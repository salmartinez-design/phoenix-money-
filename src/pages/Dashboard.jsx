import { useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatDateShort, daysUntil } from '../utils/format';
import { getCategoryById } from '../data/categories';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { financialData, lang, budgets } = useApp();
  const t = useT(lang);
  const navigate = useNavigate();
  const { monthly, totalIncome, totalExpenses, totalNet, savingsRate, burnRate, runway, latestMonth, prevMonth, allTransactions, flaggedCount, recurringDetected, accountBalances } = financialData;
  useEffect(() => { document.title = lang === 'es' ? 'Panel — Phoenix Money' : 'Dashboard — Phoenix Money'; }, [lang]);
  const $ = (n, d=0) => formatCurrency(n, lang, d);

  // Use latest month with data, not "today"
  const dataMonth = latestMonth || { key:'2026-03', label:'Mar 2026', income:0, expenses:0, net:0, savingsRate:0, short:'Mar' };
  const dataPrevMonth = prevMonth || monthly[monthly.length - 2];

  const greeting = lang === 'es'
    ? (new Date().getHours() < 12 ? '¡Buenos días' : new Date().getHours() < 18 ? '¡Buenas tardes' : '¡Buenas noches') + ', Sal!'
    : (new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening') + ', Sal!';

  // Budget data for the latest data month
  const budgetMonth = dataMonth.key;
  const monthBudgets = budgets[budgetMonth] || {};
  const budgetedIncome = Object.entries(monthBudgets).filter(([k]) => ['income','paychecks','business-revenue','other-income','interest'].includes(k)).reduce((s,[,v]) => s+v, 0);
  const budgetedExpenses = Object.entries(monthBudgets).filter(([k]) => !['income','paychecks','business-revenue','other-income','interest'].includes(k)).reduce((s,[,v]) => s+v, 0);
  const actualIncome = dataMonth.income || 0;
  const actualExpenses = Math.abs(dataMonth.expenses || 0);

  // Spending comparison: latest month vs previous month (cumulative by day)
  const spendingComparison = useMemo(() => {
    if (!dataMonth || !dataPrevMonth) return [];
    const thisMonthTxns = allTransactions.filter(t => t.date.startsWith(dataMonth.key) && t.amount < 0);
    const prevMonthTxns = allTransactions.filter(t => t.date.startsWith(dataPrevMonth.key) && t.amount < 0);
    const cumulate = (txns) => {
      const byDay = {};
      txns.forEach(t => { const d = parseInt(t.date.split('-')[2]); byDay[d] = (byDay[d]||0) + Math.abs(t.amount); });
      let cum = 0;
      const result = [];
      for (let d = 1; d <= 31; d++) { cum += (byDay[d]||0); result.push({ day: d, total: Math.round(cum) }); }
      return result;
    };
    const thisData = cumulate(thisMonthTxns);
    const prevData = cumulate(prevMonthTxns);
    return thisData.map((d,i) => ({ day: `Day ${d.day}`, thisMonth: d.total, lastMonth: prevData[i]?.total || 0 }));
  }, [allTransactions, dataMonth, dataPrevMonth]);

  // Weekly recap using the last 7 days of actual data (not calendar "this week")
  const sortedTxns = useMemo(() => [...allTransactions].sort((a,b) => b.date.localeCompare(a.date)), [allTransactions]);
  const latestDate = sortedTxns[0]?.date || '2026-03-31';
  const weekAgoDate = new Date(latestDate + 'T12:00:00');
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoStr = weekAgoDate.toISOString().slice(0,10);
  const twoWeeksAgoDate = new Date(latestDate + 'T12:00:00');
  twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);
  const twoWeeksStr = twoWeeksAgoDate.toISOString().slice(0,10);

  const thisWeekTxns = allTransactions.filter(t => t.date > weekAgoStr && t.date <= latestDate);
  const lastWeekTxns = allTransactions.filter(t => t.date > twoWeeksStr && t.date <= weekAgoStr);
  const thisWeekSpent = thisWeekTxns.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const lastWeekSpent = lastWeekTxns.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const thisWeekIncome = thisWeekTxns.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const weekDiff = lastWeekSpent > 0 ? Math.round(((thisWeekSpent - lastWeekSpent) / lastWeekSpent) * 100) : 0;

  // Net worth cumulative
  const netWorth = Object.values(accountBalances || {}).reduce((s,v) => s+v, 0);
  let cum = 0;
  const netWorthCum = monthly.map(m => { cum += m.net; return { month: m.short, value: Math.round(cum) }; });

  // Upcoming recurring — filter to ones that are actually upcoming or recently due
  const upcoming = (recurringDetected || []).filter(r => !r.isIncome).slice(0, 5);

  // Top spending categories for the latest month
  const monthTxns = allTransactions.filter(t => t.date.startsWith(dataMonth.key) && t.amount < 0);
  const catSpend = {};
  monthTxns.forEach(t => {
    const cat = getCategoryById(t.categoryId);
    const key = cat?.name || 'Other';
    if (!catSpend[key]) catSpend[key] = { name: key, icon: cat?.icon || '◦', color: cat?.color || '#94A3B8', total: 0 };
    catSpend[key].total += Math.abs(t.amount);
  });
  const topCategories = Object.values(catSpend).sort((a,b) => b.total - a.total).slice(0, 5);

  const Tip2 = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'#fff', marginBottom:4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color||p.stroke, marginBottom:2 }}>{p.name}: <strong>{$(p.value)}</strong></p>)}
    </div>;
  };

  return (
    <div style={{ padding:'28px 36px' }}>
      {/* Greeting */}
      <div className="fu" style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.03em' }}>{greeting}</h2>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* LEFT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Budget Card */}
          <div className="phoenix-card fu1" onClick={() => navigate('/budget')} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>
                {t('budget')} <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:13 }}>{dataMonth.label}</span>
              </p>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>→</span>
            </div>
            {/* Income */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{t('income')}</span>
                {budgetedIncome > 0 && <span style={{ fontSize:13, color:'var(--text-muted)' }}>{$(budgetedIncome)} {t('budgeted').toLowerCase()}</span>}
              </div>
              <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', width: budgetedIncome > 0 ? `${Math.min((actualIncome/budgetedIncome)*100, 100)}%` : '100%', background:'linear-gradient(90deg, var(--green), #34d399)', borderRadius:4, transition:'width .6s' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text-secondary)' }}>{$(actualIncome)} {lang==='es'?'recibido':'earned'}</span>
                {budgetedIncome > 0 ? (
                  <span style={{ color:'var(--green)', fontWeight:600 }}>{$(budgetedIncome - actualIncome)} {lang==='es'?'restante':'remaining'}</span>
                ) : (
                  <span style={{ color:'var(--text-muted)', fontSize:12 }}>{lang==='es'?'Sin presupuesto':'No budget set'}</span>
                )}
              </div>
            </div>
            {/* Expenses */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{t('expenses')}</span>
                {budgetedExpenses > 0 && <span style={{ fontSize:13, color:'var(--text-muted)' }}>{$(budgetedExpenses)} {t('budgeted').toLowerCase()}</span>}
              </div>
              <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', width: budgetedExpenses > 0 ? `${Math.min((actualExpenses/budgetedExpenses)*100, 100)}%` : '100%', background: (budgetedExpenses > 0 && actualExpenses > budgetedExpenses) ? 'var(--red)' : 'linear-gradient(90deg, var(--orange), var(--amber))', borderRadius:4, transition:'width .6s' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text-secondary)' }}>{$(actualExpenses)} {lang==='es'?'gastado':'spent'}</span>
                {budgetedExpenses > 0 ? (
                  <span style={{ color: actualExpenses > budgetedExpenses ? 'var(--red)' : 'var(--green)', fontWeight:600 }}>
                    {$(Math.abs(budgetedExpenses - actualExpenses))} {actualExpenses > budgetedExpenses ? (lang==='es'?'de más':'over') : (lang==='es'?'restante':'remaining')}
                  </span>
                ) : (
                  <span style={{ color:'var(--text-muted)', fontSize:12 }}>{lang==='es'?'Sin presupuesto':'No budget set'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="phoenix-card fu2" onClick={() => navigate('/transactions')} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('transactions')} <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:13 }}>{lang==='es'?'Más recientes':'Most recent'}</span></p>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>→</span>
            </div>
            {sortedTxns.slice(0,6).map(txn => {
              const cat = getCategoryById(txn.categoryId);
              return (
                <div key={txn.id} className="txn-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 8px', borderRadius:8, margin:'1px -8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:(cat?.color||'#94A3B8')+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{cat?.icon||'◦'}</div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{txn.description.slice(0,30)}{txn.description.length>30?'...':''}</p>
                      <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{cat?.name}</p>
                    </div>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color: txn.amount>0?'var(--green)':'var(--text-primary)', fontFamily:"'DM Mono',monospace" }}>
                    {txn.amount > 0 ? '+' : ''}{$(txn.amount, 2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Weekly Recap — last 7 days of data */}
          <div className="phoenix-card fu3">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontSize:18 }}>✨</span>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--orange)' }}>{t('weeklyRecap')}</p>
              <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:400 }}>
                {formatDateShort(weekAgoStr, lang)} — {formatDateShort(latestDate, lang)}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
              <div style={{ textAlign:'center', padding:'10px', background:'var(--green-dim)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{t('income')}</p>
                <p style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>{$(thisWeekIncome)}</p>
              </div>
              <div style={{ textAlign:'center', padding:'10px', background:'var(--red-dim)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{t('expenses')}</p>
                <p style={{ fontSize:16, fontWeight:800, color:'var(--red)' }}>{$(thisWeekSpent)}</p>
              </div>
              <div style={{ textAlign:'center', padding:'10px', background:'var(--blue-dim)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{t('netIncome')}</p>
                <p style={{ fontSize:16, fontWeight:800, color: (thisWeekIncome-thisWeekSpent) >= 0 ? 'var(--green)' : 'var(--red)' }}>{$(thisWeekIncome - thisWeekSpent)}</p>
              </div>
            </div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
              {weekDiff < 0
                ? `${lang==='es'?'Esa semana gastaste':'That week you spent'} ${Math.abs(weekDiff)}% ${t('lessLastWeek')} 🎉`
                : weekDiff > 0
                  ? `${lang==='es'?'Esa semana gastaste':'That week you spent'} ${weekDiff}% ${t('moreLastWeek')} 📈`
                  : `${lang==='es'?'Gastos similares a la semana anterior':'Spending was similar to the prior week'}`
              }
            </p>
          </div>

          {/* Net Worth */}
          <div className="phoenix-card fu4" onClick={() => navigate('/accounts')} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('netWorth')}</p>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>→</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:8 }}>
              <span style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', fontFamily:"'DM Mono',monospace" }}>{$(netWorth)}</span>
              {monthly.length >= 2 && (
                <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: totalNet >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: totalNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {totalNet >= 0 ? '↑' : '↓'} {$(Math.abs(totalNet))}
                </span>
              )}
            </div>
            {netWorthCum.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={netWorthCum} margin={{ top:4, right:4, bottom:4, left:4 }}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--blue)" stopOpacity={.2}/>
                      <stop offset="100%" stopColor="var(--blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="var(--blue)" strokeWidth={2} fill="url(#nwGrad)" dot={false}/>
                  <XAxis dataKey="month" fontSize={10} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Spending: Latest Month vs Previous */}
          <div className="phoenix-card fu1">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('spending')}</p>
              <span style={{ fontSize:13, color:'var(--text-muted)' }}>{dataPrevMonth?.short || ''} vs {dataMonth.short}</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>{$(actualExpenses)}</span>
              <span style={{ fontSize:13, color:'var(--text-muted)' }}>{dataMonth.short}</span>
              {dataPrevMonth && (
                <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:16, fontSize:11, fontWeight:700, background: actualExpenses < Math.abs(dataPrevMonth.expenses) ? 'var(--green-dim)' : 'var(--red-dim)', color: actualExpenses < Math.abs(dataPrevMonth.expenses) ? 'var(--green)' : 'var(--red)' }}>
                  {actualExpenses < Math.abs(dataPrevMonth.expenses) ? '↓' : '↑'} {$(Math.abs(actualExpenses - Math.abs(dataPrevMonth.expenses)))} vs {dataPrevMonth.short}
                </span>
              )}
            </div>
            {spendingComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={spendingComparison.filter((_,i) => i % 2 === 0)} margin={{ top:4, right:4, bottom:4, left:4 }}>
                  <defs>
                    <linearGradient id="thisMonthG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--orange)" stopOpacity={.25}/>
                      <stop offset="100%" stopColor="var(--orange)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                  <XAxis dataKey="day" fontSize={10} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false} interval={3}/>
                  <YAxis fontSize={10} tick={{ fill:'var(--chart-axis)' }} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'} axisLine={false} tickLine={false} width={36}/>
                  <Tooltip content={<Tip2/>}/>
                  <Area type="monotone" dataKey="lastMonth" name={dataPrevMonth?.short || 'Prev'} stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false}/>
                  <Area type="monotone" dataKey="thisMonth" name={dataMonth.short} stroke="var(--orange)" strokeWidth={2.5} fill="url(#thisMonthG)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>{t('noData')}</div>}
            <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-muted)', marginTop:6 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:16, height:2, background:'var(--text-muted)', borderRadius:1, display:'inline-block' }}/> {dataPrevMonth?.short || 'Prev'}</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:16, height:2, background:'var(--orange)', borderRadius:1, display:'inline-block' }}/> {dataMonth.short}</span>
            </div>
          </div>

          {/* Upcoming Recurring */}
          <div className="phoenix-card fu2" onClick={() => navigate('/recurring')} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('recurring')}</p>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>→</span>
            </div>
            {upcoming.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:20 }}>{t('noRecurringFound')}</p>
            ) : upcoming.map((r, i) => {
              const cat = getCategoryById(r.categoryId);
              return (
                <div key={i} className="txn-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 8px', borderRadius:8, margin:'1px -8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:(cat?.color||'#94A3B8')+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{cat?.icon||'◦'}</div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{r.merchantName.slice(0,28)}</p>
                      <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{lang==='es'?'Cada mes':'Every month'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:"'DM Mono',monospace", margin:0 }}>-{$(r.avgAmount)}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{r.frequency === 'monthly' ? '~'+$(r.avgAmount)+'/mo' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Spending Categories */}
          <div className="phoenix-card fu3" onClick={() => navigate('/cash-flow')} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{lang==='es'?'Dónde se fue el dinero':'Where money went'} <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:13 }}>{dataMonth.short}</span></p>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>→</span>
            </div>
            {topCategories.map((cat, i) => {
              const maxVal = topCategories[0]?.total || 1;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:14, width:22, textAlign:'center', flexShrink:0 }}>{cat.icon}</span>
                  <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500, minWidth:120, flexShrink:0 }}>{cat.name}</span>
                  <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(cat.total/maxVal)*100}%`, background:cat.color, borderRadius:3, opacity:.7 }}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:"'DM Mono',monospace", minWidth:70, textAlign:'right' }}>{$(cat.total)}</span>
                </div>
              );
            })}
          </div>

          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="phoenix-card fu3" style={{ textAlign:'center', padding:16 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t('savingsRate')}</p>
              <p style={{ fontSize:22, fontWeight:800, color: savingsRate > 10 ? 'var(--green)' : savingsRate > 0 ? 'var(--amber)' : 'var(--red)', letterSpacing:'-.02em' }}>{savingsRate}%</p>
              <p style={{ fontSize:11, color:'var(--text-muted)' }}>{savingsRate > 20 ? (lang==='es'?'Excelente':'Excellent') : savingsRate > 5 ? (lang==='es'?'Decente':'Decent') : (lang==='es'?'Ajustado':'Tight')}</p>
            </div>
            <div className="phoenix-card fu4" style={{ textAlign:'center', padding:16 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t('monthlyBurn')}</p>
              <p style={{ fontSize:22, fontWeight:800, color:'var(--amber)', letterSpacing:'-.02em' }}>{$(burnRate)}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)' }}>{lang==='es'?'promedio mensual':'monthly average'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
