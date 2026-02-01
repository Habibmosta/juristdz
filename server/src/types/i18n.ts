// Internationalization types for French-Arabic legal platform

export interface I18nConfig {
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  fallbackLocale: SupportedLocale;
  enableRTL: boolean;
  dateFormats: Record<SupportedLocale, DateFormatConfig>;
  numberFormats: Record<SupportedLocale, NumberFormatConfig>;
}

export enum SupportedLocale {
  FRENCH = 'fr',
  ARABIC = 'ar',
  FRENCH_ALGERIA = 'fr-DZ',
  ARABIC_ALGERIA = 'ar-DZ'
}

export interface DateFormatConfig {
  short: string;
  medium: string;
  long: string;
  full: string;
  time: string;
  datetime: string;
}

export interface NumberFormatConfig {
  decimal: string;
  currency: string;
  percent: string;
  thousand: string;
}

export interface TranslationKey {
  key: string;
  namespace: string;
  context?: string;
  pluralization?: boolean;
}

export interface Translation {
  [key: string]: string | Translation | string[];
}

export interface LocalizedContent {
  [SupportedLocale.FRENCH]: Translation;
  [SupportedLocale.ARABIC]: Translation;
  [SupportedLocale.FRENCH_ALGERIA]?: Translation;
  [SupportedLocale.ARABIC_ALGERIA]?: Translation;
}

