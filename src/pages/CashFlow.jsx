import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency } from '../utils/format';

export function CashFlow() {
  const { financialData, lang } = useApp();
  const t = useT(lang);
  const { monthly, incomeCats, expenseCats } = financialData;
  const $ = (n,d=0) => formatCurrency(n,lang,d);
  const [period, setPeriod] = useState('monthly');
  const [breakdown, setBreakdown] = useState('category');
  const sel = monthly[monthly.length-1] || { income:0, expenses:0, net:0, savingsRate:0, label:'—' };

  useEffect(() => { document.title = lang === 'es' ? 'Flujo de Caja — Phoenix Money' : 'Cash Flow — Phoenix Money'; }, [lang]);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'#fff', marginBottom:6 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, marginBottom:2 }}>{p.name}: <strong>{$(p.value)}</strong></p>)}
    </div>;
  };

  const maxVal = Math.max(...incomeCats.map(c=>c.total), ...expenseCats.map(c=>c.total), 1);
  const BarList = ({ items, color }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      {items.slice(0,8).map((item,i) => {
        const val = item.total||0;
        const pct = Math.round((val/maxVal)*100);
        return (
          <div key={item.id||i} className="bar-row" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px' }}>
            {item.cat?.icon && <span style={{ fontSize:16, width:24, textAlign:'center', flexShrink:0 }}>{item.cat.icon}</span>}
            <span style={{ fontSize:14, color:'var(--text-primary)', fontWeight:500, minWidth:200, flexShrink:0 }}>{item.cat?.name||'—'}</span>
            <div style={{ flex:1, height:10, background:'var(--border)', borderRadius:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:item.cat?.color||color, borderRadius:5, transition:'width .6s ease', opacity:.85 }}/>
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:"'DM Mono',monospace", minWidth:90, textAlign:'right', flexShrink:0 }}>{$(val)}</span>
            <span style={{ fontSize:12, color:'var(--text-muted)', minWidth:40, textAlign:'right', flexShrink:0 }}>{Math.round((val/(items.reduce((s,x)=>s+(x.total||0),0)||1))*100)}%</span>
          </div>
        );
      })}
    </div>
  );

  const PeriodToggle = () => (
    <div style={{ display:'flex', gap:5, padding:'4px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
      {[{id:'monthly',l:t('monthly')},{id:'quarterly',l:t('quarterly')},{id:'yearly',l:t('yearly')}].map(p => (
        <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding:'6px 14px', minHeight:36, borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: period===p.id?'var(--orange)':'transparent', color: period===p.id?'#fff':'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>{p.l}</button>
      ))}
    </div>
  );

  const BkToggle = () => (
    <div style={{ display:'flex', gap:4, padding:3, background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
      {['category','group'].map(b => (
        <button key={b} onClick={() => setBreakdown(b)} style={{ padding:'4px 12px', minHeight:30, borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: breakdown===b?'var(--orange)':'transparent', color: breakdown===b?'#fff':'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>
          {b === 'category' ? t('category') : t('group')}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding:'32px 36px' }}>
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:30 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('cashFlow')}</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('whereMoneyGoes')}</h2>
        </div>
        <PeriodToggle/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:t('income'), value:$(sel.income), color:'var(--green)' },
          { label:t('expenses'), value:$(Math.abs(sel.expenses)), color:'var(--red)' },
          { label:t('totalSavings'), value:$(sel.net), color: sel.net>=0?'var(--green)':'var(--red)' },
          { label:t('savingsRate'), value: sel.savingsRate!=null?`${sel.savingsRate}%`:'—', color: (sel.savingsRate||0)>20?'var(--green)':(sel.savingsRate||0)>5?'var(--amber)':'var(--red)' },
        ].map((k,i) => (
          <div key={k.label} className={`phoenix-card fu${i+1}`}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:26, fontWeight:800, color:k.color, letterSpacing:'-.02em' }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="phoenix-card fu1" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('incomeVsExpenses')}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{lang==='es'?'Barras verdes = dinero que entra · Rojas = que sale · Línea azul = neto':'Green = money in · Red = money out · Blue line = net'}</p>
          </div>
          <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text-muted)' }}>
            {[{c:'var(--green)',l:t('income')},{c:'var(--red)',l:t('expenses')},{c:'var(--blue)',l:t('netIncome')}].map(({c,l})=>(<span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9, height:9, borderRadius: l===t('netIncome')?'50%':2, background:c }}/>{l}</span>))}
          </div>
        </div>
        {monthly.length === 0 ? <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>📊 {t('noData')}</div> : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthly} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="short" fontSize={12} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
              <YAxis fontSize={11} tick={{ fill:'var(--chart-axis)' }} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="income" name={t('income')} fill="var(--green)" fillOpacity={.8} radius={[6,6,0,0]}/>
              <Bar dataKey="expenses" name={t('expenses')} fill="var(--red)" fillOpacity={.8} radius={[6,6,0,0]}/>
              <Line type="monotone" dataKey="net" name={t('netIncome')} stroke="var(--blue)" strokeWidth={3} dot={{ fill:'var(--blue)', r:5, stroke:'var(--card)', strokeWidth:2 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="phoenix-card fu2" style={{ marginBottom:16 }}>
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
              return (
                <tr key={m.key} className="txn-row" style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'13px 12px', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{m.label}</td>
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

      <div className="phoenix-card fu3" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('income')}</p>
          <BkToggle/>
        </div>
        {incomeCats.length === 0 ? <p style={{ color:'var(--text-muted)', textAlign:'center', padding:20 }}>{t('noData')}</p> : <BarList items={incomeCats} color="var(--green)"/>}
      </div>

      <div className="phoenix-card fu4">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('expenses')}</p>
          <BkToggle/>
        </div>
        {expenseCats.length === 0 ? <p style={{ color:'var(--text-muted)', textAlign:'center', padding:20 }}>{t('noData')}</p> : <BarList items={expenseCats} color="var(--red)"/>}
      </div>
    </div>
  );
}
