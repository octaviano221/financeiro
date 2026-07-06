export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function dateBr(value) {
  if (!value) return '-';
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR');
}

export function normalizePayload(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === '' ? null : value]));
}
