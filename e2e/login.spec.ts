import { test, expect } from '@playwright/test';

const E2E_LOGIN = process.env.E2E_LOGIN ?? 'admin';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows login form with username and password fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /logowanie/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Hasło' })).toBeVisible();
    await expect(page.getByRole('button', { name: /zaloguj/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Login' }).fill('wronguser');
    await page.getByRole('textbox', { name: 'Hasło' }).fill('wrongpass');
    await page.getByRole('button', { name: /zaloguj/i }).click();

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/nieprawidłow|błąd|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('redirects to admin dashboard on successful login', async ({ page }) => {
    test.skip(!E2E_PASSWORD, 'E2E_PASSWORD env var required');

    await page.getByRole('textbox', { name: 'Login' }).fill(E2E_LOGIN);
    await page.getByRole('textbox', { name: 'Hasło' }).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /zaloguj/i }).click();

    // Should redirect to admin panel
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /logowanie/i })).not.toBeVisible();
  });

  test('shows forgot password link', async ({ page }) => {
    const link = page.getByRole('link', { name: /zapomniałeś/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/forgot-password');
  });
});
