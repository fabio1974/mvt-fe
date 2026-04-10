import { test, expect, Page } from '@playwright/test';
import { loginAs } from './auth.helpers';

/**
 * Testes E2E do DeliveryWizard — alinhados com o fluxo do mobile.
 *
 * Cenário: Delivery multi-stop em Sobral-CE com 4 paradas (ida e volta).
 * A delivery é criada de verdade no backend local.
 *
 * Fluxo do mobile (base para estes testes):
 * 1. Selecionar tipo (CLIENT pula)
 * 2. Origem (endereço de coleta)
 * 3. Destino (endereço de cada parada)
 * 4. Detalhes (nome, telefone, item, valor por parada)
 * 5. Multi-stop manager (ver/editar/adicionar paradas)
 * 6. Confirmação (rota, preço, submit)
 *
 * Fluxo do FE:
 * 1. Origem
 * 2. Paradas (endereço + detalhes por parada, tudo junto)
 * 3. Resumo + submit
 */

// ============================================================
// Endereços reais em Sobral-CE
// ============================================================

const SOBRAL = {
  origin: {
    text: 'Rua Conselheiro Rodrigues, 100 - Centro, Sobral - CE',
  },
  stop1: {
    text: 'Avenida John Sanford, 800 - Centro, Sobral - CE',
    recipient: 'João da Silva',
    phone: '(88) 99876-5432',
    item: 'Documentos urgentes',
    value: '15,00',
  },
  stop2: {
    text: 'Rua Coronel Mont Alverne, 200 - Centro, Sobral - CE',
    recipient: 'Maria Oliveira',
    phone: '(88) 99765-4321',
    item: 'Caixa de medicamentos',
    value: '25,00',
  },
  stop3: {
    text: 'Rua Dr. Guarany, 300 - Derby, Sobral - CE',
    recipient: 'Pedro Santos',
    phone: '(88) 99654-3210',
    item: 'Encomenda frágil',
    value: '10,00',
  },
  stop4_volta: {
    text: 'Rua Conselheiro Rodrigues, 100 - Centro, Sobral - CE',
    recipient: 'Ana (retorno)',
    phone: '(88) 99876-5432',
    item: 'Documento assinado (retorno)',
    value: '0',
  },
};

// ============================================================
// HELPERS
// ============================================================

/** Navega para /deliveries e abre o wizard */
async function openWizard(page: Page) {
  await page.goto('/deliveries', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2_000);

  // Clica no botão "Nova Corrida" para abrir o wizard
  const wizardBtn = page.locator('button').filter({ hasText: /nova corrida|com paradas|nova entrega/i }).first();
  await wizardBtn.click();

  // Espera o título do wizard aparecer (h2 específico, não o item do sidebar)
  await expect(page.locator('h2.wizard-title')).toBeVisible({ timeout: 5_000 });
}

/** Preenche o endereço de origem no Step 1 (digita direto no input de texto) */
async function fillOriginAddress(page: Page, address: string) {
  const originInput = page.locator('.wizard-content input[type="text"]').first();
  await originInput.fill(address);
  await page.waitForTimeout(500);
}

/** Preenche endereço e detalhes de uma parada no Step 2 */
async function fillStopDetails(
  page: Page,
  stopIndex: number,
  data: { text: string; recipient: string; phone: string; item: string; value: string },
) {
  const stopItems = page.locator('.wizard-stop-item');
  const stop = stopItems.nth(stopIndex);

  // Endereço
  const addressInput = stop.locator('input[type="text"]').first();
  await addressInput.fill(data.text);

  // Detalhes da parada
  const detailsSection = stop.locator('.wizard-stop-details');

  // Nome do destinatário
  await detailsSection.getByPlaceholder(/receber/i).fill(data.recipient);

  // Telefone
  await detailsSection.locator('input[type="tel"]').fill(data.phone);

  // Descrição do item
  await detailsSection.getByPlaceholder(/caixa com/i).fill(data.item);

  // Valor a cobrar
  await detailsSection.locator('input[inputmode="numeric"]').fill(data.value);

  await page.waitForTimeout(300);
}

/** Clica em "Adicionar parada" */
async function addStop(page: Page) {
  await page.locator('button').filter({ hasText: /adicionar parada/i }).click();
  await page.waitForTimeout(300);
}

/** Clica em "Próximo" */
async function clickNext(page: Page) {
  await page.locator('.wizard-footer .wizard-btn.primary').filter({ hasText: /próximo/i }).click();
  await page.waitForTimeout(500);
}

/** Clica em "Voltar" */
async function clickBack(page: Page) {
  await page.locator('.wizard-footer .wizard-btn.secondary').filter({ hasText: /voltar/i }).click();
  await page.waitForTimeout(500);
}

