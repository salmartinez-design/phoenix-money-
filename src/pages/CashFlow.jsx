import { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency } from '../utils/format';
import { getCategoryById, getParentCategory, isIncomeCategory, isTransferCategory } from '../data/categories';

export function CashFlow() {
  const { financialData, lang, transactions } = useApp();
  const t = useT(lang);
  const { monthly } = financialData;
  const $ = (n,d=0) => formatCurrency(n,lang,d);
  const [period, setPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(() => monthly[monthly.length-1]?.key || '2026-03');
  const [breakdown, setBreakdown] = useState('category');

  useEffect(() => { document.title = lang === 'es' ? 'Flujo de Caja — Phoenix Money' : 'Cash Flow — Phoenix Money'; }, [lang]);

  // Compute income/expense breakdowns for selected month
  const monthData = useMemo(() => {
    const monthTxns = transactions.filter(tx => tx.date.startsWith(selectedMonth) && !isTransferCategory(tx.categoryId));
    const income = monthTxns.filter(tx => isIncomeCategory(tx.categoryId));
    const expenses = monthTxns.filter(tx => !isIncomeCategory(tx.categoryId) && tx.amount < 0);

    const totalInc = income.reduce((s,t) => s + t.amount, 0);
    const totalExp = expenses.reduce((s,t) => s + Math.abs(t.amount), 0);
    const totalSavings = totalInc - totalExp;
    const savingsRate = totalInc > 0 ? Math.round((totalSavings / totalInc) * 100 * 10) / 10 : 0;

    // Group by category (or merchant)
    const groupBy = (txns, useIncome) => {
      const map = {};
      txns.forEach(tx => {
        let key, name, icon, color;
        if (breakdown === 'merchant') {
          key = tx.merchantName || tx.description.slice(0,20);
          name = key;
          const cat = getCategoryById(tx.categoryId);
          icon = cat?.icon || '◦';
          color = cat?.color || '#94A3B8';
        } else {
          const cat = getCategoryById(tx.categoryId);
          const parent = breakdown === 'group' ? getParentCategory(tx.categoryId) : cat;
          key = parent?.id || tx.categoryId;
          name = parent?.name || 'Other';
          icon = parent?.icon || '◦';
          color = parent?.color || '#94A3B8';
        }
        if (!map[key]) map[key] = { key, name, icon, color, total: 0, count: 0 };
        map[key].total += Math.abs(tx.amount);
        map[key].count += 1;
      });
      const list = Object.values(map).sort((a,b) => b.total - a.total);
      const grandTotal = list.reduce((s,g) => s + g.total, 0) || 1;
      return list.map(g => ({ ...g, pct: Math.round((g.total / grandTotal) * 1000) / 10 }));
    };

    return {
      totalInc: Math.round(totalInc),
      totalExp: Math.round(totalExp),
      totalSavings: Math.round(totalSavings),
      savingsRate,
      incomeBreakdown: groupBy(income, true),
      expenseBreakdown: groupBy(expenses, false),
    };
  }, [transactions, selectedMonth, breakdown]);

  const sel = monthly.find(m => m.key === selectedMonth) || monthly[monthly.length-1] || { income:0, expenses:0, net:0, label:'—', short:'—' };

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'#fff', marginBottom:6 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, marginBottom:2 }}>{p.name}: <strong>{$(p.value)}</strong></p>)}
    </div>;
  };

  const HorizBar = ({ items, color, grandTotal }) => {
    const maxVal = items[0]?.total || 1;
    return (
      <div>
        {items.map((item, i) => (
          <div key={item.key} className="bar-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
            <span style={{ fontSize:15, width:22, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
            <span style={{ fontSize:14, color:'var(--text-primary)', fontWeight:500, minWidth:180, flexShrink:0 }}>{item.name}</span>
            <div style={{ flex:1, height:28, background:'var(--border)', borderRadius:6, overflow:'hidden', position:'relative' }}>
              <div style={{ height:'100%', width:`${Math.max((item.total/maxVal)*100, 2)}%`, background: item.color || color, borderRadius:6, opacity:.7, transition:'width .5s ease' }}/>
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:"'DM Mono',monospace", minWidth:100, textAlign:'right', flexShrink:0 }}>{$(item.total)}</span>
            <span style={{ fontSize:12, color:'var(--text-muted)', minWidth:55, textAlign:'right', flexShrink:0 }}>({item.pct}%)</span>
          </div>
        ))}
        {items.length === 0 && <p style={{ color:'var(--text-muted)', textAlign:'center', padding:20, fontSize:13 }}>{t('noData')}</p>}
      </div>
    );
  };

  const BkToggle = () => (
    <div style={{ display:'flex', gap:4, padding:3, background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
      {[
        { id:'category', l:t('category') },
        { id:'group', l:t('group') },
        { id:'merchant', l:t('merchant') },
      ].map(b => (
        <button key={b.id} onClick={() => setBreakdown(b.id)} style={{ padding:'5px 14px', minHeight:32, borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: breakdown===b.id?'var(--orange)':'transparent', color: breakdown===b.id?'#fff':'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>
          {b.l}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding:'32px 36px' }}>
      {/* Header */}
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('cashFlow')}</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('whereMoneyGoes')}</h2>
        </div>
        <div style={{ display:'flex', gap:5, padding:'4px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
          {[{id:'monthly',l:t('monthly')},{id:'quarterly',l:t('quarterly')},{id:'yearly',l:t('yearly')}].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding:'6px 14px', minHeight:36, borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: period===p.id?'var(--orange)':'transparent', color: period===p.id?'#fff':'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* Bar chart — monthly income/expenses/net */}
      <div className="phoenix-card fu1" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text-muted)' }}>
            {[{c:'var(--green)',l:t('income')},{c:'var(--red)',l:t('expenses')},{c:'var(--text-primary)',l:t('netIncome'),dot:true}].map(({c,l,dot})=>(
              <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:dot?10:10, height:dot?3:10, borderRadius:dot?1:2, background:c }}/>{l}</span>
            ))}
          </div>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>{lang==='es'?'Haz clic en un mes':'Click a month to drill down'}</span>
        </div>
        {monthly.length === 0 ? <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>📊 {t('noData')}</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={monthly} barCategoryGap="30%" onClick={(e) => { if (e?.activePayload?.[0]?.payload?.key) setSelectedMonth(e.activePayload[0].payload.key); }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="short" fontSize={12} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
              <YAxis fontSize={11} tick={{ fill:'var(--chart-axis)' }} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="income" name={t('income')} fill="var(--green)" fillOpacity={.8} radius={[5,5,0,0]}/>
              <Bar dataKey="expenses" name={t('expenses')} fill="var(--red)" fillOpacity={.8} radius={[5,5,0,0]}/>
              <Line type="monotone" dataKey="net" name={t('netIncome')} stroke="var(--text-primary)" strokeWidth={2} dot={{ fill:'var(--text-primary)', r:4, stroke:'var(--card)', strokeWidth:2 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Month title + KPI cards */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <h3 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>{sel.label}</h3>
        {monthly.length > 1 && (
          <div style={{ display:'flex', gap:4 }}>
            {monthly.map(m => (
              <button key={m.key} onClick={() => setSelectedMonth(m.key)}
                style={{ padding:'4px 10px', borderRadius:6, border: selectedMonth === m.key ? '2px solid var(--orange)' : '1px solid var(--border)', background: selectedMonth === m.key ? 'var(--orange-dim)' : 'transparent', cursor:'pointer', fontSize:12, fontWeight: selectedMonth === m.key ? 700 : 400, color: selectedMonth === m.key ? 'var(--orange)' : 'var(--text-muted)', fontFamily:"'Outfit',sans-serif" }}>
                {m.short}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:t('income'), value:$(monthData.totalInc), color:'var(--green)' },
          { label:t('expenses'), value:$(monthData.totalExp), color:'var(--red)' },
          { label:t('totalSavings'), value:$(monthData.totalSavings), color: monthData.totalSavings>=0?'var(--green)':'var(--red)' },
          { label:t('savingsRate'), value:`${monthData.savingsRate}%`, color: monthData.savingsRate>20?'var(--green)':monthData.savingsRate>5?'var(--amber)':'var(--red)' },
        ].map((k,i) => (
          <div key={k.label} className={`phoenix-card fu${i+1}`} style={{ textAlign:'center', padding:'16px 12px' }}>
            <p style={{ fontSize:22, fontWeight:800, color:k.color, letterSpacing:'-.02em', marginBottom:2 }}>{k.value}</p>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Income breakdown */}
      <div className="phoenix-card fu2" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <p style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)' }}>{t('income')}</p>
          <BkToggle/>
        </div>
        <HorizBar items={monthData.incomeBreakdown} color="var(--green)" grandTotal={monthData.totalInc}/>
      </div>

      {/* Expenses breakdown */}
      <div className="phoenix-card fu3" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <p style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)' }}>{t('expenses')}</p>
          <BkToggle/>
        </div>
        <HorizBar items={monthData.expenseBreakdown} color="var(--red)" grandTotal={monthData.totalExp}/>
      </div>

      {/* Month-by-month table */}
      <div className="phoenix-card fu4">
        <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>{t('monthByMonth')}</p>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {[lang==='es'?'Mes':'Month', t('income'), t('expenses'), t('netIncome'), t('savingsRate'), t('verdict')].map((h,i) => (
                <th key={h} style={{ padding:'8px 12px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textAlign: i===0?'left':'right', letterSpacing:'.06em', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthly.map(m => {
              const sr = m.savingsRate;
              const verdict = sr!=null ? (sr>25?{l:t('excellent'),c:'var(--green)'}:sr>8?{l:t('decent'),c:'var(--amber)'}:{l:t('tight'),c:'var(--red)'}) : null;
              const isSelected = m.key === selectedMonth;
              return (
                <tr key={m.key} className="txn-row" onClick={() => setSelectedMonth(m.key)} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', background: isSelected ? 'var(--orange-dim)' : 'transparent' }}>
                  <td style={{ padding:'13px 12px', fontSize:14, fontWeight:700, color: isSelected ? 'var(--orange)' : 'var(--text-primary)' }}>{m.label}</td>
                  <td style={{ textAlign:'right', padding:'13px 12px', fontSize:14, color:'var(--green)', fontFamily:"'DM Mono',monospace" }}>{$(m.income)}</td>
                  <td style={{ textAlign:'right', padding:'13px 12px', fontSize:14, color:'var(--red)', fontFamily:"'DM Mono',monospace" }}>{$(Math.abs(m.expenses))}</td>
                  <td style={{ textAlign:'right', padding:'13px 12px', fontSize:14, fontWeight:700, color: m.net>=0?'var(--text-primary)':'var(--red)', fontFamily:"'DM Mono',monospace" }}>{$(m.net)}</td>
                  <td style={{ textAlign:'right', padding:'13px 12px', fontSize:14, fontWeight:700, color:(sr||0)>20?'var(--green)':(sr||0)>5?'var(--amber)':'var(--red)' }}>{sr!=null?`${sr}%`:'—'}</td>
                  <td style={{ textAlign:'right', padding:'13px 12px' }}>
                    {verdict && <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:verdict.c+'1A', color:verdict.c, border:`1px solid ${verdict.c}30` }}>{verdict.l}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
