import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency } from '../utils/format';

const typeColors = { cash: 'var(--green)', credit: 'var(--red)', loan: 'var(--red)' };
const typeIcons = { cash: '#22C55E', credit: '#EF4444', loan: '#F59E0B' };

function MiniSpark({ data, color }) {
  const id = `ms${Math.random().toString(36).slice(2,8)}`;
  return (
    <ResponsiveContainer width={100} height={40}>
      <AreaChart data={data} margin={{ top:2, right:2, bottom:2, left:2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={.3}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

const NwTip = ({ active, payload, label, lang }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'#fff', marginBottom:4 }}>{label}</p>
      <p style={{ color: payload[0].value >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
        {formatCurrency(payload[0].value, lang)}
      </p>
    </div>
  );
};

export function Accounts() {
  const { accounts, financialData, lang } = useApp();
  const t = useT(lang);
  const $ = (n, d=0) => formatCurrency(n, lang, d);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    document.title = lang === 'es' ? 'Cuentas — Phoenix Money' : 'Accounts — Phoenix Money';
  }, [lang]);

  const { accountSummaries = {}, accountBalances = {} } = financialData;

  // Build monthly net worth data from all account summaries
  const netWorthData = useMemo(() => {
    const monthMap = {};
    Object.values(accountSummaries).forEach(summary => {
      if (!summary.monthlyBalances) return;
      Object.entries(summary.monthlyBalances).forEach(([month, bal]) => {
        monthMap[month] = (monthMap[month] || 0) + bal;
      });
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [y, m] = month.split('-');
        const short = new Date(+y, +m - 1).toLocaleString(lang === 'es' ? 'es' : 'en', { month: 'short' });
        return { month: `${short} ${y.slice(2)}`, v: total };
      });
  }, [accountSummaries, lang]);

  const totalNetWorth = Object.values(accountBalances).reduce((s, b) => s + b, 0);
  const nwFirst = netWorthData[0]?.v ?? 0;
  const nwLast = netWorthData[netWorthData.length - 1]?.v ?? totalNetWorth;
  const nwChange = nwLast - nwFirst;
  const nwPositiveTrend = nwChange >= 0;

  // Compute totals by type
  const accountsWithBalances = (accounts || []).map(acc => ({
    ...acc,
    balance: accountBalances[acc.id] ?? 0,
    summary: accountSummaries[acc.id],
  }));

  const totalAssets = accountsWithBalances
    .filter(a => a.type === 'cash' && a.balance > 0)
    .reduce((s, a) => s + a.balance, 0);

  const totalLiabilities = accountsWithBalances
    .filter(a => a.type === 'credit' || a.type === 'loan')
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  // Filter accounts
  const filtered = filterType === 'all'
    ? accountsWithBalances
    : accountsWithBalances.filter(a => a.type === filterType);

  // Group by type
  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(a => {
      if (!map[a.type]) map[a.type] = [];
      map[a.type].push(a);
    });
    return map;
  }, [filtered]);

  const typeLabel = { cash: lang === 'es' ? 'Efectivo' : 'Cash', credit: lang === 'es' ? 'Tarjetas de Cr\u00e9dito' : 'Credit Cards', loan: lang === 'es' ? 'Pr\u00e9stamos' : 'Loans' };
  const typeOrder = ['cash', 'credit', 'loan'];

  const chipStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${active ? 'var(--orange)' : 'var(--border)'}`,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    background: active ? 'var(--orange-dim, rgba(249,115,22,.12))' : 'transparent',
    color: active ? 'var(--orange)' : 'var(--text-muted)',
    fontFamily: "'Outfit',sans-serif",
    transition: 'all .15s',
  });

  const gradientId = 'nwGrad';

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            {t('accounts') || 'ACCOUNTS'}
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.02em' }}>
            {t('accounts') || 'Accounts'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t('accountsSubtitle') || (lang === 'es' ? 'Todas tus cuentas en un solo lugar' : 'All your accounts in one place')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'all', label: lang === 'es' ? 'Todas' : 'All' },
            { id: 'cash', label: lang === 'es' ? 'Efectivo' : 'Cash' },
            { id: 'credit', label: lang === 'es' ? 'Tarjetas' : 'Credit Cards' },
            { id: 'loan', label: lang === 'es' ? 'Pr\u00e9stamos' : 'Loans' },
          ].map(f => (
            <button key={f.id} className="filter-chip" onClick={() => setFilterType(f.id)} style={chipStyle(filterType === f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Net Worth Hero Card */}
      <div className="phoenix-card fu1" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              {t('netWorth') || (lang === 'es' ? 'Patrimonio Neto' : 'Net Worth')}
            </p>
            <p style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 6 }}>
              {$(totalNetWorth)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: nwPositiveTrend ? 'var(--green-dim)' : 'var(--red-dim)',
                color: nwPositiveTrend ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${nwPositiveTrend ? 'var(--green)' : 'var(--red)'}30`,
              }}>
                {nwPositiveTrend ? '+' : ''}{$(nwChange)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {lang === 'es' ? 'desde el primer mes' : 'since first month'}
              </span>
            </div>
          </div>
        </div>
        {netWorthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={netWorthData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={nwPositiveTrend ? 'var(--green)' : 'var(--blue)'} stopOpacity={.25}/>
                  <stop offset="100%" stopColor={nwPositiveTrend ? 'var(--green)' : 'var(--blue)'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="month" fontSize={12} tick={{ fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false}/>
              <YAxis fontSize={11} tick={{ fill: 'var(--chart-axis)' }} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} axisLine={false} tickLine={false} width={50}/>
              <Tooltip content={<NwTip lang={lang}/>}/>
              <Area type="monotone" dataKey="v" stroke={nwPositiveTrend ? 'var(--green)' : 'var(--blue)'} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No data available
          </div>
        )}
      </div>

      {/* Summary Row: Assets + Liabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <div className="phoenix-card fu1">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            {lang === 'es' ? 'Activos' : 'Assets'}
          </p>
          <p style={{ fontSize: 27, fontWeight: 800, color: 'var(--green)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
            {$(totalAssets)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {accountsWithBalances.filter(a => a.type === 'cash' && a.balance > 0).length} {lang === 'es' ? 'cuentas' : 'accounts'}
          </p>
        </div>
        <div className="phoenix-card fu2">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            {lang === 'es' ? 'Pasivos' : 'Liabilities'}
          </p>
          <p style={{ fontSize: 27, fontWeight: 800, color: 'var(--red)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
            {$(totalLiabilities)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {accountsWithBalances.filter(a => a.type === 'credit' || a.type === 'loan').length} {lang === 'es' ? 'cuentas' : 'accounts'}
          </p>
        </div>
      </div>

      {/* Account Sections grouped by type */}
      {typeOrder.filter(type => groups[type]?.length).map(type => {
        const accs = groups[type];
        const groupTotal = accs.reduce((s, a) => s + a.balance, 0);
        return (
          <div key={type} className="fu1" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {typeLabel[type]}
              </h3>
              <span style={{ fontSize: 14, fontWeight: 700, color: typeColors[type], fontFamily: "'DM Mono',monospace" }}>
                {type === 'cash' ? $(groupTotal) : $(Math.abs(groupTotal))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {accs.map(acc => {
                const isNeg = acc.balance < 0;
                const sparkData = acc.summary?.monthlyBalances
                  ? Object.entries(acc.summary.monthlyBalances)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([, v]) => ({ v }))
                  : [];
                const sparkColor = type === 'cash' ? 'var(--green)' : type === 'credit' ? 'var(--red)' : 'var(--amber)';
                const circleColor = type === 'cash' ? '#22C55E' : type === 'credit' ? '#EF4444' : '#F59E0B';

                return (
                  <div key={acc.id} className="phoenix-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', transition: 'box-shadow .15s' }}>
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: circleColor + '1A',
                      border: `1px solid ${circleColor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: circleColor,
                      flexShrink: 0,
                    }}>
                      {(acc.institution || acc.name || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Institution */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.name}
                      </p>
                      {acc.institution && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {acc.institution}
                        </p>
                      )}
                    </div>

                    {/* Sparkline */}
                    {sparkData.length > 1 && (
                      <div style={{ width: 100, flexShrink: 0 }}>
                        <MiniSpark data={sparkData} color={sparkColor}/>
                      </div>
                    )}

                    {/* Balance + Last synced */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
                      <p style={{
                        fontSize: 18, fontWeight: 700,
                        fontFamily: "'DM Mono',monospace",
                        color: isNeg ? 'var(--red)' : 'var(--text-primary)',
                        letterSpacing: '-.02em',
                      }}>
                        {$(Math.abs(acc.balance))}
                        {isNeg && <span style={{ fontSize: 12, marginLeft: 2 }}>-</span>}
                      </p>
                      {acc.lastSynced && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {lang === 'es' ? '\u00dalt. sync: ' : 'Last synced: '}{acc.lastSynced}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="phoenix-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>
            {lang === 'es' ? 'No hay cuentas para mostrar' : 'No accounts to display'}
          </p>
        </div>
      )}
    </div>
  );
}
