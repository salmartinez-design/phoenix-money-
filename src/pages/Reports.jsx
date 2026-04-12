import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency } from '../utils/format';

export function Reports() {
  const { financialData, lang } = useApp();
  const t = useT(lang);
  const { monthly, totalIncome, totalExpenses, totalNet, expenseCats, savingsRate } = financialData;
  const $ = (n,d=0) => formatCurrency(n,lang,d);
  useEffect(() => { document.title = lang==='es'?'Reportes — Phoenix Money':'Reports — Phoenix Money'; }, [lang]);

  const plRows = [
    { label: lang==='es'?'Ingresos Brutos':'Gross Revenue', amount: totalIncome, type:'income' },
    null,
    ...expenseCats.slice(0,6).map(c => ({ label: c.cat?.name||'Other', amount: -c.total, type:'expense' })),
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

  return (
    <div style={{ padding:'32px 36px' }}>
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:30 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('reports')} · YTD 2026</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('profitLoss')}</h2>
        </div>
        <button className="btn-primary" onClick={() => window.print()} style={{ padding:'10px 20px', minHeight:44, fontSize:14, borderRadius:10 }}>⬇ {t('downloadPDF')}</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:t('totalRevenue'), value:$(totalIncome), color:'var(--green)' },
          { label:t('totalExpenses'), value:$(totalExpenses), color:'var(--red)' },
          { label:t('netProfit'), value:$(totalNet), color:'var(--green)', trend:`${savingsRate}% margin` },
        ].map((k,i) => (
          <div key={k.label} className={`phoenix-card fu${i+1}`}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:27, fontWeight:800, color:k.color, letterSpacing:'-.02em', lineHeight:1.1, marginBottom:4 }}>{k.value}</p>
            {k.trend && <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(5,150,105,0.2)' }}>{k.trend}</span>}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16 }}>
        <div className="phoenix-card fu1">
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:18 }}>{t('plStatement')}</p>
          <div className="print-only" style={{ textAlign:'center', fontSize:18, fontWeight:700, marginBottom:20 }}>Phoenix Money — {t('plStatement')} — 2026</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {plRows.map((row,i) => {
                if (!row) return <tr key={i}><td colSpan={2} style={{ height:10 }}/></tr>;
                const isNet = row.type === 'net';
                return (
                  <tr key={i} style={{ background: isNet?'var(--green-dim)':'transparent' }}>
                    <td style={{ padding:`${isNet?11:7}px 10px`, fontSize:14, fontWeight: row.bold?800:400, color: isNet?'var(--green)':'var(--text-secondary)', paddingLeft: !row.bold?20:10 }}>{row.label}</td>
                    <td style={{ textAlign:'right', padding:`${isNet?11:7}px 10px`, fontSize:14, fontWeight: row.bold?800:400, color: isNet?'var(--green)':row.amount<0?'var(--red)':'var(--text-primary)', fontFamily:"'DM Mono',monospace" }}>
                      {row.amount < 0 ? `(${$(Math.abs(row.amount))})` : $(row.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
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

          <div className="phoenix-card fu3">
            <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('spendTrend')}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>{t('monthlyNetProfit')}</p>
            {monthly.length === 0 ? <div style={{ height:115, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>📊 {t('noData')}</div> : (
              <ResponsiveContainer width="100%" height={115}>
                <BarChart data={monthly} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                  <XAxis dataKey="short" fontSize={11} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="net" name={t('netIncome')} radius={[5,5,0,0]}>
                    {monthly.map((m,i) => <Cell key={i} fill={m.net>1500?'var(--green)':m.net>0?'var(--blue)':'var(--red)'}/>)}
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
