import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { getCalendarEvents, getCashFlow, simulateRenegotiation } from '../services/financeToolsService.js';

const router = Router();
router.use(authRequired);

router.get('/cash-flow', async (req, res, next) => {
  try {
    res.json(await getCashFlow(req.user.id, req.query));
  } catch (error) {
    next(error);
  }
});

router.get('/calendar', async (req, res, next) => {
  try {
    res.json(await getCalendarEvents(req.user.id, req.query));
  } catch (error) {
    next(error);
  }
});

router.post('/renegotiation/simulate', async (req, res, next) => {
  try {
    res.json(simulateRenegotiation(req.body));
  } catch (error) {
    next(error);
  }
});

export default router;
