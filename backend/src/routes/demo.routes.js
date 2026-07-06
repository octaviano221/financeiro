import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { query } from '../config/db.js';

const router = Router();
router.use(authRequired);

router.post('/seed', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await query('INSERT INTO categories (user_id, name, type, color, icon) VALUES (:userId, "Salario", "receita", "#16a34a", "wallet"), (:userId, "Moradia", "despesa", "#2563eb", "home"), (:userId, "Alimentacao", "despesa", "#f97316", "utensils"), (:userId, "Dividas", "despesa", "#dc2626", "receipt")', { userId });
    await query('INSERT INTO bank_accounts (user_id, bank_name, account_type, current_balance, overdraft_limit, overdraft_used, overdraft_interest_rate, interest_due_day) VALUES (:userId, "Nubank", "digital", 8754.32, 3000, 2450, 8.5, 10)', { userId });
    await query('INSERT INTO credit_cards (user_id, card_name, issuer, total_limit, used_limit, closing_day, due_day, revolving_interest_rate, current_invoice_value, minimum_payment_value, status) VALUES (:userId, "Cartao Principal", "Nubank", 10000, 6250, 15, 20, 14.9, 6250, 987.60, "aberta")', { userId });
    await query('INSERT INTO debts (user_id, debt_name, creditor, debt_type, original_amount, current_amount, monthly_interest_rate, start_date, due_date, installments_total, installments_paid, installment_value, status, priority) VALUES (:userId, "Cheque especial", "Banco", "cheque_especial", 2450, 2450, 8.5, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 1, 0, 2450, "atrasada", "urgente"), (:userId, "Emprestimo pessoal", "Financeira", "emprestimo_pessoal", 18000, 18753.60, 4.2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 24, 3, 980, "em_dia", "alta")', { userId });
    await query('INSERT INTO incomes (user_id, description, amount, received_date, is_recurring, recurrence_type, status) VALUES (:userId, "Receita mensal", 7850, CURDATE(), TRUE, "mensal", "recebido")', { userId });
    await query('INSERT INTO expenses (user_id, description, amount, due_date, is_recurring, recurrence_type, status) VALUES (:userId, "Aluguel", 2446, DATE_ADD(CURDATE(), INTERVAL 2 DAY), TRUE, "mensal", "aberto"), (:userId, "Mercado", 1397, DATE_ADD(CURDATE(), INTERVAL 4 DAY), FALSE, NULL, "aberto"), (:userId, "Conta vencida", 987.60, DATE_SUB(CURDATE(), INTERVAL 5 DAY), FALSE, NULL, "vencido")', { userId });
    await query('INSERT INTO financial_goals (user_id, goal_name, target_amount, current_amount, deadline, priority, status) VALUES (:userId, "Reserva de Emergencia", 10000, 1200, DATE_ADD(CURDATE(), INTERVAL 180 DAY), "alta", "ativa")', { userId });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/clear', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await query('DELETE FROM payments WHERE user_id = :userId', { userId });
    await query('DELETE FROM alerts WHERE user_id = :userId', { userId });
    await query('DELETE FROM action_plans WHERE user_id = :userId', { userId });
    await query('DELETE FROM card_transactions WHERE user_id = :userId', { userId });
    await query('DELETE FROM incomes WHERE user_id = :userId', { userId });
    await query('DELETE FROM expenses WHERE user_id = :userId', { userId });
    await query('DELETE FROM debts WHERE user_id = :userId', { userId });
    await query('DELETE FROM financial_goals WHERE user_id = :userId', { userId });
    await query('DELETE FROM credit_cards WHERE user_id = :userId', { userId });
    await query('DELETE FROM bank_accounts WHERE user_id = :userId', { userId });
    await query('DELETE FROM categories WHERE user_id = :userId', { userId });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
