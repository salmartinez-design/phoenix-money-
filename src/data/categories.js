// ctx: 'business' = only shows in business view, 'personal' = only personal, 'both' = shows in both
export const DEFAULT_CATEGORIES = [
  // Income — both
  { id: 'income', name: 'Income', parentId: null, color: '#059669', icon: '💰', ctx: 'both' },
  { id: 'paychecks', name: 'Paychecks', parentId: 'income', color: '#059669', icon: '💼', ctx: 'personal' },
  { id: 'business-revenue', name: 'Business Revenue', parentId: 'income', color: '#059669', icon: '📈', ctx: 'business' },
  { id: 'other-income', name: 'Other Income', parentId: 'income', color: '#059669', icon: '💲', ctx: 'both' },
  { id: 'interest', name: 'Interest & Dividends', parentId: 'income', color: '#059669', icon: '🏦', ctx: 'both' },
  // Investments — personal
  { id: 'investments', name: 'Investments', parentId: null, color: '#059669', icon: '📊', ctx: 'personal' },
  { id: 'stocks', name: 'Stocks', parentId: 'investments', color: '#059669', icon: '📈', ctx: 'personal' },
  { id: 'retirement', name: 'Retirement (IRA/401k)', parentId: 'investments', color: '#059669', icon: '🏖', ctx: 'personal' },
  // Housing — personal
  { id: 'housing', name: 'Housing', parentId: null, color: '#7C3AED', icon: '🏠', ctx: 'personal' },
  { id: 'mortgage', name: 'Mortgage', parentId: 'housing', color: '#7C3AED', icon: '🏠', ctx: 'personal' },
  { id: 'rent-lease', name: 'Rent / Lease', parentId: 'housing', color: '#7C3AED', icon: '🔑', ctx: 'both' },
  { id: 'home-improvement', name: 'Home Improvement', parentId: 'housing', color: '#7C3AED', icon: '🔨', ctx: 'personal' },
  // Food — both
  { id: 'food', name: 'Food & Dining', parentId: null, color: '#F97316', icon: '🍽', ctx: 'both' },
  { id: 'restaurants', name: 'Restaurants & Bars', parentId: 'food', color: '#F97316', icon: '🍔', ctx: 'both' },
  { id: 'food-delivery', name: 'Food Delivery', parentId: 'food', color: '#F97316', icon: '🛵', ctx: 'both' },
  { id: 'groceries', name: 'Groceries', parentId: 'food', color: '#F97316', icon: '🛒', ctx: 'personal' },
  { id: 'coffee', name: 'Coffee', parentId: 'food', color: '#F97316', icon: '☕', ctx: 'both' },
  // Business Expenses — business only
  { id: 'business', name: 'Business Expenses', parentId: null, color: '#F59E0B', icon: '💼', ctx: 'business' },
  { id: 'cogs', name: 'COGS (Supplies & Materials)', parentId: 'business', color: '#F59E0B', icon: '🧹', ctx: 'business' },
  { id: 'contractors', name: 'Contractors', parentId: 'business', color: '#F59E0B', icon: '🔧', ctx: 'business' },
  { id: 'payroll', name: 'Payroll', parentId: 'business', color: '#F59E0B', icon: '👥', ctx: 'business' },
  { id: 'software-subscriptions', name: 'Software & Subscriptions', parentId: 'business', color: '#F59E0B', icon: '💻', ctx: 'business' },
  { id: 'marketing-ads', name: 'Marketing & Ads', parentId: 'business', color: '#F59E0B', icon: '📣', ctx: 'business' },
  { id: 'office-supplies', name: 'Office Supplies', parentId: 'business', color: '#F59E0B', icon: '📎', ctx: 'business' },
  { id: 'equipment', name: 'Equipment', parentId: 'business', color: '#F59E0B', icon: '🔩', ctx: 'business' },
  { id: 'vehicle-expense', name: 'Vehicle Expense', parentId: 'business', color: '#F59E0B', icon: '🚐', ctx: 'business' },
  { id: 'business-insurance', name: 'Business Insurance', parentId: 'business', color: '#F59E0B', icon: '🛡', ctx: 'business' },
  { id: 'professional-services', name: 'Professional Services', parentId: 'business', color: '#F59E0B', icon: '⚖️', ctx: 'business' },
  { id: 'business-meals', name: 'Business Meals', parentId: 'business', color: '#F59E0B', icon: '🍽', ctx: 'business' },
  { id: 'training', name: 'Training & Education', parentId: 'business', color: '#F59E0B', icon: '📚', ctx: 'business' },
  { id: 'licenses-permits', name: 'Licenses & Permits', parentId: 'business', color: '#F59E0B', icon: '📜', ctx: 'business' },
  { id: 'business-travel', name: 'Business Travel', parentId: 'business', color: '#F59E0B', icon: '✈️', ctx: 'business' },
  { id: 'rent-office', name: 'Rent (Office/Warehouse)', parentId: 'business', color: '#F59E0B', icon: '🏢', ctx: 'business' },
  // Auto & Transport — both
  { id: 'transport', name: 'Auto & Transport', parentId: null, color: '#2563EB', icon: '🚗', ctx: 'both' },
  { id: 'ride-share', name: 'Ride Share', parentId: 'transport', color: '#2563EB', icon: '🚕', ctx: 'both' },
  { id: 'gas-fuel', name: 'Gas & Fuel', parentId: 'transport', color: '#2563EB', icon: '⛽', ctx: 'both' },
  { id: 'parking', name: 'Parking & Tolls', parentId: 'transport', color: '#2563EB', icon: '🅿️', ctx: 'both' },
  { id: 'auto-payment', name: 'Auto Payment', parentId: 'transport', color: '#2563EB', icon: '🚙', ctx: 'personal' },
  { id: 'auto-maintenance', name: 'Auto Maintenance', parentId: 'transport', color: '#2563EB', icon: '🔧', ctx: 'both' },
  // Taxes & Fees — both
  { id: 'taxes', name: 'Taxes & Fees', parentId: null, color: '#DC2626', icon: '🏛', ctx: 'both' },
  { id: 'federal-tax', name: 'Federal / State Tax', parentId: 'taxes', color: '#DC2626', icon: '🏛', ctx: 'both' },
  { id: 'financial-fees', name: 'Financial Fees', parentId: 'taxes', color: '#DC2626', icon: '💳', ctx: 'both' },
  { id: 'bank-fees', name: 'Bank Fees', parentId: 'taxes', color: '#DC2626', icon: '🏦', ctx: 'both' },
  { id: 'overdraft-fee', name: 'Overdraft Fee', parentId: 'taxes', color: '#DC2626', icon: '⚠️', ctx: 'both' },
  { id: 'nsf-fee', name: 'NSF Fee', parentId: 'taxes', color: '#DC2626', icon: '⚠️', ctx: 'both' },
  // Health — personal
  { id: 'health', name: 'Health & Medical', parentId: null, color: '#0891B2', icon: '🏥', ctx: 'personal' },
  { id: 'insurance', name: 'Insurance', parentId: 'health', color: '#0891B2', icon: '🛡', ctx: 'both' },
  { id: 'medical', name: 'Medical Bills', parentId: 'health', color: '#0891B2', icon: '💊', ctx: 'personal' },
  { id: 'dentist', name: 'Dentist', parentId: 'health', color: '#0891B2', icon: '🦷', ctx: 'personal' },
  // Personal — personal only
  { id: 'personal', name: 'Personal', parentId: null, color: '#DB2777', icon: '👤', ctx: 'personal' },
  { id: 'owner-compensation', name: 'Owner Compensation', parentId: 'personal', color: '#DB2777', icon: '💸', ctx: 'both' },
  { id: 'entertainment', name: 'Entertainment', parentId: 'personal', color: '#DB2777', icon: '🎮', ctx: 'personal' },
  { id: 'travel', name: 'Travel', parentId: 'personal', color: '#DB2777', icon: '✈️', ctx: 'both' },
  // Shopping — personal
  { id: 'shopping', name: 'Shopping', parentId: null, color: '#EC4899', icon: '🛍', ctx: 'personal' },
  { id: 'clothing', name: 'Clothing', parentId: 'shopping', color: '#EC4899', icon: '👕', ctx: 'personal' },
  { id: 'electronics', name: 'Electronics', parentId: 'shopping', color: '#EC4899', icon: '🖥', ctx: 'personal' },
  { id: 'furniture', name: 'Furniture & Home', parentId: 'shopping', color: '#EC4899', icon: '🪑', ctx: 'personal' },
  // Gifts — personal
  { id: 'gifts', name: 'Gifts & Donations', parentId: null, color: '#F472B6', icon: '🎁', ctx: 'personal' },
  { id: 'charity', name: 'Charity', parentId: 'gifts', color: '#F472B6', icon: '❤️', ctx: 'personal' },
  { id: 'gifts-given', name: 'Gifts', parentId: 'gifts', color: '#F472B6', icon: '🎀', ctx: 'personal' },
  // Children — personal
  { id: 'children', name: 'Children', parentId: null, color: '#8B5CF6', icon: '👶', ctx: 'personal' },
  { id: 'childcare', name: 'Child Care', parentId: 'children', color: '#8B5CF6', icon: '🧒', ctx: 'personal' },
  { id: 'child-activities', name: 'Child Activities', parentId: 'children', color: '#8B5CF6', icon: '⚽', ctx: 'personal' },
  // Education — personal
  { id: 'education', name: 'Education', parentId: null, color: '#6366F1', icon: '🎓', ctx: 'personal' },
  { id: 'tuition', name: 'Tuition', parentId: 'education', color: '#6366F1', icon: '📚', ctx: 'personal' },
  { id: 'books', name: 'Books & Supplies', parentId: 'education', color: '#6366F1', icon: '📖', ctx: 'personal' },
  // Bills — both
  { id: 'bills', name: 'Bills & Utilities', parentId: null, color: '#7C3AED', icon: '⚡', ctx: 'both' },
  { id: 'utilities', name: 'Utilities', parentId: 'bills', color: '#7C3AED', icon: '💡', ctx: 'both' },
  { id: 'phone', name: 'Phone & Internet', parentId: 'bills', color: '#7C3AED', icon: '📱', ctx: 'both' },
  { id: 'water', name: 'Water', parentId: 'bills', color: '#7C3AED', icon: '💧', ctx: 'both' },
  { id: 'electric', name: 'Electric', parentId: 'bills', color: '#7C3AED', icon: '⚡', ctx: 'both' },
  // Transfers — both
  { id: 'transfers', name: 'Transfers', parentId: null, color: '#64748B', icon: '🔄', ctx: 'both' },
  { id: 'credit-card-payment', name: 'Credit Card Payment', parentId: 'transfers', color: '#64748B', icon: '💳', ctx: 'both' },
  { id: 'bank-transfer', name: 'Bank Transfer', parentId: 'transfers', color: '#64748B', icon: '🏦', ctx: 'both' },
  // Uncategorized
  { id: 'uncategorized', name: 'Uncategorized', parentId: null, color: '#EF4444', icon: '❓', ctx: 'both' },
];

