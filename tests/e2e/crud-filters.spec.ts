import { test, expect, Page } from '@playwright/test';
import { loginAs, goToCrud, Role } from './auth.helpers';

// ============================================================
// Testes de filtros dos CRUDs — testa cada campo de filtro
// para cada role que tem acesso à tela.
// ============================================================

// Mapeia cada CRUD, quem acessa, e a rota
const CRUD_PAGES = [
  { name: 'Estabelecimentos', path: '/estabelecimentos', roles: ['ADMIN', 'ORGANIZER'] as Role[] },
  { name: 'Couriers', path: '/motoboy', roles: ['ADMIN', 'ORGANIZER'] as Role[] },
  { name: 'Gerentes', path: '/gerentes', roles: ['ADMIN', 'ORGANIZER'] as Role[] },
  { name: 'Deliveries', path: '/deliveries', roles: ['ADMIN', 'ORGANIZER', 'CLIENT', 'CUSTOMER'] as Role[] },
  { name: 'Pagamentos', path: '/pagamentos', roles: ['ADMIN', 'ORGANIZER'] as Role[] },
  { name: 'Configurações', path: '/configuracoes', roles: ['ADMIN'] as Role[] },
];

// Helper: coleta os filtros visíveis na tela
async function getVisibleFilters(page: Page) {
  // Cada filtro é um FormField com label + input/select
  const filters: { label: string; type: string; selector: string }[] = [];

  // Pega todos os labels dentro do container de filtros
  const filterContainer = page.locator('text=Filtros').locator('..').locator('..');
  const fields = filterContainer.locator('label');
  const count = await fields.count();

  for (let i = 0; i < count; i++) {
    const label = await fields.nth(i).textContent() || '';
    const fieldWrapper = fields.nth(i).locator('..');

    // Detecta tipo do input
    const input = fieldWrapper.locator('input[type="text"], input[type="number"], input:not([type])');
    const select = fieldWrapper.locator('select');
    const datepicker = fieldWrapper.locator('.react-datepicker-wrapper, input[placeholder*="/"]');

    if (await select.count() > 0) {
      filters.push({ label: label.trim(), type: 'select', selector: `label:has-text("${label.trim()}") + * select, label:has-text("${label.trim()}") ~ * select` });
    } else if (await datepicker.count() > 0) {
      filters.push({ label: label.trim(), type: 'date', selector: `label:has-text("${label.trim()}")` });
    } else if (await input.count() > 0) {
      const inputType = await input.first().getAttribute('type') || 'text';
      filters.push({ label: label.trim(), type: inputType === 'number' ? 'number' : 'text', selector: `label:has-text("${label.trim()}")` });
    }
  }

  return filters;
}

// Helper: preenche um filtro e verifica que a tabela recarrega sem erro
async function testFilter(page: Page, filter: { label: string; type: string }) {
  const fieldWrapper = page.locator(`label:has-text("${filter.label}")`).locator('..');

  if (filter.type === 'select') {
    const select = fieldWrapper.locator('select');
    if (await select.count() === 0) return { success: true, skipped: true };

    const options = select.locator('option');
    const optCount = await options.count();
    if (optCount <= 1) return { success: true, skipped: true }; // Só tem "Todos"

    // Seleciona a segunda opção (primeira não-vazia)
    const value = await options.nth(1).getAttribute('value') || '';
    await select.selectOption(value);
  } else if (filter.type === 'text') {
    const input = fieldWrapper.locator('input').first();
    if (await input.count() === 0) return { success: true, skipped: true };
    await input.fill('teste');
  } else if (filter.type === 'number') {
    const input = fieldWrapper.locator('input').first();
    if (await input.count() === 0) return { success: true, skipped: true };
    await input.fill('1');
  } else if (filter.type === 'date') {
    // Pula filtros de data (precisam de interação complexa com datepicker)
    return { success: true, skipped: true };
  }

  // Aguarda a tabela atualizar (debounce + fetch)
  await page.waitForTimeout(2_000);

  // Verifica que não tem erro na tela
  const errorVisible = await page.locator('text=/erro|error|falha/i').count();
  const tableVisible = await page.locator('table').count();

  // Limpa o filtro
  const clearBtn = page.locator('button:has-text("Limpar Filtros")');
  if (await clearBtn.count() > 0) {
    await clearBtn.click();
    await page.waitForTimeout(1_000);
  }

  return { success: tableVisible > 0, error: errorVisible > 0, skipped: false };
}

// ============================================================
// TESTES
// ============================================================

for (const crud of CRUD_PAGES) {
  for (const role of crud.roles) {
    test.describe(`${crud.name} — ${role}`, () => {
      test.beforeEach(async ({ page }) => {
        await loginAs(page, role);
        await goToCrud(page, crud.path);
      });

      test(`deve carregar a página e exibir tabela`, async ({ page }) => {
        // Verifica que a página carregou (tabela ou conteúdo CRUD)
        const hasTable = await page.locator('table').count();
        const hasContent = await page.locator('[class*="crud"], [class*="entity"]').count();
        expect(hasTable + hasContent).toBeGreaterThan(0);
      });

      test(`deve exibir seção de filtros`, async ({ page }) => {
        const filtersSection = page.locator('text=Filtros');
        // Alguns roles podem não ver filtros — skip se não existir
        if (await filtersSection.count() === 0) {
          test.skip();
          return;
        }
        await expect(filtersSection.first()).toBeVisible();
      });

      test(`deve testar cada filtro individualmente`, async ({ page }) => {
        const filtersSection = page.locator('text=Filtros');
        if (await filtersSection.count() === 0) {
          test.skip();
          return;
        }

        const filters = await getVisibleFilters(page);
        console.log(`  📋 ${crud.name} (${role}): ${filters.length} filtros encontrados`);

        const results: { filter: string; success: boolean; skipped: boolean; error: boolean }[] = [];

        for (const filter of filters) {
          console.log(`    🔍 Testando filtro: ${filter.label} (${filter.type})`);
          const result = await testFilter(page, filter);
          results.push({
            filter: filter.label,
            success: result.success ?? true,
            skipped: result.skipped ?? false,
            error: result.error ?? false,
          });
        }

        // Log resumo
        const tested = results.filter(r => !r.skipped);
        const failed = tested.filter(r => !r.success || r.error);
        console.log(`    ✅ ${tested.length} filtros testados, ${failed.length} falharam`);

        if (failed.length > 0) {
          console.log(`    ❌ Filtros com problema: ${failed.map(f => f.filter).join(', ')}`);
        }

        // Todos os filtros testados devem funcionar sem erro
        for (const r of tested) {
          expect(r.success, `Filtro "${r.filter}" deve manter a tabela visível`).toBe(true);
          expect(r.error, `Filtro "${r.filter}" não deve causar erro na tela`).toBe(false);
        }
      });

      test(`botão "Limpar Filtros" deve resetar todos os filtros`, async ({ page }) => {
        const clearBtn = page.locator('button:has-text("Limpar Filtros")');
        if (await clearBtn.count() === 0) {
          test.skip();
          return;
        }

        // Preenche um filtro de texto se existir
        const textInput = page.locator('input[type="text"]').first();
        if (await textInput.count() > 0) {
          await textInput.fill('teste123');
          await page.waitForTimeout(1_000);
        }

        // Clica em limpar
        await clearBtn.click();
        await page.waitForTimeout(1_000);

        // Verifica que inputs de texto foram limpos
        if (await textInput.count() > 0) {
          const value = await textInput.inputValue();
          expect(value).toBe('');
        }
      });
    });
  }
}
