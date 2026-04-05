import { Page } from '@playwright/test';

// Credenciais de teste por role
export const TEST_USERS = {
  ADMIN: { username: 'moveltrack@gmail.com', password: process.env.TEST_ADMIN_PASSWORD || 'Elis@123' },
  CLIENT: { username: 'demo.client@zapi10.com', password: 'Demo@123' },
  COURIER: { username: 'demo.courier@zapi10.com', password: 'Demo@123' },
  CUSTOMER: { username: 'demo.customer@zapi10.com', password: 'Demo@123' },
  ORGANIZER: { username: 'demo.organizer@zapi10.com', password: 'Demo@123' },
} as const;

export type Role = keyof typeof TEST_USERS;

/**
 * Faz login via API e injeta token no localStorage.
 */
export async function loginAs(page: Page, role: Role) {
  const { username, password } = TEST_USERS[role];

  const response = await page.request.post('http://localhost:8080/auth/login', {
    data: { username, password },
  });

  if (!response.ok()) {
    throw new Error(`Login falhou para ${role} (${username}): ${response.status()} - ${await response.text()}`);
  }

  const data = await response.json();
  const token = data.token;
  const user = data.user || {};

  // Navega para qualquer página para ter acesso ao localStorage
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Injeta tudo no localStorage de uma vez
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('authToken', token);
    if (user.userId) localStorage.setItem('userId', user.userId);
    if (user.name) localStorage.setItem('userName', user.name);
    if (user.email) localStorage.setItem('userEmail', user.email);
    if (user.role) localStorage.setItem('userRole', user.role);
    if (user.organizationId) localStorage.setItem('organizationId', String(user.organizationId));
  }, { token, user });

  // Reload para o React app detectar o token no localStorage
  await page.reload({ waitUntil: 'networkidle' });
}

/**
 * Navega para uma rota CRUD e espera carregar.
 */
export async function goToCrud(page: Page, path: string) {
  // Vai para home primeiro para o app processar o localStorage e carregar metadata
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2_000);

  // Agora navega para o CRUD
  await page.goto(path, { waitUntil: 'networkidle' });
  // Espera tabela ou conteúdo aparecer (até 15s)
  await page.waitForSelector('table, .form-container, h2, h3', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1_000);
}
