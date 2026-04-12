import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatDateShort, daysUntil } from '../utils/format';
import { getCategoryById } from '../data/categories';

const freqLabel = (freq, t) => {
  if (freq === 'monthly') return t('everyMonth');
  if (freq === 'biweekly') return t('everyTwoWeeks');
  if (freq === 'weekly') return t('everyWeek');
  return freq;
};

const freqColor = (freq) => {
  if (freq === 'monthly') return 'var(--green)';
  if (freq === 'biweekly') return 'var(--blue)';
  if (freq === 'weekly') return '#A855F7';
  return 'var(--text-muted)';
};

const DaysBadge = ({ days, t }) => {
  let label, bg, color;
  if (days < 0) {
    label = `${Math.abs(days)} ${t('daysUntil')} overdue`;
    bg = 'var(--red-dim)'; color = 'var(--red)';
  } else if (days === 0) {
    label = t('today');
    bg = 'var(--orange-dim)'; color = 'var(--orange)';
  } else if (days === 1) {
    label = t('tomorrow');
    bg = 'var(--orange-dim)'; color = 'var(--orange)';
  } else {
    label = `${days} ${t('daysUntil')}`;
    bg = 'var(--blue-dim)'; color = 'var(--blue)';
  }
  return (
    <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:bg, color, border:`1px solid ${color}25`, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
};

export function Recurring() {
  const { financialData, lang } = useApp();
  const t = useT(lang);
  const $ = (n, d=0) => formatCurrency(n, lang, d);
  const [viewMode, setViewMode] = useState('monthly');

  useEffect(() => {
    document.title = lang === 'es' ? 'Recurrentes — Phoenix Money' : 'Recurring — Phoenix Money';
  }, [lang]);

  const allItems = financialData.recurringDetected || [];

  const filtered = useMemo(() => {
    if (viewMode === 'monthly') return allItems.filter(r => r.frequency === 'monthly');
    return allItems;
  }, [allItems, viewMode]);

  const incomeItems = filtered.filter(r => r.isIncome);
  const ccItems = filtered.filter(r => !r.isIncome && r.categoryId === 'credit-card-payment');
  const expenseItems = filtered.filter(r => !r.isIncome && r.categoryId !== 'credit-card-payment');

  const incomeTotal = incomeItems.reduce((s, r) => s + r.avgAmount, 0);
  const expenseTotal = expenseItems.reduce((s, r) => s + r.avgAmount, 0);
  const ccTotal = ccItems.reduce((s, r) => s + r.avgAmount, 0);

  // For progress bars: estimate how many are "paid" (nextExpected in future = paid this cycle)
  const paidCount = (items) => items.filter(r => daysUntil(r.nextExpected) > 0).length;
  const paidAmount = (items) => items.filter(r => daysUntil(r.nextExpected) > 0).reduce((s, r) => s + r.avgAmount, 0);

  const upcoming = [...filtered].sort((a, b) => {
    const da = daysUntil(a.nextExpected);
    const db = daysUntil(b.nextExpected);
    return da - db;
  }).slice(0, 5);

  const SummaryCard = ({ label, total, items, color, dimColor }) => {
    const paid = paidAmount(items);
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    const paidN = paidCount(items);
    const remainN = items.length - paidN;
    return (
      <div className="phoenix-card fu1" style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', margin:0 }}>{label}</p>
          <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:dimColor, color }}>{items.length}</span>
        </div>
        <p style={{ fontSize:26, fontWeight:800, color, letterSpacing:'-.02em', marginBottom:10 }}>{$(total)}</p>
        <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width .4s ease' }}/>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>
          {paidN} {t('paidSoFar')} · {remainN} {t('remainingDue')}
        </p>
      </div>
    );
  };

  return (
    <div style={{ padding:'32px 36px' }}>
      {/* Header */}
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:30 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
            {t('recurring').toUpperCase()}
          </p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('recurringTransactions')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:4 }}>{t('recurringSubtitle')}</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[
            { id:'monthly', label:t('monthlyRecurring') },
            { id:'all', label:t('all') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`filter-chip${viewMode === tab.id ? ' active' : ''}`}
              style={{ padding:'6px 16px', borderRadius:20, border:`1px solid ${viewMode === tab.id ? 'var(--orange)' : 'var(--border)'}`, cursor:'pointer', fontSize:12, fontWeight:600, background: viewMode === tab.id ? 'var(--orange-dim)' : 'transparent', color: viewMode === tab.id ? 'var(--orange)' : 'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        <SummaryCard label={t('recurringIncome')} total={incomeTotal} items={incomeItems} color="var(--green)" dimColor="var(--green-dim)"/>
        <SummaryCard label={t('recurringExpenses')} total={expenseTotal} items={expenseItems} color="var(--red)" dimColor="var(--red-dim)"/>
        <SummaryCard label={t('creditCardPayments')} total={ccTotal} items={ccItems} color="var(--blue)" dimColor="var(--blue-dim)"/>
      </div>

      {/* Upcoming Charges */}
      {upcoming.length > 0 && (
        <div className="phoenix-card fu2" style={{ marginBottom:16 }}>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>{t('upcomingCharges')}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {upcoming.map((item, i) => {
              const cat = getCategoryById(item.categoryId);
              const days = daysUntil(item.nextExpected);
              return (
                <div key={i} className="txn-row" style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px' }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:cat?.color ? cat.color + '18' : 'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {cat?.icon || '?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{item.merchantName}</span>
                      <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600, background:freqColor(item.frequency) + '18', color:freqColor(item.frequency) }}>
                        {freqLabel(item.frequency, t)}
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>
                      {item.merchantName} {t('chargesYou')} {$(Math.abs(item.avgAmount))} {days < 0
                        ? <span style={{ color:'var(--red)', fontWeight:600 }}>overdue</span>
                        : <>{t('inXDays')} {days === 0 ? t('today') : days === 1 ? t('tomorrow') : `${days} ${t('daysUntil')}`}</>
                      }
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <span style={{ fontSize:15, fontWeight:700, color: item.isIncome ? 'var(--green)' : 'var(--text-primary)', fontFamily:"'DM Mono',monospace" }}>
                      {item.isIncome ? '+' : '-'}{$(Math.abs(item.avgAmount))}
                    </span>
                    <DaysBadge days={days} t={t}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Recurring Table */}
      <div className="phoenix-card fu3" style={{ padding:0, overflow:'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
            {t('noRecurringFound')}
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
                {[
                  t('merchant'),
                  t('frequency'),
                  lang === 'es' ? 'Ultima Fecha' : 'Last Date',
                  t('nextCharge'),
                  t('category'),
                  lang === 'es' ? 'Monto' : 'Amount',
                ].map((h, i) => (
                  <th key={i} style={{ padding:'13px 18px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textAlign: i >= 5 ? 'right' : 'left', letterSpacing:'.07em', textTransform:'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const cat = getCategoryById(item.categoryId);
                const days = daysUntil(item.nextExpected);
                const fColor = freqColor(item.frequency);
                return (
                  <tr key={i} className="txn-row" style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'13px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:16, width:24, textAlign:'center', flexShrink:0 }}>{cat?.icon || '?'}</span>
                        <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{item.merchantName}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:fColor + '18', color:fColor }}>
                        {freqLabel(item.frequency, t)}
                      </span>
                    </td>
                    <td style={{ padding:'13px 18px', fontSize:13, color:'var(--text-secondary)' }}>
                      {formatDateShort(item.lastDate, lang)}
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{formatDateShort(item.nextExpected, lang)}</span>
                        <DaysBadge days={days} t={t}/>
                      </div>
                    </td>
                    <td style={{ padding:'13px 18px' }}>
                      <span className="cat-pill" style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:(cat?.color || '#64748B') + '18', color:cat?.color || 'var(--text-muted)' }}>
                        {cat?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ padding:'13px 18px', textAlign:'right' }}>
                      <span style={{ fontSize:14, fontWeight:700, fontFamily:"'DM Mono',monospace", color: item.isIncome ? 'var(--green)' : 'var(--text-primary)' }}>
                        {item.isIncome ? '+' : '-'}{$(Math.abs(item.avgAmount))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
