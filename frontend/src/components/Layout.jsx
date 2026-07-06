import { Link, NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Bell, Building2, CalendarDays, CheckCircle2, ChevronDown, CreditCard, Flag, Gauge, Home, LineChart, LogOut, Mail, Menu, Moon, Receipt, Search, Server, Settings, ShieldAlert, ShoppingCart, Sparkles, Target, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';

const nav = [
  ['/', 'Dashboard', Home],
  ['/primeiros-passos', 'Primeiros Passos', Sparkles],
  ['/bancos', 'Bancos', Building2],
  ['/cartoes', 'Cartoes', CreditCard],
  ['/compras-cartao', 'Compras Cartao', CreditCard],
  ['/dividas', 'Dividas', Receipt],
  ['/receitas', 'Receitas', WalletCards],
  ['/despesas', 'Despesas', Bell],
  ['/gastos-mensais', 'Gastos Mensais', ShoppingCart],
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    api.get('/settings').then((response) => {
      document.body.classList.toggle('dark-theme', response.data.theme === 'dark');
    }).catch(() => {});
    api.get('/dashboard/financial-health').then((response) => setHealth(response.data)).catch(() => setHealth(null));
    api.get('/dashboard/alerts').then((response) => setAlertCount(response.data.length)).catch(() => setAlertCount(0));
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
          <Link className="ghost-icon top-icon-link alert-button" to="/alertas" aria-label="Alertas">
            <Bell size={19} />
            {alertCount > 0 && <span>{alertCount > 9 ? '9+' : alertCount}</span>}
          </Link>
          <Link className="ghost-icon top-icon-link" to="/status" aria-label="Mensagens do sistema">
            <Mail size={19} />
          </Link>
          <button className="ghost-icon" aria-label="Tema"><Moon size={19} /></button>
          <div className="user-menu-wrap">
            <button className="user-chip" onClick={() => setUserMenuOpen((open) => !open)} aria-expanded={userMenuOpen} aria-haspopup="menu">
              <div className="avatar">{user?.name?.slice(0, 1) || 'U'}</div>
              <div>
                <strong>Ola, {user?.name || 'Usuario'}!</strong>
                <span>Conta ativa</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {userMenuOpen && (
              <div className="user-menu" role="menu">
                <Link to="/configuracoes" onClick={() => setUserMenuOpen(false)}><Settings size={16} /> Configuracoes</Link>
                <Link to="/primeiros-passos" onClick={() => setUserMenuOpen(false)}><Sparkles size={16} /> Primeiros passos</Link>
                <Link to="/status" onClick={() => setUserMenuOpen(false)}><UserRound size={16} /> Status da conta</Link>
                <button onClick={logout}><LogOut size={16} /> Sair</button>
              </div>
            )}
          </div>
          <button className="top-logout" onClick={logout}><LogOut size={17} /> Sair</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
