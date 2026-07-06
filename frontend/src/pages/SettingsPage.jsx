import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../state/ToastContext.jsx';

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/settings').then((response) => setSettings(response.data));
  }, []);

  async function save(event) {
    event.preventDefault();
    const response = await api.put('/settings', settings);
    setSettings(response.data);
    setMessage('Configuracoes salvas.');
    showToast('Configuracoes salvas.');
  }

  async function seedDemo() {
    await api.post('/demo/seed');
    setMessage('Dados de exemplo adicionados. Volte ao dashboard para visualizar.');
    showToast('Dados demo adicionados.');
  }

  if (!settings) return <section className="page">Carregando configuracoes...</section>;

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Configuracoes</h1>
          <p>Preferencias de moeda, tema, alertas, reserva e notificacoes.</p>
        </div>
      </div>
      <form className="form-panel" onSubmit={save}>
        <div className="form-grid">
          <label><span>Moeda padrao</span><select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}><option value="BRL">Real brasileiro</option></select></label>
          <label><span>Tema</span><select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })}><option value="light">Claro</option><option value="dark">Escuro futuro</option></select></label>
          <label><span>Limite de comprometimento da renda (%)</span><input type="number" value={settings.income_commitment_limit} onChange={(e) => setSettings({ ...settings, income_commitment_limit: e.target.value })} /></label>
          <label><span>Reserva minima desejada</span><input type="number" value={settings.desired_reserve_amount} onChange={(e) => setSettings({ ...settings, desired_reserve_amount: e.target.value })} /></label>
          <label><span>Notificacoes ativas</span><input type="checkbox" checked={Boolean(settings.notifications_enabled)} onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })} /></label>
        </div>
        <button type="submit">Salvar configuracoes</button>
      </form>
      <article className="panel">
        <h2>Dados de demonstracao</h2>
        <p>Adicione exemplos de bancos, cartoes, dividas, receitas, despesas e metas para visualizar o dashboard preenchido.</p>
        <button className="primary-inline" onClick={seedDemo}>Adicionar dados demo</button>
        {message && <p className="success-text">{message}</p>}
      </article>
    </section>
  );
}
