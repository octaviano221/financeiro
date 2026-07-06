export const resources = [
  {
    path: 'bancos',
    endpoint: 'bank-accounts',
    title: 'Bancos',
    action: 'Novo banco',
    columns: ['bank_name', 'account_type', 'current_balance', 'overdraft_used'],
    fields: [
      ['bank_name', 'Nome do banco'],
      ['account_type', 'Tipo de conta', 'select', ['corrente', 'poupanca', 'digital', 'salario', 'investimento']],
      ['current_balance', 'Saldo atual', 'number'],
      ['overdraft_limit', 'Limite cheque especial', 'number'],
      ['overdraft_used', 'Cheque especial usado', 'number'],
      ['overdraft_interest_rate', 'Juros mensal (%)', 'number'],
      ['interest_due_day', 'Dia de cobranca', 'number'],
      ['notes', 'Observacoes', 'textarea']
    ]
  },
  {
    path: 'cartoes',
    endpoint: 'credit-cards',
    title: 'Cartões',
    action: 'Novo cartão',
    columns: ['card_name', 'issuer', 'total_limit', 'used_limit', 'current_invoice_value', 'status'],
    fields: [
      ['card_name', 'Nome do cartao'],
      ['issuer', 'Banco/emissor'],
      ['total_limit', 'Limite total', 'number'],
      ['used_limit', 'Limite usado', 'number'],
      ['closing_day', 'Dia fechamento', 'number'],
      ['due_day', 'Dia vencimento', 'number'],
      ['revolving_interest_rate', 'Juros rotativo (%)', 'number'],
      ['current_invoice_value', 'Fatura atual', 'number'],
      ['minimum_payment_value', 'Pagamento minimo', 'number'],
      ['status', 'Status', 'select', ['aberta', 'fechada', 'paga', 'atrasada', 'parcelada']],
      ['notes', 'Observacoes', 'textarea']
    ]
  },
  {
    path: 'dividas',
    endpoint: 'debts',
    title: 'Dívidas',
    action: 'Nova dívida',
    columns: ['debt_name', 'creditor', 'debt_type', 'current_amount', 'monthly_interest_rate', 'status', 'priority'],
    fields: [
      ['debt_name', 'Nome da divida'],
      ['creditor', 'Credor'],
      ['debt_type', 'Tipo', 'select', ['cheque_especial', 'cartao_credito', 'emprestimo_pessoal', 'financiamento', 'boleto_atrasado', 'conta_consumo', 'imposto_taxa', 'fornecedor', 'pessoal', 'outros']],
      ['original_amount', 'Valor original', 'number'],
      ['current_amount', 'Valor atual', 'number'],
      ['monthly_interest_rate', 'Juros mensal (%)', 'number'],
      ['start_date', 'Data de inicio', 'date'],
      ['due_date', 'Vencimento', 'date'],
      ['installments_total', 'Parcelas totais', 'number'],
      ['installments_paid', 'Parcelas pagas', 'number'],
      ['installment_value', 'Valor parcela', 'number'],
      ['status', 'Status', 'select', ['em_dia', 'atrasada', 'renegociada', 'quitada', 'em_negociacao']],
      ['priority', 'Prioridade', 'select', ['baixa', 'media', 'alta', 'urgente']],
      ['has_guarantee', 'Possui garantia?', 'checkbox'],
      ['notes', 'Observacoes', 'textarea']
    ]
  },
  {
    path: 'compras-cartao',
    endpoint: 'card-transactions',
    title: 'Compras no Cartão',
    action: 'Nova compra',
    columns: ['description', 'amount', 'purchase_date', 'installments', 'current_installment', 'status'],
    fields: [
      ['credit_card_id', 'Cartao', 'relation', 'credit-cards'],
      ['description', 'Descricao'],
      ['amount', 'Valor total', 'number'],
      ['purchase_date', 'Data da compra', 'date'],
      ['installments', 'Parcelas', 'number'],
      ['current_installment', 'Parcela atual', 'number'],
      ['category_id', 'Categoria', 'relation', 'categories'],
      ['status', 'Status', 'select', ['aberta', 'paga', 'cancelada']]
    ]
  },
  {
    path: 'receitas',
    endpoint: 'incomes',
    title: 'Receitas',
    action: 'Nova receita',
    columns: ['description', 'amount', 'received_date', 'status'],
    fields: [
      ['description', 'Descricao'],
      ['amount', 'Valor', 'number'],
      ['received_date', 'Data de recebimento', 'date'],
      ['category_id', 'Categoria', 'relation', 'categories'],
      ['bank_account_id', 'Conta bancaria', 'relation', 'bank-accounts'],
      ['is_recurring', 'Recorrente?', 'checkbox'],
      ['recurrence_type', 'Frequencia', 'select', ['', 'mensal', 'semanal', 'quinzenal', 'anual']],
      ['status', 'Status', 'select', ['recebido', 'previsto', 'atrasado']]
    ]
  },
  {
    path: 'despesas',
    endpoint: 'expenses',
    title: 'Despesas',
    action: 'Nova despesa',
    columns: ['description', 'amount', 'due_date', 'status'],
    fields: [
      ['description', 'Descricao'],
      ['amount', 'Valor', 'number'],
      ['due_date', 'Vencimento', 'date'],
      ['payment_date', 'Pagamento', 'date'],
      ['category_id', 'Categoria', 'relation', 'categories'],
      ['bank_account_id', 'Conta bancaria', 'relation', 'bank-accounts'],
      ['is_recurring', 'Recorrente?', 'checkbox'],
      ['recurrence_type', 'Frequencia', 'select', ['', 'mensal', 'semanal', 'quinzenal', 'anual']],
      ['status', 'Status', 'select', ['aberto', 'pago', 'vencido', 'cancelado']],
      ['notes', 'Observacoes', 'textarea']
    ]
  },
  {
    path: 'metas',
    endpoint: 'goals',
    title: 'Metas',
    action: 'Nova meta',
    columns: ['goal_name', 'target_amount', 'current_amount', 'deadline', 'priority', 'status'],
    fields: [
      ['goal_name', 'Nome da meta'],
      ['target_amount', 'Valor alvo', 'number'],
      ['current_amount', 'Valor atual', 'number'],
      ['deadline', 'Data limite', 'date'],
      ['priority', 'Prioridade', 'select', ['baixa', 'media', 'alta', 'urgente']],
      ['status', 'Status', 'select', ['ativa', 'concluida', 'pausada', 'atrasada']]
    ]
  },
  {
    path: 'categorias',
    endpoint: 'categories',
    title: 'Categorias',
    action: 'Nova categoria',
    columns: ['name', 'type', 'color', 'icon', 'active'],
    fields: [
      ['name', 'Nome'],
      ['type', 'Tipo', 'select', ['receita', 'despesa']],
      ['color', 'Cor'],
      ['icon', 'Icone'],
      ['active', 'Ativa?', 'checkbox']
    ]
  }
];
