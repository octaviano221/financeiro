import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

export function OnboardingPage() {
  const [data, setData] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const response = await api.get('/system/onboarding');
    setData(response.data);
  }

  async function seedDemo() {
    try {
      setLoadingDemo(true);
      await api.post('/demo/seed');
      showToast('Dados demo adicionados.');
      await load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel carregar demo.', 'error');
    } finally {
      setLoadingDemo(false);
    }
  }

  async function clearFinancialData() {
    const ok = await confirm({
      title: 'Limpar dados financeiros',
      message: 'Isso remove todos os dados financeiros desta conta e mantem seu usuario para voce recomecar com dados reais.',
      confirmText: 'Limpar dados'
    });
    if (!ok) return;
    try {
      await api.delete('/demo/clear');
      showToast('Dados financeiros removidos.');
      await load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel limpar os dados.', 'error');
    }
  }

  if (!data) return <section className="page">Carregando primeiros passos...</section>;

  return (
    <section className="page">
      <div className="onboarding-hero-full">
        <div>
          <span><Sparkles size={18} /> Primeiros passos</span>
          <h1>Configure sua vida financeira em poucos minutos</h1>
          <p>Complete as etapas abaixo para o dashboard mostrar diagnostico, alertas e plano de acao com dados reais.</p>
        </div>
        <div className="progress-ring">
          <strong>{data.progress}%</strong>
          <small>{data.completed} de {data.total}</small>
        </div>
      </div>

      <div className="onboarding-step-grid">
        {data.steps.map((step, index) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          return (
            <article className={step.done ? 'panel onboarding-step done' : 'panel onboarding-step'} key={step.id}>
              <Icon size={26} />
              <small>Etapa {index + 1}</small>
              <h2>{step.title}</h2>
              <p>{step.done ? 'Concluido. Esse dado ja esta alimentando o sistema.' : 'Cadastre este item para liberar calculos mais completos.'}</p>
              <Link to={step.path}>{step.done ? 'Ver modulo' : 'Cadastrar agora'}</Link>
            </article>
          );
        })}
      </div>

      <article className="panel onboarding-demo-panel">
        <div>
          <h2>Quer testar antes de preencher seus dados?</h2>
          <p>Carregue uma demonstracao somente se sua conta ainda estiver vazia. Se carregou por engano, limpe aqui e comece de novo com seus dados reais.</p>
        </div>
        <div className="onboarding-demo-actions">
          <button onClick={seedDemo} disabled={loadingDemo}>{loadingDemo ? 'Carregando...' : 'Carregar demo'}</button>
          <button className="danger-inline" onClick={clearFinancialData}><Trash2 size={16} /> Limpar demo/dados</button>
        </div>
      </article>
    </section>
  );
}
