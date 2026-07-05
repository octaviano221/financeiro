import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('lista');

  useEffect(() => {
    api.get('/tools/calendar', { params: { period: 'month' } }).then((response) => setEvents(response.data.events));
  }, []);

  const byDate = useMemo(() => events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {}), [events]);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Calendario Financeiro</h1>
          <p>Vencimentos, receitas previstas, faturas, parcelas e metas importantes.</p>
        </div>
        <div className="segmented">
          {['lista', 'semanal', 'mensal'].map((item) => <button className={view === item ? 'active' : ''} onClick={() => setView(item)} key={item}>{item}</button>)}
        </div>
      </div>

      <div className={view === 'lista' ? 'calendar-list' : 'calendar-grid'}>
        {Object.entries(byDate).map(([date, items]) => (
          <article className="panel calendar-day" key={date}>
            <h2>{new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</h2>
            {items.map((event, index) => (
              <div className={`calendar-event ${event.type}`} key={`${date}-${index}`}>
                <span>{event.type}</span>
                <strong>{event.description}</strong>
                <em>{money.format(event.amount)}</em>
              </div>
            ))}
          </article>
        ))}
        {events.length === 0 && <article className="panel"><p>Nenhum evento financeiro no periodo.</p></article>}
      </div>
    </section>
  );
}
