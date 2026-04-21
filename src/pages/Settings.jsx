import { useEffect, useState } from 'react';
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
  const { lang, setLang, theme, setTheme, notifPrefs, updateNotifPref, accountFilter, accountantInvites, inviteAccountant, updateAccountantInvite, revokeAccountantInvite } = useApp();
  const t = useT(lang);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('view');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const isBusiness = accountFilter !== 'personal';
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

      {/* Accountant Access — business only */}
      {isBusiness && (
        <div className="phoenix-card fu4" style={{ marginTop:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{t('accountantAccess')}</h3>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{t('accountantDesc')}</p>

          {/* Invite form */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            <input
              type="email"
              placeholder={t('accountantEmail')}
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteSuccess(false); }}
              style={{ flex:'1 1 200px', padding:'10px 14px', fontSize:14 }}
            />
            <select
              value={invitePermission}
              onChange={e => setInvitePermission(e.target.value)}
              style={{ padding:'10px 14px', fontSize:14, minWidth:130, cursor:'pointer' }}
            >
              <option value="view">{t('viewOnly')}</option>
              <option value="full">{t('fullAccess')}</option>
            </select>
            <button
              className="btn-primary"
              disabled={!inviteEmail || !inviteEmail.includes('@')}
              onClick={() => {
                inviteAccountant(inviteEmail.trim(), invitePermission);
                setInviteEmail('');
                setInviteSuccess(true);
                setTimeout(() => setInviteSuccess(false), 3000);
              }}
              style={{ padding:'10px 20px', fontSize:14 }}
            >
              {t('inviteAccountant')}
            </button>
          </div>

          {inviteSuccess && (
            <div style={{ background:'var(--green-dim)', color:'var(--green)', borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:600, marginBottom:16 }}>
              ✓ {t('inviteSent')}
            </div>
          )}

          {/* Invited accountants list */}
          {accountantInvites.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--text-muted)', fontStyle:'italic' }}>{t('noAccountants')}</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {accountantInvites.map(inv => (
                <div key={inv.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
                  <div style={{ flex:'1 1 200px', minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inv.email}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>
                      {lang === 'es' ? 'Invitado' : 'Invited'} {new Date(inv.invitedAt).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month:'short', day:'numeric' })}
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <select
                      value={inv.permission}
                      onChange={e => updateAccountantInvite(inv.id, { permission: e.target.value })}
                      style={{ padding:'6px 10px', fontSize:12, cursor:'pointer', borderRadius:8 }}
                    >
                      <option value="view">{t('viewOnly')}</option>
                      <option value="full">{t('fullAccess')}</option>
                    </select>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                      background: inv.status === 'active' ? 'var(--green-dim)' : 'var(--orange-dim)',
                      color: inv.status === 'active' ? 'var(--green)' : 'var(--orange)',
                    }}>
                      {inv.status === 'active' ? t('activeInvite') : t('pendingInvite')}
                    </span>
                    {inv.status === 'pending' && (
                      <button className="btn-ghost" onClick={() => updateAccountantInvite(inv.id, { invitedAt: new Date().toISOString() })} style={{ padding:'6px 12px', fontSize:12 }}>
                        {t('resendInvite')}
                      </button>
                    )}
                    <button className="btn-ghost" onClick={() => revokeAccountantInvite(inv.id)} style={{ padding:'6px 12px', fontSize:12, color:'var(--red)', borderColor:'var(--red-dim)' }}>
                      {t('revokeAccess')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
