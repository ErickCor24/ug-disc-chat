import { test, expect } from '@playwright/test';

import { expectConnectedCount, joinChannel, login, userInList } from './helpers';

test('switching channels removes the user from the previous channel roster', async ({
  browser,
}) => {
  const aliceContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();
  await login(alicePage, 'alice@test.com', 'password123');
  await joinChannel(alicePage, 'general');
  await expectConnectedCount(alicePage, 1);

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await login(bobPage, 'bob@test.com', 'password123');
  await joinChannel(bobPage, 'general');

  await expectConnectedCount(alicePage, 2);
  await expect(userInList(alicePage, 'bob')).toBeVisible();

  await joinChannel(bobPage, 'tech');

  await expectConnectedCount(alicePage, 1);
  await expect(userInList(alicePage, 'bob')).toHaveCount(0);
  await expect(userInList(alicePage, 'alice')).toBeVisible();

  await expectConnectedCount(bobPage, 1);
  await expect(userInList(bobPage, 'bob')).toBeVisible();

  await aliceContext.close();
  await bobContext.close();
});