let CATEGORIES = [...DEFAULT_CATEGORIES];

export const resetCategories = () => { CATEGORIES = [...DEFAULT_CATEGORIES]; };
export const setCategories = (cats) => { CATEGORIES = cats; };
export const getCategories = () => CATEGORIES;
export const addCategory = (cat) => { CATEGORIES.push(cat); };
export const removeCategory = (id) => { CATEGORIES = CATEGORIES.filter(c => c.id !== id); };

export const getCategoryById = (id) =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'uncategorized');
export const getParentCategory = (id) => {
  const cat = getCategoryById(id);
  if (!cat?.parentId) return cat;
  return CATEGORIES.find(c => c.id === cat.parentId) || cat;
};
export const getTopCategories = (ctx) => {
  if (!ctx || ctx === 'all') return CATEGORIES.filter(c => c.parentId === null);
  return CATEGORIES.filter(c => c.parentId === null && (c.ctx === ctx || c.ctx === 'both'));
};
export const getSubCategories = (parentId, ctx) => {
  if (!ctx || ctx === 'all') return CATEGORIES.filter(c => c.parentId === parentId);
  return CATEGORIES.filter(c => c.parentId === parentId && (c.ctx === ctx || c.ctx === 'both'));
};
export const isIncomeCategory = (id) => {
  const cat = getCategoryById(id);
  return cat?.id === 'income' || cat?.parentId === 'income';
};
export const isTransferCategory = (id) => {
  const cat = getCategoryById(id);
  return cat?.id === 'transfers' || cat?.parentId === 'transfers';
};

export { CATEGORIES };
