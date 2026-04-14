import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatDate } from '../utils/format';
import { getCategoryById, getTopCategories, getSubCategories } from '../data/categories';

export function TransactionDetail({ txn, onClose }) {
  const { updateCategory, updateTransaction, lang, accountFilter } = useApp();
  const t = useT(lang);
  const $ = (n, d=0) => formatCurrency(n, lang, d);
  const [notes, setNotes] = useState(txn?.notes || '');
  const [catId, setCatId] = useState(txn?.categoryId || 'uncategorized');

  useEffect(() => {
    if (txn) {
      setNotes(txn.notes || '');
      setCatId(txn.categoryId);
    }
  }, [txn]);

  if (!txn) return null;

  const cat = getCategoryById(txn.categoryId);
  const isIncome = txn.amount > 0;

  const handleSaveNotes = () => {
    updateTransaction(txn.id, { notes });
  };

  const handleCategoryChange = (newCatId) => {
    setCatId(newCatId);
    updateCategory(txn.id, newCatId);
  };

  const handleMarkReviewed = () => {
    updateTransaction(txn.id, { flagged: false });
  };

  return (
    <div style={{ position:'fixed', right:0, top:0, bottom:0, width:420, background:'var(--surface)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:999, boxShadow:'-8px 0 40px rgba(0,0,0,0.15)', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8 }}>
          {txn.flagged && (
            <button className="btn-primary" onClick={handleMarkReviewed} style={{ padding:'6px 14px', minHeight:34, fontSize:12, borderRadius:8 }}>
              ✓ {lang==='es'?'Marcar revisado':'Mark as reviewed'}
            </button>
          )}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:22, lineHeight:1, padding:'4px 8px', borderRadius:6 }}>×</button>
      </div>

      {/* Merchant + Amount */}
      <div style={{ padding:'24px 20px', textAlign:'center', borderBottom:'1px solid var(--border)' }}>
        <div style={{ width:56, height:56, borderRadius:14, background:(cat?.color||'#94A3B8')+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>{cat?.icon||'◦'}</div>
        <p style={{ fontSize:28, fontWeight:800, color: isIncome ? 'var(--green)' : 'var(--text-primary)', fontFamily:"'DM Mono',monospace", letterSpacing:'-.02em', margin:'0 0 4px' }}>
          {isIncome ? '+' : ''}{$(txn.amount, 2)}
        </p>
        <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>{txn.accountId?.replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
      </div>

      {/* Merchant name */}
      <div style={{ padding:'20px 20px 0' }}>
        <p style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', margin:'0 0 4px' }}>{txn.merchantName || txn.description.slice(0,30)}</p>
        {txn.merchantName && txn.merchantName !== txn.description && (
          <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>{lang==='es'?'Ver':'View'} {lang==='es'?'transacciones de':'transactions from'} {txn.merchantName}</p>
        )}
      </div>

      {/* Original statement */}
      <div style={{ padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{lang==='es'?'Descripción original':'Original Statement'}</p>
        <p style={{ fontSize:13, color:'var(--text-secondary)', background:'var(--bg)', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', fontFamily:"'DM Mono',monospace", wordBreak:'break-all', lineHeight:1.5 }}>{txn.description}</p>
      </div>

      {/* Date */}
      <div style={{ padding:'0 20px 16px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{lang==='es'?'Fecha':'Date'}</p>
        <p style={{ fontSize:14, color:'var(--text-primary)' }}>{formatDate(txn.date, lang)}</p>
      </div>

      {/* Category */}
      <div style={{ padding:'0 20px 16px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{t('category')}</p>
        <select value={catId} onChange={e => handleCategoryChange(e.target.value)} style={{ width:'100%', padding:'10px 14px', fontSize:14, minHeight:44 }}>
          {getTopCategories(accountFilter).map(parent => (
            <optgroup key={parent.id} label={parent.name}>
              {getSubCategories(parent.id, accountFilter).map(sub => (
                <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div style={{ padding:'0 20px 16px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{lang==='es'?'Notas':'Notes'}</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder={lang==='es'?'Agregar notas a esta transacción...':'Add notes to this transaction...'}
          style={{ width:'100%', padding:'10px 14px', fontSize:14, minHeight:80, resize:'vertical', borderRadius:10, fontFamily:"'Outfit',sans-serif" }}
        />
      </div>

      {/* Tags */}
      <div style={{ padding:'0 20px 16px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Tags</p>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(txn.tags || []).map((tag, i) => (
            <span key={i} style={{ padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:'var(--orange-dim)', color:'var(--orange)', border:'1px solid rgba(249,115,22,0.25)' }}>{tag}</span>
          ))}
          <button className="btn-ghost" style={{ padding:'4px 10px', borderRadius:20, fontSize:12 }}>+ {lang==='es'?'Agregar':'Add'}</button>
        </div>
      </div>

      {/* Transaction details */}
      <div style={{ padding:'0 20px 16px', borderTop:'1px solid var(--border)', marginTop:8, paddingTop:16 }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>{lang==='es'?'Detalles':'Details'}</p>
        {[
          { l: lang==='es'?'Cuenta':'Account', v: txn.accountId?.replace(/-/g,' ') },
          { l: lang==='es'?'Tipo':'Type', v: txn.accountType === 'business' ? (lang==='es'?'Negocio':'Business') : 'Personal' },
          { l: 'ID', v: txn.id },
        ].map(d => (
          <div key={d.l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13 }}>
            <span style={{ color:'var(--text-muted)' }}>{d.l}</span>
            <span style={{ color:'var(--text-secondary)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>{d.v}</span>
          </div>
        ))}
      </div>

      {/* Delete */}
      <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border)', marginTop:'auto' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>{lang==='es'?'Otras opciones':'Other Options'}</p>
        <button onClick={() => { if (window.confirm(lang==='es'?'¿Eliminar esta transacción?':'Delete this transaction?')) { updateTransaction(txn.id, { _deleted: true }); onClose(); } }} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:14, fontWeight:600, padding:'8px 0', fontFamily:"'Outfit',sans-serif" }}>
          {lang==='es'?'Eliminar transacción':'Delete transaction'}
        </button>
      </div>
    </div>
  );
}
