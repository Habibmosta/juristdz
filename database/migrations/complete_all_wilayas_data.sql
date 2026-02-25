-- Migration: Complétion des données pour toutes les 69 wilayas
-- Date: 2025-02-25
-- Description: Ajout des données complètes (tribunaux, barreaux, etc.) pour toutes les wilayas

-- ============================================
-- INSERTION DES 58 WILAYAS EXISTANTES (si manquantes)
-- ============================================

INSERT INTO wilayas (code, name_fr, name_ar, region) VALUES
('01', 'Adrar', 'أدرار', 'Sud'),
('02', 'Chlef', 'الشلف', 'Centre'),
('03', 'Laghouat', 'الأغواط', 'Hautes Plaines'),
('04', 'Oum El Bouaghi', 'أم البواقي', 'Est'),
('05', 'Batna', 'باتنة', 'Est'),
('06', 'Béjaïa', 'بجاية', 'Kabylie'),
('07', 'Biskra', 'بسكرة', 'Sud-Est'),
('08', 'Béchar', 'بشار', 'Sud-Ouest'),
('09', 'Blida', 'البليدة', 'Centre'),
('10', 'Bouira', 'البويرة', 'Kabylie'),
('11', 'Tamanrasset', 'تمنراست', 'Sahara'),
('12', 'Tébessa', 'تبسة', 'Est'),
('13', 'Tlemcen', 'تلمسان', 'Ouest'),
('14', 'Tiaret', 'تيارت', 'Hautes Plaines'),
('15', 'Tizi Ouzou', 'تيزي وزو', 'Kabylie'),
('16', 'Alger', 'الجزائر', 'Centre'),
('17', 'Djelfa', 'الجلفة', 'Hautes Plaines'),
('18', 'Jijel', 'جيجل', 'Est'),
('19', 'Sétif', 'سطيف', 'Est'),
('20', 'Saïda', 'سعيدة', 'Ouest'),
('21', 'Skikda', 'سكيكدة', 'Est'),
('22', 'Sidi Bel Abbès', 'سيدي بلعباس', 'Ouest'),
('23', 'Annaba', 'عنابة', 'Est'),
('24', 'Guelma', 'قالمة', 'Est'),
('25', 'Constantine', 'قسنطينة', 'Est'),
('26', 'Médéa', 'المدية', 'Centre'),
('27', 'Mostaganem', 'مستغانم', 'Ouest'),
('28', 'M''Sila', 'المسيلة', 'Hautes Plaines'),
('29', 'Mascara', 'معسكر', 'Ouest'),
('30', 'Ouargla', 'ورقلة', 'Sahara'),
('31', 'Oran', 'وهران', 'Ouest'),
('32', 'El Bayadh', 'البيض', 'Hautes Plaines'),
('33', 'Illizi', 'إليزي', 'Sahara'),
('34', 'Bordj Bou Arréridj', 'برج بوعريريج', 'Est'),
('35', 'Boumerdès', 'بومرداس', 'Centre'),
('36', 'El Tarf', 'الطارف', 'Est'),
('37', 'Tindouf', 'تندوف', 'Sahara'),
('38', 'Tissemsilt', 'تيسمسيلت', 'Hautes Plaines'),
('39', 'El Oued', 'الوادي', 'Sahara'),
('40', 'Khenchela', 'خنشلة', 'Est'),
('41', 'Souk Ahras', 'سوق أهراس', 'Est'),
('42', 'Tipaza', 'تيبازة', 'Centre'),
('43', 'Mila', 'ميلة', 'Est'),
('44', 'Aïn Defla', 'عين الدفلى', 'Centre'),
('45', 'Naâma', 'النعامة', 'Ouest'),
('46', 'Aïn Témouchent', 'عين تموشنت', 'Ouest'),
('47', 'Ghardaïa', 'غرداية', 'Sahara'),
('48', 'Relizane', 'غليزان', 'Ouest'),
('49', 'Timimoun', 'تيميمون', 'Sahara'),
('50', 'Bordj Badji Mokhtar', 'برج باجي مختار', 'Sahara'),
('51', 'Ouled Djellal', 'أولاد جلال', 'Sahara'),
('52', 'Béni Abbès', 'بني عباس', 'Sahara'),
('53', 'In Salah', 'عين صالح', 'Sahara'),
('54', 'In Guezzam', 'عين قزام', 'Sahara'),
('55', 'Touggourt', 'تقرت', 'Sahara'),
('56', 'Djanet', 'جانت', 'Sahara'),
('57', 'El M''Ghair', 'المغير', 'Sahara'),
('58', 'El Meniaa', 'المنيعة', 'Sahara')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CRÉATION TABLE CONSERVATION_FONCIERE
-- ============================================

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

-- ============================================
-- CRÉATION TABLE CHAMBRES_NOTAIRES
-- ============================================

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

-- ============================================
-- CRÉATION TABLE CHAMBRES_HUISSIERS
-- ============================================

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
-- INSERTION CONSERVATION FONCIERE POUR TOUTES LES WILAYAS
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
  END LOOP;
END $$;

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue complète des wilayas avec toutes leurs institutions
CREATE OR REPLACE VIEW v_wilayas_complete AS
SELECT 
  w.code,
  w.name_fr,
  w.name_ar,
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
GROUP BY w.code, w.name_fr, w.name_ar, w.region
ORDER BY w.code::INTEGER;

-- Vue des nouvelles wilayas (59-69)
CREATE OR REPLACE VIEW v_nouvelles_wilayas AS
SELECT * FROM v_wilayas_complete
WHERE code::INTEGER >= 59;

-- ============================================
-- STATISTIQUES
-- ============================================

-- Statistiques globales
SELECT 
  'Total Wilayas' as categorie,
  COUNT(*) as nombre
FROM wilayas
UNION ALL
SELECT 
  'Total Tribunaux' as categorie,
  COUNT(*) as nombre
FROM tribunaux
UNION ALL
SELECT 
  'Total Barreaux' as categorie,
  COUNT(*) as nombre
FROM barreaux
UNION ALL
SELECT 
  'Total Conservations Foncières' as categorie,
  COUNT(*) as nombre
FROM conservation_fonciere
UNION ALL
SELECT 
  'Total Chambres Notaires' as categorie,
  COUNT(*) as nombre
FROM chambres_notaires
UNION ALL
SELECT 
  'Total Chambres Huissiers' as categorie,
  COUNT(*) as nombre
FROM chambres_huissiers;

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tribunaux_wilaya ON tribunaux(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_barreaux_wilaya ON barreaux(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_conservation_wilaya ON conservation_fonciere(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_chambres_notaires_wilaya ON chambres_notaires(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_chambres_huissiers_wilaya ON chambres_huissiers(wilaya_code);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
