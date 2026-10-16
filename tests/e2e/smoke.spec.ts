import { expect, test } from '@playwright/test';

// A instância de teste precisa estar iniciada (npm run build && npm run start).
// Evita logar com senha real e não modifica as notas do usuário.
test('o aplicativo abre com título e documento PT-BR', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/WebObsidian/i);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
});

test('a interface não produz rolagem horizontal em dispositivos móveis', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'O teste de responsividade é específico para mobile');
  await page.goto('/');
  const width = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(width.documentWidth).toBeLessThanOrEqual(width.viewportWidth + 2);
});
