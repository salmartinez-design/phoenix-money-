import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { formatCurrency, formatMonthYear, getCurrentMonthKey, prevMonthKey, nextMonthKey } from '../utils/format';
import { getTopCategories, getSubCategories, getCategoryById, isIncomeCategory } from '../data/categories';

export function Budget() {
  const { budgets, setBudget, copyBudgetFromMonth, financialData, lang } = useApp();
  const t = useT(lang);
  const $ = (n, d = 0) => formatCurrency(n, lang, d);

  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [expandedParents, setExpandedParents] = useState(() => new Set(getTopCategories().map(c => c.id)));
  const [editingCell, setEditingCell] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = lang === 'es' ? 'Presupuesto — Phoenix Money' : 'Budget — Phoenix Money';
  }, [lang]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const monthBudgets = budgets[selectedMonth] || {};
  const monthActuals = financialData.categoryMonthlySpend?.[selectedMonth] || {};

  const topCategories = useMemo(() => getTopCategories(), []);
  const incomeParents = useMemo(() => topCategories.filter(c => isIncomeCategory(c.id)), [topCategories]);
  const expenseParents = useMemo(() => topCategories.filter(c => !isIncomeCategory(c.id)), [topCategories]);

  // Compute totals
  const totals = useMemo(() => {
    let incomeBudgeted = 0, incomeActual = 0;
    let expenseBudgeted = 0, expenseActual = 0;

    incomeParents.forEach(parent => {
      const subs = getSubCategories(parent.id);
      subs.forEach(sub => {
        incomeBudgeted += monthBudgets[sub.id] || 0;
        incomeActual += monthActuals[sub.id] || 0;
      });
      incomeBudgeted += monthBudgets[parent.id] || 0;
      incomeActual += monthActuals[parent.id] || 0;
    });

    expenseParents.forEach(parent => {
      const subs = getSubCategories(parent.id);
      subs.forEach(sub => {
        expenseBudgeted += monthBudgets[sub.id] || 0;
        expenseActual += Math.abs(monthActuals[sub.id] || 0);
      });
      expenseBudgeted += monthBudgets[parent.id] || 0;
      expenseActual += Math.abs(monthActuals[parent.id] || 0);
    });

    return { incomeBudgeted, incomeActual, expenseBudgeted, expenseActual };
  }, [monthBudgets, monthActuals, incomeParents, expenseParents]);

  const leftToBudget = totals.incomeBudgeted - totals.expenseBudgeted;

  const toggleParent = (id) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = (categoryId, value) => {
    const num = parseFloat(value);
    setBudget(selectedMonth, categoryId, isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100);
    setEditingCell(null);
  };

  const handleKeyDown = (e, categoryId) => {
    if (e.key === 'Enter') handleSave(categoryId, e.target.value);
    if (e.key === 'Escape') setEditingCell(null);
  };

  const remainingColor = (budgeted, actual) => {
    if (!budgeted) return 'var(--text-muted)';
    const remaining = budgeted - actual;
    if (remaining > 0) return 'var(--green)';
    if (remaining < 0) return 'var(--red)';
    return 'var(--text-muted)';
  };

  const pctUsed = (actual, budgeted) => {
    if (!budgeted) return 0;
    return Math.min(Math.round((actual / budgeted) * 100), 100);
  };

  const progressBarColor = (actual, budgeted) => {
    if (!budgeted) return 'var(--text-muted)';
    const ratio = actual / budgeted;
    if (ratio <= 0.7) return 'var(--green)';
    if (ratio <= 1) return 'var(--amber)';
    return 'var(--red)';
  };

  const usageLine = (catName, actual, budgeted, isIncome) => {
    if (!budgeted) return null;
    const pct = Math.round((actual / budgeted) * 100);
    if (isIncome) {
      if (lang === 'es') return `Has recibido el ${pct}% de tus ingresos de ${catName}`;
      return `You've received ${pct}% of your ${catName} income`;
    }
    if (lang === 'es') return `Has usado el ${pct}% de tu presupuesto de ${catName}`;
    return `You've used ${pct}% of your ${catName} budget`;
  };

  // Budget cell renderer
  const BudgetCell = ({ categoryId }) => {
    const val = monthBudgets[categoryId] || 0;
    if (editingCell === categoryId) {
      return (
        <input
          ref={inputRef}
          type="number"
          defaultValue={val || ''}
          onBlur={(e) => handleSave(categoryId, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, categoryId)}
          style={{
            width: 90, padding: '4px 8px', fontSize: 14, fontFamily: "'DM Mono', monospace",
            background: 'var(--bg)', border: '1.5px solid var(--orange)', borderRadius: 6,
            color: 'var(--text-primary)', outline: 'none', textAlign: 'right',
          }}
        />
      );
    }
    return (
      <span
        onClick={() => setEditingCell(categoryId)}
        style={{
          cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontSize: 14,
          fontFamily: "'DM Mono', monospace", color: val ? 'var(--text-primary)' : 'var(--text-muted)',
          transition: 'background .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {val ? $(val) : '\u2014'}
      </span>
    );
  };

  // Sub-category row
  const SubRow = ({ cat, isIncome }) => {
    const budgeted = monthBudgets[cat.id] || 0;
    const rawActual = monthActuals[cat.id] || 0;
    const actual = isIncome ? rawActual : Math.abs(rawActual);
    const remaining = budgeted - actual;
    const pct = pctUsed(actual, budgeted);
    const line = usageLine(cat.name, actual, budgeted, isIncome);

    return (
      <div style={{ padding: '0 0 0 24px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px',
          alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15 }}>{cat.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
          </div>
          <div style={{ textAlign: 'right' }}><BudgetCell categoryId={cat.id} /></div>
          <div style={{ textAlign: 'right', fontSize: 14, fontFamily: "'DM Mono', monospace", color: 'var(--text-secondary)' }}>
            {$(actual)}
          </div>
          <div style={{
            textAlign: 'right', fontSize: 14, fontWeight: 600, fontFamily: "'DM Mono', monospace",
            color: remainingColor(budgeted, actual),
          }}>
            {budgeted ? $(remaining) : '\u2014'}
          </div>
        </div>
        {budgeted > 0 && (
          <div style={{ padding: '4px 16px 8px 42px' }}>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{
                height: '100%', width: `${Math.min((actual / budgeted) * 100, 100)}%`,
                background: progressBarColor(actual, budgeted), borderRadius: 3, transition: 'width .4s ease',
              }} />
            </div>
            {line && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{line}</p>}
          </div>
        )}
      </div>
    );
  };

  // Parent category row (collapsible)
  const ParentRow = ({ parent, isIncome }) => {
    const subs = getSubCategories(parent.id);
    const expanded = expandedParents.has(parent.id);

    let budgeted = monthBudgets[parent.id] || 0;
    let actual = isIncome ? (monthActuals[parent.id] || 0) : Math.abs(monthActuals[parent.id] || 0);
    subs.forEach(sub => {
      budgeted += monthBudgets[sub.id] || 0;
      actual += isIncome ? (monthActuals[sub.id] || 0) : Math.abs(monthActuals[sub.id] || 0);
    });
    const remaining = budgeted - actual;

    return (
      <div>
        <div
          onClick={() => toggleParent(parent.id)}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px',
            alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
            borderBottom: '1px solid var(--border)', transition: 'background .15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, color: 'var(--text-muted)', transition: 'transform .2s',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', width: 16,
            }}>
              {'\u25B6'}
            </span>
            <span style={{ fontSize: 16 }}>{parent.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{parent.name}</span>
          </div>
          <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-primary)' }}>
            {budgeted ? $(budgeted) : '\u2014'}
          </div>
          <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-secondary)' }}>
            {$(actual)}
          </div>
          <div style={{
            textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace",
            color: remainingColor(budgeted, actual),
          }}>
            {budgeted ? $(remaining) : '\u2014'}
          </div>
        </div>
        {expanded && subs.map(sub => <SubRow key={sub.id} cat={sub} isIncome={isIncome} />)}
      </div>
    );
  };

  // Section (Income / Expenses)
  const SectionHeader = ({ label, budgeted, actual }) => {
    const remaining = budgeted - actual;
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px',
        padding: '10px 16px', borderBottom: '2px solid var(--border)', marginTop: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {t('budgeted')}
        </span>
        <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {t('actual')}
        </span>
        <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {t('remaining')}
        </span>
      </div>
    );
  };

  // Sidebar progress bar helper
  const SidebarProgress = ({ label, budgeted, actual, earnedLabel, remainingLabel, color }) => {
    const pct = budgeted ? Math.min(Math.round((actual / budgeted) * 100), 100) : 0;
    const rem = budgeted - actual;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{$(actual)} {earnedLabel}</span>
          <span>{$(Math.max(rem, 0))} {remainingLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            {t('budget')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setSelectedMonth(prevMonthKey(selectedMonth))}
              style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--text-primary)', cursor: 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {'\u2190'}
            </button>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.02em', margin: 0 }}>
              {formatMonthYear(selectedMonth, lang)}
            </h2>
            <button
              onClick={() => setSelectedMonth(nextMonthKey(selectedMonth))}
              style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--text-primary)', cursor: 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {'\u2192'}
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Main content */}
        <div>
          {/* Income section */}
          <div className="phoenix-card fu1" style={{ marginBottom: 16, overflow: 'hidden' }}>
            <SectionHeader
              label={t('income')}
              budgeted={totals.incomeBudgeted}
              actual={totals.incomeActual}
            />
            {incomeParents.map(parent => (
              <ParentRow key={parent.id} parent={parent} isIncome={true} />
            ))}
          </div>

          {/* Expenses section */}
          <div className="phoenix-card fu2" style={{ overflow: 'hidden' }}>
            <SectionHeader
              label={t('expenses')}
              budgeted={totals.expenseBudgeted}
              actual={totals.expenseActual}
            />
            {expenseParents.map(parent => (
              <ParentRow key={parent.id} parent={parent} isIncome={false} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="phoenix-card fu3" style={{ position: 'sticky', top: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            {t('budgetSummary')}
          </p>

          {/* Left to budget */}
          <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('leftToBudget')}</p>
            <p style={{
              fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', margin: 0,
              fontFamily: "'DM Mono', monospace",
              color: leftToBudget >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {$(leftToBudget)}
            </p>
          </div>

          {/* Income progress */}
          <SidebarProgress
            label={t('incomeProgress')}
            budgeted={totals.incomeBudgeted}
            actual={totals.incomeActual}
            earnedLabel={lang === 'es' ? 'recibido' : 'earned'}
            remainingLabel={t('remaining')}
            color="var(--green)"
          />

          {/* Expense progress */}
          <SidebarProgress
            label={t('expenseProgress')}
            budgeted={totals.expenseBudgeted}
            actual={totals.expenseActual}
            earnedLabel={lang === 'es' ? 'gastado' : 'spent'}
            remainingLabel={t('remaining')}
            color="var(--orange)"
          />

          {/* Copy from last month */}
          <button
            className="btn-ghost"
            onClick={() => copyBudgetFromMonth(prevMonthKey(selectedMonth), selectedMonth)}
            style={{
              width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
              border: '1px solid var(--border)', borderRadius: 8,
              background: 'transparent', color: 'var(--text-secondary)',
              transition: 'all .15s',
            }}
          >
            {t('copyFromLastMonth')}
          </button>

          {/* Hint */}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.5, textAlign: 'center' }}>
            {t('setBudgetHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