export interface LegalTerminology {
  id: string;
  domain: LegalDomain;
  termFr: string;
  termAr: string;
  definitionFr: string;
  definitionAr: string;
  synonymsFr?: string[];
  synonymsAr?: string[];
  context: TermContext;
  profession?: LegalProfession;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum LegalDomain {
  CIVIL_LAW = 'civil_law',
  CRIMINAL_LAW = 'criminal_law',
  COMMERCIAL_LAW = 'commercial_law',
  ADMINISTRATIVE_LAW = 'administrative_law',
  FAMILY_LAW = 'family_law',
  LABOR_LAW = 'labor_law',
  REAL_ESTATE_LAW = 'real_estate_law',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  TAX_LAW = 'tax_law',
  CONSTITUTIONAL_LAW = 'constitutional_law',
  INTERNATIONAL_LAW = 'international_law',
  PROCEDURAL_LAW = 'procedural_law'
}

export enum LegalProfession {
  AVOCAT = 'avocat',
  NOTAIRE = 'notaire',
  HUISSIER = 'huissier',
  MAGISTRAT = 'magistrat',
  JURISTE_ENTREPRISE = 'juriste_entreprise',
  ETUDIANT_DROIT = 'etudiant_droit',
  ADMINISTRATEUR = 'administrateur'
}

export enum TermContext {
  FORMAL = 'formal',
  INFORMAL = 'informal',
  TECHNICAL = 'technical',
  COLLOQUIAL = 'colloquial',
  ARCHAIC = 'archaic',
  MODERN = 'modern'
}

export interface I18nService {
  getCurrentLocale(): SupportedLocale;
  setLocale(locale: SupportedLocale): Promise<void>;
  translate(key: string, params?: Record<string, any>, locale?: SupportedLocale): string;
  translatePlural(key: string, count: number, params?: Record<string, any>, locale?: SupportedLocale): string;
  formatDate(date: Date, format?: string, locale?: SupportedLocale): string;
  formatNumber(number: number, format?: string, locale?: SupportedLocale): string;
  formatCurrency(amount: number, currency?: string, locale?: SupportedLocale): string;
  isRTL(locale?: SupportedLocale): boolean;
  getAvailableLocales(): SupportedLocale[];
  loadTranslations(namespace: string, locale: SupportedLocale): Promise<Translation>;
  addTranslation(key: string, value: string, locale: SupportedLocale, namespace?: string): void;
  searchLegalTerm(term: string, locale: SupportedLocale, domain?: LegalDomain): Promise<LegalTerminology[]>;
  translateLegalTerm(termId: string, targetLocale: SupportedLocale): Promise<LegalTerminology | null>;
}

export interface LocaleDetection {
  detectFromBrowser(): SupportedLocale;
  detectFromUser(userId: string): Promise<SupportedLocale>;
  detectFromRequest(headers: Record<string, string>): SupportedLocale;
}

export interface TranslationNamespace {
  COMMON: 'common';
  AUTH: 'auth';
  NAVIGATION: 'navigation';
  FORMS: 'forms';
  ERRORS: 'errors';
  LEGAL_TERMS: 'legal_terms';
  DOCUMENTS: 'documents';
  CASES: 'cases';
  BILLING: 'billing';
  NOTIFICATIONS: 'notifications';
  REPORTS: 'reports';
  ADMIN: 'admin';
  HELP: 'help';
}

export interface RTLConfig {
  enabled: boolean;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  marginStart: string;
  marginEnd: string;
  paddingStart: string;
  paddingEnd: string;
}

export interface LocalizedValidation {
  required: string;
  email: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  numeric: string;
  date: string;
  phone: string;
  url: string;
}

export interface LocalizedError {
  code: string;
  message: string;
  details?: string;
  locale: SupportedLocale;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercentage: number;
  lastUpdated: Date;
}

export interface I18nMiddleware {
  detectLocale(req: any, res: any, next: any): void;
  setLocaleHeader(req: any, res: any, next: any): void;
  validateLocale(req: any, res: any, next: any): void;
}

export interface LocalizedRoute {
  path: string;
  localizedPaths: Record<SupportedLocale, string>;
  component: string;
  title: Record<SupportedLocale, string>;
  description: Record<SupportedLocale, string>;
}

export interface LocalizedDocument {
  id: string;
  title: Record<SupportedLocale, string>;
  content: Record<SupportedLocale, string>;
  summary: Record<SupportedLocale, string>;
  keywords: Record<SupportedLocale, string[]>;
  locale: SupportedLocale;
  originalLocale: SupportedLocale;
  translatedAt?: Date;
  translatedBy?: string;
  translationQuality?: TranslationQuality;
}

export enum TranslationQuality {
  MACHINE = 'machine',
  HUMAN = 'human',
  PROFESSIONAL = 'professional',
  CERTIFIED = 'certified'
}

export interface LocalizedNotification {
  id: string;
  title: Record<SupportedLocale, string>;
  message: Record<SupportedLocale, string>;
  actionText?: Record<SupportedLocale, string>;
  locale: SupportedLocale;
}

export interface LocalizedEmail {
  subject: Record<SupportedLocale, string>;
  body: Record<SupportedLocale, string>;
  template: string;
  locale: SupportedLocale;
}

export interface BilingualSearch {
  query: string;
  locale: SupportedLocale;
  searchBothLanguages: boolean;
  transliterationEnabled: boolean;
  fuzzyMatch: boolean;
}

export interface LocalizedMenu {
  id: string;
  label: Record<SupportedLocale, string>;
  description?: Record<SupportedLocale, string>;
  icon?: string;
  path: string;
  children?: LocalizedMenu[];
  roles: LegalProfession[];
}

export interface AlgerianLocalization {
  dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd';
  timeFormat: '24h' | '12h';
  weekStart: 'saturday' | 'sunday' | 'monday';
  currency: 'DZD';
  numberFormat: 'european' | 'arabic';
  calendarType: 'gregorian' | 'hijri' | 'both';
}

export interface TranslationMemory {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  domain: LegalDomain;
  context: string;
  quality: TranslationQuality;
  usage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  translation: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  domain: LegalDomain;
  definition: string;
  examples: string[];
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface LocalizationProject {
  id: string;
  name: string;
  description: string;
  sourceLocale: SupportedLocale;
  targetLocales: SupportedLocale[];
  status: ProjectStatus;
  progress: Record<SupportedLocale, number>;
  deadline?: Date;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface TranslationRequest {
  id: string;
  sourceText: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  context: string;
  priority: Priority;
  requestedBy: string;
  assignedTo?: string;
  status: RequestStatus;
  deadline?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum RequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}