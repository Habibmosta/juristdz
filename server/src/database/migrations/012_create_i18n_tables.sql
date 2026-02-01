-- Create internationalization and legal terminology tables

-- Create translations table
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',
  key VARCHAR(500) NOT NULL,
  value TEXT NOT NULL,
  locale VARCHAR(10) NOT NULL CHECK (locale IN ('fr', 'ar', 'fr-DZ', 'ar-DZ')),
  context TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(namespace, key, locale)
);

-- Create legal terminology table
CREATE TABLE legal_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(50) NOT NULL CHECK (domain IN (
    'civil_law', 'criminal_law', 'commercial_law', 'administrative_law',
    'family_law', 'labor_law', 'real_estate_law', 'intellectual_property',
    'tax_law', 'constitutional_law', 'international_law', 'procedural_law'
  )),
  term_fr VARCHAR(200) NOT NULL,
  term_ar VARCHAR(200) NOT NULL,
  definition_fr TEXT NOT NULL,
  definition_ar TEXT NOT NULL,
  synonyms_fr JSONB DEFAULT '[]',
  synonyms_ar JSONB DEFAULT '[]',
  context VARCHAR(50) DEFAULT 'formal' CHECK (context IN (
    'formal', 'informal', 'technical', 'colloquial', 'archaic', 'modern'
  )),
  profession VARCHAR(50) CHECK (profession IN (
    'avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 
    'etudiant_droit', 'administrateur'
  )),
  source VARCHAR(500) NOT NULL,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create translation_memory table
CREATE TABLE translation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  source_locale VARCHAR(10) NOT NULL,
  target_locale VARCHAR(10) NOT NULL,
  domain VARCHAR(50),
  context TEXT,
  quality VARCHAR(20) DEFAULT 'machine' CHECK (quality IN (
    'machine', 'human', 'professional', 'certified'
  )),
  usage_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(source_text, target_text, source_locale, target_locale)
);

-- Create glossary_entries table
CREATE TABLE glossary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term VARCHAR(200) NOT NULL,
  translation VARCHAR(200) NOT NULL,
  source_locale VARCHAR(10) NOT NULL,
  target_locale VARCHAR(10) NOT NULL,
  domain VARCHAR(50),
  definition TEXT,
  examples JSONB DEFAULT '[]',
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(term, source_locale, target_locale)
);

-- Create localization_projects table
CREATE TABLE localization_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  source_locale VARCHAR(10) NOT NULL,
  target_locales JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_progress', 'review', 'completed', 'cancelled'
  )),
  progress JSONB DEFAULT '{}',
  deadline DATE,
  assigned_to JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create translation_requests table
CREATE TABLE translation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  target_text TEXT,
  source_locale VARCHAR(10) NOT NULL,
  target_locale VARCHAR(10) NOT NULL,
  context TEXT,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'rejected'
  )),
  requested_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  deadline DATE,
  notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_locales table for user language preferences
CREATE TABLE user_locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_locale VARCHAR(10) NOT NULL DEFAULT 'fr',
  date_format VARCHAR(20) DEFAULT 'dd/MM/yyyy',
  time_format VARCHAR(5) DEFAULT '24h',
  number_format VARCHAR(20) DEFAULT 'european',
  currency VARCHAR(5) DEFAULT 'DZD',
  timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
  rtl_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Create localized_content table for multilingual content
CREATE TABLE localized_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- 'document', 'notification', 'email', etc.
  content_id UUID NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  keywords JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  original_locale VARCHAR(10),
  translated_at TIMESTAMP,
  translated_by UUID REFERENCES users(id),
  translation_quality VARCHAR(20) DEFAULT 'machine',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_type, content_id, locale)
);

-- Create indexes for performance
CREATE INDEX idx_translations_namespace_locale ON translations(namespace, locale);
CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_locale ON translations(locale);
CREATE INDEX idx_translations_active ON translations(is_active);

CREATE INDEX idx_legal_terminology_domain ON legal_terminology(domain);
CREATE INDEX idx_legal_terminology_term_fr ON legal_terminology(term_fr);
CREATE INDEX idx_legal_terminology_term_ar ON legal_terminology(term_ar);
CREATE INDEX idx_legal_terminology_profession ON legal_terminology(profession);
CREATE INDEX idx_legal_terminology_approved ON legal_terminology(approved);

-- Full-text search indexes
CREATE INDEX idx_legal_terminology_search_fr ON legal_terminology 
  USING gin(to_tsvector('french', term_fr || ' ' || definition_fr));
