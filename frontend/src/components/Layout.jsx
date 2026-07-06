import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Bell, Building2, CalendarDays, CheckCircle2, ChevronDown, CreditCard, Flag, Gauge, Home, LineChart, LogOut, Mail, Menu, Moon, Receipt, Search, Server, Settings, ShieldAlert, Target, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const nav = [
  ['/', 'Dashboard', Home],
  ['/bancos', 'Bancos', Building2],
  ['/cartoes', 'Cartoes', CreditCard],
  ['/compras-cartao', 'Compras Cartao', CreditCard],
  ['/dividas', 'Dividas', Receipt],
  ['/receitas', 'Receitas', WalletCards],
  ['/despesas', 'Despesas', Bell],
  ['/fluxo-de-caixa', 'Fluxo de Caixa', LineChart],
  ['/plano-de-acao', 'Plano', Flag],
  ['/pagamentos', 'Pagamentos', CheckCircle2],
  ['/alertas', 'Alertas', Bell],
  ['/emergencia', 'Emergencia', ShieldAlert],
  ['/metas', 'Metas', Target],
  ['/simulador', 'Simulador', Gauge],
  ['/calendario', 'Calendario', CalendarDays],
  ['/relatorios', 'Relatorios', BarChart3],
  ['/categorias', 'Categorias', CalendarDays],
  ['/status', 'Status', Server],
  ['/configuracoes', 'Configuracoes', Settings]
];

export function Layout() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get('/settings').then((response) => {
      document.body.classList.toggle('dark-theme', response.data.theme === 'dark');
    }).catch(() => {});
    api.get('/dashboard/financial-health').then((response) => setHealth(response.data)).catch(() => setHealth(null));
  }, []);

  return (
    <div className={menuOpen ? 'app-shell menu-open' : 'app-shell'}>
      <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
      <aside className="sidebar">
        <div className="brand">
          <Gauge size={28} />
          <div>
            <strong>Gestao Financeira</strong>
            <span>Inteligente</span>
          </div>
        </div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-health">
          <span>Saude Financeira</span>
          <strong>{health ? `${health.score} / 100` : '-- / 100'}</strong>
          <small>{health?.classification || 'Sem dados'}</small>
          <div className="mini-gauge"><i style={{ width: `${health?.score || 0}%` }} /></div>
        </div>
        <button className="logout" onClick={logout}><LogOut size={18} /> Sair</button>
      </aside>
      <main className="content">
        <header className="topbar">
          <button className="ghost-icon" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="top-search">
            <Search size={18} />
            <input placeholder="Buscar no sistema..." />
          </div>
          <button className="ghost-icon alert-dot" aria-label="Alertas"><Bell size={19} /></button>
          <button className="ghost-icon" aria-label="Mensagens"><Mail size={19} /></button>
          <button className="ghost-icon" aria-label="Tema"><Moon size={19} /></button>
          <div className="user-chip">
            <div className="avatar">{user?.name?.slice(0, 1) || 'U'}</div>
            <div>
              <strong>Ola, {user?.name || 'Usuario'}!</strong>
              <span>Conta ativa</span>
            </div>
            <ChevronDown size={16} />
          </div>
          <button className="top-logout" onClick={logout}><LogOut size={17} /> Sair</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
