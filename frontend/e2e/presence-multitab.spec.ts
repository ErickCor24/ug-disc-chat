import { test, expect } from '@playwright/test';

import { expectConnectedCount, joinChannel, login, userInList } from './helpers';

test('a user stays connected in another tab after closing one of two open tabs', async ({
  browser,
}) => {
  const context = await browser.newContext();

  const page1 = await context.newPage();
  await login(page1, 'alice@test.com', 'password123');
  await joinChannel(page1, 'general');
  await expectConnectedCount(page1, 1);
  await expect(userInList(page1, 'alice')).toBeVisible();

  const page2 = await context.newPage();
  await page2.goto('/chat');
  await joinChannel(page2, 'general');
  await expectConnectedCount(page2, 1);
  await expect(userInList(page2, 'alice')).toBeVisible();

  await expectConnectedCount(page1, 1);

  await page1.close();

  await expectConnectedCount(page2, 1);
  await expect(userInList(page2, 'alice')).toBeVisible();

  await context.close();
});
