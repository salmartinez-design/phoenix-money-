import { useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatDateShort } from '../utils/format';
import { getCategoryById } from '../data/categories';

const Tip = ({ active, payload, label, lang }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'#fff', marginBottom:6 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, marginBottom:2 }}>{p.name}: <strong>{formatCurrency(p.value, lang)}</strong></p>)}
    </div>
  );
};

function Spark({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={38}>
      <AreaChart data={data} margin={{ top:2, right:2, bottom:2, left:2 }}>
        <defs>
          <linearGradient id={`sg${color.replace(/[^a-z]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={.25}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg${color.replace(/[^a-z]/gi,'')})`} dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KpiCard({ label, value, sub, color, trend, sp }) {
  const tColor = trend?.startsWith('+') ? 'var(--green)' : trend?.startsWith('-') ? 'var(--red)' : 'var(--text-muted)';
  return (
    <div className="phoenix-card" style={{ display:'flex', flexDirection:'column' }}>
      <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{label}</p>
      <p style={{ fontSize:27, fontWeight:800, color: color || 'var(--text-primary)', letterSpacing:'-.02em', lineHeight:1.1, marginBottom:4 }}>{value}</p>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        {sub && <p style={{ fontSize:12, color:'var(--text-muted)' }}>{sub}</p>}
        {trend && <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:tColor+'1A', color:tColor, border:`1px solid ${tColor}30` }}>{trend}</span>}
      </div>
      {sp && <div style={{ marginTop:10 }}><Spark data={sp} color={color || '#94A3B8'}/></div>}
    </div>
  );
}

