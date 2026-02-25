-- Migration: Ajout des 11 nouvelles wilayas (59-69) - Novembre 2025
-- Date: 2025-02-25
-- Description: Ajout des 11 nouvelles wilayas créées en novembre 2025

-- ============================================
-- 1. CRÉATION DE LA TABLE WILAYAS (si elle n'existe pas)
-- ============================================

CREATE TABLE IF NOT EXISTS wilayas (
  id SERIAL PRIMARY KEY,
  code VARCHAR(2) UNIQUE NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. INSERTION DES 11 NOUVELLES WILAYAS
-- ============================================

-- Wilaya 59: Aflou (détachée de Laghouat)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('59', 'Aflou', 'أفلو', 'Hautes Plaines')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 60: Barika (détachée de Batna)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('60', 'Barika', 'باريكة', 'Hautes Plaines')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 61: Ksar Chellala (détachée de Tiaret)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('61', 'Ksar Chellala', 'قصر الشلالة', 'Hautes Plaines')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 62: Messaad (détachée de Djelfa)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('62', 'Messaad', 'مسعد', 'Hautes Plaines')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 63: Aïn Oussera (détachée de Djelfa)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('63', 'Aïn Oussera', 'عين وسارة', 'Hautes Plaines')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 64: Boussaâda (détachée de M'Sila)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('64', 'Boussaâda', 'بوسعادة', 'Hautes Plaines')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 65: El Abiodh Sidi Cheikh (détachée de El Bayadh)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('65', 'El Abiodh Sidi Cheikh', 'الأبيض سيدي الشيخ', 'Sud')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 66: El Kantara (détachée de Biskra)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('66', 'El Kantara', 'القنطرة', 'Sud')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 67: Bir El Ater (détachée de Tébessa)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('67', 'Bir El Ater', 'بئر العاتر', 'Sud-Est')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 68: Ksar El Boukhari (détachée de Médéa)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('68', 'Ksar El Boukhari', 'قصر البخاري', 'Centre')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- Wilaya 69: El Aricha (détachée de Tlemcen)
INSERT INTO wilayas (code, name_fr, name_ar, region) 
VALUES ('69', 'El Aricha', 'العريشة', 'Ouest')
ON CONFLICT (code) DO UPDATE SET 
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  region = EXCLUDED.region,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- 3. CRÉATION DE LA TABLE TRIBUNAUX (si elle n'existe pas)
-- ============================================

CREATE TABLE IF NOT EXISTS tribunaux (
  id SERIAL PRIMARY KEY,
  wilaya_code VARCHAR(2) REFERENCES wilayas(code),
  name_fr VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- premiere_instance, appel, administratif, commerce
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. INSERTION DES TRIBUNAUX POUR LES NOUVELLES WILAYAS
-- ============================================

-- Tribunaux pour Aflou (59)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('59', 'Tribunal de Première Instance d''Aflou', 'محكمة أفلو', 'premiere_instance', 'Centre-ville, Aflou 03300', NULL),
('59', 'Tribunal Administratif d''Aflou', 'المحكمة الإدارية أفلو', 'administratif', 'Centre-ville, Aflou 03300', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Barika (60)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('60', 'Tribunal de Première Instance de Barika', 'محكمة باريكة', 'premiere_instance', 'Centre-ville, Barika 05400', NULL),
('60', 'Tribunal Administratif de Barika', 'المحكمة الإدارية باريكة', 'administratif', 'Centre-ville, Barika 05400', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Ksar Chellala (61)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('61', 'Tribunal de Première Instance de Ksar Chellala', 'محكمة قصر الشلالة', 'premiere_instance', 'Centre-ville, Ksar Chellala 14200', NULL),
('61', 'Tribunal Administratif de Ksar Chellala', 'المحكمة الإدارية قصر الشلالة', 'administratif', 'Centre-ville, Ksar Chellala 14200', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Messaad (62)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('62', 'Tribunal de Première Instance de Messaad', 'محكمة مسعد', 'premiere_instance', 'Centre-ville, Messaad 17300', NULL),
('62', 'Tribunal Administratif de Messaad', 'المحكمة الإدارية مسعد', 'administratif', 'Centre-ville, Messaad 17300', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Aïn Oussera (63)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('63', 'Tribunal de Première Instance d''Aïn Oussera', 'محكمة عين وسارة', 'premiere_instance', 'Centre-ville, Aïn Oussera 17400', NULL),
('63', 'Tribunal Administratif d''Aïn Oussera', 'المحكمة الإدارية عين وسارة', 'administratif', 'Centre-ville, Aïn Oussera 17400', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Boussaâda (64)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('64', 'Tribunal de Première Instance de Boussaâda', 'محكمة بوسعادة', 'premiere_instance', 'Centre-ville, Boussaâda 28200', NULL),
('64', 'Tribunal Administratif de Boussaâda', 'المحكمة الإدارية بوسعادة', 'administratif', 'Centre-ville, Boussaâda 28200', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour El Abiodh Sidi Cheikh (65)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('65', 'Tribunal de Première Instance d''El Abiodh Sidi Cheikh', 'محكمة الأبيض سيدي الشيخ', 'premiere_instance', 'Centre-ville, El Abiodh Sidi Cheikh 32100', NULL),
('65', 'Tribunal Administratif d''El Abiodh Sidi Cheikh', 'المحكمة الإدارية الأبيض سيدي الشيخ', 'administratif', 'Centre-ville, El Abiodh Sidi Cheikh 32100', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour El Kantara (66)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('66', 'Tribunal de Première Instance d''El Kantara', 'محكمة القنطرة', 'premiere_instance', 'Centre-ville, El Kantara 07300', NULL),
('66', 'Tribunal Administratif d''El Kantara', 'المحكمة الإدارية القنطرة', 'administratif', 'Centre-ville, El Kantara 07300', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Bir El Ater (67)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('67', 'Tribunal de Première Instance de Bir El Ater', 'محكمة بئر العاتر', 'premiere_instance', 'Centre-ville, Bir El Ater 12300', NULL),
('67', 'Tribunal Administratif de Bir El Ater', 'المحكمة الإدارية بئر العاتر', 'administratif', 'Centre-ville, Bir El Ater 12300', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour Ksar El Boukhari (68)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('68', 'Tribunal de Première Instance de Ksar El Boukhari', 'محكمة قصر البخاري', 'premiere_instance', 'Centre-ville, Ksar El Boukhari 26200', NULL),
('68', 'Tribunal Administratif de Ksar El Boukhari', 'المحكمة الإدارية قصر البخاري', 'administratif', 'Centre-ville, Ksar El Boukhari 26200', NULL)
ON CONFLICT DO NOTHING;

-- Tribunaux pour El Aricha (69)
INSERT INTO tribunaux (wilaya_code, name_fr, name_ar, type, address, phone) 
VALUES 
('69', 'Tribunal de Première Instance d''El Aricha', 'محكمة العريشة', 'premiere_instance', 'Centre-ville, El Aricha 13400', NULL),
('69', 'Tribunal Administratif d''El Aricha', 'المحكمة الإدارية العريشة', 'administratif', 'Centre-ville, El Aricha 13400', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CRÉATION DE LA TABLE BARREAUX (si elle n'existe pas)
-- ============================================

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

-- ============================================
-- 6. INSERTION DES BARREAUX POUR LES NOUVELLES WILAYAS
-- ============================================

INSERT INTO barreaux (wilaya_code, name_fr, name_ar, address) 
VALUES 
('59', 'Barreau d''Aflou', 'نقابة المحامين أفلو', 'Centre-ville, Aflou 03300'),
('60', 'Barreau de Barika', 'نقابة المحامين باريكة', 'Centre-ville, Barika 05400'),
('61', 'Barreau de Ksar Chellala', 'نقابة المحامين قصر الشلالة', 'Centre-ville, Ksar Chellala 14200'),
('62', 'Barreau de Messaad', 'نقابة المحامين مسعد', 'Centre-ville, Messaad 17300'),
('63', 'Barreau d''Aïn Oussera', 'نقابة المحامين عين وسارة', 'Centre-ville, Aïn Oussera 17400'),
('64', 'Barreau de Boussaâda', 'نقابة المحامين بوسعادة', 'Centre-ville, Boussaâda 28200'),
('65', 'Barreau d''El Abiodh Sidi Cheikh', 'نقابة المحامين الأبيض سيدي الشيخ', 'Centre-ville, El Abiodh Sidi Cheikh 32100'),
('66', 'Barreau d''El Kantara', 'نقابة المحامين القنطرة', 'Centre-ville, El Kantara 07300'),
('67', 'Barreau de Bir El Ater', 'نقابة المحامين بئر العاتر', 'Centre-ville, Bir El Ater 12300'),
('68', 'Barreau de Ksar El Boukhari', 'نقابة المحامين قصر البخاري', 'Centre-ville, Ksar El Boukhari 26200'),
('69', 'Barreau d''El Aricha', 'نقابة المحامين العريشة', 'Centre-ville, El Aricha 13400')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. VÉRIFICATION
-- ============================================

-- Compter le nombre total de wilayas (devrait être 69)
SELECT COUNT(*) as total_wilayas FROM wilayas;

-- Lister les nouvelles wilayas
SELECT code, name_fr, name_ar, region 
FROM wilayas 
WHERE code::INTEGER >= 59 
ORDER BY code::INTEGER;

-- Compter les tribunaux par wilaya pour les nouvelles wilayas
SELECT w.code, w.name_fr, COUNT(t.id) as nombre_tribunaux
FROM wilayas w
LEFT JOIN tribunaux t ON w.code = t.wilaya_code
WHERE w.code::INTEGER >= 59
GROUP BY w.code, w.name_fr
ORDER BY w.code::INTEGER;

-- ============================================
-- 8. COMMENTAIRES
-- ============================================

COMMENT ON TABLE wilayas IS 'Table des 69 wilayas d''Algérie (mise à jour novembre 2025)';
COMMENT ON TABLE tribunaux IS 'Table des tribunaux par wilaya';
COMMENT ON TABLE barreaux IS 'Table des barreaux (ordres des avocats) par wilaya';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
