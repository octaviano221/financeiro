import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { query } from '../config/db.js';

const router = Router();
router.use(authRequired);

const defaults = {
  currency: 'BRL',
  theme: 'light',
  income_commitment_limit: 50,
  desired_reserve_amount: 0,
  notifications_enabled: true
};

router.get('/', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM user_settings WHERE user_id = :userId', { userId: req.user.id });
    res.json(rows[0] || defaults);
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const payload = { ...defaults, ...req.body, userId: req.user.id };
    await query(
      `INSERT INTO user_settings (user_id, currency, theme, income_commitment_limit, desired_reserve_amount, notifications_enabled)
       VALUES (:userId, :currency, :theme, :income_commitment_limit, :desired_reserve_amount, :notifications_enabled)
       ON DUPLICATE KEY UPDATE
       currency = VALUES(currency),
       theme = VALUES(theme),
       income_commitment_limit = VALUES(income_commitment_limit),
       desired_reserve_amount = VALUES(desired_reserve_amount),
       notifications_enabled = VALUES(notifications_enabled)`,
      payload
    );
    const rows = await query('SELECT * FROM user_settings WHERE user_id = :userId', { userId: req.user.id });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
