import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login.page';

type CarfectFixtures = {
  loginPage: LoginPage;
  authenticatedPage: LoginPage;
};

export const test = base.extend<CarfectFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const login = process.env.E2E_LOGIN ?? 'admin';
    const password = process.env.E2E_PASSWORD ?? '';
    if (!password) throw new Error('E2E_PASSWORD env var required');

    await loginPage.login(login, password);
    await loginPage.expectRedirectToAdmin();
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';
