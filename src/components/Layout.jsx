import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { useLocation, useNavigate } from 'react-router-dom';

export function Layout({ children }) {
  const { theme, setTheme, lang, setLang, setAiOpen, financialData } = useApp();
  const t = useT(lang);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace('/', '') || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '◈' },
    { id: 'accounts', label: t('accounts'), icon: '🏦' },
    { id: 'transactions', label: t('transactions'), icon: '≡', badge: financialData.flaggedCount },
    { id: 'cash-flow', label: t('cashFlow'), icon: '↕' },
    { id: 'reports', label: t('reports'), icon: '◧' },
    { id: 'budget', label: t('budget'), icon: '📊' },
    { id: 'recurring', label: t('recurring'), icon: '🔄' },
    { id: 'rules', label: t('rules'), icon: '⚡' },
    { id: 'settings', label: t('settings'), icon: '⚙️' },
  ];

  const isActive = (id) => path === id || (id === 'dashboard' && path === '');

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)', fontFamily:"'Outfit',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width:230, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh', flexShrink:0 }}>
        <div style={{ padding:'22px 20px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#F97316,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#fff', fontSize:20, boxShadow:'0 4px 14px rgba(249,115,22,0.3)' }}>P</div>
            <div>
              <p style={{ fontWeight:800, color:'var(--text-primary)', fontSize:17, letterSpacing:'-.02em', margin:0 }}>Phoenix</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>Money</p>
            </div>
          </div>
        </div>
        <div style={{ padding:'4px 10px', flex:1 }}>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${isActive(item.id) ? ' active' : ''}`} onClick={() => navigate(`/${item.id}`)}>
              <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background:'#DC2626', color:'#fff', borderRadius:10, fontSize:10, fontWeight:800, padding:'1px 6px' }}>{item.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 10px 20px' }}>
          <div className="nav-item" onClick={() => setAiOpen(true)} style={{ background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.25)', color:'var(--orange)', fontWeight:700, marginBottom:6 }}>
            <span>✨</span>
            <span style={{ flex:1 }}>{t('aiAdvisor')}</span>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#F97316,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:13 }}>S</div>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Sal</p>
              <p style={{ margin:0, fontSize:11, color:'var(--text-muted)' }}>Business Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'0 28px', display:'flex', justifyContent:'space-between', alignItems:'center', height:52, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'stretch', height:'100%' }}>
            {navItems.map(item => (
              <button key={item.id} className={`tab-btn${isActive(item.id) ? ' active' : ''}`} onClick={() => navigate(`/${item.id}`)}>
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* EN / ES */}
            <div style={{ display:'flex', gap:2, padding:3, background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
              {['en','es'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ padding:'4px 12px', minHeight:32, borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: lang === l ? 'var(--orange)' : 'transparent', color: lang === l ? '#fff' : 'var(--text-muted)', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Theme toggle */}
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle theme"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:16, flexShrink:0, transition:'all .15s' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {/* Ask AI */}
            <button className="btn-primary" onClick={() => setAiOpen(true)} style={{ padding:'7px 16px', minHeight:36, fontSize:13, borderRadius:8, boxShadow:'0 4px 14px rgba(249,115,22,0.25)' }}>
              ✨ {t('askAI')}
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>{children}</div>
      </div>
    </div>
  );
}
