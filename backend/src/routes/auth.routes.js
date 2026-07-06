import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authRequired } from '../middlewares/auth.js';
import { httpError } from '../utils/httpError.js';
import { ensureDefaultCategories } from '../services/categoryDefaultsService.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional().nullable(),
  profile_type: z.enum(['pessoal', 'empresa', 'ambos']).default('pessoal')
});

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await query('SELECT id FROM users WHERE email = :email', { email: data.email });
    if (exists[0]) throw httpError(409, 'E-mail ja cadastrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, phone, profile_type) VALUES (:name, :email, :passwordHash, :phone, :profile_type)',
      { ...data, passwordHash }
    );
    await ensureDefaultCategories(result.insertId);
    const user = { id: result.insertId, name: data.name, email: data.email, phone: data.phone, profile_type: data.profile_type };
    res.status(201).json({ user, token: sign(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const users = await query('SELECT * FROM users WHERE email = :email', { email });
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) throw httpError(401, 'E-mail ou senha invalidos');
    delete user.password_hash;
    res.json({ user, token: sign(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const users = await query('SELECT id, name, email, phone, profile_type, created_at FROM users WHERE id = :id', { id: req.user.id });
    res.json(users[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
