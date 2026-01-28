
export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  RESEARCH = 'RESEARCH',
  DRAFTING = 'DRAFTING',
  ANALYSIS = 'ANALYSIS',
  ADMIN = 'ADMIN',
  DOCS = 'DOCS',
  CASES = 'CASES'
}

export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export type Language = 'fr' | 'ar';

export type SubscriptionPlan = 'free' | 'pro' | 'cabinet';

export type UserRole = 'user' | 'admin' | 'tester';

export interface Case {
  id: string;
  title: string;
  clientName: string;
  description: string;
  createdAt: Date;
  status: 'active' | 'archived';
}

export interface UserFeedback {
  id: string;
  userId: string;
  messageId: string;
  isPositive: boolean;
  comment?: string;
  mode: AppMode;
  timestamp: Date;
}

export interface UserStats {
  id: string;
  email: string;
  credits: number;
  plan: SubscriptionPlan;
  isPro: boolean;
  role: UserRole;
  joinedAt: Date;
}

export interface Citation {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isThinking?: boolean;
  citations?: Citation[];
  feedback?: {
    isPositive: boolean;
    comment?: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  prompt: string;
  prompt_ar: string;
  structure: string[];
  structure_ar: string[];
  inputGuide: string;
  inputGuide_ar: string;
}

export interface LicenseKey {
  key: string;
  plan: SubscriptionPlan;
  isUsed: boolean;
  createdAt: Date;
  usedBy?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  date: Date;
}
