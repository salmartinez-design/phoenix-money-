import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency } from '../utils/format';
import { getParentCategory, isIncomeCategory, isTransferCategory, getCategoryById } from '../data/categories';

const DATE_PRESETS = {
  en: [
    { id:'this-month', label:'This Month' }, { id:'last-month', label:'Last Month' },
    { id:'this-quarter', label:'This Quarter' }, { id:'this-year', label:'This Year' },
    { id:'last-year', label:'Last Year' }, { id:'all', label:'All Time' }, { id:'custom', label:'Custom' },
  ],
  es: [
    { id:'this-month', label:'Este Mes' }, { id:'last-month', label:'Mes Pasado' },
    { id:'this-quarter', label:'Este Trimestre' }, { id:'this-year', label:'Este Año' },
    { id:'last-year', label:'Año Pasado' }, { id:'all', label:'Todo' }, { id:'custom', label:'Personalizado' },
  ],
};

function getDateRange(id) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  switch (id) {
    case 'this-month': return { from: new Date(y,m,1).toISOString().slice(0,10), to: new Date(y,m+1,0).toISOString().slice(0,10) };
    case 'last-month': return { from: new Date(y,m-1,1).toISOString().slice(0,10), to: new Date(y,m,0).toISOString().slice(0,10) };
    case 'this-quarter': { const q = Math.floor(m/3)*3; return { from: new Date(y,q,1).toISOString().slice(0,10), to: new Date(y,q+3,0).toISOString().slice(0,10) }; }
    case 'this-year': return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'last-year': return { from: `${y-1}-01-01`, to: `${y-1}-12-31` };
    default: return { from: '', to: '' };
  }
}

