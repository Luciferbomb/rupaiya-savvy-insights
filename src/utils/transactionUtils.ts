
import { Transaction, CategoryTotal, MerchantTotal, MonthlySpending, SavingRecommendation } from '../types';

// Sample categories with Indian context
export const CATEGORIES = {
  GROCERIES: 'Groceries',
  DINING: 'Dining Out',
  ENTERTAINMENT: 'Entertainment',
  UTILITIES: 'Utilities',
  TRANSPORT: 'Transport',
  HEALTH: 'Healthcare',
  EDUCATION: 'Education',
  SHOPPING: 'Shopping',
  TRAVEL: 'Travel',
  RENT: 'Rent/Housing',
  INVESTMENTS: 'Investments',
  INSURANCE: 'Insurance',
  OTHERS: 'Others'
};

// Category colors for charts
export const CATEGORY_COLORS = {
  [CATEGORIES.GROCERIES]: '#FF9F6B',
  [CATEGORIES.DINING]: '#FFC857',
  [CATEGORIES.ENTERTAINMENT]: '#58C7B4',
  [CATEGORIES.UTILITIES]: '#6E59A5',
  [CATEGORIES.TRANSPORT]: '#E5DEFF',
  [CATEGORIES.HEALTH]: '#A9DEF9',
  [CATEGORIES.EDUCATION]: '#D4A5A5',
  [CATEGORIES.SHOPPING]: '#77DD77',
  [CATEGORIES.TRAVEL]: '#FFD4B8',
  [CATEGORIES.RENT]: '#CFBAF0',
  [CATEGORIES.INVESTMENTS]: '#B4F8C8',
  [CATEGORIES.INSURANCE]: '#FBE7C6',
  [CATEGORIES.OTHERS]: '#FFAEBC'
};

// Function to categorize transactions based on description keywords
export const categorizeTransaction = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('bigbasket') || lowerDesc.includes('grofer') || lowerDesc.includes('dmart') || lowerDesc.includes('grocery')) {
    return CATEGORIES.GROCERIES;
  } else if (lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('restaurant') || lowerDesc.includes('cafe')) {
    return CATEGORIES.DINING;
  } else if (lowerDesc.includes('netflix') || lowerDesc.includes('amazon prime') || lowerDesc.includes('hotstar') || lowerDesc.includes('movie') || lowerDesc.includes('bookmyshow')) {
    return CATEGORIES.ENTERTAINMENT;
  } else if (lowerDesc.includes('electricity') || lowerDesc.includes('water') || lowerDesc.includes('gas') || lowerDesc.includes('broadband') || lowerDesc.includes('jio') || lowerDesc.includes('airtel')) {
    return CATEGORIES.UTILITIES;
  } else if (lowerDesc.includes('uber') || lowerDesc.includes('ola') || lowerDesc.includes('metro') || lowerDesc.includes('petrol') || lowerDesc.includes('diesel') || lowerDesc.includes('train')) {
    return CATEGORIES.TRANSPORT;
  } else if (lowerDesc.includes('hospital') || lowerDesc.includes('pharmacy') || lowerDesc.includes('doctor') || lowerDesc.includes('apollo') || lowerDesc.includes('medplus')) {
    return CATEGORIES.HEALTH;
  } else if (lowerDesc.includes('school') || lowerDesc.includes('college') || lowerDesc.includes('tuition') || lowerDesc.includes('course') || lowerDesc.includes('fee')) {
    return CATEGORIES.EDUCATION;
  } else if (lowerDesc.includes('myntra') || lowerDesc.includes('amazon') || lowerDesc.includes('flipkart') || lowerDesc.includes('mall') || lowerDesc.includes('retail')) {
    return CATEGORIES.SHOPPING;
  } else if (lowerDesc.includes('hotel') || lowerDesc.includes('flight') || lowerDesc.includes('makemytrip') || lowerDesc.includes('yatra') || lowerDesc.includes('travel')) {
    return CATEGORIES.TRAVEL;
  } else if (lowerDesc.includes('rent') || lowerDesc.includes('housing') || lowerDesc.includes('apartment') || lowerDesc.includes('maintenance')) {
    return CATEGORIES.RENT;
  } else if (lowerDesc.includes('mutual fund') || lowerDesc.includes('stock') || lowerDesc.includes('zerodha') || lowerDesc.includes('groww') || lowerDesc.includes('investment')) {
    return CATEGORIES.INVESTMENTS;
  } else if (lowerDesc.includes('insurance') || lowerDesc.includes('lic') || lowerDesc.includes('policy')) {
    return CATEGORIES.INSURANCE;
  } else {
    return CATEGORIES.OTHERS;
  }
};

// Calculate category totals for pie chart
export const calculateCategoryTotals = (transactions: Transaction[]): CategoryTotal[] => {
  const categoryMap = new Map<string, number>();
  
  transactions.forEach(transaction => {
    const currentTotal = categoryMap.get(transaction.category) || 0;
    categoryMap.set(transaction.category, currentTotal + transaction.amount);
  });
  
  return Array.from(categoryMap.entries()).map(([category, total]) => ({
    category,
    total,
    color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#CCCCCC'
  }));
};

