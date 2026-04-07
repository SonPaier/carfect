import { test, expect } from './fixtures';

test.describe('Login flow', () => {
  test('shows login form with username and password fields', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ loginPage }) => {
    await loginPage.login('wronguser', 'wrongpass');
    await loginPage.expectError();
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('redirects to admin dashboard on successful login', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.page).toHaveURL(/\/admin/);
  });

  test('shows forgot password link', async ({ loginPage }) => {
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });
});
