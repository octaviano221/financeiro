import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../state/ToastContext.jsx';
import { normalizePayload } from '../utils/format.js';

const quickFields = {
  incomes: ['description', 'amount', 'received_date', 'status', 'bank_account_id'],
  expenses: ['description', 'amount', 'due_date', 'category_id', 'status', 'is_recurring', 'recurrence_type', 'bank_account_id'],
  debts: ['debt_name', 'creditor', 'current_amount', 'due_date', 'priority', 'status'],
  'credit-cards': ['card_name', 'issuer', 'total_limit', 'current_invoice_value', 'due_day', 'status'],
  'bank-accounts': ['bank_name', 'account_type', 'current_balance', 'overdraft_limit', 'overdraft_used']
};

export function QuickCreateModal({ resource, onClose, onSaved }) {
  const [form, setForm] = useState(() => buildInitial(resource));
  const [relationOptions, setRelationOptions] = useState({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const relationEndpoints = [...new Set(selectedFields(resource).filter((field) => field[2] === 'relation').map((field) => field[3]))];
    if (!relationEndpoints.length) return;
    Promise.all(relationEndpoints.map(async (endpoint) => {
      const response = await api.get(`/${endpoint}`);
      return [endpoint, response.data];
    })).then((entries) => setRelationOptions(Object.fromEntries(entries))).catch(() => setRelationOptions({}));
  }, [resource]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = normalizePayload(form);
      await api.post(`/${resource.endpoint}`, payload);
      onSaved?.();
      showToast('Registro cadastrado.');
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="quick-modal" onSubmit={submit}>
        <div className="quick-modal-head">
          <div>
            <span>Cadastro rapido</span>
            <h2>{resource.action}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="form-grid quick-form-grid">
          {selectedFields(resource).map(([name, label, type = 'text', fieldOptions]) => (
            <label key={name} className={type === 'textarea' ? 'span-2' : ''}>
              <span>{label}</span>
              {renderField({ name, type, fieldOptions, form, setForm, relationOptions })}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-inline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-inline" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  );
}

function selectedFields(resource) {
  const allowed = quickFields[resource.endpoint] || resource.fields.map(([name]) => name);
  return resource.fields.filter(([name]) => allowed.includes(name));
}

function buildInitial(resource) {
  return Object.fromEntries(selectedFields(resource).map(([name, , type, opts]) => {
    if (type === 'checkbox') return [name, false];
    if (resource.endpoint === 'expenses' && name === 'recurrence_type') return [name, 'mensal'];
    if (type === 'select') return [name, opts[0] ?? ''];
    if (type === 'date') return [name, new Date().toISOString().slice(0, 10)];
    return [name, ''];
  }));
}

function renderField({ name, type, fieldOptions, form, setForm, relationOptions }) {
  if (type === 'select') {
    return (
      <select value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })}>
        {fieldOptions.map((option) => <option key={option} value={option}>{option || 'Nenhum'}</option>)}
      </select>
    );
  }
  if (type === 'relation') {
    return (
      <select value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })}>
        <option value="">Sem vinculo</option>
        {(relationOptions[fieldOptions] || []).map((option) => (
          <option key={option.id} value={option.id}>{relationLabel(option)}</option>
        ))}
      </select>
    );
  }
  if (type === 'checkbox') {
    return <input type="checkbox" checked={Boolean(form[name])} onChange={(event) => setForm({ ...form, [name]: event.target.checked })} />;
  }
  return (
    <div className={type === 'number' && isMoneyField(name) ? 'money-input' : ''}>
      {type === 'number' && isMoneyField(name) && <span>R$</span>}
      <input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        placeholder={type === 'number' && isMoneyField(name) ? '0,00' : undefined}
        value={form[name] ?? ''}
        onChange={(event) => setForm({ ...form, [name]: event.target.value })}
        required={['description', 'amount', 'debt_name', 'card_name', 'bank_name'].includes(name)}
      />
    </div>
  );
}

function relationLabel(item) {
  return item.name || item.bank_name || item.card_name || item.description || item.goal_name || `Registro ${item.id}`;
}

function isMoneyField(name) {
  return ['amount', 'current_balance', 'overdraft_limit', 'overdraft_used', 'total_limit', 'used_limit', 'current_invoice_value', 'minimum_payment_value', 'original_amount', 'current_amount', 'installment_value', 'target_amount'].includes(name);
}