// ============================================================
// TESTES
// ============================================================

test.describe('DeliveryWizard - Criação de Entregas', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'CLIENT');
  });

  // ----------------------------------------------------------
  // Caminho feliz: delivery simples (1 destino)
  // ----------------------------------------------------------

  test('cria delivery simples com 1 destino — caminho feliz completo', async ({ page }) => {
    await openWizard(page);

    // Step 1: Origem
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // Step 2: 1 parada com detalhes
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible({ timeout: 5_000 });
    await fillStopDetails(page, 0, SOBRAL.stop1);

    // Intercepta o POST para verificar o payload
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/deliveries') && req.method() === 'POST',
      { timeout: 30_000 },
    );

    await clickNext(page); // vai para Step 3

    // Step 3: Resumo — espera carregar
    await page.waitForTimeout(3_000);
    await expect(page.locator('text=/resumo/i')).toBeVisible({ timeout: 10_000 });

    // Verifica que o resumo mostra os dados
    await expect(page.locator(`text=${SOBRAL.stop1.recipient}`)).toBeVisible();

    // Submete a entrega
    await page.locator('button').filter({ hasText: /criar corrida/i }).click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');

    // Valida payload
    expect(payload.fromAddress).toContain('Conselheiro Rodrigues');
    expect(payload.stops).toHaveLength(1);
    expect(payload.stops[0].address).toContain('John Sanford');
    expect(payload.stops[0].recipientName).toBe('João da Silva');
    expect(payload.stops[0].recipientPhone).toBe('88998765432'); // sem formatação
    expect(payload.stops[0].itemDescription).toBe('Documentos urgentes');
    expect(payload.stops[0].plannedOrder).toBe(1);
  });

  // ----------------------------------------------------------
  // Caminho feliz: delivery multi-stop 4 paradas (ida e volta)
  // ----------------------------------------------------------

  test('cria delivery multi-stop com 4 paradas em Sobral (ida e volta)', async ({ page }) => {
    await openWizard(page);

    // Step 1: Origem
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // Step 2: 4 paradas
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible({ timeout: 5_000 });

    // Parada 1 (já existe por default)
    await fillStopDetails(page, 0, SOBRAL.stop1);

    // Parada 2
    await addStop(page);
    await fillStopDetails(page, 1, SOBRAL.stop2);

    // Parada 3
    await addStop(page);
    await fillStopDetails(page, 2, SOBRAL.stop3);

    // Parada 4 (retorno à origem)
    await addStop(page);
    await fillStopDetails(page, 3, SOBRAL.stop4_volta);

    // Verifica que tem 4 paradas na tela
    const stopCount = await page.locator('.wizard-stop-item').count();
    expect(stopCount).toBe(4);

    // Intercepta POST
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/deliveries') && req.method() === 'POST',
      { timeout: 30_000 },
    );

    await clickNext(page); // Step 3

    // Espera resumo carregar
    await page.waitForTimeout(3_000);
    await expect(page.locator('text=/resumo/i')).toBeVisible({ timeout: 10_000 });

    // Verifica que o resumo mostra todas as 4 paradas
    await expect(page.locator(`text=${SOBRAL.stop1.recipient}`)).toBeVisible();
    await expect(page.locator(`text=${SOBRAL.stop2.recipient}`)).toBeVisible();
    await expect(page.locator(`text=${SOBRAL.stop3.recipient}`)).toBeVisible();
    await expect(page.locator(`text=${SOBRAL.stop4_volta.recipient}`)).toBeVisible();

    // Submete
    await page.locator('button').filter({ hasText: /criar corrida/i }).click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');

    // Valida payload multi-stop
    expect(payload.fromAddress).toContain('Conselheiro Rodrigues');
    expect(payload.stops).toHaveLength(4);

    // Stop 1
    expect(payload.stops[0].recipientName).toBe('João da Silva');
    expect(payload.stops[0].recipientPhone).toBe('88998765432');
    expect(payload.stops[0].itemDescription).toBe('Documentos urgentes');
    expect(payload.stops[0].plannedOrder).toBe(1);

    // Stop 2
    expect(payload.stops[1].recipientName).toBe('Maria Oliveira');
    expect(payload.stops[1].recipientPhone).toBe('88997654321');
    expect(payload.stops[1].itemDescription).toBe('Caixa de medicamentos');
    expect(payload.stops[1].plannedOrder).toBe(2);

    // Stop 3
    expect(payload.stops[2].recipientName).toBe('Pedro Santos');
    expect(payload.stops[2].plannedOrder).toBe(3);

    // Stop 4 (retorno)
    expect(payload.stops[3].recipientName).toBe('Ana (retorno)');
    expect(payload.stops[3].address).toContain('Conselheiro Rodrigues');
    expect(payload.stops[3].plannedOrder).toBe(4);

    // toAddress = último stop (retorno à origem)
    expect(payload.toAddress).toContain('Conselheiro Rodrigues');

    // totalAmount = soma dos valores (15 + 25 + 10 + 0 = 50)
    if (payload.totalAmount) {
      expect(parseFloat(payload.totalAmount)).toBe(50);
    }

    // recipientName/Phone do primeiro stop no nível raiz (compat mobile)
    expect(payload.recipientName).toBe('João da Silva');
    expect(payload.recipientPhone).toBe('88998765432');
  });

  // ----------------------------------------------------------
  // Navegação do wizard
  // ----------------------------------------------------------

  test('navegação: avançar e voltar entre steps funciona', async ({ page }) => {
    await openWizard(page);

    // Step 1 visível
    await expect(page.locator('.wizard-section-title').filter({ hasText: /origem|coleta/i }).first()).toBeVisible();

    // Preenche e avança
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // Step 2 visível
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible();

    // Volta para Step 1
    await clickBack(page);
    await expect(page.locator('.wizard-section-title').filter({ hasText: /origem|coleta/i }).first()).toBeVisible();

    // Avança de novo
    await clickNext(page);
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible();
  });

  test('ida e volta no wizard preserva todos os dados preenchidos', async ({ page }) => {
    await openWizard(page);

    // === Step 1: preenche origem ===
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // === Step 2: preenche 3 paradas com detalhes ===
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible({ timeout: 5_000 });
    await fillStopDetails(page, 0, SOBRAL.stop1);
    await addStop(page);
    await fillStopDetails(page, 1, SOBRAL.stop2);
    await addStop(page);
    await fillStopDetails(page, 2, SOBRAL.stop3);

    // Verifica que os 3 stops estão na tela
    expect(await page.locator('.wizard-stop-item').count()).toBe(3);

    // === VOLTA para Step 1 ===
    await clickBack(page);
    await expect(page.locator('.wizard-section-title').filter({ hasText: /origem|coleta/i }).first()).toBeVisible();

    // Verifica que o endereço de origem foi preservado
    const originInput = page.locator('.wizard-content input[type="text"]').first();
    const originValue = await originInput.inputValue();
    expect(originValue).toContain('Conselheiro Rodrigues');

    // === AVANÇA de volta para Step 2 ===
    await clickNext(page);
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible();

    // Verifica que TODAS as paradas foram preservadas (3 paradas)
    expect(await page.locator('.wizard-stop-item').count()).toBe(3);

    // Verifica dados da parada 1
    const stop1 = page.locator('.wizard-stop-item').nth(0);
    await expect(stop1.getByPlaceholder(/receber/i)).toHaveValue(SOBRAL.stop1.recipient);
    await expect(stop1.locator('input[type="tel"]')).toHaveValue(SOBRAL.stop1.phone);
    await expect(stop1.locator('.wizard-stop-details').getByPlaceholder(/caixa com/i)).toHaveValue(SOBRAL.stop1.item);

    // Verifica dados da parada 2
    const stop2 = page.locator('.wizard-stop-item').nth(1);
    await expect(stop2.getByPlaceholder(/receber/i)).toHaveValue(SOBRAL.stop2.recipient);
    await expect(stop2.locator('input[type="tel"]')).toHaveValue(SOBRAL.stop2.phone);

    // Verifica dados da parada 3
    const stop3 = page.locator('.wizard-stop-item').nth(2);
    await expect(stop3.getByPlaceholder(/receber/i)).toHaveValue(SOBRAL.stop3.recipient);

    // === AVANÇA para Step 3 (resumo) ===
    await clickNext(page);
    await page.waitForTimeout(3_000);
    await expect(page.locator('text=/resumo/i')).toBeVisible({ timeout: 10_000 });

    // Verifica que o resumo mostra todas as 3 paradas
    await expect(page.locator(`text=${SOBRAL.stop1.recipient}`)).toBeVisible();
    await expect(page.locator(`text=${SOBRAL.stop2.recipient}`)).toBeVisible();
    await expect(page.locator(`text=${SOBRAL.stop3.recipient}`)).toBeVisible();

    // === VOLTA para Step 2 de novo ===
    await clickBack(page);
    await expect(page.locator('text=/paradas de entrega/i')).toBeVisible();

    // Dados continuam preservados
    expect(await page.locator('.wizard-stop-item').count()).toBe(3);
    await expect(page.locator('.wizard-stop-item').nth(0).getByPlaceholder(/receber/i)).toHaveValue(SOBRAL.stop1.recipient);
    await expect(page.locator('.wizard-stop-item').nth(1).getByPlaceholder(/receber/i)).toHaveValue(SOBRAL.stop2.recipient);
    await expect(page.locator('.wizard-stop-item').nth(2).getByPlaceholder(/receber/i)).toHaveValue(SOBRAL.stop3.recipient);

    // === AVANÇA para Step 3 e submete ===
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/deliveries') && req.method() === 'POST',
      { timeout: 30_000 },
    );

    await clickNext(page);
    await page.waitForTimeout(3_000);
    await page.locator('button').filter({ hasText: /criar corrida/i }).click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');

    // Mesmo após ida e volta, o payload deve ter os 3 stops com dados completos
    expect(payload.stops).toHaveLength(3);
    expect(payload.stops[0].recipientName).toBe(SOBRAL.stop1.recipient);
    expect(payload.stops[1].recipientName).toBe(SOBRAL.stop2.recipient);
    expect(payload.stops[2].recipientName).toBe(SOBRAL.stop3.recipient);
    expect(payload.fromAddress).toContain('Conselheiro Rodrigues');
  });

  test('botão cancelar fecha o wizard', async ({ page }) => {
    await openWizard(page);

    // Clica em Cancelar (step 1 mostra "Cancelar" ao invés de "Voltar")
    await page.locator('.wizard-footer .wizard-btn.secondary').filter({ hasText: /cancelar/i }).click();

    // Wizard deve fechar (h2 do wizard desaparece)
    await expect(page.locator('h2.wizard-title')).not.toBeVisible({ timeout: 3_000 });
  });

  test('botão X fecha o wizard', async ({ page }) => {
    await openWizard(page);

    await page.locator('.wizard-close').click();

    await expect(page.locator('text=Nova Corrida')).not.toBeVisible({ timeout: 3_000 });
  });

  // ----------------------------------------------------------
  // Validações
  // ----------------------------------------------------------

  test('não avança do Step 1 sem endereço de origem', async ({ page }) => {
    await openWizard(page);

    // Botão "Próximo" deve estar desabilitado
    const nextBtn = page.locator('.wizard-footer .wizard-btn.primary');
    await expect(nextBtn).toBeDisabled();
  });

  test('não avança do Step 2 sem endereço na parada', async ({ page }) => {
    await openWizard(page);

    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // Step 2 com parada vazia — botão deve estar desabilitado
    const nextBtn = page.locator('.wizard-footer .wizard-btn.primary');
    await expect(nextBtn).toBeDisabled();
  });

  // ----------------------------------------------------------
  // Adicionar e remover paradas
  // ----------------------------------------------------------

  test('adicionar e remover paradas funciona', async ({ page }) => {
    await openWizard(page);
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // Começa com 1 parada
    expect(await page.locator('.wizard-stop-item').count()).toBe(1);

    // Adiciona 2 paradas (total 3)
    await addStop(page);
    await addStop(page);
    expect(await page.locator('.wizard-stop-item').count()).toBe(3);

    // Remove a parada do meio (index 1)
    const removeButtons = page.locator('.wizard-stop-remove');
    await removeButtons.nth(1).click();
    await page.waitForTimeout(300);
    expect(await page.locator('.wizard-stop-item').count()).toBe(2);
  });

  test('parada única não tem botão de remover', async ({ page }) => {
    await openWizard(page);
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    // Com 1 parada, não deve ter botão de remover
    const removeButtons = page.locator('.wizard-stop-remove');
    expect(await removeButtons.count()).toBe(0);
  });

  // ----------------------------------------------------------
  // Consistência de payload com o mobile
  // ----------------------------------------------------------

  test('payload envia recipientPhone sem formatação (digits only)', async ({ page }) => {
    await openWizard(page);
    await fillOriginAddress(page, SOBRAL.origin.text);
    await clickNext(page);

    await fillStopDetails(page, 0, SOBRAL.stop1);

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/deliveries') && req.method() === 'POST',
      { timeout: 30_000 },
    );

    await clickNext(page);
    await page.waitForTimeout(3_000);
    await page.locator('button').filter({ hasText: /criar corrida/i }).click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');

    // Telefone deve ir sem parênteses, espaços ou traços
    const phone = payload.stops[0].recipientPhone;
    expect(phone).toMatch(/^\d+$/); // apenas dígitos
    expect(phone).not.toContain('(');
    expect(phone).not.toContain(')');
    expect(phone).not.toContain('-');
    expect(phone).not.toContain(' ');
  });
});
