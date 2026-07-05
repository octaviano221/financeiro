import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

router.post('/forgot', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const users = await query('SELECT id FROM users WHERE email = :email', { email });
    if (!users[0]) return res.json({ message: 'Se o e-mail existir, um token sera gerado.' });

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:userId, :token, :expiresAt)',
      { userId: users[0].id, token, expiresAt }
    );

    res.json({
      message: 'Token de recuperacao gerado. Em producao, envie este token por e-mail.',
      reset_token: token
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset', async (req, res, next) => {
  try {
    const { token, password } = z.object({ token: z.string().min(10), password: z.string().min(6) }).parse(req.body);
    const rows = await query(
      'SELECT * FROM password_reset_tokens WHERE token = :token AND used_at IS NULL AND expires_at > NOW()',
      { token }
    );
    const reset = rows[0];
    if (!reset) throw httpError(400, 'Token invalido ou expirado');

    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = :passwordHash WHERE id = :userId', { passwordHash, userId: reset.user_id });
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = :id', { id: reset.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
