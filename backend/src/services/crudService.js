import { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';
import { roundMoney, toNumber } from '../utils/money.js';

const resources = {
  'bank-accounts': {
    table: 'bank_accounts',
    fields: ['bank_name', 'account_type', 'current_balance', 'overdraft_limit', 'overdraft_used', 'overdraft_interest_rate', 'interest_due_day', 'notes']
  },
  'credit-cards': {
    table: 'credit_cards',
    fields: ['card_name', 'issuer', 'total_limit', 'used_limit', 'closing_day', 'due_day', 'revolving_interest_rate', 'current_invoice_value', 'minimum_payment_value', 'status', 'notes']
  },
  'card-transactions': {
    table: 'card_transactions',
    fields: ['credit_card_id', 'description', 'amount', 'purchase_date', 'installments', 'current_installment', 'category_id', 'status']
  },
  debts: {
    table: 'debts',
    fields: ['debt_name', 'creditor', 'debt_type', 'original_amount', 'current_amount', 'monthly_interest_rate', 'start_date', 'due_date', 'installments_total', 'installments_paid', 'installment_value', 'status', 'priority', 'has_guarantee', 'notes']
  },
  incomes: {
    table: 'incomes',
    fields: ['description', 'amount', 'received_date', 'category_id', 'bank_account_id', 'is_recurring', 'recurrence_type', 'status']
  },
  expenses: {
    table: 'expenses',
    fields: ['description', 'amount', 'due_date', 'payment_date', 'category_id', 'bank_account_id', 'is_recurring', 'recurrence_type', 'status', 'notes']
  },
  goals: {
    table: 'financial_goals',
    fields: ['goal_name', 'target_amount', 'current_amount', 'deadline', 'priority', 'status']
  },
  categories: {
    table: 'categories',
    fields: ['name', 'type', 'color', 'icon', 'active']
  },
  alerts: {
    table: 'alerts',
    fields: ['title', 'message', 'alert_type', 'severity', 'is_read', 'related_table', 'related_id']
  },
  settings: {
    table: 'user_settings',
    fields: ['currency', 'theme', 'income_commitment_limit', 'desired_reserve_amount', 'notifications_enabled']
  }
};

export function getResource(name) {
  const resource = resources[name];
  if (!resource) throw httpError(404, 'Recurso nao encontrado');
  return resource;
}

export async function list(resourceName, userId) {
  const resource = getResource(resourceName);
  return query(`SELECT * FROM ${resource.table} WHERE user_id = :userId ORDER BY created_at DESC`, { userId });
}

export async function create(resourceName, userId, payload) {
  if (resourceName === 'card-transactions' && toNumber(payload.installments) > 1) {
    return createCardInstallments(userId, payload);
  }

  const resource = getResource(resourceName);
  const fields = resource.fields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (!fields.length) throw httpError(400, 'Nenhum campo valido informado');

  const columns = ['user_id', ...fields].join(', ');
  const values = [':userId', ...fields.map((field) => `:${field}`)].join(', ');
  const result = await query(`INSERT INTO ${resource.table} (${columns}) VALUES (${values})`, { userId, ...payload });
  const rows = await query(`SELECT * FROM ${resource.table} WHERE id = :id AND user_id = :userId`, { id: result.insertId, userId });
  return rows[0];
}

async function createCardInstallments(userId, payload) {
  const installments = Math.max(1, Number(payload.installments || 1));
  const totalAmount = toNumber(payload.amount);
  const installmentAmount = roundMoney(totalAmount / installments);
  const purchaseDate = new Date(payload.purchase_date);
  const created = [];

  for (let index = 1; index <= installments; index += 1) {
    const dueDate = new Date(purchaseDate);
    dueDate.setMonth(dueDate.getMonth() + index - 1);
    const item = {
      ...payload,
      amount: installmentAmount,
      purchase_date: dueDate.toISOString().slice(0, 10),
      current_installment: index
    };
    const result = await query(
      `INSERT INTO card_transactions (user_id, credit_card_id, description, amount, purchase_date, installments, current_installment, category_id, status)
       VALUES (:userId, :credit_card_id, :description, :amount, :purchase_date, :installments, :current_installment, :category_id, :status)`,
      { userId, status: 'aberta', category_id: null, ...item }
    );
    const rows = await query('SELECT * FROM card_transactions WHERE id = :id AND user_id = :userId', { id: result.insertId, userId });
    created.push(rows[0]);
  }

  await query(
    `UPDATE credit_cards
     SET used_limit = used_limit + :totalAmount,
         current_invoice_value = current_invoice_value + :installmentAmount
     WHERE id = :creditCardId AND user_id = :userId`,
    { totalAmount, installmentAmount, creditCardId: payload.credit_card_id, userId }
  );

  return { installments: created };
}

export async function update(resourceName, userId, id, payload) {
  const resource = getResource(resourceName);
  const fields = resource.fields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (!fields.length) throw httpError(400, 'Nenhum campo valido informado');

  const setSql = fields.map((field) => `${field} = :${field}`).join(', ');
  await query(`UPDATE ${resource.table} SET ${setSql} WHERE id = :id AND user_id = :userId`, { id, userId, ...payload });
  const rows = await query(`SELECT * FROM ${resource.table} WHERE id = :id AND user_id = :userId`, { id, userId });
  if (!rows[0]) throw httpError(404, 'Registro nao encontrado');
  return rows[0];
}

export async function remove(resourceName, userId, id) {
  const resource = getResource(resourceName);
  const result = await query(`DELETE FROM ${resource.table} WHERE id = :id AND user_id = :userId`, { id, userId });
  if (!result.affectedRows) throw httpError(404, 'Registro nao encontrado');
  return { ok: true };
}
