import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';

export function AiPanel({ onClose }) {
  const { lang, financialData } = useApp();
  const t = useT(lang);
  const { totalIncome, totalNet, burnRate, runway, latestMonth, prevMonth } = financialData;
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: lang === 'es' ? '¡Hola! Soy tu asesor financiero IA de Phoenix. Tengo todos tus números cargados. ¿Qué quieres saber?' : "Hey! I'm your Phoenix AI financial advisor — I have all your numbers loaded. What would you like to know?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const quickQ = lang === 'es'
    ? ['¿Por qué es bajo mi margen de marzo?', '¿Dónde estoy gastando de más?', '¿Cómo va abril?', '¿Qué significa mi tasa de quema?']
    : ['Why is my March margin so low?', 'Where am I overspending?', "How's April looking?", "What does my burn rate mean?"];

  const send = async (text) => {
    const m = text || input;
    if (!m.trim()) return;
    setInput('');
    const next = [...msgs, { role: 'user', content: m }];
    setMsgs(next); setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: `You are a friendly financial advisor for a small business using Phoenix Money.
IMPORTANT: Respond ONLY in ${lang === 'es' ? 'Spanish (friendly, clear Latin American)' : 'English'}.
Keep responses under 100 words. Use bullet points for lists. Plain language, no jargon.
Their data: Latest month (${latestMonth?.label||'Apr 2026'}): Income $${latestMonth?.income||7253}, Expenses $${Math.abs(latestMonth?.expenses||3997)}, Net $${latestMonth?.net||3256} (${latestMonth?.savingsRate||44}% saved). Prev month (${prevMonth?.label||'Mar 2026'}): Income $${prevMonth?.income||10647}, Expenses $${Math.abs(prevMonth?.expenses||10303)}, Net $${prevMonth?.net||344}. Total income: $${Math.round(totalIncome)}, Kept: $${Math.round(totalNet)}. Burn: $${burnRate}/mo. Runway: ${runway} months.`,
          messages: next.map(x => ({ role: x.role, content: x.content }))
        })
      });
      const d = await res.json();
      setMsgs([...next, { role: 'assistant', content: d.content[0].text }]);
    } catch { setMsgs([...next, { role: 'assistant', content: t('connectionError') }]); }
    setLoading(false);
  };

  return (
    <div className="ai-panel" style={{ position:'fixed', right:0, top:0, bottom:0, width:400, background:'var(--surface)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:999, boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>
      <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#F97316,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✨</div>
          <div>
            <p style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15, margin:0 }}>{t('aiAdvisor')}</p>
            <p style={{ fontSize:11, color:'var(--green)', fontWeight:600, margin:0 }}>{t('onlinePowered')}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:22, lineHeight:1, padding:'4px 8px', borderRadius:6 }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom:12, display:'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap:8 }}>
            {m.role === 'assistant' && <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#F97316,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, marginTop:2 }}>✨</div>}
            <div style={{ maxWidth:'88%', padding:'11px 14px', borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? 'linear-gradient(135deg,#F97316,#F59E0B)' : 'var(--card)', border: m.role === 'user' ? 'none' : '1px solid var(--border)', color: m.role === 'user' ? '#fff' : 'var(--text-primary)', fontSize:13.5, lineHeight:1.65, whiteSpace:'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ display:'flex', gap:8 }}><div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#F97316,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✨</div><div style={{ padding:'11px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'4px 16px 16px 16px', color:'var(--text-muted)', fontSize:13 }}>{t('thinking')}</div></div>}
        <div ref={endRef}/>
      </div>
      {msgs.length <= 1 && (
        <div style={{ padding:'0 14px 10px' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{t('quickQuestions')}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {quickQ.map(q => <button key={q} className="btn-ghost" onClick={() => send(q)} style={{ padding:'6px 12px', minHeight:36, borderRadius:20, fontSize:11 }}>{q}</button>)}
          </div>
        </div>
      )}
      <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder={t('askAboutMoney')} style={{ flex:1, padding:'11px 14px', fontSize:14, minHeight:44 }} disabled={loading}/>
        <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ padding:'11px 16px', minWidth:44, fontSize:16, opacity: loading || !input.trim() ? .4 : 1 }}>↑</button>
      </div>
    </div>
  );
}
