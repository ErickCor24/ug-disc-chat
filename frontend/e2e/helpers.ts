import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/chat/);
}

export function channelItem(page: Page, channelName: string) {
  return page.getByRole('button', { name: `Canal ${channelName}`, exact: true });
}

export async function joinChannel(page: Page, channelName: string): Promise<void> {
  await channelItem(page, channelName).click();
  await expect(page.getByRole('heading', { name: channelName, level: 3 })).toBeVisible();
}

export function userListHeader(page: Page) {
  return page.locator('.user-list-header');
}

export function userInList(page: Page, username: string) {
  return page.locator('.user-list .user-item').filter({ hasText: username });
}

export async function expectConnectedCount(page: Page, count: number): Promise<void> {
  await expect(userListHeader(page)).toHaveText(`En línea — ${count}`);
}
