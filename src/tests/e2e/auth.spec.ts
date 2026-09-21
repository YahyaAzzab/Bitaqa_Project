import { expect, test } from '@playwright/test';

test.describe('Auth gates', () => {
  test('login renders in French', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Espace vendeur');
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrer' })).toBeVisible();
  });

  test('login renders in Arabic with RTL', async ({ page }) => {
    await page.goto('/ar/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('dashboard redirects guests to login', async ({ page }) => {
    await page.goto('/fr/dashboard');
    await expect(page).toHaveURL(/\/fr\/login/);
    await expect(page.url()).toContain('next=');
  });
});
