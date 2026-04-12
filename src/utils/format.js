export const formatCurrency = (amount, lang = 'en', decimals = 0) => {
  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (amount < 0 ? '-$' : '$') + formatted;
};

export const formatDate = (dateStr, lang = 'en') => {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    if (lang === 'es') return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

export const formatDateShort = (dateStr, lang = 'en') => {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    if (lang === 'es') return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
};

export const normalize = (str) =>
  (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const safeSetLocal = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { if (e.name === 'QuotaExceededError') console.warn('Phoenix: localStorage full'); }
};

export const daysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T12:00:00'); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
};

export const formatMonthYear = (monthKey, lang = 'en') => {
  try {
    const [y, m] = monthKey.split('-');
    const date = new Date(Number(y), Number(m) - 1, 15);
    return date.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' });
  } catch { return monthKey; }
};

export const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};

export const prevMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  const prev = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`;
  return prev;
};

export const nextMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  const next = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`;
  return next;
};
