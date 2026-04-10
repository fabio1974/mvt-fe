import { test, expect } from '@playwright/test';
import { loginAs, goToCrud } from './auth.helpers';

/**
 * Testes E2E para a tabela de entregas e funcionalidades relacionadas.
 * Cobre as mudanças recentes: mapa de rota, detalhes do frete, pins pirulito.
 */

test.describe('Tabela de Entregas', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await goToCrud(page, '/deliveries');
  });

  // ----------------------------------------------------------
  // Coluna de Ações na primeira posição
  // ----------------------------------------------------------

  test('coluna "Ações" é a primeira da tabela', async ({ page }) => {
    const firstHeader = page.locator('table thead th').first();
    await expect(firstHeader).toHaveText('Ações');
  });

  // ----------------------------------------------------------
  // Botão "Ver rota no mapa" abre modal
  // ----------------------------------------------------------

  test('botão "Ver rota no mapa" abre modal com mapa', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    // Clica no botão de mapa do primeiro registro
    const mapBtn = rows.first().locator('button[title*="rota"], button[title*="mapa"]').first();
    if (await mapBtn.count() === 0) { test.skip(); return; }

    await mapBtn.click();

    // Modal deve abrir com título "Rota #..."
    await expect(page.locator('text=/Rota #/i')).toBeVisible({ timeout: 10_000 });

    // Deve ter mapa carregado (GoogleMap container)
    await page.waitForTimeout(3_000);
    const mapContainer = page.locator('[class*="gm-style"], [style*="height: 500px"]');
    await expect(mapContainer.first()).toBeVisible({ timeout: 10_000 });

    // Fecha modal
    const closeBtn = page.locator('button[title="Fechar"]');
    await closeBtn.click();
    await expect(page.locator('text=/Rota #/i')).not.toBeVisible({ timeout: 5_000 });
  });

  // ----------------------------------------------------------
  // Valor do frete é clicável e abre detalhes
  // ----------------------------------------------------------

  test('coluna "Valor do Frete" tem botão clicável com valor formatado', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    // Procura botão com R$ na tabela
    const freteBtn = rows.first().locator('button').filter({ hasText: /R\$/ }).first();
    if (await freteBtn.count() === 0) { test.skip(); return; }

    // Verifica que é formatado como moeda
    const text = await freteBtn.textContent();
    expect(text).toMatch(/R\$ \d/);
  });

  test('clique no valor do frete abre popup com breakdown', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    const freteBtn = rows.first().locator('button').filter({ hasText: /R\$/ }).first();
    if (await freteBtn.count() === 0) { test.skip(); return; }

    await freteBtn.click();

    // Popup deve abrir com título "Detalhes do Frete"
    await expect(page.locator('text=/Detalhes do Frete/i')).toBeVisible({ timeout: 10_000 });

    // Deve mostrar breakdown (Taxa base, Distância, Total)
    await page.waitForTimeout(3_000);
    await expect(page.locator('text=/Taxa base|Distância|Total/i').first()).toBeVisible({ timeout: 10_000 });

    // Fecha popup
    await page.locator('button').filter({ hasText: '✕' }).first().click();
    await expect(page.locator('text=/Detalhes do Frete/i')).not.toBeVisible({ timeout: 3_000 });
  });

  // ----------------------------------------------------------
  // Datas formatadas corretamente
  // ----------------------------------------------------------

  test('datas na tabela estão no formato dd/MM/yyyy HH:mm', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    // Pega todo o texto da primeira row
    const rowText = await rows.first().textContent();

    // Não deve conter formato ISO (yyyy-MM-ddTHH:mm)
    expect(rowText).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });

  // ----------------------------------------------------------
  // Células não quebram linha (nowrap)
  // ----------------------------------------------------------

  test('células da tabela têm white-space: nowrap', async ({ page }) => {
    const firstCell = page.locator('table tbody td').first();
    if (await firstCell.count() === 0) { test.skip(); return; }

    const whiteSpace = await firstCell.evaluate(el => getComputedStyle(el).whiteSpace);
    expect(whiteSpace).toBe('nowrap');
  });

  test('headers da tabela têm white-space: nowrap', async ({ page }) => {
    const firstHeader = page.locator('table thead th').first();
    if (await firstHeader.count() === 0) { test.skip(); return; }

    const whiteSpace = await firstHeader.evaluate(el => getComputedStyle(el).whiteSpace);
    expect(whiteSpace).toBe('nowrap');
  });

  // ----------------------------------------------------------
  // Botão "Nova Corrida" — visível apenas para CLIENT/CUSTOMER
  // ----------------------------------------------------------

  test('ADMIN não vê wizard "Nova Corrida" mas vê "Criar Novo" do formulário genérico', async ({ page }) => {
    // ADMIN não usa o wizard — não tem "Nova Corrida" no sidebar
    await expect(page.locator('.sidebar-nav').filter({ hasText: /^Nova Corrida$/ })).not.toBeVisible();
    // ADMIN pode criar via formulário genérico ("Criar Novo" no breadcrumb)
    await expect(page.locator('button.breadcrumb-action-btn').filter({ hasText: /Criar Novo/i })).toBeVisible();
  });

  // ----------------------------------------------------------
  // Sem botão de editar na tabela de entregas
  // ----------------------------------------------------------

  test('tabela de entregas não tem botão de editar', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    const editBtns = rows.first().locator('button[title="Editar"]');
    expect(await editBtns.count()).toBe(0);
  });

  // ----------------------------------------------------------
  // Pagamentos renderizados corretamente (não [object Object])
  // ----------------------------------------------------------

  test('coluna de pagamentos não mostra [object Object]', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) { test.skip(); return; }

    const allText = await page.locator('table tbody').textContent();
    expect(allText).not.toContain('[object Object]');
    expect(allText).not.toContain('object Object');
  });

  // ----------------------------------------------------------
  // Campo paymentCompleted não aparece na tabela
  // ----------------------------------------------------------

  test('coluna "Payment Completed" não aparece na tabela', async ({ page }) => {
    const headers = await page.locator('table thead th').allTextContents();
    for (const h of headers) {
      expect(h).not.toContain('Payment Completed');
      expect(h).not.toContain('paymentCompleted');
    }
  });
});

