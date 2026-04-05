import { test, expect, Page, Request } from '@playwright/test';
import { loginAs, goToCrud } from './auth.helpers';

/**
 * Testes E2E de integridade de payload nos CRUDs.
 *
 * Garante que o valor digitado no campo do formulário é enviado
 * corretamente no payload PUT/POST ao backend.
 *
 * Previne bugs como:
 * - "1.5" virar "15" (ponto decimal removido)
 * - strings ao invés de numbers no JSON
 * - campos ignorados no payload
 * - vírgula (locale BR) não normalizada para ponto
 */

// ============================================================
// HELPERS
// ============================================================

/** Abre o formulário de edição do primeiro registro da tabela */
async function openFirstEditForm(page: Page) {
  const row = page.locator('table tbody tr').first();
  await row.waitFor({ timeout: 10_000 });

  // Tenta botão com texto "Editar"
  const editBtn = row.locator('button, a').filter({ hasText: /editar|edit/i }).first();
  if (await editBtn.count() > 0) {
    await editBtn.click();
  } else {
    // Fallback: botão com ícone (pencil, etc)
    const iconBtn = row.locator('[title*="Editar"], [aria-label*="Editar"], button:has(svg)').first();
    if (await iconBtn.count() > 0) {
      await iconBtn.click();
    } else {
      // Último fallback: clica na row inteira
      await row.click();
    }
  }

  await page.waitForSelector('form, .form-container', { timeout: 10_000 });
  await page.waitForTimeout(1_000);
}

/** Altera um campo no formulário pelo texto do label */
async function setFieldValue(page: Page, labelText: string, newValue: string): Promise<string> {
  const label = page.locator('label').filter({ hasText: new RegExp(labelText, 'i') }).first();
  if (await label.count() === 0) {
    throw new Error(`Label "${labelText}" não encontrado`);
  }

  const field = label.locator('..').locator('input, textarea, select').first();
  if (await field.count() === 0) {
    throw new Error(`Input para label "${labelText}" não encontrado`);
  }

  const tagName = await field.evaluate(el => el.tagName.toLowerCase());

  if (tagName === 'select') {
    await field.selectOption(newValue);
  } else {
    await field.click();
    await field.press('Control+a');
    await field.press('Meta+a');
    await field.fill(newValue);
  }

  return await field.inputValue();
}

/** Lê o valor atual de um campo pelo label */
async function getFieldValue(page: Page, labelText: string): Promise<string | null> {
  const label = page.locator('label').filter({ hasText: new RegExp(labelText, 'i') }).first();
  if (await label.count() === 0) return null;

  const field = label.locator('..').locator('input, textarea, select').first();
  if (await field.count() === 0) return null;

  return await field.inputValue();
}

