import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { api } from '../api/client.js';
import { useToast } from '../state/ToastContext.jsx';

export function AuthPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', profile_type: 'pessoal' });
  const [reset, setReset] = useState({ token: '', password: '' });
  const { showToast } = useToast();

  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        showToast('Login realizado.');
      } else if (mode === 'register') {
        await register(form);
        showToast('Conta criada.');
      }
      else if (mode === 'forgot') {
        const response = await api.post('/password/forgot', { email: form.email });
        setInfo(`${response.data.message}${response.data.reset_token ? ` Token: ${response.data.reset_token}` : ''}`);
        showToast('Token gerado.');
      } else if (mode === 'reset') {
        await api.post('/password/reset', reset);
        setInfo('Senha alterada. Entre com a nova senha.');
        setMode('login');
        showToast('Senha alterada.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Nao foi possivel concluir');
      showToast(err.response?.data?.message || 'Nao foi possivel concluir.', 'error');
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-copy">
        <div className="auth-logo-mark"><Landmark size={38} /></div>
        <h1>Gestao Financeira Inteligente</h1>
        <p>Organize bancos, cartoes, dividas, receitas e despesas em um painel simples para sair do aperto com plano de acao.</p>
        <div className="auth-highlights">
          <span>Dashboard financeiro</span>
          <span>Plano contra dividas</span>
          <span>Modo emergencia</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-brand"><Landmark size={34} /><strong>Gestao Financeira Inteligente</strong></div>
        <h1>{mode === 'login' ? 'Acesse sua conta' : mode === 'register' ? 'Crie sua conta' : mode === 'forgot' ? 'Recuperar senha' : 'Nova senha'}</h1>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input placeholder="Telefone opcional" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select value={form.profile_type} onChange={(e) => setForm({ ...form, profile_type: e.target.value })}>
                <option value="pessoal">Pessoal</option>
                <option value="empresa">Empresa</option>
                <option value="ambos">Ambos</option>
              </select>
            </>
          )}
          {mode !== 'reset' && <input type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />}
          {['login', 'register'].includes(mode) && <input type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          {mode === 'reset' && (
            <>
              <input placeholder="Token recebido" value={reset.token} onChange={(e) => setReset({ ...reset, token: e.target.value })} required />
              <input type="password" placeholder="Nova senha" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} required />
            </>
          )}
          {error && <div className="error">{error}</div>}
          {info && <div className="success-box">{info}</div>}
          <button type="submit">{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Cadastrar' : mode === 'forgot' ? 'Gerar token' : 'Alterar senha'}</button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Criar nova conta' : 'Ja tenho cadastro'}
        </button>
        {mode === 'login' && <button className="link-button" onClick={() => setMode('forgot')}>Esqueci minha senha</button>}
        {mode === 'forgot' && <button className="link-button" onClick={() => setMode('reset')}>Ja tenho token</button>}
      </section>
    </div>
  );
}