CREATE INDEX idx_legal_terminology_search_ar ON legal_terminology 
  USING gin(to_tsvector('arabic', term_ar || ' ' || definition_ar));

CREATE INDEX idx_translation_memory_source ON translation_memory(source_locale, target_locale);
CREATE INDEX idx_translation_memory_domain ON translation_memory(domain);
CREATE INDEX idx_translation_memory_quality ON translation_memory(quality);

CREATE INDEX idx_glossary_entries_term ON glossary_entries(term);
CREATE INDEX idx_glossary_entries_locale ON glossary_entries(source_locale, target_locale);
CREATE INDEX idx_glossary_entries_domain ON glossary_entries(domain);
CREATE INDEX idx_glossary_entries_approved ON glossary_entries(approved);

CREATE INDEX idx_localization_projects_status ON localization_projects(status);
CREATE INDEX idx_localization_projects_deadline ON localization_projects(deadline);

CREATE INDEX idx_translation_requests_status ON translation_requests(status);
CREATE INDEX idx_translation_requests_priority ON translation_requests(priority);
CREATE INDEX idx_translation_requests_assigned ON translation_requests(assigned_to);
CREATE INDEX idx_translation_requests_deadline ON translation_requests(deadline);

CREATE INDEX idx_user_locales_user ON user_locales(user_id);
CREATE INDEX idx_user_locales_locale ON user_locales(preferred_locale);

CREATE INDEX idx_localized_content_type_id ON localized_content(content_type, content_id);
CREATE INDEX idx_localized_content_locale ON localized_content(locale);
CREATE INDEX idx_localized_content_original ON localized_content(original_locale);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER translations_updated_at_trigger
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER legal_terminology_updated_at_trigger
  BEFORE UPDATE ON legal_terminology
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER translation_memory_updated_at_trigger
  BEFORE UPDATE ON translation_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER glossary_entries_updated_at_trigger
  BEFORE UPDATE ON glossary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER localization_projects_updated_at_trigger
  BEFORE UPDATE ON localization_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER translation_requests_updated_at_trigger
  BEFORE UPDATE ON translation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_locales_updated_at_trigger
  BEFORE UPDATE ON user_locales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER localized_content_updated_at_trigger
  BEFORE UPDATE ON localized_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default translations (French)
INSERT INTO translations (namespace, key, value, locale, description) VALUES
  ('common', 'welcome', 'Bienvenue', 'fr', 'Welcome message'),
  ('common', 'loading', 'Chargement...', 'fr', 'Loading indicator'),
  ('common', 'save', 'Enregistrer', 'fr', 'Save button'),
  ('common', 'cancel', 'Annuler', 'fr', 'Cancel button'),
  ('common', 'delete', 'Supprimer', 'fr', 'Delete button'),
  ('common', 'edit', 'Modifier', 'fr', 'Edit button'),
  ('common', 'view', 'Voir', 'fr', 'View button'),
  ('common', 'search', 'Rechercher', 'fr', 'Search button'),
  ('common', 'filter', 'Filtrer', 'fr', 'Filter button'),
  ('common', 'export', 'Exporter', 'fr', 'Export button'),
  ('common', 'import', 'Importer', 'fr', 'Import button'),
  ('common', 'print', 'Imprimer', 'fr', 'Print button'),
  ('common', 'download', 'Télécharger', 'fr', 'Download button'),
  ('common', 'upload', 'Téléverser', 'fr', 'Upload button'),
  ('common', 'close', 'Fermer', 'fr', 'Close button'),
  ('common', 'back', 'Retour', 'fr', 'Back button'),
  ('common', 'next', 'Suivant', 'fr', 'Next button'),
  ('common', 'previous', 'Précédent', 'fr', 'Previous button'),
  ('common', 'yes', 'Oui', 'fr', 'Yes confirmation'),
  ('common', 'no', 'Non', 'fr', 'No confirmation'),
  
  ('auth', 'login', 'Connexion', 'fr', 'Login page title'),
  ('auth', 'logout', 'Déconnexion', 'fr', 'Logout action'),
  ('auth', 'email', 'Adresse e-mail', 'fr', 'Email field label'),
  ('auth', 'password', 'Mot de passe', 'fr', 'Password field label'),
  ('auth', 'remember_me', 'Se souvenir de moi', 'fr', 'Remember me checkbox'),
  ('auth', 'forgot_password', 'Mot de passe oublié ?', 'fr', 'Forgot password link'),
  ('auth', 'register', 'S''inscrire', 'fr', 'Register link'),
  ('auth', 'profile', 'Profil', 'fr', 'Profile page'),
  ('auth', 'settings', 'Paramètres', 'fr', 'Settings page'),
  
  ('navigation', 'dashboard', 'Tableau de bord', 'fr', 'Dashboard menu item'),
  ('navigation', 'cases', 'Dossiers', 'fr', 'Cases menu item'),
  ('navigation', 'documents', 'Documents', 'fr', 'Documents menu item'),
  ('navigation', 'billing', 'Facturation', 'fr', 'Billing menu item'),
  ('navigation', 'search', 'Recherche', 'fr', 'Search menu item'),
  ('navigation', 'reports', 'Rapports', 'fr', 'Reports menu item'),
  ('navigation', 'notifications', 'Notifications', 'fr', 'Notifications menu item'),
  ('navigation', 'admin', 'Administration', 'fr', 'Admin menu item'),
  
  ('forms', 'required', 'Ce champ est obligatoire', 'fr', 'Required field validation'),
  ('forms', 'invalid_email', 'Adresse e-mail invalide', 'fr', 'Invalid email validation'),
  ('forms', 'min_length', 'Minimum {{min}} caractères', 'fr', 'Minimum length validation'),
  ('forms', 'max_length', 'Maximum {{max}} caractères', 'fr', 'Maximum length validation'),
  ('forms', 'invalid_phone', 'Numéro de téléphone invalide', 'fr', 'Invalid phone validation'),
  ('forms', 'invalid_date', 'Date invalide', 'fr', 'Invalid date validation'),
  
  ('errors', 'not_found', 'Page non trouvée', 'fr', '404 error message'),
  ('errors', 'unauthorized', 'Accès non autorisé', 'fr', '401 error message'),
  ('errors', 'forbidden', 'Accès interdit', 'fr', '403 error message'),
  ('errors', 'server_error', 'Erreur serveur', 'fr', '500 error message'),
  ('errors', 'network_error', 'Erreur de connexion', 'fr', 'Network error message');

