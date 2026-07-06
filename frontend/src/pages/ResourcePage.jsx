import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Edit3, Plus, Search, Trash2, WalletCards, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../state/ToastContext.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { normalizePayload } from '../utils/format.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function ResourcePage({ resource }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [relationOptions, setRelationOptions] = useState({});
  const [search, setSearch] = useState('');
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const columnLabels = Object.fromEntries(resource.fields.map(([name, label]) => [name, label]));

  useEffect(() => {
    load();
    loadOptions();
  }, [resource.endpoint]);

  async function load() {
    const response = await api.get(`/${resource.endpoint}`);
    setItems(response.data);
  }

  async function loadOptions() {
    const relationEndpoints = [...new Set(resource.fields.filter((field) => field[2] === 'relation').map((field) => field[3]))];
    const entries = await Promise.all(relationEndpoints.map(async (endpoint) => {
      const response = await api.get(`/${endpoint}`);
      return [endpoint, response.data];
    }));
    setRelationOptions(Object.fromEntries(entries));
  }

  function openForm(item = {}) {
    setEditing(item.id ? item : null);
    const initial = Object.fromEntries(resource.fields.map(([name, , type, opts]) => {
      if (Object.prototype.hasOwnProperty.call(item, name)) return [name, item[name] ?? ''];
      if (type === 'checkbox') return [name, false];
      if (type === 'select') return [name, opts[0] ?? ''];
      if (type === 'relation') return [name, ''];
      return [name, ''];
    }));
    setForm(initial);
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const payload = normalizePayload(form);
      if (editing) await api.put(`/${resource.endpoint}/${editing.id}`, payload);
      else await api.post(`/${resource.endpoint}`, payload);
      setForm({});
      setEditing(null);
      setFormOpen(false);
      showToast(editing ? 'Registro atualizado.' : 'Registro cadastrado.');
      await load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel salvar.', 'error');
    }
  }

  async function remove(id) {
    const ok = await confirm({
      title: 'Excluir registro',
      message: 'Esta acao nao pode ser desfeita. Deseja excluir este registro?',
      confirmText: 'Excluir'
    });
    if (!ok) return;
    try {
      await api.delete(`/${resource.endpoint}/${id}`);
      showToast('Registro excluido.');
      await load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel excluir.', 'error');
    }
  }

  const filteredItems = items.filter((item) => {
    const text = resource.columns.map((column) => item[column]).join(' ').toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });
  const summary = buildResourceSummary(items, resource, columnLabels);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>{resource.title}</h1>
          <p>Cadastre, edite e acompanhe os dados financeiros deste modulo.</p>
        </div>
        <button onClick={() => openForm({})}><Plus size={16} /> {resource.action}</button>
      </div>

      <div className="resource-summary-grid">
        <article className="resource-summary-card">
          <span><WalletCards size={19} /></span>
          <small>Total de registros</small>
          <strong>{summary.count}</strong>
          <em>{resource.title}</em>
        </article>
        <article className="resource-summary-card">
          <span><BarChart3 size={19} /></span>
          <small>{summary.amountLabel}</small>
          <strong>{money.format(summary.amountTotal)}</strong>
          <em>Soma cadastrada</em>
        </article>
        <article className="resource-summary-card">
          <span><CheckCircle2 size={19} /></span>
          <small>Status principal</small>
          <strong>{summary.statusLabel}</strong>
          <em>{summary.statusCount} registro(s)</em>
        </article>
      </div>

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar em ${resource.title.toLowerCase()}...`} />
        </div>
        <span>{filteredItems.length} de {items.length} registro(s)</span>
      </div>

      {formOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="quick-modal resource-form-modal" onSubmit={submit}>
            <div className="quick-modal-head">
              <div>
                <span>{editing ? 'Editar registro' : 'Novo registro'}</span>
                <h2>{editing ? `Editar ${resource.title}` : resource.action}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => { setForm({}); setEditing(null); setFormOpen(false); }} aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="form-grid quick-form-grid">
              {resource.fields.map(([name, label, type = 'text', fieldOptions]) => (
                <label key={name} className={type === 'textarea' ? 'span-2' : ''}>
                  <span>{label}</span>
                  {type === 'select' ? (
                    <select value={form[name] ?? ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })}>
                      {fieldOptions.map((option) => <option key={option} value={option}>{option || 'Nenhum'}</option>)}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea value={form[name] ?? ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
                  ) : type === 'checkbox' ? (
                    <input type="checkbox" checked={Boolean(form[name])} onChange={(e) => setForm({ ...form, [name]: e.target.checked })} />
                  ) : type === 'relation' ? (
                    <select value={form[name] ?? ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })}>
                      <option value="">Selecione</option>
                      {(relationOptions[fieldOptions] || []).map((option) => (
                        <option key={option.id} value={option.id}>{relationLabel(option)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={type === 'number' && isMoneyField(name) ? 'money-input' : ''}>
                      {type === 'number' && isMoneyField(name) && <span>R$</span>}
                      <input type={type} step={type === 'number' ? '0.01' : undefined} placeholder={type === 'number' && isMoneyField(name) ? '0,00' : undefined} value={form[name] ?? ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
                    </div>
                  )}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-inline" onClick={() => { setForm({}); setEditing(null); setFormOpen(false); }}>Cancelar</button>
              <button type="submit" className="primary-inline">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="resource-card-grid">
          {filteredItems.map((item) => {
            const card = buildResourceCard(item, resource, columnLabels);
            return (
              <article className="resource-card" key={`card-${item.id}`}>
                <div className="resource-card-icon"><WalletCards size={20} /></div>
                <div className="resource-card-main">
                  <small>{resource.title}</small>
                  <h2>{card.title}</h2>
                  <p>{card.subtitle}</p>
                </div>
                <div className="resource-card-value">
                  {card.amount && <strong>{formatCell(card.amount.value)}</strong>}
                  {card.status && <span>{formatCell(card.status.value)}</span>}
                </div>
                <div className="resource-card-actions">
                  <button className="icon-button" onClick={() => openForm(item)} aria-label="Editar"><Edit3 size={16} /></button>
                  <button className="icon-button danger" onClick={() => remove(item.id)} aria-label="Excluir"><Trash2 size={16} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {resource.columns.map((column) => <th key={column}>{columnLabels[column] || prettyColumn(column)}</th>)}
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                {resource.columns.map((column) => <td key={column}>{formatCell(item[column])}</td>)}
                <td className="actions">
                  <button className="icon-button" onClick={() => openForm(item)}><Edit3 size={16} /></button>
                  <button className="icon-button danger" onClick={() => remove(item.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="empty-table-cell" colSpan={resource.columns.length + 1}>Nenhum registro cadastrado.</td></tr>}
            {items.length > 0 && filteredItems.length === 0 && <tr><td className="empty-table-cell" colSpan={resource.columns.length + 1}>Nenhum resultado encontrado para a busca.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function relationLabel(item) {
  return item.name || item.bank_name || item.card_name || item.description || item.goal_name || `Registro ${item.id}`;
}

function isMoneyField(name) {
  return ['amount', 'current_balance', 'overdraft_limit', 'overdraft_used', 'total_limit', 'used_limit', 'current_invoice_value', 'minimum_payment_value', 'original_amount', 'current_amount', 'installment_value', 'target_amount', 'current_amount'].includes(name);
}

function formatCell(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value > 999 || String(value).includes('.') ? money.format(value) : value;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
  if (isStatusValue(value)) return <span className={`status-badge ${String(value).replaceAll('_', '-')}`}>{prettyText(value)}</span>;
  return String(value);
}

function isStatusValue(value) {
  return ['aberta', 'fechada', 'paga', 'atrasada', 'parcelada', 'em_dia', 'renegociada', 'quitada', 'em_negociacao', 'recebido', 'previsto', 'aberto', 'pago', 'vencido', 'cancelado', 'ativa', 'concluida', 'pausada', 'baixa', 'media', 'alta', 'urgente'].includes(String(value));
}

function prettyText(value) {
  return String(value).replaceAll('_', ' ');
}

function prettyColumn(column) {
  const labels = {
    issuer: 'Emissor',
    status: 'Status',
    active: 'Ativa?',
    icon: 'Icone',
    color: 'Cor'
  };
  return labels[column] || String(column).replaceAll('_', ' ');
}

function buildResourceCard(item, resource, columnLabels) {
  const columns = resource.columns;
  const titleColumn = columns[0];
  const subtitleColumn = columns.find((column) => column !== titleColumn && !isMoneyField(column) && !isStatusValue(item[column])) || columns[1];
  const amountColumn = columns.find((column) => isMoneyField(column) && item[column] !== null && item[column] !== undefined);
  const statusColumn = columns.find((column) => isStatusValue(item[column]));

  return {
    title: item[titleColumn] || `Registro ${item.id}`,
    subtitle: subtitleColumn ? `${columnLabels[subtitleColumn] || prettyColumn(subtitleColumn)}: ${prettyText(item[subtitleColumn] ?? '-')}` : 'Registro financeiro',
    amount: amountColumn ? { label: columnLabels[amountColumn] || prettyColumn(amountColumn), value: item[amountColumn] } : null,
    status: statusColumn ? { label: columnLabels[statusColumn] || prettyColumn(statusColumn), value: item[statusColumn] } : null
  };
}

function buildResourceSummary(items, resource, columnLabels) {
  const amountColumn = resource.columns.find((column) => isMoneyField(column))
    || resource.fields.map(([name]) => name).find((name) => isMoneyField(name));
  const statusColumn = resource.columns.find((column) => items.some((item) => isStatusValue(item[column])))
    || resource.fields.map(([name]) => name).find((name) => items.some((item) => isStatusValue(item[name])));
  const amountTotal = amountColumn ? items.reduce((sum, item) => sum + Number(item[amountColumn] || 0), 0) : 0;
  const statusCounts = statusColumn ? items.reduce((acc, item) => {
    const value = item[statusColumn] || 'sem status';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {}) : {};
  const topStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    count: items.length,
    amountLabel: amountColumn ? (columnLabels[amountColumn] || prettyColumn(amountColumn)) : 'Total financeiro',
    amountTotal,
    statusLabel: topStatus ? prettyText(topStatus[0]) : 'Sem status',
    statusCount: topStatus ? topStatus[1] : 0
  };
}
