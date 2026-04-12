export const CATEGORIES = [
  { id: 'income', name: 'Income', parentId: null, color: '#059669', icon: '💰' },
  { id: 'paychecks', name: 'Paychecks', parentId: 'income', color: '#059669', icon: '💼' },
  { id: 'business-revenue', name: 'Business Revenue', parentId: 'income', color: '#059669', icon: '📈' },
  { id: 'other-income', name: 'Other Income', parentId: 'income', color: '#059669', icon: '💲' },
  { id: 'interest', name: 'Interest & Dividends', parentId: 'income', color: '#059669', icon: '🏦' },
  { id: 'housing', name: 'Housing', parentId: null, color: '#7C3AED', icon: '🏠' },
  { id: 'mortgage', name: 'Mortgage', parentId: 'housing', color: '#7C3AED', icon: '🏠' },
  { id: 'rent-lease', name: 'Rent / Lease', parentId: 'housing', color: '#7C3AED', icon: '🔑' },
  { id: 'food', name: 'Food & Dining', parentId: null, color: '#F97316', icon: '🍽' },
  { id: 'restaurants', name: 'Restaurants & Bars', parentId: 'food', color: '#F97316', icon: '🍔' },
  { id: 'food-delivery', name: 'Food Delivery', parentId: 'food', color: '#F97316', icon: '🛵' },
  { id: 'groceries', name: 'Groceries', parentId: 'food', color: '#F97316', icon: '🛒' },
  { id: 'business', name: 'Business Expenses', parentId: null, color: '#F59E0B', icon: '💼' },
  { id: 'contractors', name: 'Contractors', parentId: 'business', color: '#F59E0B', icon: '🔧' },
  { id: 'payroll', name: 'Payroll', parentId: 'business', color: '#F59E0B', icon: '👥' },
  { id: 'software-subscriptions', name: 'Software & Subscriptions', parentId: 'business', color: '#F59E0B', icon: '💻' },
  { id: 'marketing-ads', name: 'Marketing & Ads', parentId: 'business', color: '#F59E0B', icon: '📣' },
  { id: 'office-supplies', name: 'Office Supplies', parentId: 'business', color: '#F59E0B', icon: '📎' },
  { id: 'transport', name: 'Transportation', parentId: null, color: '#2563EB', icon: '🚗' },
  { id: 'ride-share', name: 'Ride Share', parentId: 'transport', color: '#2563EB', icon: '🚕' },
  { id: 'gas-fuel', name: 'Gas & Fuel', parentId: 'transport', color: '#2563EB', icon: '⛽' },
  { id: 'parking', name: 'Parking & Tolls', parentId: 'transport', color: '#2563EB', icon: '🅿️' },
  { id: 'taxes', name: 'Taxes & Fees', parentId: null, color: '#DC2626', icon: '🏛' },
  { id: 'federal-tax', name: 'Federal / State Tax', parentId: 'taxes', color: '#DC2626', icon: '🏛' },
  { id: 'financial-fees', name: 'Financial Fees', parentId: 'taxes', color: '#DC2626', icon: '💳' },
  { id: 'bank-fees', name: 'Bank Fees', parentId: 'taxes', color: '#DC2626', icon: '🏦' },
  { id: 'overdraft-fee', name: 'Overdraft Fee', parentId: 'taxes', color: '#DC2626', icon: '⚠️' },
  { id: 'nsf-fee', name: 'NSF Fee', parentId: 'taxes', color: '#DC2626', icon: '⚠️' },
  { id: 'health', name: 'Health & Medical', parentId: null, color: '#0891B2', icon: '🏥' },
  { id: 'insurance', name: 'Insurance', parentId: 'health', color: '#0891B2', icon: '🛡' },
  { id: 'medical', name: 'Medical Bills', parentId: 'health', color: '#0891B2', icon: '💊' },
  { id: 'personal', name: 'Personal', parentId: null, color: '#DB2777', icon: '👤' },
  { id: 'owner-compensation', name: 'Owner Compensation', parentId: 'personal', color: '#DB2777', icon: '💸' },
  { id: 'entertainment', name: 'Entertainment', parentId: 'personal', color: '#DB2777', icon: '🎮' },
  { id: 'travel', name: 'Travel', parentId: 'personal', color: '#DB2777', icon: '✈️' },
  { id: 'shopping', name: 'Shopping', parentId: 'personal', color: '#DB2777', icon: '🛍' },
  { id: 'bills', name: 'Bills & Utilities', parentId: null, color: '#7C3AED', icon: '⚡' },
  { id: 'utilities', name: 'Utilities', parentId: 'bills', color: '#7C3AED', icon: '💡' },
  { id: 'phone', name: 'Phone & Internet', parentId: 'bills', color: '#7C3AED', icon: '📱' },
  { id: 'transfers', name: 'Transfers', parentId: null, color: '#64748B', icon: '🔄' },
  { id: 'credit-card-payment', name: 'Credit Card Payment', parentId: 'transfers', color: '#64748B', icon: '💳' },
  { id: 'bank-transfer', name: 'Bank Transfer', parentId: 'transfers', color: '#64748B', icon: '🏦' },
  { id: 'uncategorized', name: 'Uncategorized', parentId: null, color: '#EF4444', icon: '❓' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'uncategorized');
export const getParentCategory = (id) => {
  const cat = getCategoryById(id);
  if (!cat?.parentId) return cat;
  return CATEGORIES.find(c => c.id === cat.parentId) || cat;
};
export const getTopCategories = () => CATEGORIES.filter(c => c.parentId === null);
export const getSubCategories = (parentId) => CATEGORIES.filter(c => c.parentId === parentId);
export const isIncomeCategory = (id) => {
  const cat = getCategoryById(id);
  return cat?.id === 'income' || cat?.parentId === 'income';
};
export const isTransferCategory = (id) => {
  const cat = getCategoryById(id);
  return cat?.id === 'transfers' || cat?.parentId === 'transfers';
};