-- Insert default translations (Arabic)
INSERT INTO translations (namespace, key, value, locale, description) VALUES
  ('common', 'welcome', 'مرحباً', 'ar', 'Welcome message'),
  ('common', 'loading', 'جاري التحميل...', 'ar', 'Loading indicator'),
  ('common', 'save', 'حفظ', 'ar', 'Save button'),
  ('common', 'cancel', 'إلغاء', 'ar', 'Cancel button'),
  ('common', 'delete', 'حذف', 'ar', 'Delete button'),
  ('common', 'edit', 'تعديل', 'ar', 'Edit button'),
  ('common', 'view', 'عرض', 'ar', 'View button'),
  ('common', 'search', 'بحث', 'ar', 'Search button'),
  ('common', 'filter', 'تصفية', 'ar', 'Filter button'),
  ('common', 'export', 'تصدير', 'ar', 'Export button'),
  ('common', 'import', 'استيراد', 'ar', 'Import button'),
  ('common', 'print', 'طباعة', 'ar', 'Print button'),
  ('common', 'download', 'تحميل', 'ar', 'Download button'),
  ('common', 'upload', 'رفع', 'ar', 'Upload button'),
  ('common', 'close', 'إغلاق', 'ar', 'Close button'),
  ('common', 'back', 'رجوع', 'ar', 'Back button'),
  ('common', 'next', 'التالي', 'ar', 'Next button'),
  ('common', 'previous', 'السابق', 'ar', 'Previous button'),
  ('common', 'yes', 'نعم', 'ar', 'Yes confirmation'),
  ('common', 'no', 'لا', 'ar', 'No confirmation'),
  
  ('auth', 'login', 'تسجيل الدخول', 'ar', 'Login page title'),
  ('auth', 'logout', 'تسجيل الخروج', 'ar', 'Logout action'),
  ('auth', 'email', 'البريد الإلكتروني', 'ar', 'Email field label'),
  ('auth', 'password', 'كلمة المرور', 'ar', 'Password field label'),
  ('auth', 'remember_me', 'تذكرني', 'ar', 'Remember me checkbox'),
  ('auth', 'forgot_password', 'نسيت كلمة المرور؟', 'ar', 'Forgot password link'),
  ('auth', 'register', 'إنشاء حساب', 'ar', 'Register link'),
  ('auth', 'profile', 'الملف الشخصي', 'ar', 'Profile page'),
  ('auth', 'settings', 'الإعدادات', 'ar', 'Settings page'),
  
  ('navigation', 'dashboard', 'لوحة التحكم', 'ar', 'Dashboard menu item'),
  ('navigation', 'cases', 'القضايا', 'ar', 'Cases menu item'),
  ('navigation', 'documents', 'الوثائق', 'ar', 'Documents menu item'),
  ('navigation', 'billing', 'الفوترة', 'ar', 'Billing menu item'),
  ('navigation', 'search', 'البحث', 'ar', 'Search menu item'),
  ('navigation', 'reports', 'التقارير', 'ar', 'Reports menu item'),
  ('navigation', 'notifications', 'الإشعارات', 'ar', 'Notifications menu item'),
  ('navigation', 'admin', 'الإدارة', 'ar', 'Admin menu item'),
  
  ('forms', 'required', 'هذا الحقل مطلوب', 'ar', 'Required field validation'),
  ('forms', 'invalid_email', 'عنوان بريد إلكتروني غير صحيح', 'ar', 'Invalid email validation'),
  ('forms', 'min_length', 'الحد الأدنى {{min}} أحرف', 'ar', 'Minimum length validation'),
  ('forms', 'max_length', 'الحد الأقصى {{max}} أحرف', 'ar', 'Maximum length validation'),
  ('forms', 'invalid_phone', 'رقم هاتف غير صحيح', 'ar', 'Invalid phone validation'),
  ('forms', 'invalid_date', 'تاريخ غير صحيح', 'ar', 'Invalid date validation'),
  
  ('errors', 'not_found', 'الصفحة غير موجودة', 'ar', '404 error message'),
  ('errors', 'unauthorized', 'غير مخول بالوصول', 'ar', '401 error message'),
  ('errors', 'forbidden', 'الوصول محظور', 'ar', '403 error message'),
  ('errors', 'server_error', 'خطأ في الخادم', 'ar', '500 error message'),
  ('errors', 'network_error', 'خطأ في الاتصال', 'ar', 'Network error message');

