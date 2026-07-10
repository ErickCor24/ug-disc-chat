import { test, expect } from '@playwright/test';

import { expectConnectedCount, joinChannel, login, userInList } from './helpers';

test('presence syncs across independent browser sessions without a page reload', async ({
  browser,
}) => {
  const aliceContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();

  await login(alicePage, 'alice@test.com', 'password123');
  await joinChannel(alicePage, 'general');

  await expectConnectedCount(alicePage, 1);
  await expect(userInList(alicePage, 'alice')).toBeVisible();

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();

  await login(bobPage, 'bob@test.com', 'password123');
  await joinChannel(bobPage, 'general');

  await expectConnectedCount(alicePage, 2);
  await expect(userInList(alicePage, 'bob')).toBeVisible();
  await expect(userInList(bobPage, 'alice')).toBeVisible();
  await expect(userInList(bobPage, 'bob')).toBeVisible();

  await bobContext.close();

  await expectConnectedCount(alicePage, 1);
  await expect(userInList(alicePage, 'bob')).toHaveCount(0);
  await expect(userInList(alicePage, 'alice')).toBeVisible();

  await aliceContext.close();
});
