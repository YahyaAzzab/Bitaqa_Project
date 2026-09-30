import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads in French', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('loads in Arabic with RTL', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('plays the intro once per visit', async ({ page }) => {
    await page.goto('/fr');
    const intro = page.locator('.home-intro');
    await expect(intro).toBeVisible();
    await expect(intro).toBeHidden({ timeout: 3000 });

    await page.reload();
    await expect(intro).toBeHidden();
  });

  test('leads clients to their space and keeps the seller entry in the footer', async ({
    page,
  }) => {
    await page.goto('/fr');
    await expect(page.getByRole('link', { name: 'Espace client' })).toHaveAttribute(
      'href',
      '/fr/account',
    );
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Espace vendeur' }),
    ).toHaveAttribute('href', '/fr/login');
  });
});