export function Dashboard() {
  const { financialData, lang, setAccountFilter, accountFilter } = useApp();
  const t = useT(lang);
  const { monthly, totalIncome, totalExpenses, totalNet, savingsRate, burnRate, runway, latestMonth, prevMonth, allTransactions, flaggedCount, negativeAccounts } = financialData;
  useEffect(() => { document.title = lang === 'es' ? 'Panel — Phoenix Money' : 'Dashboard — Phoenix Money'; }, [lang]);
  const $ = (n, d=0) => formatCurrency(n, lang, d);

  return (
    <div style={{ padding:'32px 36px' }}>
      {negativeAccounts.length > 0 && (
        <div style={{ background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <p style={{ fontSize:14, color:'var(--red)', fontWeight:600, margin:0 }}>
            {lang === 'es' ? 'Una o más cuentas están en negativo. Revisa tus transacciones.' : 'One or more accounts are negative. Review your transactions to find unexpected fees.'}
          </p>
        </div>
      )}
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:30 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('businessOverview')} · Apr 2026</p>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.03em' }}>{t('yourMoneyClear')}</h2>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['all','business','personal'].map(f => (
            <button key={f} onClick={() => setAccountFilter(f)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${accountFilter === f ? 'var(--orange)' : 'var(--border)'}`, cursor:'pointer', fontSize:12, fontWeight:600, background: accountFilter === f ? 'var(--orange-dim)' : 'transparent', color: accountFilter === f ? 'var(--orange)' : 'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>
              {f === 'all' ? t('all') : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <div className="fu1"><KpiCard label={t('totalRevenue')} value={$(totalIncome)} sub={t('yearToDate')} sp={monthly.map(m=>({v:m.income}))}/></div>
        <div className="fu2"><KpiCard label={t('whatYouKept')} value={$(totalNet)} sub={`${savingsRate}% ${t('profitMargin').toLowerCase()}`} color="var(--green)" trend={totalNet > 0 ? `+${$(totalNet)}` : undefined} sp={monthly.map(m=>({v:m.net}))}/></div>
        <div className="fu3"><KpiCard label={t('monthlyBurn')} value={$(burnRate)} sub={t('avgMonthlySpend')} color="var(--amber)" sp={monthly.map(m=>({v:Math.abs(m.expenses)}))}/></div>
        <div className="fu4"><KpiCard label={t('runway')} value={`${runway} mo`} sub={t('atCurrentBurn')} color="var(--blue)" sp={[{v:20},{v:30},{v:40},{v:runway}]}/></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16, marginBottom:16 }}>
        <div className="phoenix-card fu1">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Monthly Cash Flow</p>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{t('income')} · {t('expenses')} · {t('netIncome')}</p>
            </div>
            <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text-muted)' }}>
              {[{c:'var(--green)',l:t('income')},{c:'var(--red)',l:t('expenses')},{c:'var(--blue)',l:t('netIncome')}].map(({c,l})=>(<span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9, height:9, borderRadius: l===t('netIncome')?'50%':2, background:c }}/>{l}</span>))}
            </div>
          </div>
          {monthly.length === 0 ? <div style={{ height:215, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>📊 {t('noData')}</div> : (
            <ResponsiveContainer width="100%" height={215}>
              <ComposedChart data={monthly} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                <XAxis dataKey="short" fontSize={12} tick={{ fill:'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
                <YAxis fontSize={11} tick={{ fill:'var(--chart-axis)' }} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'} axisLine={false} tickLine={false} width={44}/>
                <Tooltip content={<Tip lang={lang}/>}/>
                <Bar dataKey="income" name={t('income')} fill="var(--green)" fillOpacity={.8} radius={[6,6,0,0]}/>
                <Bar dataKey="expenses" name={t('expenses')} fill="var(--red)" fillOpacity={.8} radius={[6,6,0,0]}/>
                <Line type="monotone" dataKey="net" name={t('netIncome')} stroke="var(--blue)" strokeWidth={2.5} dot={{ fill:'var(--blue)', r:5, stroke:'var(--card)', strokeWidth:2 }}/>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="phoenix-card fu2">
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:18 }}>{t('businessHealth')}</p>
          {[
            { label:t('profitMargin'), pct:savingsRate, max:40, color:'var(--green)' },
            { label:'Revenue Growth', pct:88, max:100, color:'var(--blue)' },
            { label:'Runway Safety', pct:Math.min(runway,100), max:100, color:'var(--green)' },
            { label:'Bookkeeping', pct:flaggedCount === 0 ? 100 : Math.max(20, 100 - flaggedCount * 15), max:100, color:'var(--amber)' },
          ].map(({ label, pct, max, color }) => (
            <div key={label} style={{ marginBottom:15 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:800, color }}>{Math.round(Math.max(0,(pct/max)*100))}</span>
              </div>
              <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(Math.max(0,(pct/max)*100),100)}%`, background:`linear-gradient(90deg,${color}80,${color})`, borderRadius:3, transition:'width 1s ease' }}/>
              </div>
            </div>
          ))}
          <div style={{ marginTop:12, padding:'12px 14px', background:'var(--green-dim)', border:'1px solid rgba(5,150,105,0.2)', borderRadius:10 }}>
            <p style={{ fontSize:12, color:'var(--green)', fontWeight:600, lineHeight:1.5 }}>
              {lang === 'es' ? '✓ Tu negocio está en pleno rendimiento. Abril va mejor que marzo.' : '✓ Firing on all cylinders. April savings are much better than March.'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="phoenix-card fu3">
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>{t('marchVsApril')}</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['', lang==='es'?'Marzo':'March', lang==='es'?'Abril':'April', lang==='es'?'Cambio':'Change'].map((h,i) => (
                  <th key={i} style={{ padding:'6px 0 10px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textAlign: i===0?'left':'right', letterSpacing:'.06em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name:t('income'), mar:prevMonth?.income||10647, apr:latestMonth?.income||7253 },
                { name:t('expenses'), mar:Math.abs(prevMonth?.expenses||10303), apr:Math.abs(latestMonth?.expenses||3997) },
                { name:t('netIncome'), mar:prevMonth?.net||344, apr:latestMonth?.net||3256, bold:true },
              ].map(({ name, mar, apr, bold }) => {
                const diff = apr - mar;
                const good = name === t('expenses') ? diff < 0 : diff > 0;
                return (
                  <tr key={name} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'12px 0', fontSize:14, color: bold?'var(--text-primary)':'var(--text-secondary)', fontWeight: bold?700:400 }}>{name}</td>
                    <td style={{ textAlign:'right', padding:'12px 0', fontSize:13, color:'var(--text-muted)', fontFamily:"'DM Mono',monospace" }}>{$(mar)}</td>
                    <td style={{ textAlign:'right', padding:'12px 0', fontSize:14, color: bold?'var(--text-primary)':'var(--text-secondary)', fontWeight: bold?700:400, fontFamily:"'DM Mono',monospace" }}>{$(apr)}</td>
                    <td style={{ textAlign:'right', padding:'12px 0' }}>
                      <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:(good?'var(--green)':'var(--red)')+'1A', color:good?'var(--green)':'var(--red)', border:`1px solid ${good?'var(--green)':'var(--red)'}30` }}>
                        {diff > 0 ? '+' : ''}{$(diff)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="phoenix-card fu4">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{t('recentActivity')}</p>
            <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(5,150,105,0.2)' }}>{t('live')}</span>
          </div>
          {allTransactions.slice(0,6).map(txn => {
            const cat = getCategoryById(txn.categoryId);
            return (
              <div key={txn.id} className="txn-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 10px', borderRadius:9, margin:'1px -10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:(cat?.color||'#94A3B8')+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{cat?.icon||'◦'}</div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color: txn.flagged?'var(--amber)':'var(--text-primary)', margin:0 }}>{txn.description}{txn.flagged?' 🚩':''}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)', margin:'1px 0 0' }}>{formatDateShort(txn.date, lang)}</p>
                  </div>
                </div>
                <p style={{ fontSize:14, fontWeight:700, color: txn.amount > 0 ?'var(--green)':'var(--text-secondary)', fontFamily:"'DM Mono',monospace", margin:0 }}>
                  {txn.amount > 0 ? '+' : ''}{$(txn.amount, 2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
