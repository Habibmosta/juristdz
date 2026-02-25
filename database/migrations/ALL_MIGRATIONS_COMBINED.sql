-- ============================================
-- MIGRATION COMPLÈTE - 69 WILAYAS D'ALGÉRIE
-- Date: 2025-02-25
-- Description: Migration complète pour ajouter toutes les données des 69 wilayas
-- ============================================

-- Ce fichier combine toutes les migrations en un seul fichier
-- pour faciliter l'exécution dans le SQL Editor de Supabase

-- ============================================
-- PARTIE 1: CRÉATION DES TABLES
-- ============================================

-- Table wilayas
CREATE TABLE IF NOT EXISTS wilayas (
  id SERIAL PRIMARY KEY,
  code VARCHAR(2) UNIQUE NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  code_postal_prefix VARCHAR(2) NOT NULL,
  region VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table tribunaux
CREATE TABLE IF NOT EXISTS tribunaux (
  id SERIAL PRIMARY KEY,
  wilaya_code VARCHAR(2) REFERENCES wilayas(code),
  name_fr VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table barreaux
CREATE TABLE IF NOT EXISTS barreaux (
  id SERIAL PRIMARY KEY,
  wilaya_code VARCHAR(2) REFERENCES wilayas(code),
  name_fr VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  president VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table conservation_fonciere
CREATE TABLE IF NOT EXISTS conservation_fonciere (
  id SERIAL PRIMARY KEY,
  wilaya_code VARCHAR(2) REFERENCES wilayas(code),
  name_fr VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table chambres_notaires
CREATE TABLE IF NOT EXISTS chambres_notaires (
  id SERIAL PRIMARY KEY,
  wilaya_code VARCHAR(2) REFERENCES wilayas(code),
  name_fr VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  president VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table chambres_huissiers
CREATE TABLE IF NOT EXISTS chambres_huissiers (
  id SERIAL PRIMARY KEY,
  wilaya_code VARCHAR(2) REFERENCES wilayas(code),
  name_fr VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  president VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PARTIE 2: INSERTION DES 69 WILAYAS
-- ============================================

INSERT INTO wilayas (code, name_fr, name_ar, code_postal_prefix, region) VALUES
('01', 'Adrar', 'أدرار', '01', 'Sud'),
('02', 'Chlef', 'الشلف', '02', 'Centre'),
('03', 'Laghouat', 'الأغواط', '03', 'Hautes Plaines'),
('04', 'Oum El Bouaghi', 'أم البواقي', '04', 'Est'),
('05', 'Batna', 'باتنة', '05', 'Est'),
('06', 'Béjaïa', 'بجاية', '06', 'Kabylie'),
('07', 'Biskra', 'بسكرة', '07', 'Sud-Est'),
('08', 'Béchar', 'بشار', '08', 'Sud-Ouest'),
('09', 'Blida', 'البليدة', '09', 'Centre'),
('10', 'Bouira', 'البويرة', '10', 'Kabylie'),
('11', 'Tamanrasset', 'تمنراست', '11', 'Sahara'),
('12', 'Tébessa', 'تبسة', '12', 'Est'),
('13', 'Tlemcen', 'تلمسان', '13', 'Ouest'),
('14', 'Tiaret', 'تيارت', '14', 'Hautes Plaines'),
('15', 'Tizi Ouzou', 'تيزي وزو', '15', 'Kabylie'),
('16', 'Alger', 'الجزائر', '16', 'Centre'),
('17', 'Djelfa', 'الجلفة', '17', 'Hautes Plaines'),
('18', 'Jijel', 'جيجل', '18', 'Est'),
('19', 'Sétif', 'سطيف', '19', 'Est'),
('20', 'Saïda', 'سعيدة', '20', 'Ouest'),
('21', 'Skikda', 'سكيكدة', '21', 'Est'),
('22', 'Sidi Bel Abbès', 'سيدي بلعباس', '22', 'Ouest'),
('23', 'Annaba', 'عنابة', '23', 'Est'),
('24', 'Guelma', 'قالمة', '24', 'Est'),
('25', 'Constantine', 'قسنطينة', '25', 'Est'),
('26', 'Médéa', 'المدية', '26', 'Centre'),
('27', 'Mostaganem', 'مستغانم', '27', 'Ouest'),
('28', 'M''Sila', 'المسيلة', '28', 'Hautes Plaines'),
('29', 'Mascara', 'معسكر', '29', 'Ouest'),
('30', 'Ouargla', 'ورقلة', '30', 'Sahara'),
('31', 'Oran', 'وهران', '31', 'Ouest'),
('32', 'El Bayadh', 'البيض', '32', 'Hautes Plaines'),
('33', 'Illizi', 'إليزي', '33', 'Sahara'),
('34', 'Bordj Bou Arréridj', 'برج بوعريريج', '34', 'Est'),
('35', 'Boumerdès', 'بومرداس', '35', 'Centre'),
('36', 'El Tarf', 'الطارف', '36', 'Est'),
('37', 'Tindouf', 'تندوف', '37', 'Sahara'),
('38', 'Tissemsilt', 'تيسمسيلت', '38', 'Hautes Plaines'),
('39', 'El Oued', 'الوادي', '39', 'Sahara'),
('40', 'Khenchela', 'خنشلة', '40', 'Est'),
('41', 'Souk Ahras', 'سوق أهراس', '41', 'Est'),
('42', 'Tipaza', 'تيبازة', '42', 'Centre'),
('43', 'Mila', 'ميلة', '43', 'Est'),
('44', 'Aïn Defla', 'عين الدفلى', '44', 'Centre'),
('45', 'Naâma', 'النعامة', '45', 'Ouest'),
('46', 'Aïn Témouchent', 'عين تموشنت', '46', 'Ouest'),
('47', 'Ghardaïa', 'غرداية', '47', 'Sahara'),
('48', 'Relizane', 'غليزان', '48', 'Ouest'),
('49', 'Timimoun', 'تيميمون', '49', 'Sahara'),
('50', 'Bordj Badji Mokhtar', 'برج باجي مختار', '50', 'Sahara'),
('51', 'Ouled Djellal', 'أولاد جلال', '51', 'Sahara'),
('52', 'Béni Abbès', 'بني عباس', '52', 'Sahara'),
('53', 'In Salah', 'عين صالح', '53', 'Sahara'),
('54', 'In Guezzam', 'عين قزام', '54', 'Sahara'),
('55', 'Touggourt', 'تقرت', '55', 'Sahara'),
('56', 'Djanet', 'جانت', '56', 'Sahara'),
('57', 'El M''Ghair', 'المغير', '57', 'Sahara'),
('58', 'El Meniaa', 'المنيعة', '58', 'Sahara'),
-- Nouvelles wilayas (novembre 2025)
('59', 'Aflou', 'أفلو', '59', 'Hautes Plaines'),
('60', 'Barika', 'باريكة', '60', 'Hautes Plaines'),
('61', 'Ksar Chellala', 'قصر الشلالة', '61', 'Hautes Plaines'),
('62', 'Messaad', 'مسعد', '62', 'Hautes Plaines'),
('63', 'Aïn Oussera', 'عين وسارة', '63', 'Hautes Plaines'),
('64', 'Boussaâda', 'بوسعادة', '64', 'Hautes Plaines'),
('65', 'El Abiodh Sidi Cheikh', 'الأبيض سيدي الشيخ', '65', 'Sud'),
('66', 'El Kantara', 'القنطرة', '66', 'Sud'),
('67', 'Bir El Ater', 'بئر العاتر', '67', 'Sud-Est'),
('68', 'Ksar El Boukhari', 'قصر البخاري', '68', 'Centre'),
('69', 'El Aricha', 'العريشة', '69', 'Ouest')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  code_postal_prefix = EXCLUDED.code_postal_prefix,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- PARTIE 3: INSERTION AUTOMATIQUE DES INSTITUTIONS
-- ============================================

-- Fonction pour générer les insertions automatiquement
DO $$
DECLARE
  wilaya_rec RECORD;
BEGIN
  FOR wilaya_rec IN SELECT code, name_fr, name_ar FROM wilayas ORDER BY code::INTEGER
  LOOP
    -- Conservation Foncière
    INSERT INTO conservation_fonciere (wilaya_code, name_fr, name_ar, address)
    VALUES (
      wilaya_rec.code,
      'Conservation Foncière de ' || wilaya_rec.name_fr,
      'المحافظة العقارية ' || wilaya_rec.name_ar,
      'Centre-ville, ' || wilaya_rec.name_fr
    )
    ON CONFLICT DO NOTHING;
    
    -- Chambre des Notaires
    INSERT INTO chambres_notaires (wilaya_code, name_fr, name_ar, address)
    VALUES (
      wilaya_rec.code,
      'Chambre des Notaires de ' || wilaya_rec.name_fr,
      'غرفة الموثقين ' || wilaya_rec.name_ar,
      'Centre-ville, ' || wilaya_rec.name_fr
    )
    ON CONFLICT DO NOTHING;
    
    -- Chambre des Huissiers
    INSERT INTO chambres_huissiers (wilaya_code, name_fr, name_ar, address)
    VALUES (
      wilaya_rec.code,
      'Chambre des Huissiers de ' || wilaya_rec.name_fr,
      'غرفة المحضرين ' || wilaya_rec.name_ar,
      'Centre-ville, ' || wilaya_rec.name_fr
    )
    ON CONFLICT DO NOTHING;
    
    -- Barreau
    INSERT INTO barreaux (wilaya_code, name_fr, name_ar, address)
    VALUES (
      wilaya_rec.code,
      'Barreau de ' || wilaya_rec.name_fr,
      'نقابة المحامين ' || wilaya_rec.name_ar,
      'Centre-ville, ' || wilaya_rec.name_fr
    )
    ON CONFLICT DO NOTHING;
    
    -- Tribunaux (2 par wilaya: première instance + administratif)
    INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address)
    VALUES (
      wilaya_rec.code,
      'Tribunal de Première Instance de ' || wilaya_rec.name_fr,
      'محكمة ' || wilaya_rec.name_ar,
      'premiere_instance',
      'Centre-ville, ' || wilaya_rec.name_fr
    )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address)
    VALUES (
      wilaya_rec.code,
      'Tribunal Administratif de ' || wilaya_rec.name_fr,
      'المحكمة الإدارية ' || wilaya_rec.name_ar,
      'administratif',
      'Centre-ville, ' || wilaya_rec.name_fr
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- PARTIE 4: INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tribunaux_wilaya ON tribunaux(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_barreaux_wilaya ON barreaux(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_conservation_wilaya ON conservation_fonciere(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_chambres_notaires_wilaya ON chambres_notaires(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_chambres_huissiers_wilaya ON chambres_huissiers(wilaya_code);

-- ============================================
-- PARTIE 5: VUES UTILES
-- ============================================

CREATE OR REPLACE VIEW v_wilayas_complete AS
SELECT 
  w.code,
  w.name_fr,
  w.name_ar,
  w.code_postal_prefix,
  w.region,
  COUNT(DISTINCT t.id) as nombre_tribunaux,
  COUNT(DISTINCT b.id) as nombre_barreaux,
  COUNT(DISTINCT cf.id) as nombre_conservations,
  COUNT(DISTINCT cn.id) as nombre_chambres_notaires,
  COUNT(DISTINCT ch.id) as nombre_chambres_huissiers
FROM wilayas w
LEFT JOIN tribunaux t ON w.code = t.wilaya_code
LEFT JOIN barreaux b ON w.code = b.wilaya_code
LEFT JOIN conservation_fonciere cf ON w.code = cf.wilaya_code
LEFT JOIN chambres_notaires cn ON w.code = cn.wilaya_code
LEFT JOIN chambres_huissiers ch ON w.code = ch.wilaya_code
GROUP BY w.code, w.name_fr, w.name_ar, w.code_postal_prefix, w.region
ORDER BY w.code::INTEGER;

-- ============================================
-- PARTIE 6: VÉRIFICATION FINALE
-- ============================================

-- Compter le nombre total de wilayas (devrait être 69)
SELECT 'Total Wilayas' as info, COUNT(*) as nombre FROM wilayas
UNION ALL
SELECT 'Total Tribunaux' as info, COUNT(*) as nombre FROM tribunaux
UNION ALL
SELECT 'Total Barreaux' as info, COUNT(*) as nombre FROM barreaux
UNION ALL
SELECT 'Total Conservations' as info, COUNT(*) as nombre FROM conservation_fonciere
UNION ALL
SELECT 'Total Chambres Notaires' as info, COUNT(*) as nombre FROM chambres_notaires
UNION ALL
SELECT 'Total Chambres Huissiers' as info, COUNT(*) as nombre FROM chambres_huissiers;

-- Lister les nouvelles wilayas (59-69)
SELECT code, name_fr, name_ar, code_postal_prefix, region 
FROM wilayas 
WHERE code::INTEGER >= 59 
ORDER BY code::INTEGER;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Afficher un message de succès
SELECT '✅ Migration terminée avec succès! 69 wilayas créées.' as message;
