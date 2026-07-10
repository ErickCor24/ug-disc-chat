// ── Utilidad para colores y iniciales de avatar basados en hash del username

const USER_COLORS = [
  '#e05c5c', // rojo
  '#d97706', // ámbar
  '#059669', // esmeralda
  '#7c3aed', // violeta
  '#db2777', // rosa
  '#0891b2', // cian
  '#65a30d', // lima
  '#c2410c', // naranja
];

const USER_BG_COLORS = [
  'rgba(224,92,92,0.10)',
  'rgba(217,119,6,0.10)',
  'rgba(5,150,105,0.10)',
  'rgba(124,58,237,0.10)',
  'rgba(219,39,119,0.10)',
  'rgba(8,145,178,0.10)',
  'rgba(101,163,13,0.10)',
  'rgba(194,65,12,0.10)',
];

function hashUsername(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return hash % USER_COLORS.length;
}

export function getAvatarColor(username: string | null): string {
  if (!username) return USER_COLORS[0];
  return USER_COLORS[hashUsername(username)];
}

export function getAvatarBgColor(username: string | null): string {
  if (!username) return USER_BG_COLORS[0];
  return USER_BG_COLORS[hashUsername(username)];
}

export function getAvatarInitial(username: string | null): string {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
}
