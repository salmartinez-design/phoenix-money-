import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';

const PRIMARY_TABS = [
  { id: 'dashboard',    icon: '◈',  labelKey: 'dashboard' },
  { id: 'transactions', icon: '≡',  labelKey: 'transactions', badge: true },
  { id: 'cash-flow',    icon: '↕',  labelKey: 'cashFlow' },
  { id: 'budget',       icon: '📊', labelKey: 'budget' },
  { id: 'more',         icon: '•••', labelKey: 'more' },
];

const MORE_TABS = [
  { id: 'accounts',  icon: '🏦', labelKey: 'accounts' },
  { id: 'reports',   icon: '◧',  labelKey: 'reports' },
  { id: 'recurring', icon: '🔄', labelKey: 'recurring' },
  { id: 'rules',     icon: '⚡', labelKey: 'rules' },
  { id: 'settings',  icon: '⚙️', labelKey: 'settings' },
];

export function MobileNav() {
  const { lang, financialData, setAiOpen } = useApp();
  const t = useT(lang);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace('/', '') || 'dashboard';

  const isActive = (id) => path === id || (id === 'dashboard' && path === '');
  const isMoreActive = MORE_TABS.some(tab => tab.id === path);

  const handleTab = (id) => {
    if (id === 'more') {
      const overlay = document.getElementById('phoenix-more-sheet');
      if (overlay) {
        overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
      }
      return;
    }
    const overlay = document.getElementById('phoenix-more-sheet');
    if (overlay) overlay.style.display = 'none';
    navigate(`/${id}`);
  };

  const moreLabel = lang === 'es' ? 'Más' : 'More';

  return (
    <>
      <nav className="mobile-nav" aria-label="Main navigation">
        {PRIMARY_TABS.map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-item${isActive(tab.id) || (tab.id === 'more' && isMoreActive) ? ' active' : ''}`}
            onClick={() => handleTab(tab.id)}
            aria-label={tab.id === 'more' ? moreLabel : t(tab.labelKey)}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              {tab.icon}
              {tab.badge && financialData.flaggedCount > 0 && (
                <span className="nav-badge">{financialData.flaggedCount}</span>
              )}
            </span>
            <span>{tab.id === 'more' ? moreLabel : t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div
        id="phoenix-more-sheet"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          flexDirection: 'column',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 16px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
          }
        }}
      >
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px', flexShrink: 0 }} />

        <button
          onClick={() => {
            document.getElementById('phoenix-more-sheet').style.display = 'none';
            setAiOpen(true);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', borderRadius: 14, border: 'none', width: '100%',
            background: 'var(--orange-dim)', color: 'var(--orange)',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 22 }}>✨</span>
          <span>{t('aiAdvisor')}</span>
          <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
        </button>

        {MORE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              document.getElementById('phoenix-more-sheet').style.display = 'none';
              navigate(`/${tab.id}`);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14, border: 'none', width: '100%',
              background: isActive(tab.id) ? 'var(--orange-dim)' : 'transparent',
              color: isActive(tab.id) ? 'var(--orange)' : 'var(--text-primary)',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span>{t(tab.labelKey)}</span>
            {isActive(tab.id) && <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)' }} />}
          </button>
        ))}
      </div>
    </>
  );
}
