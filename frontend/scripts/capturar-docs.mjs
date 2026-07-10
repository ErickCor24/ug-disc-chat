/**
 * Genera las capturas de pantalla de docs/manual-usuario.md.
 *
 * Requisitos: backend en :8000, frontend en :4200, y los usuarios alice y bob
 * sembrados en la base de datos local.
 *
 *   cd frontend && node scripts/capturar-docs.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:4200';
const OUT = new URL('../../docs/capturas/', import.meta.url).pathname;

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('password123');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL(/\/chat/);
}

async function entrarACanal(page, canal) {
  await page.getByRole('button', { name: `Canal ${canal}`, exact: true }).click();
  await page.getByRole('heading', { name: canal, level: 3 }).waitFor();
}

async function enviar(page, texto) {
  const input = page.getByPlaceholder(/Escribe en/);
  await input.fill(texto);
  await input.press('Enter');
  await page.getByText(texto, { exact: true }).waitFor();
}

// animations: 'disabled' adelanta las transiciones CSS a su estado final,
// para no capturar el drawer a medio abrir.
const shot = (target, nombre) =>
  target.screenshot({ path: `${OUT}${nombre}.png`, animations: 'disabled' });

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

const escritorio = { viewport: { width: 1280, height: 800 } };
const ctxAlice = await browser.newContext(escritorio);
const alice = await ctxAlice.newPage();

await alice.goto(`${BASE}/login`);
await shot(alice, '01-login');

await alice.goto(`${BASE}/register`);
await shot(alice, '02-registro');

await login(alice, 'alice@test.com');
await entrarACanal(alice, 'general');
await shot(alice, '03-chat-inicial');

const ctxBob = await browser.newContext(escritorio);
const bob = await ctxBob.newPage();
await login(bob, 'bob@test.com');
await entrarACanal(bob, 'general');

await alice.locator('.user-list .user-item').nth(1).waitFor();
await enviar(alice, 'Hola, ¿reciben el mensaje?');
await enviar(bob, 'Recibido, llega al instante.');
await alice.getByText('Recibido, llega al instante.').waitFor();

await shot(alice, '04-conversacion');
await shot(alice.locator('.user-list'), '05-usuarios-conectados');

await ctxBob.close();
await alice.locator('.user-list .user-item').nth(1).waitFor({ state: 'detached' });
await shot(alice.locator('.user-list'), '06-usuarios-tras-salida');

// En movil el sidebar es un drawer: hay que abrirlo para alcanzar los canales.
const ctxMovil = await browser.newContext({ viewport: { width: 626, height: 900 } });
const movil = await ctxMovil.newPage();
await login(movil, 'bob@test.com');

await movil.locator('button.hamburger-btn').click();
await movil.locator('.drawer-backdrop').waitFor();
await shot(movil, '08-movil-drawer-abierto');

// Seleccionar un canal cierra el drawer.
await entrarACanal(movil, 'off-topic');
await movil.locator('.drawer-backdrop').waitFor({ state: 'detached' });
await shot(movil, '07-movil-drawer-cerrado');

await browser.close();
console.log('capturas generadas en', OUT);
