import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';

function Toggle({ on, onChange }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="toggle-switch" style={{ background: on ? 'var(--orange)' : 'var(--border)' }}>
      <span className="toggle-knob" style={{ left: on ? 22 : 2 }}/>
    </button>
  );
}

function Row({ label, desc, value, onChange, extra }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, paddingRight:24 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{label}</p>
        {desc && <p style={{ fontSize:12, color:'var(--text-muted)', margin:'3px 0 0' }}>{desc}</p>}
        {extra}
      </div>
      <Toggle on={value} onChange={onChange}/>
    </div>
  );
}

export function Settings() {
  const { lang, setLang, theme, setTheme, notifPrefs, updateNotifPref } = useApp();
  const t = useT(lang);
  useEffect(() => { document.title = lang==='es'?'Ajustes — Phoenix Money':'Settings — Phoenix Money'; }, [lang]);

  return (
    <div style={{ padding:'32px 36px', maxWidth:680 }}>
      <div className="fu" style={{ marginBottom:32 }}>
        <p style={{ fontSize:12, color:'var(--orange)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('settings')}</p>
        <h2 style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-.02em' }}>{t('preferences')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:6 }}>{t('allChangesSaved')}</p>
      </div>

      {/* Appearance */}
      <div className="phoenix-card fu1" style={{ marginBottom:16 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('appearance')}</h3>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{lang==='es'?'Personaliza cómo se ve Phoenix.':'Customize how Phoenix looks on your device.'}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[{id:'light',label:t('light'),icon:'☀️'},{id:'dark',label:t('dark'),icon:'🌙'},{id:'system',label:t('system'),icon:'💻'}].map(opt => (
            <button key={opt.id}
              onClick={() => opt.id === 'system' ? setTheme(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light') : setTheme(opt.id)}
              style={{ padding:'16px', borderRadius:12, cursor:'pointer', border: theme===opt.id?'2px solid var(--orange)':'1px solid var(--border)', background: theme===opt.id?'var(--orange-dim)':'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>
              <span style={{ fontSize:24 }}>{opt.icon}</span>
              <span style={{ fontSize:14, fontWeight: theme===opt.id?700:400, color: theme===opt.id?'var(--orange)':'var(--text-secondary)' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="phoenix-card fu2" style={{ marginBottom:16 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('language')}</h3>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>{t('appLanguage')}</p>
        <div style={{ display:'flex', gap:10 }}>
          {[{code:'en',label:'🇺🇸 English'},{code:'es',label:'🇲🇽 Español'}].map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              style={{ padding:'10px 24px', minHeight:44, borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600, border: lang===l.code?'2px solid var(--orange)':'1px solid var(--border)', background: lang===l.code?'var(--orange-dim)':'transparent', color: lang===l.code?'var(--orange)':'var(--text-secondary)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="phoenix-card fu3">
        <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('notifications')}</h3>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>{lang==='es'?'Controla qué alertas recibes.':'Control which alerts you receive.'}</p>
        <Row label={t('negBalAlert')} desc={t('negBalDesc')} value={notifPrefs.negativeBalance} onChange={v => updateNotifPref('negativeBalance', v)}/>
        <Row label={t('largeTransAlert')} desc={t('largeTransDesc')} value={notifPrefs.largeTransaction} onChange={v => updateNotifPref('largeTransaction', v)}
          extra={notifPrefs.largeTransaction && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>$</span>
              <input type="number" min="1" value={notifPrefs.largeTransactionThreshold} onChange={e => updateNotifPref('largeTransactionThreshold', Number(e.target.value))} style={{ width:80, padding:'5px 10px', borderRadius:8, fontSize:14, fontFamily:"'DM Mono',monospace", textAlign:'center' }}/>
            </div>
          )}/>
        <Row label={t('uncatPileup')} desc={t('uncatDesc')} value={notifPrefs.uncategorizedPileup} onChange={v => updateNotifPref('uncategorizedPileup', v)}
          extra={notifPrefs.uncategorizedPileup && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <input type="number" min="1" value={notifPrefs.uncategorizedThreshold} onChange={e => updateNotifPref('uncategorizedThreshold', Number(e.target.value))} style={{ width:80, padding:'5px 10px', borderRadius:8, fontSize:14, fontFamily:"'DM Mono',monospace", textAlign:'center' }}/>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{t('transactions_count')}</span>
            </div>
          )}/>
        <Row label={t('weeklySummary')} desc={t('weeklyDesc')} value={notifPrefs.weeklySummary} onChange={v => updateNotifPref('weeklySummary', v)}/>
        <Row label={t('monthlySummary')} desc={t('monthlyDesc')} value={notifPrefs.monthlySummary} onChange={v => updateNotifPref('monthlySummary', v)}/>
      </div>
    </div>
  );
}
