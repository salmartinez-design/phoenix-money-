import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatDateShort, formatDate, normalize } from '../utils/format';
import { getCategoryById, getParentCategory, getTopCategories, getSubCategories, isTransferCategory } from '../data/categories';

const PER_PAGE = 30;

const DATE_PRESETS_EN = [
  { id: 'all', label: 'All Time' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'last-3', label: 'Last 3 Months' },
  { id: 'this-year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];
const DATE_PRESETS_ES = [
  { id: 'all', label: 'Todo' },
  { id: 'this-month', label: 'Este Mes' },
  { id: 'last-month', label: 'Mes Pasado' },
  { id: 'last-3', label: 'Últimos 3 Meses' },
  { id: 'this-year', label: 'Este Año' },
  { id: 'custom', label: 'Personalizado' },
];

function getDateRange(presetId) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  switch (presetId) {
    case 'this-month': return { from: new Date(y, m, 1).toISOString().slice(0,10), to: new Date(y, m+1, 0).toISOString().slice(0,10) };
    case 'last-month': return { from: new Date(y, m-1, 1).toISOString().slice(0,10), to: new Date(y, m, 0).toISOString().slice(0,10) };
    case 'last-3': return { from: new Date(y, m-3, 1).toISOString().slice(0,10), to: new Date(y, m+1, 0).toISOString().slice(0,10) };
    case 'this-year': return { from: `${y}-01-01`, to: `${y}-12-31` };
    default: return { from: '', to: '' };
  }
}

export function Transactions() {
  const { transactions, updateCategory, lang } = useApp();
  const t = useT(lang);
  const $ = (n,d=0) => formatCurrency(n,lang,d);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);

  const presets = lang === 'es' ? DATE_PRESETS_ES : DATE_PRESETS_EN;

  useEffect(() => { document.title = lang === 'es' ? 'Transacciones — Phoenix Money' : 'Transactions — Phoenix Money'; }, [lang]);
  useEffect(() => { setPage(1); }, [search, catFilter, datePreset, customFrom, customTo, sortBy]);

  const dateRange = datePreset === 'custom' ? { from: customFrom, to: customTo } : getDateRange(datePreset);

  const filtered = useMemo(() => {
    let list = transactions.filter(txn => {
      const q = normalize(search);
      const matchSearch = !q || normalize(txn.description).includes(q) || normalize(txn.merchantName||'').includes(q);
      const matchCat = catFilter === 'all' || (catFilter === 'flagged' && txn.flagged) || txn.categoryId === catFilter || getParentCategory(txn.categoryId)?.id === catFilter;
      const matchDate = (!dateRange.from || txn.date >= dateRange.from) && (!dateRange.to || txn.date <= dateRange.to);
      return matchSearch && matchCat && matchDate;
    });

    // Sort
    switch (sortBy) {
      case 'date-asc': list.sort((a,b) => a.date.localeCompare(b.date)); break;
      case 'amount-desc': list.sort((a,b) => Math.abs(b.amount) - Math.abs(a.amount)); break;
      case 'amount-asc': list.sort((a,b) => Math.abs(a.amount) - Math.abs(b.amount)); break;
      case 'name-asc': list.sort((a,b) => a.description.localeCompare(b.description)); break;
      default: list.sort((a,b) => b.date.localeCompare(a.date)); break; // date-desc
    }
    return list;
  }, [transactions, search, catFilter, dateRange.from, dateRange.to, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const flaggedCount = transactions.filter(x => x.flagged).length;

  // Group paginated by date for daily headers
  const grouped = [];
  let lastDate = null;
  paginated.forEach(txn => {
    if (txn.date !== lastDate) {
      grouped.push({ type: 'header', date: txn.date, total: 0 });
      lastDate = txn.date;
    }
    grouped[grouped.length - 1].total += txn.amount;
    grouped.push({ type: 'txn', txn });
  });

  // Summary stats for filtered
  const filteredIncome = filtered.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const filteredExpenses = filtered.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);

  const chips = [
    { id:'all', label:t('all') },
    { id:'flagged', label:'🚩 '+t('flagged') },
    { id:'income', label:t('income') },
    { id:'food', label: lang==='es'?'Comida':'Food' },
    { id:'business', label: lang==='es'?'Negocio':'Business' },
    { id:'housing', label: lang==='es'?'Vivienda':'Housing' },
    { id:'transport', label: lang==='es'?'Transporte':'Transport' },
    { id:'taxes', label: lang==='es'?'Impuestos':'Taxes' },
    { id:'personal', label: lang==='es'?'Personal':'Personal' },
    { id:'transfers', label: lang==='es'?'Transferencias':'Transfers' },
    { id:'uncategorized', label: lang==='es'?'Sin categoría':'Uncategorized' },
  ];

  const sortOptions = lang === 'es'
    ? [{ id:'date-desc', l:'Más reciente' }, { id:'date-asc', l:'Más antiguo' }, { id:'amount-desc', l:'Mayor monto' }, { id:'amount-asc', l:'Menor monto' }, { id:'name-asc', l:'A → Z' }]
    : [{ id:'date-desc', l:'Newest first' }, { id:'date-asc', l:'Oldest first' }, { id:'amount-desc', l:'Largest first' }, { id:'amount-asc', l:'Smallest first' }, { id:'name-asc', l:'A → Z' }];

  return (
    <div style={{ padding:'32px 36px' }}>
      {/* Header */}
      <div className="fu" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('transactions')}</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>
            {filtered.length} {t('transactions_count')}
            {flaggedCount > 0 && <span style={{ fontSize:16, color:'var(--red)', marginLeft:12 }}>· {flaggedCount} {t('flagged').toLowerCase()}</span>}
          </h2>
        </div>
        {/* Summary pills */}
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ textAlign:'right' }}>
            <span style={{ fontSize:13, color:'var(--green)', fontWeight:700, fontFamily:"'DM Mono',monospace" }}>+{$(filteredIncome)}</span>
            <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:6 }}>{lang==='es'?'ingresos':'income'}</span>
          </div>
          <div style={{ width:1, height:24, background:'var(--border)' }}/>
          <div style={{ textAlign:'right' }}>
            <span style={{ fontSize:13, color:'var(--red)', fontWeight:700, fontFamily:"'DM Mono',monospace" }}>-{$(filteredExpenses)}</span>
            <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:6 }}>{lang==='es'?'gastos':'spent'}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:'0 0 240px' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text-muted)', pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} style={{ padding:'9px 14px 9px 34px', fontSize:13, width:'100%', minHeight:40 }}/>
        </div>

        {/* Date filter */}
        <div style={{ position:'relative' }}>
          <button onClick={() => { setShowDatePicker(!showDatePicker); setShowSortMenu(false); }} className="btn-ghost" style={{ padding:'9px 14px', minHeight:40, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            📅 {presets.find(p => p.id === datePreset)?.label || 'Date'}
            <span style={{ fontSize:10 }}>▼</span>
          </button>
          {showDatePicker && (
            <div style={{ position:'absolute', top:'100%', left:0, marginTop:4, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:8, zIndex:100, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', minWidth:200 }}>
              {presets.map(p => (
                <button key={p.id} onClick={() => { setDatePreset(p.id); if (p.id !== 'custom') setShowDatePicker(false); }}
                  style={{ display:'block', width:'100%', padding:'9px 14px', background: datePreset === p.id ? 'var(--orange-dim)' : 'transparent', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight: datePreset === p.id ? 700 : 400, color: datePreset === p.id ? 'var(--orange)' : 'var(--text-primary)', textAlign:'left', fontFamily:"'Outfit',sans-serif", transition:'all .1s' }}>
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
          )}
        </div>

        {/* Sort */}
        <div style={{ position:'relative' }}>
          <button onClick={() => { setShowSortMenu(!showSortMenu); setShowDatePicker(false); }} className="btn-ghost" style={{ padding:'9px 14px', minHeight:40, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            ↕ {lang==='es'?'Ordenar':'Sort'}
            <span style={{ fontSize:10 }}>▼</span>
          </button>
          {showSortMenu && (
            <div style={{ position:'absolute', top:'100%', right:0, marginTop:4, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:8, zIndex:100, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', minWidth:180 }}>
              {sortOptions.map(o => (
                <button key={o.id} onClick={() => { setSortBy(o.id); setShowSortMenu(false); }}
                  style={{ display:'block', width:'100%', padding:'9px 14px', background: sortBy === o.id ? 'var(--orange-dim)' : 'transparent', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight: sortBy === o.id ? 700 : 400, color: sortBy === o.id ? 'var(--orange)' : 'var(--text-primary)', textAlign:'left', fontFamily:"'Outfit',sans-serif", transition:'all .1s' }}>
                  {sortBy === o.id && '✓ '}{o.l}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex:1 }}/>

        {/* Active filter clear */}
        {(datePreset !== 'all' || catFilter !== 'all' || search) && (
          <button onClick={() => { setDatePreset('all'); setCatFilter('all'); setSearch(''); setCustomFrom(''); setCustomTo(''); }} className="btn-ghost" style={{ padding:'9px 14px', minHeight:40, fontSize:12, color:'var(--red)' }}>
            ✕ {lang==='es'?'Limpiar filtros':'Clear filters'}
          </button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display:'flex', gap:5, marginBottom:16, flexWrap:'wrap' }}>
        {chips.map(f => <button key={f.id} onClick={() => setCatFilter(f.id)} className={`filter-chip${catFilter===f.id?' active':''}`}>{f.label}</button>)}
      </div>

      {/* Flagged banner */}
      {flaggedCount > 0 && catFilter === 'all' && datePreset === 'all' && (
        <div className="fu" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'13px 17px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>🚩</span>
          <div>
            <p style={{ fontWeight:700, color:'var(--amber)', fontSize:14, margin:0 }}>{flaggedCount} {lang==='es'?'transacciones necesitan tu atención':'transactions need your attention'}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>{lang==='es'?'Haz clic en la categoría para editarla':'Click any category pill to edit inline'}</p>
          </div>
        </div>
      )}

      {/* Transaction table with daily grouping */}
      <div className="phoenix-card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
              {[lang==='es'?'Fecha':'Date', lang==='es'?'Descripción':'Description', t('category'), lang==='es'?'Monto':'Amount', ''].map((h,i) => (
                <th key={i} style={{ padding:'13px 18px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textAlign: i>=3?'right':'left', letterSpacing:'.07em', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <tr key={'h-'+item.date} style={{ background:'var(--bg)' }}>
                    <td colSpan={4} style={{ padding:'10px 18px 6px', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                      {formatDate(item.date, lang)}
                    </td>
                    <td style={{ textAlign:'right', padding:'10px 18px 6px', fontSize:12, fontWeight:600, color:'var(--text-muted)', fontFamily:"'DM Mono',monospace" }}>
                      {$(Math.abs(item.total), 2)}
                    </td>
                  </tr>
                );
              }
              const txn = item.txn;
              const cat = getCategoryById(txn.categoryId);
              const isTransfer = isTransferCategory(txn.categoryId);
              return (
                <tr key={txn.id} className="txn-row" style={{ borderBottom:'1px solid var(--border)', background: txn.flagged?'rgba(245,158,11,0.03)':'transparent' }}>
                  <td style={{ padding:'11px 18px', fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>{formatDateShort(txn.date, lang)}</td>
                  <td style={{ padding:'11px 18px' }}>
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
                  <td style={{ padding:'11px 18px' }}>
                    {editId === txn.id ? (
                      <select value={txn.categoryId} onChange={e => { updateCategory(txn.id, e.target.value); setEditId(null); }} style={{ fontSize:12, padding:'5px 10px', minHeight:36 }} autoFocus onBlur={() => setEditId(null)}>
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
                  <td style={{ textAlign:'right', padding:'11px 18px', fontWeight:700, fontSize:14, color: isTransfer?'var(--text-muted)':txn.amount>0?'var(--green)':'var(--text-primary)', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>
                    {txn.amount > 0 ? '+' : ''}{$(txn.amount, 2)}
                  </td>
                  <td style={{ textAlign:'right', padding:'11px 18px' }}>
                    <button onClick={() => setEditId(txn.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, padding:'4px 8px', borderRadius:6, minHeight:36, minWidth:36 }}>✏️</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>📭 {t('noData')}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Click outside to close dropdowns */}
      {(showDatePicker || showSortMenu) && <div onClick={() => { setShowDatePicker(false); setShowSortMenu(false); }} style={{ position:'fixed', inset:0, zIndex:50 }}/>}
    </div>
  );
}
