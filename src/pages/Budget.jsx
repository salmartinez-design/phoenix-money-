import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatMonthYear, prevMonthKey, nextMonthKey } from '../utils/format';
import { getTopCategories, getSubCategories, getCategoryById, isIncomeCategory } from '../data/categories';

export function Budget() {
  const { budgets, setBudget, copyBudgetFromMonth, financialData, lang, transactions } = useApp();
  const t = useT(lang);
  const $ = (n, d=0) => formatCurrency(n, lang, d);
  const { monthly, categoryMonthlySpend } = financialData;

  const [selectedMonth, setSelectedMonth] = useState(() => monthly[monthly.length-1]?.key || '2026-03');
  const [expandedParents, setExpandedParents] = useState(() => new Set(getTopCategories().map(c => c.id)));
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { document.title = lang === 'es' ? 'Presupuesto — Phoenix Money' : 'Budget — Phoenix Money'; }, [lang]);

  const monthBudgets = budgets[selectedMonth] || {};
  const monthSpend = categoryMonthlySpend[selectedMonth] || {};
  const prevMk = prevMonthKey(selectedMonth);
  const prevSpend = categoryMonthlySpend[prevMk] || {};

  // Smart suggestions based on average spending
  const smartSuggestions = useMemo(() => {
    const suggestions = {};
    const monthKeys = Object.keys(categoryMonthlySpend).sort();
    getTopCategories().forEach(parent => {
      if (parent.id === 'transfers' || parent.id === 'uncategorized') return;
      getSubCategories(parent.id).forEach(sub => {
        const values = monthKeys.map(mk => categoryMonthlySpend[mk]?.[sub.id] || 0).filter(v => v > 0);
        if (values.length > 0) {
          const avg = values.reduce((s,v) => s+v, 0) / values.length;
          suggestions[sub.id] = Math.ceil(avg / 50) * 50;
        }
      });
      const parentValues = monthKeys.map(mk => categoryMonthlySpend[mk]?.[parent.id] || 0).filter(v => v > 0);
      if (parentValues.length > 0) {
        const avg = parentValues.reduce((s,v) => s+v, 0) / parentValues.length;
        suggestions[parent.id] = Math.ceil(avg / 50) * 50;
      }
    });
    return suggestions;
  }, [categoryMonthlySpend]);

  const applySmartBudget = () => {
    Object.entries(smartSuggestions).forEach(([catId, amount]) => {
      setBudget(selectedMonth, catId, amount);
    });
  };

  const toggleParent = (id) => {
    const next = new Set(expandedParents);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedParents(next);
  };

  const startEdit = (catId) => {
    setEditingCell(catId);
    setEditValue(monthBudgets[catId]?.toString() || '');
  };

  const saveEdit = (catId) => {
    const num = parseInt(editValue) || 0;
    setBudget(selectedMonth, catId, num > 0 ? num : null);
    setEditingCell(null);
  };

  const incomeCategories = getTopCategories().filter(c => isIncomeCategory(c.id));
  const expenseCategories = getTopCategories().filter(c => !isIncomeCategory(c.id) && c.id !== 'transfers' && c.id !== 'uncategorized');

  const totalBudgetedIncome = incomeCategories.reduce((s, p) => s + (monthBudgets[p.id] || getSubCategories(p.id).reduce((ss, sub) => ss + (monthBudgets[sub.id] || 0), 0)), 0);
  const totalActualIncome = incomeCategories.reduce((s, p) => s + (monthSpend[p.id] || 0), 0);
  const totalBudgetedExpenses = expenseCategories.reduce((s, p) => s + (monthBudgets[p.id] || getSubCategories(p.id).reduce((ss, sub) => ss + (monthBudgets[sub.id] || 0), 0)), 0);
  const totalActualExpenses = expenseCategories.reduce((s, p) => s + (monthSpend[p.id] || 0), 0);
  const leftToBudget = totalBudgetedIncome - totalBudgetedExpenses;
  const hasBudgets = Object.keys(monthBudgets).length > 0;

  const CategorySection = ({ title, categories, isIncome }) => (
    <div className="phoenix-card" style={{ marginBottom:16, padding:0, overflow:'hidden' }}>
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:13, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)' }}>{title}</p>
          <div style={{ display:'flex', gap:40, fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'.06em', textTransform:'uppercase' }}>
            <span style={{ width:90, textAlign:'right' }}>{t('budgeted')}</span>
            <span style={{ width:90, textAlign:'right' }}>{t('actual')}</span>
            <span style={{ width:90, textAlign:'right' }}>{t('remaining')}</span>
          </div>
        </div>
      </div>
      {categories.map(parent => {
        const subs = getSubCategories(parent.id);
        const expanded = expandedParents.has(parent.id);
        const parentBudget = monthBudgets[parent.id] || subs.reduce((s, sub) => s + (monthBudgets[sub.id] || 0), 0);
        const parentActual = monthSpend[parent.id] || 0;
        const parentRemaining = parentBudget - parentActual;
        const parentPrevActual = prevSpend[parent.id] || 0;
        const pct = parentBudget > 0 ? Math.round((parentActual / parentBudget) * 100) : 0;
        const barColor = pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : isIncome ? 'var(--green)' : 'var(--orange)';

        return (
          <div key={parent.id}>
            <div className="txn-row" onClick={() => toggleParent(parent.id)} style={{ display:'flex', alignItems:'center', padding:'14px 20px', cursor:'pointer', borderBottom: expanded ? 'none' : '1px solid var(--border)' }}>
              <span style={{ fontSize:10, color:'var(--text-muted)', marginRight:8, transition:'transform .2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              <span style={{ fontSize:16, marginRight:10, flexShrink:0 }}>{parent.icon}</span>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{parent.name}</span>
                {parentBudget > 0 && (
                  <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden', marginTop:6, maxWidth:200 }}>
                    <div style={{ height:'100%', width:`${Math.min(pct, 100)}%`, background:barColor, borderRadius:2, transition:'width .5s' }}/>
                  </div>
                )}
                {parentBudget > 0 && parentActual > 0 && (
                  <p style={{ fontSize:11, color: pct > 100 ? 'var(--red)' : 'var(--text-muted)', marginTop:3 }}>
                    {pct > 100
                      ? (lang==='es' ? `${$(parentActual - parentBudget)} de más` : `${$(parentActual - parentBudget)} over budget`)
                      : (lang==='es' ? `${pct}% usado` : `${pct}% used`)
                    }
                  </p>
                )}
                {!parentBudget && parentPrevActual > 0 && (
                  <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                    {lang==='es' ? `Mes pasado: ${$(parentPrevActual)}` : `Last month: ${$(parentPrevActual)}`}
                  </p>
                )}
              </div>
              <div style={{ display:'flex', gap:40, alignItems:'center' }}>
                <span style={{ width:90, textAlign:'right', fontSize:14, fontWeight:700, color: parentBudget > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily:"'DM Mono',monospace" }}>{parentBudget > 0 ? $(parentBudget) : '—'}</span>
                <span style={{ width:90, textAlign:'right', fontSize:14, fontWeight:600, color:'var(--text-secondary)', fontFamily:"'DM Mono',monospace" }}>{parentActual > 0 ? $(parentActual) : '$0'}</span>
                <span style={{ width:90, textAlign:'right', fontSize:14, fontWeight:700, fontFamily:"'DM Mono',monospace", color: parentBudget === 0 ? 'var(--text-muted)' : parentRemaining >= 0 ? 'var(--green)' : 'var(--red)' }}>{parentBudget > 0 ? (parentRemaining >= 0 ? $(parentRemaining) : `-${$(Math.abs(parentRemaining))}`) : '—'}</span>
              </div>
            </div>
            {expanded && subs.map(sub => {
              const subBudget = monthBudgets[sub.id] || 0;
              const subActual = monthSpend[sub.id] || 0;
              const subRemaining = subBudget - subActual;
              const subPrev = prevSpend[sub.id] || 0;
              const suggestion = smartSuggestions[sub.id];
              const subPct = subBudget > 0 ? Math.round((subActual / subBudget) * 100) : 0;
              const subBarColor = subPct > 100 ? 'var(--red)' : subPct > 80 ? 'var(--amber)' : isIncome ? 'var(--green)' : 'var(--orange)';
              const isEditing = editingCell === sub.id;

              return (
                <div key={sub.id} style={{ display:'flex', alignItems:'center', padding:'12px 20px 12px 52px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
                  <span style={{ fontSize:14, marginRight:10, flexShrink:0 }}>{sub.icon}</span>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{sub.name}</span>
                    {subBudget > 0 && (
                      <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden', marginTop:4, maxWidth:160 }}>
                        <div style={{ height:'100%', width:`${Math.min(subPct, 100)}%`, background:subBarColor, borderRadius:2, transition:'width .5s' }}/>
                      </div>
                    )}
                    {!subBudget && subPrev > 0 && !isEditing && (
                      <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                        {lang==='es' ? `Mes pasado: ${$(subPrev)}` : `Last month: ${$(subPrev)}`}
                        {suggestion && <span style={{ color:'var(--blue)', marginLeft:6, cursor:'pointer' }} onClick={(e) => { e.stopPropagation(); setBudget(selectedMonth, sub.id, suggestion); }}>→ {lang==='es'?'Sugerir':'Suggest'} {$(suggestion)}</span>}
                      </p>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:40, alignItems:'center' }}>
                    <div style={{ width:90, textAlign:'right' }}>
                      {isEditing ? (
                        <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key==='Enter') saveEdit(sub.id); if (e.key==='Escape') setEditingCell(null); }} onBlur={() => saveEdit(sub.id)} autoFocus style={{ width:80, padding:'4px 8px', fontSize:13, textAlign:'right', fontFamily:"'DM Mono',monospace", minHeight:32 }}/>
                      ) : (
                        <span onClick={() => startEdit(sub.id)} style={{ cursor:'pointer', fontSize:13, fontFamily:"'DM Mono',monospace", color: subBudget > 0 ? 'var(--text-primary)' : 'var(--text-muted)', padding:'4px 8px', borderRadius:6, border:'1px dashed var(--border)', display:'inline-block', minWidth:60, transition:'all .15s' }} onMouseEnter={e => e.target.style.borderColor='var(--orange)'} onMouseLeave={e => e.target.style.borderColor='var(--border)'}>
                          {subBudget > 0 ? $(subBudget) : '—'}
                        </span>
                      )}
                    </div>
                    <span style={{ width:90, textAlign:'right', fontSize:13, color:'var(--text-secondary)', fontFamily:"'DM Mono',monospace" }}>{subActual > 0 ? $(subActual) : '$0'}</span>
                    <span style={{ width:90, textAlign:'right', fontSize:13, fontWeight:600, fontFamily:"'DM Mono',monospace", color: subBudget === 0 ? 'var(--text-muted)' : subRemaining >= 0 ? 'var(--green)' : 'var(--red)' }}>{subBudget > 0 ? (subRemaining >= 0 ? $(subRemaining) : `-${$(Math.abs(subRemaining))}`) : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ padding:'32px 36px' }}>
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('budget')}</p>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setSelectedMonth(prevMonthKey(selectedMonth))} style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', padding:'6px 10px', fontSize:16, color:'var(--text-muted)', minHeight:36 }}>←</button>
            <h2 style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em', minWidth:220, textAlign:'center' }}>{formatMonthYear(selectedMonth, lang)}</h2>
            <button onClick={() => setSelectedMonth(nextMonthKey(selectedMonth))} style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', padding:'6px 10px', fontSize:16, color:'var(--text-muted)', minHeight:36 }}>→</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {!hasBudgets && <button className="btn-primary" onClick={applySmartBudget} style={{ padding:'10px 20px', minHeight:44, fontSize:14 }}>✨ {lang==='es'?'Presupuesto Inteligente':'Smart Budget'}</button>}
          <button className="btn-ghost" onClick={() => copyBudgetFromMonth(prevMk, selectedMonth)} style={{ padding:'10px 16px', minHeight:44, fontSize:13 }}>📋 {t('copyFromLastMonth')}</button>
        </div>
      </div>

      {!hasBudgets && (
        <div className="fu1" style={{ background:'var(--blue-dim)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:14, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:28 }}>✨</span>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--blue)', marginBottom:4 }}>{lang==='es'?'¿Quieres un presupuesto en un clic?':'Want a budget in one click?'}</p>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
              {lang==='es' ? 'Presupuesto Inteligente mira lo que gastaste los últimos meses y sugiere montos realistas.' : "Smart Budget looks at what you actually spent and suggests realistic amounts. Adjust anytime."}
            </p>
          </div>
          <button className="btn-primary" onClick={applySmartBudget} style={{ padding:'12px 24px', minHeight:48, fontSize:15, flexShrink:0 }}>{lang==='es'?'Crear':'Create'}</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <div>
          <CategorySection title={t('income')} categories={incomeCategories} isIncome={true}/>
          <CategorySection title={t('expenses')} categories={expenseCategories} isIncome={false}/>
        </div>
        <div style={{ position:'sticky', top:20, alignSelf:'start' }}>
          <div className="phoenix-card fu2" style={{ textAlign:'center', marginBottom:16 }}>
            <p style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{t('leftToBudget')}</p>
            <p style={{ fontSize:34, fontWeight:800, color: leftToBudget >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing:'-.03em', fontFamily:"'DM Mono',monospace" }}>{$(leftToBudget)}</p>
          </div>
          <div className="phoenix-card fu3" style={{ marginBottom:16 }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{t('income')}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{totalBudgetedIncome > 0 ? `${Math.round((totalActualIncome/totalBudgetedIncome)*100)}%` : '—'}</span>
              </div>
              <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', width: totalBudgetedIncome > 0 ? `${Math.min((totalActualIncome/totalBudgetedIncome)*100, 100)}%` : '0%', background:'var(--green)', borderRadius:4, transition:'width .6s' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'var(--text-secondary)' }}>{$(totalActualIncome)} {lang==='es'?'recibido':'earned'}</span>
                {totalBudgetedIncome > 0 && <span style={{ color:'var(--green)', fontWeight:600 }}>{$(totalBudgetedIncome - totalActualIncome)} {lang==='es'?'restante':'left'}</span>}
              </div>
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{t('expenses')}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{totalBudgetedExpenses > 0 ? `${Math.round((totalActualExpenses/totalBudgetedExpenses)*100)}%` : '—'}</span>
              </div>
              <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', width: totalBudgetedExpenses > 0 ? `${Math.min((totalActualExpenses/totalBudgetedExpenses)*100, 100)}%` : '0%', background: totalActualExpenses > totalBudgetedExpenses ? 'var(--red)' : 'var(--orange)', borderRadius:4, transition:'width .6s' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'var(--text-secondary)' }}>{$(totalActualExpenses)} {lang==='es'?'gastado':'spent'}</span>
                {totalBudgetedExpenses > 0 && <span style={{ color: totalActualExpenses > totalBudgetedExpenses ? 'var(--red)' : 'var(--green)', fontWeight:600 }}>{$(Math.abs(totalBudgetedExpenses - totalActualExpenses))} {totalActualExpenses > totalBudgetedExpenses ? (lang==='es'?'de más':'over') : (lang==='es'?'restante':'left')}</span>}
              </div>
            </div>
          </div>
          <div style={{ padding:'14px 16px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
            <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, textAlign:'center' }}>
              💡 {lang==='es' ? 'Haz clic en "—" para escribir un presupuesto. Los números azules son sugerencias.' : 'Click any "—" to type a budget. Blue numbers are suggestions based on your spending.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
