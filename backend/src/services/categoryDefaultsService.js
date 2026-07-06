import { query } from '../config/db.js';

const defaultCategories = [
  ['Salario', 'receita', '#16a34a', 'wallet'],
  ['Servicos', 'receita', '#2563eb', 'briefcase'],
  ['Vendas', 'receita', '#10b981', 'shopping-bag'],
  ['Mercado', 'despesa', '#f97316', 'shopping-cart'],
  ['Aluguel', 'despesa', '#2563eb', 'home'],
  ['Energia', 'despesa', '#facc15', 'zap'],
  ['Agua', 'despesa', '#38bdf8', 'droplets'],
  ['Internet', 'despesa', '#7c3aed', 'wifi'],
  ['Transporte', 'despesa', '#0f766e', 'car'],
  ['Saude', 'despesa', '#dc2626', 'heart-pulse'],
  ['Escola', 'despesa', '#9333ea', 'graduation-cap'],
  ['Dividas', 'despesa', '#b91c1c', 'receipt'],
  ['Cartao', 'despesa', '#4f46e5', 'credit-card']
];

export async function ensureDefaultCategories(userId) {
  const existing = await query('SELECT name, type FROM categories WHERE user_id = :userId', { userId });
  const existingKeys = new Set(existing.map((item) => `${item.name}:${item.type}`.toLowerCase()));
  const missing = defaultCategories.filter(([name, type]) => !existingKeys.has(`${name}:${type}`.toLowerCase()));

  for (const [name, type, color, icon] of missing) {
    await query(
      'INSERT INTO categories (user_id, name, type, color, icon, active) VALUES (:userId, :name, :type, :color, :icon, TRUE)',
      { userId, name, type, color, icon }
    );
  }

  return { created: missing.length };
}