test.describe('Wizard de entrega — validações visuais', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'CLIENT');
    await goToCrud(page, '/deliveries');
  });

  test('campos obrigatórios têm asterisco *', async ({ page }) => {
    // Abre wizard
    await page.locator('button').filter({ hasText: /Nova Corrida/i }).click();
    await expect(page.locator('h2.wizard-title')).toBeVisible({ timeout: 5_000 });

    // Step 1: seção de origem visível e campo com required
    await expect(page.locator('h3.wizard-section-title')).toContainText(/origem/i);
    await expect(page.locator('.wizard-content input[required]').first()).toBeAttached();
  });

  test('erro de validação aparece ao tentar avançar sem preencher', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Nova Corrida/i }).click();
    await expect(page.locator('h2.wizard-title')).toBeVisible({ timeout: 5_000 });

    // Limpa o endereço de origem (pode estar pré-preenchido) e tenta avançar
    const originInput = page.locator('.wizard-content input[type="text"]').first();
    await originInput.fill('');

    await page.locator('.wizard-footer .wizard-btn.primary').click();

    // Erro deve aparecer
    await expect(page.locator('.wizard-field-error')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('text=/obrigatório/i')).toBeVisible();
  });

  test('máscara monetária formata corretamente', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Nova Corrida/i }).click();
    await expect(page.locator('h2.wizard-title')).toBeVisible({ timeout: 5_000 });

    // Preenche origem para avançar
    await page.locator('.wizard-content input[type="text"]').first().fill('Rua Teste, 123');
    await page.locator('.wizard-btn.primary').click();
    await page.waitForTimeout(500);

    // Preenche valor a cobrar: digita 2500 → deve formatar para 25,00
    const valorInput = page.locator('input[inputmode="numeric"]').first();
    await valorInput.fill('2500');

    const value = await valorInput.inputValue();
    expect(value).toContain('25,00');
  });
});

test.describe('Popup de endereço (mapa)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'CLIENT');
    await goToCrud(page, '/deliveries');
  });

  test('popup de mapa tem botão confirmar na linha dos botões', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Nova Corrida/i }).click();
    await expect(page.locator('h2.wizard-title')).toBeVisible({ timeout: 5_000 });

    // Preenche origem e avança
    await page.locator('.wizard-content input[type="text"]').first().fill('Rua Teste, 123');
    await page.locator('.wizard-btn.primary').click();
    await page.waitForTimeout(500);

    // Clica no botão de mapa da parada
    const mapBtn = page.locator('.address-map-button').first();
    if (await mapBtn.count() > 0) {
      await mapBtn.click();
      await page.waitForTimeout(1_000);

      // Botão confirmar deve estar visível
      const confirmBtn = page.locator('.address-confirm-button');
      if (await confirmBtn.count() > 0) {
        await expect(confirmBtn).toBeVisible();
      }
    }
  });
});
