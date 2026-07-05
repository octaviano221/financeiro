import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function ResourcePage({ resource }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [relationOptions, setRelationOptions] = useState({});

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
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]));
    if (editing) await api.put(`/${resource.endpoint}/${editing.id}`, payload);
    else await api.post(`/${resource.endpoint}`, payload);
    setForm({});
    setEditing(null);
    setFormOpen(false);
    await load();
  }

  async function remove(id) {
    if (!confirm('Deseja excluir este registro?')) return;
    await api.delete(`/${resource.endpoint}/${id}`);
    await load();
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>{resource.title}</h1>
          <p>Cadastre, edite e acompanhe os dados financeiros deste modulo.</p>
        </div>
        <button onClick={() => openForm({})}><Plus size={16} /> {resource.action}</button>
      </div>

      {formOpen && (
        <form className="form-panel" onSubmit={submit}>
          <div className="form-title">
            <strong>{editing ? 'Editar registro' : resource.action}</strong>
            <button type="button" className="icon-button" onClick={() => { setForm({}); setEditing(null); setFormOpen(false); }}><X size={18} /></button>
          </div>
          <div className="form-grid">
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
                  <input type={type} value={form[name] ?? ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
                )}
              </label>
            ))}
          </div>
          <button type="submit">Salvar</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {resource.columns.map((column) => <th key={column}>{column}</th>)}
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {resource.columns.map((column) => <td key={column}>{formatCell(item[column])}</td>)}
                <td className="actions">
                  <button className="icon-button" onClick={() => openForm(item)}><Edit3 size={16} /></button>
                  <button className="icon-button danger" onClick={() => remove(item.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={resource.columns.length + 1}>Nenhum registro cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function relationLabel(item) {
  return item.name || item.bank_name || item.card_name || item.description || item.goal_name || `Registro ${item.id}`;
}

function formatCell(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value > 999 || String(value).includes('.') ? money.format(value) : value;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
  return String(value);
}