// Calculate merchant totals
export const calculateMerchantTotals = (transactions: Transaction[]): MerchantTotal[] => {
  const merchantMap = new Map<string, number>();
  
  transactions.forEach(transaction => {
    const currentTotal = merchantMap.get(transaction.merchant) || 0;
    merchantMap.set(transaction.merchant, currentTotal + transaction.amount);
  });
  
  return Array.from(merchantMap.entries())
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5 merchants
};

// Calculate monthly spending for trend chart
export const calculateMonthlySpending = (transactions: Transaction[]): MonthlySpending[] => {
  const monthMap = new Map<string, number>();
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    const currentTotal = monthMap.get(monthYear) || 0;
    monthMap.set(monthYear, currentTotal + transaction.amount);
  });
  
  return Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
};

// Generate saving recommendations based on spending patterns
export const generateSavingRecommendations = (transactions: Transaction[]): SavingRecommendation[] => {
  const categoryTotals = calculateCategoryTotals(transactions);
  const totalSpending = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
  const recommendations: SavingRecommendation[] = [];
  
  // Dining recommendation
  const diningTotal = categoryTotals.find(cat => cat.category === CATEGORIES.DINING)?.total || 0;
  if (diningTotal > 0.1 * totalSpending) {
    recommendations.push({
      id: '1',
      title: 'Reduce Eating Out',
      description: 'You\'re spending ₹' + diningTotal.toLocaleString('en-IN') + ' on dining out. Try cooking at home more often to save up to 50% on food expenses.',
      potentialSavings: diningTotal * 0.5,
      category: CATEGORIES.DINING
    });
  }
  
  // Entertainment recommendation
  const entertainmentTotal = categoryTotals.find(cat => cat.category === CATEGORIES.ENTERTAINMENT)?.total || 0;
  if (entertainmentTotal > 0.08 * totalSpending) {
    recommendations.push({
      id: '2',
      title: 'Share Subscription Costs',
      description: 'Share your OTT subscriptions with family members or look for combo plans to reduce your ₹' + entertainmentTotal.toLocaleString('en-IN') + ' entertainment expenses.',
      potentialSavings: entertainmentTotal * 0.3,
      category: CATEGORIES.ENTERTAINMENT
    });
  }
  
  // Transport recommendation
  const transportTotal = categoryTotals.find(cat => cat.category === CATEGORIES.TRANSPORT)?.total || 0;
  if (transportTotal > 0.15 * totalSpending) {
    recommendations.push({
      id: '3',
      title: 'Optimize Transport Costs',
      description: 'Consider carpooling or using public transport more often to reduce your ₹' + transportTotal.toLocaleString('en-IN') + ' transportation expenses.',
      potentialSavings: transportTotal * 0.4,
      category: CATEGORIES.TRANSPORT
    });
  }
  
  // Shopping recommendation
  const shoppingTotal = categoryTotals.find(cat => cat.category === CATEGORIES.SHOPPING)?.total || 0;
  if (shoppingTotal > 0.1 * totalSpending) {
    recommendations.push({
      id: '4',
      title: 'Plan Your Shopping',
      description: 'You spent ₹' + shoppingTotal.toLocaleString('en-IN') + ' on shopping. Wait for seasonal sales and create a shopping list to avoid impulse purchases.',
      potentialSavings: shoppingTotal * 0.3,
      category: CATEGORIES.SHOPPING
    });
  }
  
  // Utilities recommendation
  const utilitiesTotal = categoryTotals.find(cat => cat.category === CATEGORIES.UTILITIES)?.total || 0;
  if (utilitiesTotal > 0.1 * totalSpending) {
    recommendations.push({
      id: '5',
      title: 'Reduce Utility Bills',
      description: 'Your utility bills amount to ₹' + utilitiesTotal.toLocaleString('en-IN') + '. Consider switching to energy-efficient appliances and being mindful of power consumption.',
      potentialSavings: utilitiesTotal * 0.2,
      category: CATEGORIES.UTILITIES
    });
  }
  
  // Add a general savings recommendation if we have fewer than 3 specific ones
  if (recommendations.length < 3) {
    recommendations.push({
      id: '6',
      title: 'Create a Monthly Budget',
      description: 'Setting up a monthly budget for each category can help you track and reduce your overall expenses of ₹' + totalSpending.toLocaleString('en-IN') + '.',
      potentialSavings: totalSpending * 0.1,
      category: CATEGORIES.OTHERS
    });
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
};

// Mock data generator for demonstration
export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const merchants = [
    'BigBasket', 'Swiggy', 'Zomato', 'Amazon', 'Flipkart', 
    'Netflix', 'Airtel', 'Uber', 'Apollo Pharmacy', 'HDFC Credit Card',
    'TATA CLiQ', 'Reliance Mart', 'BookMyShow', 'MakeMyTrip', 'Myntra'
  ];
  
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  for (let i = 0; i < 100; i++) {
    const randomDate = new Date(
      sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime())
    );
    
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = Math.floor(Math.random() * 5000) + 100; // Random amount between 100 and 5100
    
    const transaction: Transaction = {
      id: `trans-${i}`,
      date: randomDate.toISOString().split('T')[0],
      description: `Payment to ${merchant}`,
      amount: amount,
      category: categorizeTransaction(`Payment to ${merchant}`),
      merchant: merchant
    };
    
    transactions.push(transaction);
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
