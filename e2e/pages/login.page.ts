import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: 'Login' });
    this.passwordInput = page.getByRole('textbox', { name: 'Hasło' });
    this.submitButton = page.getByRole('button', { name: /zaloguj/i });
    this.errorMessage = page.getByText(/nieprawidłow|błąd|invalid/i);
    this.forgotPasswordLink = page.getByRole('link', { name: /zapomniałeś/i });
    this.heading = page.getByRole('heading', { name: /logowanie/i });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async expectRedirectToAdmin() {
    await expect(this.page).toHaveURL(/\/admin/, { timeout: 10000 });
  }
}
