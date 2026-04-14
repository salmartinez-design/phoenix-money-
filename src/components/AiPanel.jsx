import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { addCategory, getTopCategories, getSubCategories, getCategoryById, CATEGORIES } from '../data/categories';

export function AiPanel({ onClose }) {
  const { lang, financialData, addRule, rules, updateCategory, transactions, accountFilter } = useApp();
  const t = useT(lang);
  const { totalIncome, totalNet, burnRate, runway, latestMonth, prevMonth } = financialData;
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: lang === 'es' ? '¡Hola! Soy tu asesor financiero IA de Phoenix. Puedo responder preguntas Y hacer cambios — crear categorías, reglas, recategorizar transacciones. ¿Qué necesitas?' : "Hey! I'm your Phoenix AI advisor. I can answer questions AND take action — create categories, set up rules, recategorize transactions. What do you need?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const quickQ = lang === 'es'
    ? ['Agrega categoría COGS bajo Negocio', '¿Dónde estoy gastando de más?', 'Crea regla: amazon → COGS', '¿Cómo va mi negocio?']
    : ['Add a COGS category under Business', 'Where am I overspending?', 'Create rule: amazon → COGS', "How's my business doing?"];

  // Execute an action the AI requested
  const executeAction = (action) => {
    try {
      if (action.type === 'add_category') {
        const parent = getCategoryById(action.parentId);
        const id = 'custom-' + action.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        addCategory({
          id, name: action.name, parentId: action.parentId,
          color: parent?.color || '#F59E0B', icon: action.icon || parent?.icon || '📦',
          ctx: action.ctx || 'business'
        });
        return `✅ Created category "${action.name}" under ${parent?.name || 'top level'}`;
      }
      if (action.type === 'add_rule') {
        const existing = rules.find(r => r.match.toLowerCase() === action.keyword.toLowerCase());
        if (existing) return `⚠️ Rule for "${action.keyword}" already exists (→ ${getCategoryById(existing.categoryId)?.name})`;
        addRule({ id: 'r' + Date.now(), match: action.keyword.toLowerCase(), categoryId: action.categoryId });
        const cat = getCategoryById(action.categoryId);
        const matched = transactions.filter(tx => tx.description.toLowerCase().includes(action.keyword.toLowerCase())).length;
        return `✅ Rule created: "${action.keyword}" → ${cat?.icon} ${cat?.name}. ${matched} transaction${matched !== 1 ? 's' : ''} updated.`;
      }
      if (action.type === 'recategorize') {
        let count = 0;
        transactions.forEach(tx => {
          if (tx.description.toLowerCase().includes(action.keyword.toLowerCase())) {
            updateCategory(tx.id, action.categoryId);
            count++;
          }
        });
        const cat = getCategoryById(action.categoryId);
        return `✅ Recategorized ${count} transaction${count !== 1 ? 's' : ''} matching "${action.keyword}" → ${cat?.icon} ${cat?.name}`;
      }
      return '❌ Unknown action type';
    } catch (e) {
      return `❌ Error: ${e.message}`;
    }
  };

  const send = async (text) => {
    const m = text || input;
    if (!m.trim()) return;
    setInput('');

    // If there's a pending action and user confirms
    if (pendingAction && (m.toLowerCase().includes('yes') || m.toLowerCase().includes('sí') || m.toLowerCase().includes('si') || m.toLowerCase().includes('confirm') || m.toLowerCase().includes('do it') || m.toLowerCase().includes('hazlo'))) {
      const result = executeAction(pendingAction);
      setPendingAction(null);
      setMsgs(prev => [...prev, { role: 'user', content: m }, { role: 'assistant', content: result }]);
      return;
    }
    if (pendingAction && (m.toLowerCase().includes('no') || m.toLowerCase().includes('cancel'))) {
      setPendingAction(null);
      setMsgs(prev => [...prev, { role: 'user', content: m }, { role: 'assistant', content: lang === 'es' ? 'Cancelado. ¿Qué más necesitas?' : 'Cancelled. What else do you need?' }]);
      return;
    }

    const next = [...msgs, { role: 'user', content: m }];
    setMsgs(next); setLoading(true);

    // Build category list for the AI
    const catList = getTopCategories().map(p => {
      const subs = getSubCategories(p.id);
      return `${p.name} (id: ${p.id}): ${subs.map(s => `${s.name} (id: ${s.id})`).join(', ')}`;
    }).join('\n');

    const rulesList = rules.slice(0, 30).map(r => `"${r.match}" → ${getCategoryById(r.categoryId)?.name}`).join(', ');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1500,
          system: `You are Phoenix Money's AI financial advisor for a small business owner (PHES LLC, cleaning/property services).
IMPORTANT: Respond ONLY in ${lang === 'es' ? 'Spanish (friendly, clear Latin American)' : 'English'}.
Keep responses concise. Use plain language, no jargon. 8th grade reading level.

You can ANSWER questions AND TAKE ACTIONS. When the user asks you to create categories, rules, or recategorize:

ACTIONS - respond with a JSON block wrapped in \`\`\`action markers:
1. Add category: \`\`\`action{"type":"add_category","name":"Category Name","parentId":"business","icon":"🧹","ctx":"business"}\`\`\`
2. Add rule: \`\`\`action{"type":"add_rule","keyword":"amazon","categoryId":"cogs"}\`\`\`
3. Recategorize: \`\`\`action{"type":"recategorize","keyword":"amazon","categoryId":"cogs"}\`\`\`

ALWAYS ask for confirmation before executing. Say what you'll do, include the action block, then ask "Should I do this?"

Current view: ${accountFilter} | Categories:\n${catList}

Active rules (first 30): ${rulesList}

Financial data: Latest month (${latestMonth?.label||'N/A'}): Income $${latestMonth?.income||0}, Expenses $${Math.abs(latestMonth?.expenses||0)}. Total income: $${Math.round(totalIncome)}, Kept: $${Math.round(totalNet)}. Burn: $${burnRate}/mo.`,
          messages: next.map(x => ({ role: x.role, content: x.content }))
        })
      });
      const d = await res.json();
      let reply = d.content[0].text;

      // Check if AI returned an action block
      const actionMatch = reply.match(/```action(\{[^`]+\})```/);
      if (actionMatch) {
        try {
          const action = JSON.parse(actionMatch[1]);
          setPendingAction(action);
          // Clean the action block from display text
          reply = reply.replace(/```action\{[^`]+\}```/g, '').trim();
          if (!reply) reply = lang === 'es' ? '¿Confirmas?' : 'Confirm?';
        } catch (e) {
          // If JSON parse fails, just show the message
        }
      }

      setMsgs([...next, { role: 'assistant', content: reply }]);
    } catch { setMsgs([...next, { role: 'assistant', content: t('connectionError') }]); }
    setLoading(false);
  };

  return (
    <div className="ai-panel" style={{ position:'fixed', right:0, top:0, bottom:0, width:420, background:'var(--surface)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:999, boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>
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

      {/* Pending action confirmation */}
      {pendingAction && (
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--orange-dim)', display:'flex', gap:8 }}>
          <button className="btn-primary" onClick={() => send(lang === 'es' ? 'Sí' : 'Yes')} style={{ flex:1, padding:'9px', minHeight:38, fontSize:13 }}>
            ✓ {lang === 'es' ? 'Confirmar' : 'Confirm'}
          </button>
          <button className="btn-ghost" onClick={() => send(lang === 'es' ? 'Cancelar' : 'Cancel')} style={{ flex:1, padding:'9px', minHeight:38, fontSize:13 }}>
            ✕ {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      )}

      {msgs.length <= 1 && (
        <div style={{ padding:'0 14px 10px' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{t('quickQuestions')}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {quickQ.map(q => <button key={q} className="btn-ghost" onClick={() => send(q)} style={{ padding:'6px 12px', minHeight:36, borderRadius:20, fontSize:11 }}>{q}</button>)}
          </div>
        </div>
      )}
      <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder={lang === 'es' ? 'Pregunta o da instrucciones...' : 'Ask a question or give instructions...'} style={{ flex:1, padding:'11px 14px', fontSize:14, minHeight:44 }} disabled={loading}/>
        <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ padding:'11px 16px', minWidth:44, fontSize:16, opacity: loading || !input.trim() ? .4 : 1 }}>↑</button>
      </div>
    </div>
  );
}
