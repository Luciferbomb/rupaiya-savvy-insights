
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  merchant: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  color: string;
}

export interface MerchantTotal {
  merchant: string;
  total: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface SavingRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  category: string;
}
