import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';
import { toNumber } from '../utils/money.js';

const router = Router();
router.use(authRequired);

router.post('/register', async (req, res, next) => {
  const connection = await (await import('../config/db.js')).pool.getConnection();
  try {
    const { target_type, target_id, amount, bank_account_id, payment_date, notes } = req.body;
    const paidAmount = toNumber(amount);
    if (!target_type || !target_id || paidAmount <= 0) throw httpError(400, 'Informe tipo, registro e valor do pagamento');

    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO payments (user_id, target_type, target_id, amount, bank_account_id, payment_date, notes)
       VALUES (:userId, :target_type, :target_id, :amount, :bank_account_id, :payment_date, :notes)`,
      { userId: req.user.id, target_type, target_id, amount: paidAmount, bank_account_id: bank_account_id || null, payment_date: payment_date || new Date().toISOString().slice(0, 10), notes: notes || null }
    );

    if (bank_account_id) {
      await connection.execute(
        'UPDATE bank_accounts SET current_balance = current_balance - :amount WHERE id = :bank_account_id AND user_id = :userId',
        { amount: paidAmount, bank_account_id, userId: req.user.id }
      );
    }

    if (target_type === 'expense') {
      await connection.execute('UPDATE expenses SET status = "pago", payment_date = :paymentDate WHERE id = :id AND user_id = :userId', { paymentDate: payment_date || new Date().toISOString().slice(0, 10), id: target_id, userId: req.user.id });
    } else if (target_type === 'debt') {
      await connection.execute(
        `UPDATE debts
         SET current_amount = GREATEST(0, current_amount - :amount),
             installments_paid = LEAST(installments_total, installments_paid + 1),
             status = CASE WHEN GREATEST(0, current_amount - :amount) = 0 THEN 'quitada' ELSE status END
         WHERE id = :id AND user_id = :userId`,
        { amount: paidAmount, id: target_id, userId: req.user.id }
      );
    } else if (target_type === 'card') {
      await connection.execute(
        `UPDATE credit_cards
         SET current_invoice_value = GREATEST(0, current_invoice_value - :amount),
             used_limit = GREATEST(0, used_limit - :amount),
             status = CASE WHEN GREATEST(0, current_invoice_value - :amount) = 0 THEN 'paga' ELSE status END
         WHERE id = :id AND user_id = :userId`,
        { amount: paidAmount, id: target_id, userId: req.user.id }
      );
    } else if (target_type === 'card_transaction') {
      await connection.execute('UPDATE card_transactions SET status = "paga" WHERE id = :id AND user_id = :userId', { id: target_id, userId: req.user.id });
    } else {
      throw httpError(400, 'Tipo de pagamento invalido');
    }

    await connection.commit();
    res.status(201).json({ ok: true });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM payments WHERE user_id = :userId ORDER BY payment_date DESC, created_at DESC', { userId: req.user.id });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
