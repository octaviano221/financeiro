import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { getFinancialSnapshot } from '../services/dashboardService.js';
import { getCashFlow } from '../services/financeToolsService.js';

const router = Router();
router.use(authRequired);

router.get('/monthly', async (req, res, next) => {
  try {
    const snapshot = await getFinancialSnapshot(req.user.id);
    res.json({ summary: snapshot.summary, health: snapshot.health, alerts: snapshot.alerts });
  } catch (error) {
    next(error);
  }
});

router.get('/debts', async (req, res, next) => {
  try {
    const snapshot = await getFinancialSnapshot(req.user.id);
    res.json(snapshot.debts);
  } catch (error) {
    next(error);
  }
});

router.get('/cash-flow', async (req, res, next) => {
  try {
    const snapshot = await getFinancialSnapshot(req.user.id);
    res.json({ incomes: snapshot.incomes, expenses: snapshot.expenses, expectedBalance: snapshot.summary.expectedMonthlyBalance });
  } catch (error) {
    next(error);
  }
});

router.get('/cards', async (req, res, next) => {
  try {
    const snapshot = await getFinancialSnapshot(req.user.id);
    res.json(snapshot.cards);
  } catch (error) {
    next(error);
  }
});

function csv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

router.get('/export/:type', async (req, res, next) => {
  try {
    const snapshot = await getFinancialSnapshot(req.user.id);
    const cashFlow = await getCashFlow(req.user.id, { period: req.query.period || 'month' });
    const data = {
      debts: snapshot.debts,
      cards: snapshot.cards,
      incomes: snapshot.incomes,
      expenses: snapshot.expenses,
      'cash-flow': cashFlow.daily
    }[req.params.type];
    if (!data) return res.status(404).json({ message: 'Relatorio nao encontrado' });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}.csv"`);
    res.send(csv(data));
  } catch (error) {
    next(error);
  }
});

export default router;