-- Insert legal terminology (French-Arabic)
INSERT INTO legal_terminology (domain, term_fr, term_ar, definition_fr, definition_ar, context, source) VALUES
  ('civil_law', 'Contrat', 'عقد', 'Accord de volontés créant des obligations juridiques', 'اتفاق إرادات ينشئ التزامات قانونية', 'formal', 'Code civil algérien'),
  ('civil_law', 'Responsabilité civile', 'المسؤولية المدنية', 'Obligation de réparer le dommage causé à autrui', 'التزام بإصلاح الضرر المسبب للغير', 'formal', 'Code civil algérien'),
  ('civil_law', 'Dommages-intérêts', 'تعويضات', 'Somme d''argent destinée à réparer un préjudice', 'مبلغ مالي مخصص لإصلاح ضرر', 'formal', 'Code civil algérien'),
  ('civil_law', 'Prescription', 'التقادم', 'Extinction d''un droit par l''écoulement du temps', 'انقضاء حق بمرور الزمن', 'formal', 'Code civil algérien'),
  ('civil_law', 'Nullité', 'البطلان', 'Sanction frappant un acte juridique défectueux', 'جزاء يصيب تصرف قانوني معيب', 'formal', 'Code civil algérien'),
  
  ('criminal_law', 'Infraction', 'جريمة', 'Violation de la loi pénale', 'مخالفة للقانون الجنائي', 'formal', 'Code pénal algérien'),
  ('criminal_law', 'Délit', 'جنحة', 'Infraction de gravité moyenne', 'جريمة متوسطة الخطورة', 'formal', 'Code pénal algérien'),
  ('criminal_law', 'Crime', 'جناية', 'Infraction la plus grave', 'أخطر أنواع الجرائم', 'formal', 'Code pénal algérien'),
  ('criminal_law', 'Préméditation', 'سبق الإصرار', 'Dessein formé avant l''action', 'قصد مكون قبل الفعل', 'formal', 'Code pénal algérien'),
  ('criminal_law', 'Légitime défense', 'الدفاع الشرعي', 'Droit de se défendre contre une agression', 'حق الدفاع ضد اعتداء', 'formal', 'Code pénal algérien'),
  
  ('commercial_law', 'Société', 'شركة', 'Groupement de personnes en vue d''un but commun', 'تجمع أشخاص لهدف مشترك', 'formal', 'Code de commerce algérien'),
  ('commercial_law', 'Fonds de commerce', 'المحل التجاري', 'Ensemble des biens mobiliers affectés au commerce', 'مجموعة الأموال المنقولة المخصصة للتجارة', 'formal', 'Code de commerce algérien'),
  ('commercial_law', 'Bilan', 'الميزانية', 'Document comptable présentant la situation financière', 'وثيقة محاسبية تعرض الوضع المالي', 'formal', 'Code de commerce algérien'),
  ('commercial_law', 'Faillite', 'الإفلاس', 'Situation d''un commerçant qui ne peut payer ses dettes', 'وضع تاجر لا يستطيع دفع ديونه', 'formal', 'Code de commerce algérien'),
  
  ('administrative_law', 'Service public', 'المرفق العام', 'Activité d''intérêt général assurée par l''administration', 'نشاط ذو مصلحة عامة تؤمنه الإدارة', 'formal', 'Droit administratif algérien'),
  ('administrative_law', 'Acte administratif', 'القرار الإداري', 'Décision unilatérale de l''administration', 'قرار انفرادي من الإدارة', 'formal', 'Droit administratif algérien'),
  ('administrative_law', 'Recours pour excès de pouvoir', 'دعوى تجاوز السلطة', 'Recours contre un acte administratif illégal', 'طعن ضد قرار إداري غير قانوني', 'formal', 'Droit administratif algérien'),
  
  ('family_law', 'Mariage', 'الزواج', 'Union légale entre deux personnes', 'اتحاد قانوني بين شخصين', 'formal', 'Code de la famille algérien'),
  ('family_law', 'Divorce', 'الطلاق', 'Dissolution du lien matrimonial', 'حل الرابطة الزوجية', 'formal', 'Code de la famille algérien'),
  ('family_law', 'Garde des enfants', 'حضانة الأطفال', 'Droit et devoir d''élever un enfant', 'حق وواجب تربية الطفل', 'formal', 'Code de la famille algérien'),
  ('family_law', 'Pension alimentaire', 'النفقة', 'Obligation de subvenir aux besoins d''une personne', 'التزام بتلبية احتياجات شخص', 'formal', 'Code de la famille algérien'),
  
  ('labor_law', 'Contrat de travail', 'عقد العمل', 'Convention par laquelle une personne s''engage à travailler', 'اتفاقية يلتزم بموجبها شخص بالعمل', 'formal', 'Code du travail algérien'),
  ('labor_law', 'Licenciement', 'الفصل من العمل', 'Rupture du contrat de travail à l''initiative de l''employeur', 'إنهاء عقد العمل بمبادرة من صاحب العمل', 'formal', 'Code du travail algérien'),
  ('labor_law', 'Syndicat', 'النقابة', 'Organisation de défense des intérêts des travailleurs', 'منظمة للدفاع عن مصالح العمال', 'formal', 'Code du travail algérien'),
  
  ('real_estate_law', 'Propriété', 'الملكية', 'Droit de jouir et disposer des choses', 'حق الانتفاع والتصرف في الأشياء', 'formal', 'Code civil algérien'),
  ('real_estate_law', 'Hypothèque', 'الرهن', 'Sûreté réelle immobilière', 'ضمان عيني عقاري', 'formal', 'Code civil algérien'),
  ('real_estate_law', 'Servitude', 'الارتفاق', 'Charge imposée sur un immeuble', 'عبء مفروض على عقار', 'formal', 'Code civil algérien'),
  
  ('procedural_law', 'Assignation', 'التكليف بالحضور', 'Acte par lequel on cite quelqu''un en justice', 'إجراء استدعاء شخص للمحكمة', 'formal', 'Code de procédure civile'),
  ('procedural_law', 'Jugement', 'الحكم', 'Décision rendue par un tribunal', 'قرار صادر عن محكمة', 'formal', 'Code de procédure civile'),
  ('procedural_law', 'Appel', 'الاستئناف', 'Voie de recours contre un jugement', 'طريق طعن ضد حكم', 'formal', 'Code de procédure civile'),
  ('procedural_law', 'Cassation', 'النقض', 'Recours devant la Cour suprême', 'طعن أمام المحكمة العليا', 'formal', 'Code de procédure civile'),
  ('procedural_law', 'Exécution forcée', 'التنفيذ الجبري', 'Mise en œuvre forcée d''une décision de justice', 'تطبيق قسري لقرار قضائي', 'formal', 'Code de procédure civile');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON translations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON legal_terminology TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON translation_memory TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON glossary_entries TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON localization_projects TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON translation_requests TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_locales TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON localized_content TO app_user;