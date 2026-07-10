import { test, expect } from '@playwright/test';

import { channelItem, login } from './helpers';

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('hamburger toggles the sidebar drawer via click and Escape', async ({ page }) => {
    await login(page, 'alice@test.com', 'password123');

    const hamburger = page.locator('button.hamburger-btn');
    const backdrop = page.locator('.drawer-backdrop');

    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(backdrop).toHaveCount(0);

    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(backdrop).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(backdrop).toHaveCount(0);

    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    await channelItem(page, 'general').click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(backdrop).toHaveCount(0);
  });

  test('the floating hamburger does not cover the channel title', async ({ page }) => {
    await login(page, 'alice@test.com', 'password123');

    await page.locator('button.hamburger-btn').click();
    await channelItem(page, 'general').click();
    await expect(page.locator('.chat-header')).toBeVisible();

    const hamburger = await page.locator('button.hamburger-btn').boundingBox();
    const title = await page.locator('.chat-header .channel-hash').boundingBox();

    expect(hamburger).not.toBeNull();
    expect(title).not.toBeNull();
    expect(hamburger!.x + hamburger!.width).toBeLessThanOrEqual(title!.x);
  });
});

test.describe('desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sidebar is always visible and the hamburger is hidden', async ({ page }) => {
    await login(page, 'alice@test.com', 'password123');

    await expect(page.locator('button.hamburger-btn')).not.toBeVisible();
    await expect(page.locator('aside.sidebar')).toBeVisible();
  });
});