export function Reports() {
  const { financialData, lang, transactions, accountFilter } = useApp();
  const t = useT(lang);
  const { monthly } = financialData;
  const $ = (n,d=0) => formatCurrency(n,lang,d);
  const [datePreset, setDatePreset] = useState('this-year');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => { document.title = lang==='es'?'Reportes — Phoenix Money':'Reports — Phoenix Money'; }, [lang]);

  const presets = DATE_PRESETS[lang] || DATE_PRESETS.en;
  const dateRange = datePreset === 'custom' ? { from: customFrom, to: customTo } : getDateRange(datePreset);

  // Filter transactions by date range AND account filter
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchDate = (!dateRange.from || tx.date >= dateRange.from) && (!dateRange.to || tx.date <= dateRange.to);
      const matchAccount = accountFilter === 'all' || tx.accountType === accountFilter;
      const notTransfer = !isTransferCategory(tx.categoryId);
      return matchDate && matchAccount && notTransfer;
    });
  }, [transactions, dateRange.from, dateRange.to, accountFilter]);

  // Compute totals
  const totalIncome = filtered.filter(t => isIncomeCategory(t.categoryId)).reduce((s,t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => !isIncomeCategory(t.categoryId) && t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const totalNet = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0;

  // Expense categories breakdown
  const expenseCatMap = {};
  filtered.filter(t => !isIncomeCategory(t.categoryId) && t.amount < 0).forEach(t => {
    const parent = getParentCategory(t.categoryId);
    const key = parent?.id || t.categoryId;
    if (!expenseCatMap[key]) expenseCatMap[key] = { id: key, cat: parent, total: 0 };
    expenseCatMap[key].total += Math.abs(t.amount);
  });
  const expenseCats = Object.values(expenseCatMap).sort((a,b) => b.total - a.total);

  // Income categories breakdown
  const incomeCatMap = {};
  filtered.filter(t => isIncomeCategory(t.categoryId)).forEach(t => {
    const parent = getParentCategory(t.categoryId);
    const key = parent?.id || t.categoryId;
    if (!incomeCatMap[key]) incomeCatMap[key] = { id: key, cat: parent, total: 0 };
    incomeCatMap[key].total += t.amount;
  });
  const incomeCats = Object.values(incomeCatMap).sort((a,b) => b.total - a.total);

  // Monthly data for chart (filtered by date range)
  const monthlyFiltered = useMemo(() => {
    const byMonth = {};
    filtered.forEach(t => {
      const key = t.date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { inc: 0, exp: 0 };
      if (isIncomeCategory(t.categoryId)) byMonth[key].inc += t.amount;
      else if (t.amount < 0) byMonth[key].exp += Math.abs(t.amount);
    });
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return Object.keys(byMonth).sort().map(key => {
      const [, mo] = key.split('-');
      return { month: monthNames[parseInt(mo)-1], income: Math.round(byMonth[key].inc), expenses: Math.round(byMonth[key].exp), net: Math.round(byMonth[key].inc - byMonth[key].exp) };
    });
  }, [filtered]);

  const plRows = [
    { label: lang==='es'?'Ingresos Brutos':'Gross Revenue', amount: totalIncome, type:'income' },
    null,
    ...expenseCats.slice(0,8).map(c => ({ label: c.cat?.name||'Other', amount: -c.total, type:'expense' })),
    null,
    { label: t('totalExpenses'), amount: -totalExpenses, type:'total-exp', bold:true },
    { label: t('netProfit'), amount: totalNet, type:'net', bold:true },
  ];

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'#fff', marginBottom:6 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, marginBottom:2 }}>{p.name}: <strong>{$(p.value)}</strong></p>)}
    </div>;
  };

  const currentPresetLabel = presets.find(p => p.id === datePreset)?.label || '';

  return (
    <div style={{ padding:'32px 36px' }}>
      {/* Header with date filter */}
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('reports')} · {currentPresetLabel}</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('profitLoss')}</h2>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Date filter */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="btn-ghost" style={{ padding:'9px 14px', minHeight:40, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
              📅 {currentPresetLabel} <span style={{ fontSize:10 }}>▼</span>
            </button>
            {showDatePicker && (
              <>
                <div onClick={() => setShowDatePicker(false)} style={{ position:'fixed', inset:0, zIndex:50 }}/>
                <div style={{ position:'absolute', top:'100%', right:0, marginTop:4, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:8, zIndex:100, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', minWidth:200 }}>
                  {presets.map(p => (
                    <button key={p.id} onClick={() => { setDatePreset(p.id); if (p.id !== 'custom') setShowDatePicker(false); }}
                      style={{ display:'block', width:'100%', padding:'9px 14px', background: datePreset===p.id?'var(--orange-dim)':'transparent', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight: datePreset===p.id?700:400, color: datePreset===p.id?'var(--orange)':'var(--text-primary)', textAlign:'left', fontFamily:"'Outfit',sans-serif" }}>
                      {p.label}
                    </button>
                  ))}
                  {datePreset === 'custom' && (
                    <div style={{ padding:'8px 14px 4px', display:'flex', gap:8, borderTop:'1px solid var(--border)', marginTop:4, paddingTop:10 }}>
                      <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ fontSize:12, padding:'6px 8px', minHeight:34, flex:1 }}/>
                      <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ fontSize:12, padding:'6px 8px', minHeight:34, flex:1 }}/>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <button className="btn-primary" onClick={() => window.print()} style={{ padding:'10px 20px', minHeight:40, fontSize:14, borderRadius:10 }}>⬇ {t('downloadPDF')}</button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display:'flex', gap:8, marginBottom:8, fontSize:12, color:'var(--text-muted)' }}>
        <span>{filtered.length} {t('transactions_count')}</span>
        {dateRange.from && <span>· {dateRange.from} — {dateRange.to}</span>}
        <span>· {accountFilter === 'all' ? (lang==='es'?'Todas las cuentas':'All accounts') : accountFilter === 'business' ? (lang==='es'?'Negocio':'Business') : 'Personal'}</span>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22, position:'relative', zIndex:1 }}>
        {[
          { label:t('totalRevenue'), value:$(totalIncome), color:'var(--green)' },
          { label:t('totalExpenses'), value:$(totalExpenses), color:'var(--red)' },
          { label:t('netProfit'), value:$(totalNet), color: totalNet >= 0 ? 'var(--green)' : 'var(--red)', trend:`${savingsRate}% ${lang==='es'?'margen':'margin'}` },
        ].map((k,i) => (
          <div key={k.label} className={`phoenix-card fu${i+1}`}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:27, fontWeight:800, color:k.color, letterSpacing:'-.02em', lineHeight:1.1, marginBottom:4 }}>{k.value}</p>
            {k.trend && <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: totalNet >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: totalNet >= 0 ? 'var(--green)' : 'var(--red)' }}>{k.trend}</span>}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16 }}>
        {/* P&L Statement */}
        <div className="phoenix-card fu1">
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:18 }}>{t('plStatement')}</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {plRows.map((row,i) => {
                if (!row) return <tr key={i}><td colSpan={2} style={{ height:10 }}/></tr>;
                const isNet = row.type === 'net';
                return (
                  <tr key={i} style={{ background: isNet ? (totalNet >= 0 ? 'var(--green-dim)' : 'var(--red-dim)') : 'transparent' }}>
                    <td style={{ padding:`${isNet?11:7}px 10px`, fontSize:14, fontWeight: row.bold?800:400, color: isNet ? (totalNet >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)', paddingLeft: !row.bold?20:10 }}>{row.label}</td>
                    <td style={{ textAlign:'right', padding:`${isNet?11:7}px 10px`, fontSize:14, fontWeight: row.bold?800:400, color: isNet ? (totalNet >= 0 ? 'var(--green)' : 'var(--red)') : row.amount<0 ? 'var(--red)' : 'var(--text-primary)', fontFamily:"'DM Mono',monospace" }}>
                      {row.amount < 0 ? `(${$(Math.abs(row.amount))})` : $(row.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Income breakdown */}
          {incomeCats.length > 0 && (
            <>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', marginTop:20, marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>{t('income')} {lang==='es'?'por categoría':'by category'}</p>
              {incomeCats.map(c => (
                <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{c.cat?.icon} {c.cat?.name}</span>
                  <span style={{ fontWeight:600, color:'var(--green)', fontFamily:"'DM Mono',monospace" }}>{$(c.total)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Spend by category — donut */}
          <div className="phoenix-card fu2">
            <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('spendByCategory')}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{t('whereExpensesGo')}</p>
            {expenseCats.length === 0 ? <div style={{ height:185, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>📊 {t('noData')}</div> : (
              <>
                <ResponsiveContainer width="100%" height={185}>
                  <PieChart>
                    <Pie data={expenseCats.slice(0,8)} dataKey="total" cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={2} strokeWidth={0}>
                      {expenseCats.slice(0,8).map((e,i) => <Cell key={e.id} fill={e.cat?.color||`hsl(${i*45},70%,50%)`}/>)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', fontSize:13 }}>
                        <p style={{ color:d.payload.cat?.color||'#fff', fontWeight:700 }}>{d.payload.cat?.name}: {$(d.value)}</p>
                      </div>;
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
                  {expenseCats.slice(0,8).map((e,i) => (
                    <div key={e.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-secondary)' }}><span style={{ width:7, height:7, borderRadius:2, background:e.cat?.color||`hsl(${i*45},70%,50%)`, flexShrink:0 }}/>{e.cat?.name}</span>
                      <span style={{ fontWeight:600, color:'var(--text-primary)', fontFamily:"'DM Mono',monospace" }}>{$(e.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Net income trend */}
          <div className="phoenix-card fu3">
            <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('spendTrend')}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>{t('monthlyNetProfit')}</p>
            {monthlyFiltered.length === 0 ? <div style={{ height:115, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>📊 {t('noData')}</div> : (
              <ResponsiveContainer width="100%" height={115}>
                <BarChart data={monthlyFiltered} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                  <XAxis dataKey="month" fontSize={11} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="net" name={t('netIncome')} radius={[5,5,0,0]}>
                    {monthlyFiltered.map((m,i) => <Cell key={i} fill={m.net>1500?'var(--green)':m.net>0?'var(--blue)':'var(--red)'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
