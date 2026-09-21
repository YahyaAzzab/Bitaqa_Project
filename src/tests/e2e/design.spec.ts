import { test, expect } from '@playwright/test';

test.describe('Design system page', () => {
  test('renders in French', async ({ page }) => {
    await page.goto('/fr/design');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible();
  });

  test('renders in Arabic with RTL', async ({ page }) => {
    await page.goto('/ar/design');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