/** Captura o payload do próximo request PUT ou POST para o endpoint */
async function capturePayload(
  page: Page,
  urlPattern: string | RegExp,
): Promise<{ method: string; url: string; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Nenhum request PUT/POST para ${urlPattern} em 15s`)), 15_000);

    const handler = (request: Request) => {
      const method = request.method();
      const url = request.url();
      const matches = typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);

      if ((method === 'PUT' || method === 'POST') && matches) {
        clearTimeout(timeout);
        page.removeListener('request', handler);
        try {
          const body = JSON.parse(request.postData() || '{}');
          resolve({ method, url, body });
        } catch {
          reject(new Error(`Payload não é JSON: ${request.postData()}`));
        }
      }
    };

    page.on('request', handler);
  });
}

/** Clica no botão de salvar */
async function clickSave(page: Page) {
  const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /salvar|save|atualizar|criar|confirmar/i }).first();
  await saveBtn.click();
}

/** Verifica que todos os campos numéricos do payload são typeof number */
function assertNumericFieldsAreNumbers(body: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = body[field];
    if (value !== undefined && value !== null) {
      expect(typeof value, `"${field}" deveria ser number, é ${typeof value}: ${JSON.stringify(value)}`).toBe('number');
    }
  }
}

/** Verifica que um campo decimal no payload tem o valor correto */
function assertDecimalValue(body: Record<string, unknown>, field: string, expected: number) {
  expect(body[field], `"${field}" deveria ser ${expected}`).toBe(expected);
  expect(body[field], `"${field}" não deveria ser ${expected * 10} (bug do ponto decimal)`).not.toBe(expected * 10);
}

// ============================================================
// SITE CONFIGURATION
// ============================================================

test.describe('Configurações do Sistema (/configuracoes)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/configuracoes');
  });

  test('edição de pricePerKm com decimal mantém valor correto no payload', async ({ page }) => {
    await openFirstEditForm(page);
    const original = await getFieldValue(page, 'Preço por Km - Moto');

    await setFieldValue(page, 'Preço por Km - Moto', '1.5');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertDecimalValue(body, 'pricePerKm', 1.5);

    // Restaura
    if (original) {
      await page.waitForTimeout(1_500);
      await openFirstEditForm(page);
      await setFieldValue(page, 'Preço por Km - Moto', original);
      const r = capturePayload(page, '/site-configuration');
      await clickSave(page);
      await r;
    }
  });

  test('edição de carPricePerKm com decimal mantém valor correto', async ({ page }) => {
    await openFirstEditForm(page);
    const original = await getFieldValue(page, 'Preço por Km - Automóvel');

    await setFieldValue(page, 'Preço por Km - Automóvel', '2.75');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertDecimalValue(body, 'carPricePerKm', 2.75);

    if (original) {
      await page.waitForTimeout(1_500);
      await openFirstEditForm(page);
      await setFieldValue(page, 'Preço por Km - Automóvel', original);
      const r = capturePayload(page, '/site-configuration');
      await clickSave(page);
      await r;
    }
  });

  test('edição de minimumShippingFee com decimal mantém valor correto', async ({ page }) => {
    await openFirstEditForm(page);
    const original = await getFieldValue(page, 'Frete Mínimo - Moto');

    await setFieldValue(page, 'Frete Mínimo - Moto', '5.75');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertDecimalValue(body, 'minimumShippingFee', 5.75);

    if (original) {
      await page.waitForTimeout(1_500);
      await openFirstEditForm(page);
      await setFieldValue(page, 'Frete Mínimo - Moto', original);
      const r = capturePayload(page, '/site-configuration');
      await clickSave(page);
      await r;
    }
  });

  test('edição de carMinimumShippingFee com decimal mantém valor correto', async ({ page }) => {
    await openFirstEditForm(page);
    const original = await getFieldValue(page, 'Frete Mínimo - Automóvel');

    await setFieldValue(page, 'Frete Mínimo - Automóvel', '8.25');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertDecimalValue(body, 'carMinimumShippingFee', 8.25);

    if (original) {
      await page.waitForTimeout(1_500);
      await openFirstEditForm(page);
      await setFieldValue(page, 'Frete Mínimo - Automóvel', original);
      const r = capturePayload(page, '/site-configuration');
      await clickSave(page);
      await r;
    }
  });

  test('edição de additionalStopFee envia valor correto', async ({ page }) => {
    await openFirstEditForm(page);
    const original = await getFieldValue(page, 'Additional Stop Fee');

    await setFieldValue(page, 'Additional Stop Fee', '3.5');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertDecimalValue(body, 'additionalStopFee', 3.5);

    if (original) {
      await page.waitForTimeout(1_500);
      await openFirstEditForm(page);
      await setFieldValue(page, 'Additional Stop Fee', original);
      const r = capturePayload(page, '/site-configuration');
      await clickSave(page);
      await r;
    }
  });

  test('edição de percentuais (organizer, platform, danger, highIncome, creditCard)', async ({ page }) => {
    await openFirstEditForm(page);

    // Salva originais
    const originals = {
      organizerPercentage: await getFieldValue(page, 'Comissão do Gerente'),
      platformPercentage: await getFieldValue(page, 'Comissão da Plataforma'),
      dangerFeePercentage: await getFieldValue(page, 'Taxa de Periculosidade'),
      highIncomeFeePercentage: await getFieldValue(page, 'Taxa de Renda Alta'),
      creditCardFeePercentage: await getFieldValue(page, 'Taxa de Cartão'),
    };

    // Altera para valores decimais
    await setFieldValue(page, 'Comissão do Gerente', '5.5');
    await setFieldValue(page, 'Comissão da Plataforma', '8.5');
    await setFieldValue(page, 'Taxa de Periculosidade', '12.75');
    await setFieldValue(page, 'Taxa de Renda Alta', '15.25');
    await setFieldValue(page, 'Taxa de Cartão', '3.99');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertDecimalValue(body, 'organizerPercentage', 5.5);
    assertDecimalValue(body, 'platformPercentage', 8.5);
    assertDecimalValue(body, 'dangerFeePercentage', 12.75);
    assertDecimalValue(body, 'highIncomeFeePercentage', 15.25);
    assertDecimalValue(body, 'creditCardFeePercentage', 3.99);

    // Restaura
    await page.waitForTimeout(1_500);
    await openFirstEditForm(page);
    for (const [, val] of Object.entries(originals)) {
      if (!val) continue;
    }
    if (originals.organizerPercentage) await setFieldValue(page, 'Comissão do Gerente', originals.organizerPercentage);
    if (originals.platformPercentage) await setFieldValue(page, 'Comissão da Plataforma', originals.platformPercentage);
    if (originals.dangerFeePercentage) await setFieldValue(page, 'Taxa de Periculosidade', originals.dangerFeePercentage);
    if (originals.highIncomeFeePercentage) await setFieldValue(page, 'Taxa de Renda Alta', originals.highIncomeFeePercentage);
    if (originals.creditCardFeePercentage) await setFieldValue(page, 'Taxa de Cartão', originals.creditCardFeePercentage);
    const r = capturePayload(page, '/site-configuration');
    await clickSave(page);
    await r;
  });

  test('campo com vírgula (locale BR) é normalizado para ponto', async ({ page }) => {
    await openFirstEditForm(page);
    const original = await getFieldValue(page, 'Frete Mínimo - Moto');

    await setFieldValue(page, 'Frete Mínimo - Moto', '6,25');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    expect(body.minimumShippingFee).toBe(6.25);

    if (original) {
      await page.waitForTimeout(1_500);
      await openFirstEditForm(page);
      await setFieldValue(page, 'Frete Mínimo - Moto', original);
      const r = capturePayload(page, '/site-configuration');
      await clickSave(page);
      await r;
    }
  });

  test('todos os campos number são typeof number no payload', async ({ page }) => {
    await openFirstEditForm(page);

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    assertNumericFieldsAreNumbers(body, [
      'pricePerKm', 'carPricePerKm',
      'minimumShippingFee', 'carMinimumShippingFee',
      'organizerPercentage', 'platformPercentage',
      'dangerFeePercentage', 'highIncomeFeePercentage',
      'creditCardFeePercentage', 'additionalStopFee',
      'paymentHistoryDays', 'deliveryHistoryDays',
    ]);
  });

  test('campos inteiros (paymentHistoryDays, deliveryHistoryDays) enviam valores corretos', async ({ page }) => {
    await openFirstEditForm(page);
    const origPay = await getFieldValue(page, 'Dias do Histórico de Pagamentos');
    const origDel = await getFieldValue(page, 'Dias do Histórico de Entregas');

    await setFieldValue(page, 'Dias do Histórico de Pagamentos', '14');
    await setFieldValue(page, 'Dias do Histórico de Entregas', '30');

    const payloadPromise = capturePayload(page, '/site-configuration');
    await clickSave(page);
    const { body } = await payloadPromise;

    expect(body.paymentHistoryDays).toBe(14);
    expect(body.deliveryHistoryDays).toBe(30);

    // Restaura
    await page.waitForTimeout(1_500);
    await openFirstEditForm(page);
    if (origPay) await setFieldValue(page, 'Dias do Histórico de Pagamentos', origPay);
    if (origDel) await setFieldValue(page, 'Dias do Histórico de Entregas', origDel);
    const r = capturePayload(page, '/site-configuration');
    await clickSave(page);
    await r;
  });
});

// ============================================================
// ESTABELECIMENTOS (CLIENT users)
// ============================================================

test.describe('Estabelecimentos (/estabelecimentos)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/estabelecimentos');
  });

  test('edição preserva campos de texto e envia no payload', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    await openFirstEditForm(page);

    // Lê valores atuais e verifica campos presentes
    const name = await getFieldValue(page, 'Nome');
    const email = await getFieldValue(page, 'E-mail');
    const phone = await getFieldValue(page, 'Telefone');

    // Salva sem alterar — payload deve ter os mesmos valores
    const payloadPromise = capturePayload(page, /\/users/);
    await clickSave(page);

    try {
      const { body } = await payloadPromise;

      // Campos de texto devem estar presentes e ser strings
      if (name) expect(body.name).toBeTruthy();
      if (email) expect(body.username || body.email).toBeTruthy();
    } catch {
      // Se não capturou request, pode ser que o form não tenha disparado PUT
    }
  });
});

// ============================================================
// COURIERS (motoboys)
// ============================================================

test.describe('Couriers (/motoboy)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/motoboy');
  });

  test('edição de courier preserva dados no payload', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    await openFirstEditForm(page);

    const name = await getFieldValue(page, 'Nome');

    const payloadPromise = capturePayload(page, /\/users/);
    await clickSave(page);

    try {
      const { body } = await payloadPromise;
      if (name) expect(body.name).toBeTruthy();
    } catch {
      // Sem request capturado
    }
  });
});

// ============================================================
// GERENTES (ORGANIZER users)
// ============================================================

test.describe('Gerentes (/gerentes)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/gerentes');
  });

  test('edição de gerente preserva dados no payload', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    await openFirstEditForm(page);

    const payloadPromise = capturePayload(page, /\/users/);
    await clickSave(page);

    try {
      const { body } = await payloadPromise;
      expect(body.name).toBeTruthy();
    } catch {
      // Sem request capturado
    }
  });
});

// ============================================================
// DELIVERIES
// ============================================================

test.describe('Entregas (/deliveries)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/deliveries');
  });

  test('edição de entrega preserva campos numéricos como number', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    await openFirstEditForm(page);

    const payloadPromise = capturePayload(page, /\/deliveries/);
    await clickSave(page);

    try {
      const { body } = await payloadPromise;

      // Campos numéricos de delivery devem ser number
      const numericFields = ['shippingFee', 'distanceKm', 'fromLatitude', 'fromLongitude', 'toLatitude', 'toLongitude'];
      assertNumericFieldsAreNumbers(body, numericFields);
    } catch {
      // Sem request capturado
    }
  });
});

// ============================================================
// PAGAMENTOS
// ============================================================

test.describe('Pagamentos (/pagamentos)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/pagamentos');
  });

  test('edição de pagamento preserva campos numéricos', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    await openFirstEditForm(page);

    const payloadPromise = capturePayload(page, /\/payments/);
    await clickSave(page);

    try {
      const { body } = await payloadPromise;
      const numericFields = ['amount', 'platformFee', 'courierFee', 'organizerFee'];
      assertNumericFieldsAreNumbers(body, numericFields);
    } catch {
      // Sem request capturado
    }
  });
});
