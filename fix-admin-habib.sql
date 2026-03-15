-- Corriger le compte admin habib.belkacemi@outlook.com
UPDATE profiles 
SET is_admin = true 
WHERE email = 'habib.belkacemi@outlook.com';

-- Vérification
SELECT id, email, profession, is_admin, is_active 
FROM profiles 
WHERE email IN ('admin@juristdz.com', 'habib.belkacemi@outlook.com');
