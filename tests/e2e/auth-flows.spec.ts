import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './auth.helpers';

/**
 * Testes E2E para fluxos de autenticação.
 */

test.describe('Login', () => {

  test('login com credenciais válidas redireciona para dashboard', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.getByPlaceholder(/email ou CPF/i).fill(TEST_USERS.ADMIN.username);
    await page.getByPlaceholder(/senha/i).fill(TEST_USERS.ADMIN.password);

    await page.locator('form button[type="submit"]').click();

    // Após login, deve redirecionar para dashboard
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2_000);

    // Token deve estar no localStorage
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
  });

  test('login com senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.getByPlaceholder(/email ou CPF/i).fill(TEST_USERS.ADMIN.username);
    await page.getByPlaceholder(/senha/i).fill('SenhaErrada@999');

    await page.locator('form button[type="submit"]').click();

    await expect(
      page.locator('text=/inválid|incorret|erro/i')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('login com email inexistente exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.getByPlaceholder(/email ou CPF/i).fill('naoexiste@test.com');
    await page.getByPlaceholder(/senha/i).fill('Qualquer@123');

    await page.locator('form button[type="submit"]').click();

    await expect(
      page.locator('text=/inválid|incorret|erro/i')
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Registro', () => {

  const FAKE_REGISTER_DATA = {
    name: 'Teste Automatizado',
    username: 'teste.e2e@zapi10.com',
    cpf: '123.456.789-00',
    password: 'Teste@123',
  };

  async function goToRegisterWithRole(page: import('@playwright/test').Page, role: string) {
    await page.goto(`/login?tab=register&role=${role}&lockRole=true`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1_000);
  }

  test('registro com sucesso exibe mensagem de confirmação (mock)', async ({ page }) => {
    await page.route('**/auth/register', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User registered successfully' }),
      });
    });

    await goToRegisterWithRole(page, 'COURIER');

    // Preenche formulário usando placeholders reais
    await page.getByPlaceholder(/nome/i).first().fill(FAKE_REGISTER_DATA.name);
    const cpfField = page.getByPlaceholder(/000\.000\.000/i);
    if (await cpfField.count() > 0) {
      await cpfField.fill(FAKE_REGISTER_DATA.cpf);
    }
    await page.locator('input[type="email"], input[placeholder*="@"]').first().fill(FAKE_REGISTER_DATA.username);

    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill(FAKE_REGISTER_DATA.password);
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill(FAKE_REGISTER_DATA.password);
    }

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/auth/register') && req.method() === 'POST'
    );

    await page.locator('form button[type="submit"]').click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');

    expect(payload.name).toBe(FAKE_REGISTER_DATA.name);
    expect(payload.username).toBe(FAKE_REGISTER_DATA.username);
    expect(payload.password).toBe(FAKE_REGISTER_DATA.password);
    expect(payload.role).toBe('COURIER');
  });

  test('registro com email duplicado exibe mensagem de erro (mock)', async ({ page }) => {
    await page.route('**/auth/register', (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email já está cadastrado' }),
      });
    });

    await goToRegisterWithRole(page, 'CUSTOMER');

    await page.getByPlaceholder(/nome/i).first().fill(FAKE_REGISTER_DATA.name);
    const cpfField = page.getByPlaceholder(/000\.000\.000/i);
    if (await cpfField.count() > 0) await cpfField.fill(FAKE_REGISTER_DATA.cpf);
    await page.locator('input[type="email"], input[placeholder*="@"]').first().fill(FAKE_REGISTER_DATA.username);

    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill(FAKE_REGISTER_DATA.password);
    if (await passwordFields.count() > 1) await passwordFields.nth(1).fill(FAKE_REGISTER_DATA.password);

    await page.locator('form button[type="submit"]').click();

    await expect(
      page.locator('text=/já.*cadastrado|already|duplicad/i')
    ).toBeVisible({ timeout: 10_000 });
  });

  const ROLES_TO_TEST = ['CUSTOMER', 'CLIENT', 'COURIER', 'ORGANIZER'] as const;

  for (const role of ROLES_TO_TEST) {
    test(`registro envia role=${role} no payload (mock)`, async ({ page }) => {
      let capturedPayload: Record<string, unknown> = {};

      await page.route('**/auth/register', (route, request) => {
        capturedPayload = JSON.parse(request.postData() || '{}');
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'User registered successfully' }),
        });
      });

      await goToRegisterWithRole(page, role);

      await page.getByPlaceholder(/nome/i).first().fill(FAKE_REGISTER_DATA.name);
      const cpfField = page.getByPlaceholder(/000\.000\.000/i);
      if (await cpfField.count() > 0) await cpfField.fill(FAKE_REGISTER_DATA.cpf);
      await page.locator('input[type="email"], input[placeholder*="@"]').first().fill(FAKE_REGISTER_DATA.username);

      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.first().fill(FAKE_REGISTER_DATA.password);
      if (await passwordFields.count() > 1) await passwordFields.nth(1).fill(FAKE_REGISTER_DATA.password);

      await page.locator('form button[type="submit"]').click();

      // Aguarda request ser processada
      await page.waitForTimeout(3_000);

      expect(capturedPayload.role).toBe(role);
    });
  }
});

test.describe('Esqueci minha senha', () => {

  test('link "Clique aqui" navega para /esqueci-senha', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.locator('a[href="/esqueci-senha"]').click();

    await page.waitForURL('/esqueci-senha', { timeout: 5_000 });
    await expect(page.locator('text=RECUPERAR SENHA')).toBeVisible({ timeout: 5_000 });
  });

  test('submete email e exibe mensagem de sucesso (mock)', async ({ page }) => {
    // Mock ANTES de navegar
    await page.route('**/auth/forgot-password', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email sent' }),
      });
    });

    await page.goto('/esqueci-senha', { waitUntil: 'networkidle' });

    await page.locator('input[type="email"], input[placeholder*="@"]').first().fill('teste@zapi10.com');

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/forgot-password') && req.method() === 'POST'
    );

    // O botão pode ser "Enviar Link" ou "Recuperar Senha"
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /enviar|recuperar/i }).first();
    await submitBtn.click();

    const request = await requestPromise;
    const payload = JSON.parse(request.postData() || '{}');
    expect(payload.email).toBe('teste@zapi10.com');
  });

  test('link "Fazer login" retorna para /login', async ({ page }) => {
    await page.goto('/esqueci-senha', { waitUntil: 'networkidle' });

    const loginLink = page.locator('a, button').filter({ hasText: /fazer login|voltar/i }).first();
    await loginLink.click();

    await page.waitForURL('**/login**', { timeout: 5_000 });
  });
});

test.describe('Logout', () => {

  test('logout limpa sessão e redireciona para login', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    await page.waitForTimeout(2_000);
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();

    // Clica no avatar/nome do usuário (classe `user-info-button` em Header.tsx)
    // pra abrir o dropdown. Usar a classe específica é mais robusto do que
    // pegar o primeiro botão do header (que pode mudar de ordem com features novas).
    await page.locator('.user-info-button').click();
    await page.waitForTimeout(500);

    // Clica em "Sair" no dropdown
    await page.locator('text=/^Sair$/').click();

    await page.waitForURL('**/login**', { timeout: 10_000 });

    const tokenAfter = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(tokenAfter).toBeFalsy();
  });
});
