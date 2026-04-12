import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { SEED_TRANSACTIONS, SEED_RULES } from '../data/transactions';
import { getParentCategory, isIncomeCategory, isTransferCategory, getCategoryById } from '../data/categories';
import { safeSetLocal, normalize } from '../utils/format';

const AppContext = createContext(null);

const SEED_ACCOUNTS = [
  { id: 'business-checking', name: 'PNC Business Checking', type: 'cash', institution: 'PNC', lastSynced: '2026-03-31' },
];

function detectRecurring(transactions) {
  const byMerchant = {};
  transactions.forEach(t => {
    const key = normalize(t.merchantName || t.description).slice(0, 20);
    if (!key) return;
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(t);
  });

  const recurring = [];
  Object.entries(byMerchant).forEach(([key, txns]) => {
    if (txns.length < 2) return;
    const sorted = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
    const amounts = sorted.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.every(a => Math.abs(a - avg) / avg < 0.3);
    if (!variance) return;

    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date);
      const d2 = new Date(sorted[i].date);
      gaps.push(Math.round((d2 - d1) / 86400000));
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

    let frequency = null;
    if (avgGap >= 25 && avgGap <= 35) frequency = 'monthly';
    else if (avgGap >= 12 && avgGap <= 16) frequency = 'biweekly';
    else if (avgGap >= 5 && avgGap <= 9) frequency = 'weekly';
    else return;

    const lastDate = sorted[sorted.length - 1].date;
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.round(avgGap));
    const nextExpected = nextDate.toISOString().slice(0, 10);

    const sample = sorted[sorted.length - 1];
    recurring.push({
      merchantName: sample.merchantName || sample.description,
      description: sample.description,
      frequency,
      avgAmount: Math.round(avg * 100) / 100,
      lastDate,
      nextExpected,
      categoryId: sample.categoryId,
      accountId: sample.accountId,
      isIncome: sample.amount > 0,
      count: sorted.length,
    });
  });

  return recurring.sort((a, b) => new Date(a.nextExpected) - new Date(b.nextExpected));
}

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoenix-transactions')) || SEED_TRANSACTIONS; }
    catch { return SEED_TRANSACTIONS; }
  });
  const [rules, setRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoenix-rules')) || SEED_RULES; }
    catch { return SEED_RULES; }
  });
  const [theme, setThemeState] = useState(() => localStorage.getItem('phoenix-theme') || 'light');
  const [lang, setLangState] = useState(() => localStorage.getItem('phoenix-lang') || 'en');
  const [aiOpen, setAiOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState('all');
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoenix-budgets')) || {}; }
    catch { return {}; }
  });
  const [accounts, setAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoenix-accounts')) || SEED_ACCOUNTS; }
    catch { return SEED_ACCOUNTS; }
  });
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoenix-notif-prefs')); } catch {}
    return { negativeBalance: true, largeTransaction: true, largeTransactionThreshold: 500, uncategorizedPileup: true, uncategorizedThreshold: 3, weeklySummary: true, monthlySummary: true };
  });

  const setTheme = useCallback((t) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('phoenix-theme', t);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem('phoenix-lang', l);
  }, []);

  const updateNotifPref = useCallback((key, value) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: value };
      safeSetLocal('phoenix-notif-prefs', updated);
      return updated;
    });
  }, []);

  useEffect(() => { safeSetLocal('phoenix-transactions', transactions); }, [transactions]);
  useEffect(() => { safeSetLocal('phoenix-rules', rules); }, [rules]);
  useEffect(() => { safeSetLocal('phoenix-budgets', budgets); }, [budgets]);
  useEffect(() => { safeSetLocal('phoenix-accounts', accounts); }, [accounts]);

  const setBudget = useCallback((monthKey, categoryId, amount) => {
    setBudgets(prev => {
      const month = { ...(prev[monthKey] || {}) };
      if (amount === null || amount === 0) { delete month[categoryId]; }
      else { month[categoryId] = amount; }
      return { ...prev, [monthKey]: month };
    });
  }, []);

  const copyBudgetFromMonth = useCallback((sourceMonth, targetMonth) => {
    setBudgets(prev => ({ ...prev, [targetMonth]: { ...(prev[sourceMonth] || {}) } }));
  }, []);

  const applyRulesToAll = useCallback((ruleList, txnList) =>
    txnList.map(t => {
      const desc = t.description.toLowerCase();
      const match = ruleList.find(r => desc.includes(r.match.toLowerCase()));
      return match ? { ...t, categoryId: match.categoryId, flagged: false } : t;
    }), []);

  const updateCategory = useCallback((txnId, categoryId) => {
    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, categoryId, flagged: false } : t));
  }, []);

  const addRule = useCallback((rule) => {
    const conflict = rules.find(r => r.id !== rule.id && r.match.toLowerCase() === rule.match.toLowerCase());
    const newRules = conflict ? rules.filter(r => r.id !== conflict.id).concat(rule) : [...rules, rule];
    setRules(newRules);
    setTransactions(prev => applyRulesToAll(newRules, prev));
    return conflict;
  }, [rules, applyRulesToAll]);

  const updateRule = useCallback((updatedRule) => {
    const newRules = rules.map(r => r.id === updatedRule.id ? updatedRule : r);
    setRules(newRules);
    setTransactions(prev => applyRulesToAll(newRules, prev));
  }, [rules, applyRulesToAll]);

  const deleteRule = useCallback((ruleId) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const financialData = useMemo(() => {
    const operational = transactions.filter(t => !isTransferCategory(t.categoryId));
    const filtered = accountFilter === 'all' ? operational : operational.filter(t => t.accountType === accountFilter);
    const byMonth = {};
    filtered.forEach(t => {
      const key = t.date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(t);
    });
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = Object.keys(byMonth).sort().map(key => {
      const txns = byMonth[key];
      const inc = txns.filter(t => isIncomeCategory(t.categoryId)).reduce((s, t) => s + t.amount, 0);
      const exp = txns.filter(t => !isIncomeCategory(t.categoryId) && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const [yr, mo] = key.split('-');
      return { key, label: `${monthNames[parseInt(mo)-1]} ${yr}`, short: monthNames[parseInt(mo)-1], income: Math.round(inc), expenses: -Math.round(exp), net: Math.round(inc - exp), savingsRate: inc > 0 ? Math.round(((inc - exp) / inc) * 100) : null, current: key === new Date().toISOString().slice(0, 7) };
    });
    const totalIncome = filtered.filter(t => isIncomeCategory(t.categoryId)).reduce((s, t) => s + t.amount, 0);
    const totalExpenses = filtered.filter(t => !isIncomeCategory(t.categoryId) && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalNet = totalIncome - totalExpenses;
    const catMap = {};
    filtered.forEach(t => {
      const parent = getParentCategory(t.categoryId);
      const key = parent?.id || t.categoryId;
      if (!catMap[key]) catMap[key] = { id: key, cat: parent, total: 0 };
      catMap[key].total += t.amount;
    });
    const incomeCats = Object.values(catMap).map(g => {
      const inc = filtered.filter(t => isIncomeCategory(t.categoryId) && (t.categoryId === g.id || getParentCategory(t.categoryId)?.id === g.id)).reduce((s,t)=>s+t.amount,0);
      return { ...g, total: inc };
    }).filter(g => g.total > 0).sort((a,b) => b.total - a.total);
    const expenseCats = Object.values(catMap).map(g => {
      const exp = filtered.filter(t => !isIncomeCategory(t.categoryId) && t.amount < 0 && (t.categoryId === g.id || getParentCategory(t.categoryId)?.id === g.id)).reduce((s,t)=>s+Math.abs(t.amount),0);
      return { ...g, total: exp };
    }).filter(g => g.total > 0).sort((a,b) => b.total - a.total);
    const accountBalances = {};
    transactions.forEach(t => { if (!accountBalances[t.accountId]) accountBalances[t.accountId] = 0; accountBalances[t.accountId] += t.amount; });
    const negativeAccounts = Object.entries(accountBalances).filter(([,bal]) => bal < 0).map(([id, balance]) => ({ accountId: id, balance }));
    const flaggedCount = transactions.filter(t => t.flagged).length;
    const burnRate = monthly.length > 0 ? Math.round(monthly.reduce((s,m) => s + Math.abs(m.expenses), 0) / monthly.length) : 0;
    const runway = burnRate > 0 ? Math.round((totalNet / burnRate) * 12) : 0;

    // Category monthly spend (for budget page)
    const categoryMonthlySpend = {};
    operational.forEach(t => {
      const mk = t.date.slice(0, 7);
      if (!categoryMonthlySpend[mk]) categoryMonthlySpend[mk] = {};
      const catId = t.categoryId;
      const parentId = getParentCategory(catId)?.id || catId;
      // Store both subcategory and parent aggregation
      if (!categoryMonthlySpend[mk][catId]) categoryMonthlySpend[mk][catId] = 0;
      categoryMonthlySpend[mk][catId] += t.amount < 0 ? Math.abs(t.amount) : t.amount;
      if (parentId !== catId) {
        if (!categoryMonthlySpend[mk][parentId]) categoryMonthlySpend[mk][parentId] = 0;
        categoryMonthlySpend[mk][parentId] += t.amount < 0 ? Math.abs(t.amount) : t.amount;
      }
    });

    // Account summaries
    const accountSummaries = {};
    transactions.forEach(t => {
      if (!accountSummaries[t.accountId]) accountSummaries[t.accountId] = { balance: 0, count: 0, monthlyBalances: {} };
      accountSummaries[t.accountId].balance += t.amount;
      accountSummaries[t.accountId].count += 1;
      const mk = t.date.slice(0, 7);
      if (!accountSummaries[t.accountId].monthlyBalances[mk]) accountSummaries[t.accountId].monthlyBalances[mk] = 0;
      accountSummaries[t.accountId].monthlyBalances[mk] += t.amount;
    });

    // Recurring detection
    const recurringDetected = detectRecurring(transactions);

    return { monthly, totalIncome, totalExpenses, totalNet, incomeCats, expenseCats, savingsRate: totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0, burnRate, runway, flaggedCount, negativeAccounts, latestMonth: monthly[monthly.length - 1], prevMonth: monthly[monthly.length - 2], allTransactions: transactions, categoryMonthlySpend, accountSummaries, accountBalances, recurringDetected };
  }, [transactions, accountFilter]);

  return (
    <AppContext.Provider value={{ transactions, rules, theme, lang, aiOpen, accountFilter, notifPrefs, budgets, accounts, setTheme, setLang, setAiOpen, setAccountFilter, updateNotifPref, updateCategory, addRule, updateRule, deleteRule, setBudget, copyBudgetFromMonth, financialData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
