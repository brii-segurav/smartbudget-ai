export type Transaction = {
  id?: number;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date?: string;
};

export type BudgetStatus = {
  category: string;
  monthly_limit: number;
  spent: number;
  percentage: number;
};

export type BudgetInput = {
  category: string;
  monthly_limit: number;
};

export type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'neutral';
  language: 'es' | 'en';
  currency_code: string;
  custom_symbol: string | null;
};

export type UserProfileUpdate = Omit<UserProfile, 'id'>;

export type AIInsights = {
  health_score: number;
  status: string;
  recommendations: string[];
};