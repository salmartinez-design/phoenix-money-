import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { getTopCategories, getSubCategories, getCategoryById, addCategory } from '../data/categories';

function Toggle({ on, onChange }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="toggle-switch" style={{ background: on ? 'var(--orange)' : 'var(--border)' }}>
      <span className="toggle-knob" style={{ left: on ? 22 : 2 }}/>
    </button>
  );
}

export function Settings() {
  const { lang, setLang, theme, setTheme, notifPrefs, updateNotifPref, rules, transactions } = useApp();
  const t = useT(lang);
  const [section, setSection] = useState('profile');
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [catRefresh, setCatRefresh] = useState(0); // force re-render after adding
  useEffect(() => { document.title = lang==='es'?'Ajustes — Phoenix Money':'Settings — Phoenix Money'; }, [lang]);

  const sections = [
    { group: lang==='es'?'Cuenta':'Account', items: [
      { id:'profile', label: lang==='es'?'Perfil':'Profile', icon:'👤' },
      { id:'appearance', label: lang==='es'?'Apariencia':'Appearance', icon:'🎨' },
      { id:'notifications', label: lang==='es'?'Notificaciones':'Notifications', icon:'🔔' },
    ]},
    { group: lang==='es'?'Configuración':'Configuration', items: [
      { id:'categories', label: lang==='es'?'Categorías':'Categories', icon:'📂' },
      { id:'rules-settings', label: lang==='es'?'Reglas':'Rules', icon:'⚡' },
      { id:'data', label: lang==='es'?'Datos':'Data & Export', icon:'💾' },
    ]},
  ];

  const allCategories = getTopCategories();
  const ICONS = ['💰','📈','🏠','🍽','💼','🚗','🏛','🏥','👤','🛍','🎁','👶','🎓','⚡','📱','🔄','📊','🎮','✈️','🔧','💳','🏦','☕','💊','🛡','📎','📣','👥','💸','🅿️','⛽','🛒','🛵','🍔','💡','💧','🔑','🔨','👕','🪑','🖥','❤️','🎀','🧒','⚽','📚','📖','🏖'];
  const COLORS = ['#059669','#7C3AED','#F97316','#F59E0B','#2563EB','#DC2626','#0891B2','#DB2777','#EC4899','#F472B6','#8B5CF6','#6366F1','#64748B'];

  const handleAddSubCategory = (parentId) => {
    if (!newCatName.trim()) return;
    const parent = getCategoryById(parentId);
    const id = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
    addCategory({ id: 'custom-'+id+'-'+Date.now(), name: newCatName.trim(), parentId, color: parent?.color || '#94A3B8', icon: parent?.icon || '◦' });
    setNewCatName('');
    setNewCatParent(null);
    setCatRefresh(n => n+1);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const id = 'custom-group-'+newGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')+'-'+Date.now();
    addCategory({ id, name: newGroupName.trim(), parentId: null, color: COLORS[Math.floor(Math.random()*COLORS.length)], icon: ICONS[Math.floor(Math.random()*ICONS.length)] });
    setNewGroupName('');
    setShowNewGroup(false);
    setCatRefresh(n => n+1);
  };

  // Notification row with grouped sections
  const NotifRow = ({ label, desc, prefKey, extra }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'16px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, paddingRight:20 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{label}</p>
        <p style={{ fontSize:12, color:'var(--text-muted)', margin:'4px 0 0', lineHeight:1.5 }}>{desc}</p>
        {extra}
      </div>
      <Toggle on={notifPrefs[prefKey]} onChange={v => updateNotifPref(prefKey, v)}/>
    </div>
  );

  return (
    <div style={{ padding:'32px 36px' }}>
      <div className="fu" style={{ marginBottom:24 }}>
        <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('settings')}</p>
        <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('preferences')}</h2>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24 }}>
        {/* Sidebar */}
        <div>
          {sections.map(group => (
            <div key={group.group} style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)', padding:'0 14px', marginBottom:6 }}>{group.group}</p>
              {group.items.map(item => (
                <div key={item.id} onClick={() => setSection(item.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, cursor:'pointer', marginBottom:2, background: section===item.id?'var(--orange-dim)':'transparent', color: section===item.id?'var(--orange)':'var(--text-secondary)', fontWeight: section===item.id?700:400, fontSize:14, transition:'all .15s', border: section===item.id?'1px solid rgba(249,115,22,0.25)':'1px solid transparent' }}>
                  <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ maxWidth:640 }}>

          {/* Profile */}
          {section === 'profile' && (
            <div className="phoenix-card fu1">
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>{lang==='es'?'Perfil':'Profile'}</h3>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:16, background:'var(--bg)', borderRadius:12 }}>
                <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#F97316,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#fff', fontSize:24 }}>S</div>
                <div>
                  <p style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', margin:0 }}>Sal Martinez</p>
                  <p style={{ fontSize:13, color:'var(--text-muted)', margin:'2px 0 0' }}>PHES LLC</p>
                </div>
              </div>
              {[{l:lang==='es'?'Nombre':'Display Name',v:'Sal'},{l:lang==='es'?'Empresa':'Business Name',v:'PHES LLC'}].map(f => (
                <div key={f.l} style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>{f.l}</label>
                  <input defaultValue={f.v} style={{ width:'100%', padding:'12px 14px', fontSize:14, minHeight:44 }}/>
                </div>
              ))}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>{lang==='es'?'Zona horaria':'Timezone'}</label>
                <select defaultValue="America/Chicago" style={{ width:'100%', padding:'12px 14px', fontSize:14, minHeight:44 }}>
                  <option value="America/New_York">Eastern (New York)</option>
                  <option value="America/Chicago">Central (Chicago)</option>
                  <option value="America/Denver">Mountain (Denver)</option>
                  <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                </select>
              </div>
            </div>
          )}

          {/* Appearance */}
          {section === 'appearance' && (
            <div className="phoenix-card fu1">
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:20 }}>{lang==='es'?'Apariencia':'Appearance'}</h3>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>{lang==='es'?'Tema':'Theme'}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:24 }}>
                {[{id:'light',label:t('light'),icon:'☀️'},{id:'dark',label:t('dark'),icon:'🌙'},{id:'system',label:t('system'),icon:'💻'}].map(opt => (
                  <button key={opt.id} onClick={() => opt.id==='system'?setTheme(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):setTheme(opt.id)}
                    style={{ padding:'20px 16px', borderRadius:12, cursor:'pointer', border: theme===opt.id?'2px solid var(--orange)':'1px solid var(--border)', background: theme===opt.id?'var(--orange-dim)':'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, fontFamily:"'Outfit',sans-serif" }}>
                    <span style={{ fontSize:28 }}>{opt.icon}</span>
                    <span style={{ fontSize:14, fontWeight: theme===opt.id?700:400, color: theme===opt.id?'var(--orange)':'var(--text-secondary)' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>{t('language')}</p>
              <div style={{ display:'flex', gap:10 }}>
                {[{code:'en',label:'🇺🇸 English'},{code:'es',label:'🇲🇽 Español'}].map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)} style={{ padding:'12px 28px', minHeight:48, borderRadius:10, cursor:'pointer', fontSize:15, fontWeight:600, border: lang===l.code?'2px solid var(--orange)':'1px solid var(--border)', background: lang===l.code?'var(--orange-dim)':'transparent', color: lang===l.code?'var(--orange)':'var(--text-secondary)', fontFamily:"'Outfit',sans-serif" }}>{l.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Notifications — grouped like Monarch */}
          {section === 'notifications' && (
            <div className="phoenix-card fu1">
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{lang==='es'?'Notificaciones':'Notifications'}</h3>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>{lang==='es'?'Controla qué alertas recibes.':'Control which alerts you receive.'}</p>

              {/* Accounts */}
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', padding:'12px 0 4px', borderTop:'1px solid var(--border)' }}>{lang==='es'?'Cuentas':'Accounts'}</p>
              <NotifRow label={lang==='es'?'Cuenta en negativo':'Negative balance alert'} desc={lang==='es'?'Recibe una alerta cuando una cuenta se ponga en negativo.':'Get alerted when any account balance goes negative.'} prefKey="negativeBalance"/>

              {/* Transactions */}
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', padding:'12px 0 4px' }}>{lang==='es'?'Transacciones':'Transactions'}</p>
              <NotifRow label={lang==='es'?'Depósito grande':'Deposit alert'} desc={lang==='es'?'Recibe una alerta cuando se detecte un depósito mayor al monto que especifiques.':'Get alerted when a deposit above your threshold is detected.'}
                prefKey="largeTransaction" extra={notifPrefs.largeTransaction && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{lang==='es'?'Monto mínimo:':'Minimum Amount:'}</span>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>$</span>
                    <input type="number" min="1" value={notifPrefs.largeTransactionThreshold} onChange={e => updateNotifPref('largeTransactionThreshold', Number(e.target.value))} style={{ width:80, padding:'5px 10px', borderRadius:8, fontSize:14, fontFamily:"'DM Mono',monospace", textAlign:'center' }}/>
                  </div>
                )}/>
              <NotifRow label={lang==='es'?'Transacciones sin categoría':'Uncategorized pile-up'} desc={lang==='es'?'Recibe una alerta cuando se acumulen transacciones sin categoría.':'Get alerted when uncategorized transactions pile up.'}
                prefKey="uncategorizedPileup" extra={notifPrefs.uncategorizedPileup && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{lang==='es'?'Umbral:':'Threshold:'}</span>
                    <input type="number" min="1" value={notifPrefs.uncategorizedThreshold} onChange={e => updateNotifPref('uncategorizedThreshold', Number(e.target.value))} style={{ width:60, padding:'5px 10px', borderRadius:8, fontSize:14, fontFamily:"'DM Mono',monospace", textAlign:'center' }}/>
                    <span style={{ fontSize:13, color:'var(--text-muted)' }}>{t('transactions_count')}</span>
                  </div>
                )}/>

              {/* Budget */}
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', padding:'12px 0 4px' }}>{lang==='es'?'Presupuesto':'Budget'}</p>
              <NotifRow label={lang==='es'?'Presupuesto excedido':'Budget exceeded'} desc={lang==='es'?'Recibirás una alerta cuando excedas tu presupuesto en cualquier categoría.':'Get notified when you exceed your budget in any category.'} prefKey="weeklySummary"/>

              {/* Summaries */}
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', padding:'12px 0 4px' }}>{lang==='es'?'Resúmenes':'Summaries'}</p>
              <NotifRow label={lang==='es'?'Resumen semanal':'Weekly summary'} desc={lang==='es'?'Recibe un resumen semanal de tu flujo de caja.':'Get a weekly summary of your cash flow.'} prefKey="weeklySummary"/>
              <NotifRow label={lang==='es'?'Resumen mensual P&G':'Monthly P&L summary'} desc={lang==='es'?'Recibe un resumen mensual de pérdidas y ganancias.':'Get a monthly profit and loss summary.'} prefKey="monthlySummary"/>
            </div>
          )}

          {/* Categories — editable like Monarch */}
          {section === 'categories' && (
            <div className="phoenix-card fu1" key={catRefresh}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{lang==='es'?'Categorías':'Categories'}</h3>
                <button className="btn-primary" onClick={() => setShowNewGroup(true)} style={{ padding:'8px 16px', minHeight:36, fontSize:13 }}>
                  + {lang==='es'?'Crear grupo':'Create group'}
                </button>
              </div>
              <div style={{ background:'var(--blue-dim)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, marginTop:12 }}>
                <p style={{ fontSize:13, color:'var(--blue)', lineHeight:1.5 }}>
                  ℹ️ {lang==='es'?'Los cambios a tus categorías se aplican en toda la app. Personaliza la estructura a tu medida.':'Changes to your categories apply throughout Phoenix. Customize the structure to fit your needs.'}
                </p>
              </div>

              {showNewGroup && (
                <div style={{ display:'flex', gap:8, marginBottom:16, padding:'12px 14px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={lang==='es'?'Nombre del grupo':'Group name'} style={{ flex:1, padding:'8px 12px', fontSize:14, minHeight:36 }} autoFocus onKeyDown={e => e.key==='Enter' && handleAddGroup()}/>
                  <button className="btn-primary" onClick={handleAddGroup} style={{ padding:'8px 16px', minHeight:36, fontSize:13 }}>{lang==='es'?'Crear':'Create'}</button>
                  <button className="btn-ghost" onClick={() => { setShowNewGroup(false); setNewGroupName(''); }} style={{ padding:'8px 12px', minHeight:36, fontSize:13 }}>{lang==='es'?'Cancelar':'Cancel'}</button>
                </div>
              )}

              {/* Income groups */}
              <p style={{ fontSize:13, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', padding:'8px 0', marginBottom:4 }}>{lang==='es'?'Ingresos':'Income'}</p>
              {allCategories.filter(c => c.id !== 'uncategorized' && (c.id === 'income' || c.id === 'investments')).map(parent => {
                const subs = getSubCategories(parent.id);
                return (
                  <div key={parent.id} style={{ marginBottom:16, background:'var(--bg)', borderRadius:12, padding:'2px 0', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:16 }}>{parent.icon}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{parent.name}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>Edit</span>
                    </div>
                    {subs.map(sub => (
                      <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px 10px 44px', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ fontSize:14 }}>{sub.icon}</span>
                        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{sub.name}</span>
                      </div>
                    ))}
                    {newCatParent === parent.id ? (
                      <div style={{ display:'flex', gap:8, padding:'10px 16px 10px 44px' }}>
                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder={lang==='es'?'Nombre de categoría':'Category name'} style={{ flex:1, padding:'6px 10px', fontSize:13, minHeight:32 }} autoFocus onKeyDown={e => e.key==='Enter' && handleAddSubCategory(parent.id)}/>
                        <button className="btn-primary" onClick={() => handleAddSubCategory(parent.id)} style={{ padding:'6px 12px', minHeight:32, fontSize:12 }}>+</button>
                        <button className="btn-ghost" onClick={() => { setNewCatParent(null); setNewCatName(''); }} style={{ padding:'6px 10px', minHeight:32, fontSize:12 }}>✕</button>
                      </div>
                    ) : (
                      <div onClick={() => setNewCatParent(parent.id)} style={{ padding:'10px 16px 10px 44px', cursor:'pointer', color:'var(--orange)', fontSize:13, fontWeight:600 }}>
                        + {lang==='es'?'Crear Categoría':'Create Category'}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Expense groups */}
              <p style={{ fontSize:13, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', padding:'12px 0 4px', marginTop:8 }}>{lang==='es'?'Gastos':'Expenses'}</p>
              {allCategories.filter(c => c.id !== 'uncategorized' && c.id !== 'income' && c.id !== 'investments' && c.id !== 'transfers').map(parent => {
                const subs = getSubCategories(parent.id);
                return (
                  <div key={parent.id} style={{ marginBottom:12, background:'var(--bg)', borderRadius:12, padding:'2px 0', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:16 }}>{parent.icon}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{parent.name}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>Edit</span>
                    </div>
                    {subs.map(sub => (
                      <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px 10px 44px', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ fontSize:14 }}>{sub.icon}</span>
                        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{sub.name}</span>
                      </div>
                    ))}
                    {newCatParent === parent.id ? (
                      <div style={{ display:'flex', gap:8, padding:'10px 16px 10px 44px' }}>
                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder={lang==='es'?'Nombre de categoría':'Category name'} style={{ flex:1, padding:'6px 10px', fontSize:13, minHeight:32 }} autoFocus onKeyDown={e => e.key==='Enter' && handleAddSubCategory(parent.id)}/>
                        <button className="btn-primary" onClick={() => handleAddSubCategory(parent.id)} style={{ padding:'6px 12px', minHeight:32, fontSize:12 }}>+</button>
                        <button className="btn-ghost" onClick={() => { setNewCatParent(null); setNewCatName(''); }} style={{ padding:'6px 10px', minHeight:32, fontSize:12 }}>✕</button>
                      </div>
                    ) : (
                      <div onClick={() => setNewCatParent(parent.id)} style={{ padding:'10px 16px 10px 44px', cursor:'pointer', color:'var(--orange)', fontSize:13, fontWeight:600 }}>
                        + {lang==='es'?'Crear Categoría':'Create Category'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Rules */}
          {section === 'rules-settings' && (
            <div className="phoenix-card fu1">
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{lang==='es'?'Reglas de Categorización':'Categorization Rules'}</h3>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>{rules.length} {lang==='es'?'reglas activas. Edita las reglas en la página de Reglas.':'active rules. Edit rules on the Rules page.'}</p>
              <div style={{ maxHeight:500, overflowY:'auto' }}>
                {rules.map(rule => {
                  const cat = getCategoryById(rule.categoryId);
                  return (
                    <div key={rule.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                      <code style={{ fontFamily:"'DM Mono',monospace", background:'var(--bg)', padding:'4px 10px', borderRadius:6, fontSize:12, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>"{rule.match}"</code>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>→</span>
                      <span style={{ fontSize:12, color: cat?.color||'#94A3B8', fontWeight:600 }}>{cat?.icon} {cat?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data & Export */}
          {section === 'data' && (
            <div className="phoenix-card fu1">
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:20 }}>{lang==='es'?'Datos y Exportar':'Data & Export'}</h3>
              {[
                { label: lang==='es'?'Transacciones':'Transactions', sub: `${transactions.length} ${t('transactions_count')}`, action: () => {
                  const csv = ['Date,Description,Amount,Category,Merchant,Account'].concat(transactions.map(t => `${t.date},"${t.description}",${t.amount},${t.categoryId},"${t.merchantName}",${t.accountId}`)).join('\n');
                  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='phoenix-transactions.csv'; a.click();
                }, btn: '⬇ CSV' },
                { label: lang==='es'?'Reglas':'Rules', sub: `${rules.length} ${lang==='es'?'reglas':'rules'}`, action: () => {
                  const json = JSON.stringify(rules,null,2); const blob = new Blob([json], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='phoenix-rules.json'; a.click();
                }, btn: '⬇ JSON' },
              ].map(item => (
                <div key={item.label} style={{ padding:16, background:'var(--bg)', borderRadius:12, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{item.label}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>{item.sub}</p>
                  </div>
                  <button className="btn-ghost" onClick={item.action} style={{ padding:'8px 16px', minHeight:36, fontSize:13 }}>{item.btn}</button>
                </div>
              ))}
              <div style={{ padding:16, background:'var(--red-dim)', borderRadius:12, border:'1px solid rgba(220,38,38,0.2)', marginTop:8 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--red)', margin:'0 0 4px' }}>{lang==='es'?'Zona de peligro':'Danger zone'}</p>
                <p style={{ fontSize:12, color:'var(--text-muted)', margin:'0 0 12px' }}>{lang==='es'?'Borrar todos los datos. No se puede deshacer.':'Erase all data. Cannot be undone.'}</p>
                <button className="btn-ghost" onClick={() => { if (window.confirm(lang==='es'?'¿Estás seguro?':'Are you sure?')) { localStorage.clear(); window.location.reload(); }}} style={{ padding:'8px 16px', minHeight:36, fontSize:13, color:'var(--red)', borderColor:'var(--red)' }}>🗑 {lang==='es'?'Borrar todo':'Clear everything'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
