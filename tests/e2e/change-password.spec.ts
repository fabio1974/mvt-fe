import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helpers';

/**
 * Testes E2E para troca de senha.
 *
 * Garante que:
 * - Troca de senha funciona (mesmo com documentNumber legado inválido)
 * - Senha atual incorreta é rejeitada
 * - Nova senha é aceita no login posterior
 */

const ORIGINAL_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Elis@123';
const TEMP_PASSWORD = 'Temp@456';

test.describe('Alterar Senha', () => {

  test('troca de senha com sucesso e login com nova senha', async ({ page }) => {
    // 1. Login com senha atual
    await loginAs(page, 'ADMIN');

    // 2. Navega para alterar senha
    await page.goto('/alterar-senha', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1_000);

    // 3. Preenche formulário
    const currentField = page.locator('input[type="password"]').first();
    const newField = page.locator('input[type="password"]').nth(1);
    const confirmField = page.locator('input[type="password"]').nth(2);

    await currentField.fill(ORIGINAL_PASSWORD);
    await newField.fill(TEMP_PASSWORD);
    await confirmField.fill(TEMP_PASSWORD);

    // 4. Intercepta request para verificar payload
    const requestPromise = page.waitForRequest(req =>
      req.url().includes('/change-password') && req.method() === 'POST'
    );

    // 5. Clica salvar
    const saveBtn = page.locator('button').filter({ hasText: /salvar|alterar|confirmar/i }).first();
    await saveBtn.click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');

    // 6. Verifica payload
    expect(payload.currentPassword).toBe(ORIGINAL_PASSWORD);
    expect(payload.newPassword).toBe(TEMP_PASSWORD);

    // 7. Espera resposta de sucesso
    const response = await request.response();
    expect(response?.status()).toBe(200);

    // 8. Restaura senha original — login com senha temporária
    await page.evaluate(() => localStorage.clear());
    await page.goto('/', { waitUntil: 'networkidle' });

    // Login via API com senha temporária
    const loginResponse = await page.request.post('http://localhost:8080/auth/login', {
      data: { username: 'moveltrack@gmail.com', password: TEMP_PASSWORD },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Troca de volta para senha original
    const restoreResponse = await page.request.post('http://localhost:8080/api/auth/change-password', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { currentPassword: TEMP_PASSWORD, newPassword: ORIGINAL_PASSWORD },
    });
    expect(restoreResponse.ok()).toBeTruthy();
  });

  test('senha atual incorreta é rejeitada', async ({ page }) => {
    await loginAs(page, 'ADMIN');
    await page.goto('/alterar-senha', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1_000);

    const currentField = page.locator('input[type="password"]').first();
    const newField = page.locator('input[type="password"]').nth(1);
    const confirmField = page.locator('input[type="password"]').nth(2);

    await currentField.fill('SenhaErrada@999');
    await newField.fill(TEMP_PASSWORD);
    await confirmField.fill(TEMP_PASSWORD);

    const saveBtn = page.locator('button').filter({ hasText: /salvar|alterar|confirmar/i }).first();
    await saveBtn.click();

    // Deve mostrar mensagem de erro
    await page.waitForTimeout(2_000);
    const errorVisible = await page.locator('text=/erro|incorreta|inválida|incorrect/i').count();
    expect(errorVisible).toBeGreaterThan(0);
  });
});
