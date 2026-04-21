import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatDateShort, normalize } from '../utils/format';
import { getCategoryById, getParentCategory, getTopCategories, getSubCategories, isTransferCategory } from '../data/categories';

const PER_PAGE = 25;

export function Transactions() {
  const { transactions, updateCategory, lang } = useApp();
  const t = useT(lang);
  const $ = (n,d=0) => formatCurrency(n,lang,d);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => { document.title = lang === 'es' ? 'Transacciones — Phoenix Money' : 'Transactions — Phoenix Money'; }, [lang]);
  useEffect(() => { setPage(1); }, [search, catFilter]);

  const filtered = transactions.filter(txn => {
    const q = normalize(search);
    const matchSearch = !q || normalize(txn.description).includes(q) || normalize(txn.merchantName||'').includes(q);
    const matchCat = catFilter === 'all' || (catFilter === 'flagged' && txn.flagged) || txn.categoryId === catFilter || getParentCategory(txn.categoryId)?.id === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const flaggedCount = transactions.filter(x => x.flagged).length;

  const chips = [
    { id:'all', label:t('all') },
    { id:'flagged', label:'🚩 '+t('flagged') },
    { id:'income', label:t('income') },
    { id:'food', label: lang==='es'?'Comida':'Food' },
    { id:'housing', label: lang==='es'?'Vivienda':'Housing' },
    { id:'transport', label: lang==='es'?'Transporte':'Transport' },
    { id:'transfers', label: lang==='es'?'Transferencias':'Transfers' },
    { id:'uncategorized', label: lang==='es'?'Sin categoría':'Uncategorized' },
  ];

  return (
    <div style={{ padding:'32px 36px' }}>
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:26 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('transactions')}</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>
            {transactions.length} {t('transactions_count')}
            {flaggedCount > 0 && <span style={{ fontSize:16, color:'var(--red)', marginLeft:12 }}>· {flaggedCount} {t('flagged').toLowerCase()}</span>}
          </h2>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} style={{ padding:'10px 16px', fontSize:14, width:260, minHeight:44 }}/>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {chips.map(f => <button key={f.id} onClick={() => setCatFilter(f.id)} className={`filter-chip${catFilter===f.id?' active':''}`}>{f.label}</button>)}
      </div>

      {flaggedCount > 0 && catFilter === 'all' && (
        <div className="fu" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'13px 17px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>🚩</span>
          <div>
            <p style={{ fontWeight:700, color:'var(--amber)', fontSize:14, margin:0 }}>{flaggedCount} {lang==='es'?'transacciones necesitan tu atención':'transactions need your attention'}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>{lang==='es'?'Haz clic en la categoría para editarla':'Click any category pill to edit inline'}</p>
          </div>
        </div>
      )}

      <div className="phoenix-card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
              {['Date', lang==='es'?'Descripción':'Description', t('category'), lang==='es'?'Monto':'Amount', ''].map((h,i) => (
                <th key={i} style={{ padding:'13px 18px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textAlign: i>=3?'right':'left', letterSpacing:'.07em', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(txn => {
              const cat = getCategoryById(txn.categoryId);
              const isTransfer = isTransferCategory(txn.categoryId);
              return (
                <tr key={txn.id} className="txn-row" style={{ borderBottom:'1px solid var(--border)', background: txn.flagged?'rgba(245,158,11,0.03)':'transparent' }}>
                  <td style={{ padding:'12px 18px', fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>{formatDateShort(txn.date, lang)}</td>
                  <td style={{ padding:'12px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:(cat?.color||'#94A3B8')+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {isTransfer ? '↔' : cat?.icon||'◦'}
                      </div>
                      <div>
                        <p style={{ fontWeight:600, color: txn.flagged?'var(--amber)':'var(--text-primary)', fontSize:13, margin:0 }}>{txn.description}{txn.flagged?' 🚩':''}</p>
                        {isTransfer && <p style={{ fontSize:11, color:'var(--text-muted)', margin:'2px 0 0' }}>{t('notCountedInTotals')}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 18px' }}>
                    {editId === txn.id ? (
                      <select value={txn.categoryId} onChange={e => { updateCategory(txn.id, e.target.value); setEditId(null); }} style={{ fontSize:12, padding:'5px 10px', minHeight:36 }} autoFocus onBlur={e => { setTimeout(() => setEditId(null), 200); }}>
                        {getTopCategories().map(parent => (
                          <optgroup key={parent.id} label={parent.name}>
                            {getSubCategories(parent.id).map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <span className="cat-pill" onClick={() => setEditId(txn.id)} style={{ background:(cat?.color||'#94A3B8')+'18', color:cat?.color||'#94A3B8', border:`1px solid ${cat?.color||'#94A3B8'}28` }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:cat?.color||'#94A3B8', flexShrink:0 }}/>
                        {cat?.name||'Uncategorized'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign:'right', padding:'12px 18px', fontWeight:700, fontSize:14, color: isTransfer?'var(--text-muted)':txn.amount>0?'var(--green)':'var(--text-primary)', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>
                    {txn.amount > 0 ? '+' : ''}{$(txn.amount, 2)}
                  </td>
                  <td style={{ textAlign:'right', padding:'12px 18px' }}>
                    <button onClick={() => setEditId(txn.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, padding:'4px 8px', borderRadius:6, minHeight:36, minWidth:36 }}>✏️</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>📭 {t('noData')}</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, fontSize:13, color:'var(--text-muted)' }}>
          <span>{lang==='es'?'Mostrando':'Showing'} {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} {lang==='es'?'de':'of'} {filtered.length}</span>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-ghost" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'6px 14px', minHeight:36, fontSize:13 }}>← {lang==='es'?'Anterior':'Prev'}</button>
            <span style={{ padding:'6px 14px', fontSize:13 }}>{page} / {totalPages}</span>
            <button className="btn-ghost" onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'6px 14px', minHeight:36, fontSize:13 }}>{lang==='es'?'Siguiente':'Next'} →</button>
          </div>
        </div>
      )}
    </div>
  );
}
