import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency } from '../utils/format';
import { getCategoryById, getTopCategories, getSubCategories } from '../data/categories';

export function Rules() {
  const { rules, addRule, updateRule, deleteRule, lang, financialData } = useApp();
  const t = useT(lang);
  const [match, setMatch] = useState('');
  const [catId, setCatId] = useState('business-revenue');
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editMatch, setEditMatch] = useState('');
  const [editCat, setEditCat] = useState('');

  useEffect(() => { document.title = lang==='es'?'Reglas — Phoenix Money':'Rules — Phoenix Money'; }, [lang]);

  const aiSuggest = async (kw, forEdit = false) => {
    const keyword = forEdit ? editMatch : (kw || match);
    if (!keyword.trim()) return;
    setLoading(true); setHint(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 300,
          messages: [{ role: 'user', content: `Transaction: "${keyword}". Best financial category? Respond ONLY as JSON: {"categoryId":"one of: business-revenue,paychecks,other-income,mortgage,rent-lease,restaurants,food-delivery,groceries,contractors,payroll,software-subscriptions,marketing-ads,ride-share,gas-fuel,federal-tax,financial-fees,bank-fees,owner-compensation,shopping,utilities,transfers,uncategorized","reason":"${lang==='es'?'una oración en español':'one English sentence'}"}` }]
        })
      });
      const d = await res.json();
      const p = JSON.parse(d.content[0].text.replace(/```json|```/g,'').trim());
      setHint(p);
      if (forEdit) setEditCat(p.categoryId); else setCatId(p.categoryId);
    } catch { setHint({ categoryId: catId, reason: t('connectionError') }); }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!match.trim()) return;
    const existing = rules.find(r => r.match.toLowerCase() === match.toLowerCase().trim());
    setConflict(existing || null);
    addRule({ id: 'r'+Date.now(), match: match.toLowerCase().trim(), categoryId: catId });
    setMatch(''); setHint(null); setConflict(null);
  };

  const CatSelect = ({ value, onChange }) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width:'100%', padding:'10px 14px', fontSize:14, minHeight:44 }}>
      {getTopCategories().map(parent => (
        <optgroup key={parent.id} label={parent.name}>
          {getSubCategories(parent.id).map(sub => <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>)}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div style={{ padding:'32px 36px' }}>
      <div className="fu" style={{ marginBottom:30 }}>
        <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('rules')}</p>
        <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('automateBookkeeping')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:6 }}>{t('setRuleOnce')}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div className="phoenix-card fu1">
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>{t('createRule')}</p>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t('keyword')}</p>
          <input value={match} onChange={e => { setMatch(e.target.value); setHint(null); setConflict(null); }} placeholder={t('keywordPlaceholder')} style={{ width:'100%', padding:'10px 14px', fontSize:14, marginBottom:12, minHeight:44 }}/>
          {conflict && (
            <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
              <p style={{ fontSize:12, color:'var(--amber)', fontWeight:600 }}>⚠️ {t('ruleConflict')} {getCategoryById(conflict.categoryId)?.name}{t('ruleConflictSuffix')}</p>
            </div>
          )}
          {hint && (
            <div style={{ background:'var(--blue-dim)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:10, padding:'11px 14px', marginBottom:12 }}>
              <p style={{ fontSize:13, color:'var(--blue)', fontWeight:700, marginBottom:3 }}>✨ {lang==='es'?'IA sugiere:':'AI Suggests:'} <span style={{ color:'var(--text-primary)' }}>{getCategoryById(hint.categoryId)?.name}</span></p>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>{hint.reason}</p>
            </div>
          )}
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t('category')}</p>
          <div style={{ marginBottom:16 }}><CatSelect value={catId} onChange={setCatId}/></div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-ghost" onClick={() => aiSuggest(match)} disabled={loading || !match.trim()} style={{ flex:1, padding:'10px', minHeight:44, fontSize:14, fontWeight:600, opacity:loading?.5:1 }}>
              {loading ? t('thinking') : '✨ '+t('aiSuggest')}
            </button>
            <button className="btn-primary" onClick={handleAdd} disabled={!match.trim()} style={{ flex:1, padding:'10px', minHeight:44, fontSize:14 }}>+ {t('addRule')}</button>
          </div>
        </div>

        <div className="phoenix-card fu2">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', margin:0 }}>{t('needsReview')}</p>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{t('needsReviewSub')}</p>
            </div>
            <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(245,158,11,0.12)', color:'var(--amber)', border:'1px solid rgba(245,158,11,0.25)' }}>{financialData.flaggedCount} {t('pending')}</span>
          </div>
          {financialData.allTransactions.filter(x => x.flagged).slice(0,3).map(txn => (
            <div key={txn.id} style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                <div>
                  <p style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13, margin:0 }}>{txn.description}</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>{formatCurrency(txn.amount,lang,2)} · {lang==='es'?'Actualmente:':'Currently:'} <span style={{ color:'var(--red)' }}>{getCategoryById(txn.categoryId)?.name}</span></p>
                </div>
                <button className="btn-primary" style={{ padding:'5px 12px', minHeight:36, fontSize:12 }}>{t('approve')}</button>
              </div>
            </div>
          ))}
          {financialData.flaggedCount === 0 && <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>{t('nothingToReview')}</p>}
        </div>
      </div>

      <div className="phoenix-card fu3">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', margin:0 }}>{t('activeRules')}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{rules.length} {t('rulesRunning')}</p>
          </div>
          <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(5,150,105,0.2)' }}>{rules.length} {t('active')}</span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {[t('keywordMatch'), t('autoCategorizes'), ''].map((h,i) => (
                <th key={i} style={{ padding:'9px 14px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textAlign: i===2?'right':'left', letterSpacing:'.07em', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => {
              const cat = getCategoryById(rule.categoryId);
              const isEdit = editingId === rule.id;
              return (
                <tr key={rule.id} className="txn-row" style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'12px 14px' }}>
                    {isEdit ? (
                      <input value={editMatch} onChange={e => setEditMatch(e.target.value)} style={{ padding:'5px 10px', borderRadius:8, fontSize:13, width:'100%', minHeight:36, fontFamily:"'DM Mono',monospace" }} autoFocus/>
                    ) : (
                      <code style={{ fontFamily:"'DM Mono',monospace", background:'var(--bg)', padding:'4px 10px', borderRadius:6, fontSize:13, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>"{rule.match}"</code>
                    )}
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    {isEdit ? (
                      <CatSelect value={editCat} onChange={setEditCat}/>
                    ) : (
                      <span className="cat-pill" style={{ background:(cat?.color||'#94A3B8')+'18', color:cat?.color||'#94A3B8', border:`1px solid ${cat?.color||'#94A3B8'}28`, cursor:'default' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:cat?.color||'#94A3B8', flexShrink:0 }}/>{cat?.name}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign:'right', padding:'12px 14px' }}>
                    {isEdit ? (
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <button onClick={() => aiSuggest('', true)} disabled={loading} style={{ padding:'4px 10px', borderRadius:7, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', fontSize:11, color:'var(--text-muted)', minHeight:32, fontFamily:"'Outfit',sans-serif" }}>✨</button>
                        <button className="btn-primary" onClick={() => { updateRule({ id:editingId, match:editMatch.toLowerCase().trim(), categoryId:editCat }); setEditingId(null); setHint(null); }} style={{ padding:'5px 12px', minHeight:32, fontSize:12 }}>{t('saveRule')}</button>
                        <button className="btn-ghost" onClick={() => setEditingId(null)} style={{ padding:'5px 10px', minHeight:32, fontSize:12 }}>{t('cancelEdit')}</button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                        <button onClick={() => { setEditingId(rule.id); setEditMatch(rule.match); setEditCat(rule.categoryId); setHint(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, padding:'4px 8px', borderRadius:6, minHeight:36, minWidth:36 }}>✏️</button>
                        <button onClick={() => deleteRule(rule.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, padding:'4px 8px', borderRadius:6, minHeight:36, minWidth:36 }}>✕</button>
                      </div>
                    )}
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
