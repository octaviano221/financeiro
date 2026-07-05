import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import crudRoutes from './routes/crud.routes.js';
import actionPlanRoutes from './routes/actionPlan.routes.js';
import reportRoutes from './routes/report.routes.js';
import financeToolsRoutes from './routes/financeTools.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import demoRoutes from './routes/demo.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import passwordRoutes from './routes/password.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/action-plan', actionPlanRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/tools', financeToolsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/demo', demoRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/password', passwordRoutes);
  app.use('/api', crudRoutes);

  app.use((req, res) => res.status(404).json({ message: 'Rota nao encontrada' }));
  app.use(errorHandler);

  return app;
}
