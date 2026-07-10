import { test, expect } from '@playwright/test';

import { joinChannel, login } from './helpers';

/**
 * La interfaz se dibuja solo con SVG. Cubre flechas, simbolos tecnicos,
 * dingbats y pictogramas; deja fuera la puntuacion tipografica y los acentos
 * del castellano.
 */
const GLYPH_ICON = /[\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F000}-\u{1FAFF}]/u;

async function visibleText(page: import('@playwright/test').Page): Promise<string> {
  return page.locator('body').innerText();
}

test.describe('branding', () => {
  test('the login screen renders no glyph icons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('app-logo svg')).toBeVisible();
    expect(await visibleText(page)).not.toMatch(GLYPH_ICON);
  });

  test('the register screen renders no glyph icons', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('app-logo svg')).toBeVisible();
    expect(await visibleText(page)).not.toMatch(GLYPH_ICON);
  });

  test('the chat screen renders no glyph icons, in both empty and joined states', async ({ page }) => {
    await login(page, 'alice@test.com', 'password123');

    await expect(page.locator('.no-channel app-icon svg')).toBeVisible();
    expect(await visibleText(page)).not.toMatch(GLYPH_ICON);

    await joinChannel(page, 'general');

    await expect(page.locator('app-message-input .send-btn svg')).toBeVisible();
    expect(await visibleText(page)).not.toMatch(GLYPH_ICON);
  });
});
