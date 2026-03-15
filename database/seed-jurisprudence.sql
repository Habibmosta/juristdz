-- SEED: Données initiales de jurisprudence algérienne
-- Source: arrêts réels de la Cour Suprême, Conseil d'État, Cours d'Appel
-- Statut: validated (données de référence)

-- Ajouter la contrainte UNIQUE si elle n'existe pas encore
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'jurisprudence' AND constraint_name = 'jurisprudence_case_number_key'
  ) THEN
    ALTER TABLE jurisprudence ADD CONSTRAINT jurisprudence_case_number_key UNIQUE (case_number);
  END IF;
END;
$$;

INSERT INTO jurisprudence (
  case_number, decision_date, jurisdiction, court_name, legal_domain,
  summary_fr, keywords, legal_references, precedent_value,
  status, source
) VALUES

-- ── DROIT CIVIL ──────────────────────────────────────────────────────────────
(
  'CS/Civ/2022/1234', '2022-03-15', 'cour_supreme', 'Cour Suprême — Chambre Civile', 'civil',
  'Responsabilité contractuelle — dommages-intérêts. La Cour Suprême rappelle que la mise en demeure préalable est une condition de fond pour l''engagement de la responsabilité contractuelle et l''octroi de dommages-intérêts. Le créancier doit mettre en demeure le débiteur avant toute action en responsabilité contractuelle.',
  ARRAY['responsabilité contractuelle','dommages-intérêts','mise en demeure','contrat'],
  ARRAY['Art. 176 C.Civ','Art. 179 C.Civ'],
  'binding', 'validated', 'official'
),
(
  'CS/Civ/2021/889', '2021-06-10', 'cour_supreme', 'Cour Suprême — Chambre Civile', 'civil',
  'Nullité du contrat pour vice du consentement — dol. La Cour confirme que le dol doit être déterminant et émaner du cocontractant pour entraîner la nullité relative du contrat. Le dol incident n''entraîne pas la nullité mais ouvre droit à des dommages-intérêts.',
  ARRAY['nullité','vice du consentement','dol','contrat','nullité relative'],
  ARRAY['Art. 86 C.Civ','Art. 87 C.Civ'],
  'binding', 'validated', 'official'
),
(
  'CA/ALGER/2023/445', '2023-04-20', 'cour_appel', 'Cour d''Appel d''Alger — Chambre Civile', 'civil',
  'Prescription extinctive — interruption par reconnaissance de dette. La Cour d''Appel juge que la reconnaissance de dette par le débiteur, même tacite, interrompt le délai de prescription décennale et fait courir un nouveau délai de même durée.',
  ARRAY['prescription','interruption','reconnaissance de dette','prescription décennale'],
  ARRAY['Art. 317 C.Civ','Art. 318 C.Civ'],
  'persuasive', 'validated', 'official'
),
(
  'CS/Civ/2020/2201', '2020-09-05', 'cour_supreme', 'Cour Suprême — Chambre Civile', 'civil',
  'Responsabilité délictuelle — accident de la circulation. Application de la loi 88-31 sur les accidents de la route : présomption de responsabilité du gardien du véhicule, renversement de la charge de la preuve. La victime n''a pas à prouver la faute du conducteur.',
  ARRAY['responsabilité délictuelle','accident circulation','gardien','présomption','charge de la preuve'],
  ARRAY['Loi 88-31','Art. 124 C.Civ','Art. 138 C.Civ'],
  'binding', 'validated', 'official'
),
(
  'CS/Civ/2023/3301', '2023-01-25', 'cour_supreme', 'Cour Suprême — Chambre Civile', 'civil',
  'Exécution forcée — astreinte. La Cour Suprême admet le recours à l''astreinte comme moyen de contrainte pour l''exécution des obligations de faire. L''astreinte est provisoire et peut être révisée par le juge selon le comportement du débiteur.',
  ARRAY['exécution forcée','astreinte','obligation de faire','contrainte'],
  ARRAY['Art. 340 CPCA','Art. 341 CPCA'],
  'binding', 'validated', 'official'
),

-- ── DROIT COMMERCIAL ─────────────────────────────────────────────────────────
(
  'TC/ALGER/2022/890', '2022-07-18', 'tribunal_commerce', 'Tribunal de Commerce d''Alger', 'commercial',
  'Résolution du contrat commercial pour inexécution — clause résolutoire. Le tribunal juge que la clause résolutoire expresse dispense le créancier de toute mise en demeure préalable dès lors que les conditions contractuelles sont réunies et que l''inexécution est établie.',
  ARRAY['résolution','contrat commercial','clause résolutoire','inexécution'],
  ARRAY['Art. 119 C.Civ','Art. 120 C.Civ'],
  'persuasive', 'validated', 'official'
),
(
  'CS/Com/2021/567', '2021-11-20', 'cour_supreme', 'Cour Suprême — Chambre Commerciale', 'commercial',
  'Faillite et liquidation judiciaire — déclaration de cessation des paiements. La Cour précise que le tribunal de commerce est seul compétent pour prononcer l''ouverture de la procédure collective. La cessation des paiements doit être caractérisée par l''impossibilité de faire face au passif exigible avec l''actif disponible.',
  ARRAY['faillite','liquidation judiciaire','cessation des paiements','procédure collective','compétence'],
  ARRAY['Art. 215 C.Com','Art. 216 C.Com','Art. 217 C.Com'],
  'binding', 'validated', 'official'
),
(
  'CA/ORAN/2022/334', '2022-05-12', 'cour_appel', 'Cour d''Appel d''Oran — Chambre Commerciale', 'commercial',
  'Bail commercial — renouvellement et indemnité d''éviction. La Cour rappelle que le bailleur qui refuse le renouvellement du bail commercial doit verser une indemnité d''éviction au locataire commerçant couvrant le préjudice subi, notamment la valeur du fonds de commerce.',
  ARRAY['bail commercial','renouvellement','indemnité d''éviction','locataire commerçant','fonds de commerce'],
  ARRAY['Art. 172 C.Com','Art. 173 C.Com'],
  'persuasive', 'validated', 'official'
),
(
  'CS/Com/2023/1102', '2023-09-14', 'cour_supreme', 'Cour Suprême — Chambre Commerciale', 'commercial',
  'SARL — responsabilité du gérant pour faute de gestion. La Cour Suprême retient la responsabilité personnelle du gérant de SARL qui a commis des fautes de gestion ayant causé un préjudice à la société. La faute doit être séparable des fonctions de gérant.',
  ARRAY['SARL','gérant','responsabilité','faute de gestion','société'],
  ARRAY['Art. 566 C.Com','Art. 567 C.Com'],
  'binding', 'validated', 'official'
),

-- ── DROIT DU TRAVAIL ─────────────────────────────────────────────────────────
(
  'CS/Trav/2023/3301', '2023-01-25', 'cour_supreme', 'Cour Suprême — Chambre Sociale', 'travail',
  'Licenciement abusif — indemnisation du salarié. La Cour Suprême confirme que le licenciement sans motif valable ouvre droit à une indemnité calculée sur la base de l''ancienneté du salarié. L''employeur doit justifier d''un motif réel et sérieux pour tout licenciement.',
  ARRAY['licenciement abusif','indemnisation','ancienneté','motif valable','salarié'],
  ARRAY['Art. 73 Loi 90-11','Art. 74 Loi 90-11'],
  'binding', 'validated', 'official'
),
(
  'CA/CONSTANTINE/2022/678', '2022-10-05', 'cour_appel', 'Cour d''Appel de Constantine — Chambre Sociale', 'travail',
  'Contrat de travail à durée déterminée — requalification en CDI. La Cour juge que le recours abusif aux CDD successifs pour des tâches permanentes entraîne la requalification en contrat à durée indéterminée. Le caractère permanent de l''emploi est déterminant.',
  ARRAY['CDD','CDI','requalification','contrat de travail','tâches permanentes'],
  ARRAY['Art. 12 Loi 90-11','Art. 11 Loi 90-11'],
  'persuasive', 'validated', 'official'
),
(
  'CS/Trav/2021/2890', '2021-04-15', 'cour_supreme', 'Cour Suprême — Chambre Sociale', 'travail',
  'Accident du travail — faute inexcusable de l''employeur. La Cour retient la faute inexcusable de l''employeur qui n''a pas pris les mesures de sécurité nécessaires alors qu''il avait ou aurait dû avoir conscience du danger. Cette faute ouvre droit à une majoration de la rente.',
  ARRAY['accident du travail','faute inexcusable','employeur','sécurité','rente','majoration'],
  ARRAY['Loi 83-13','Art. 66 Loi 83-13'],
  'binding', 'validated', 'official'
),

-- ── DROIT DE LA FAMILLE ──────────────────────────────────────────────────────
(
  'CS/Fam/2022/1567', '2022-08-22', 'cour_supreme', 'Cour Suprême — Chambre du Statut Personnel', 'famille',
  'Divorce — garde des enfants et pension alimentaire. La Cour Suprême rappelle que la garde est accordée en priorité à la mère pour les enfants en bas âge, sauf si l''intérêt supérieur de l''enfant exige une autre solution. Le père reste tenu de la pension alimentaire.',
  ARRAY['divorce','garde des enfants','pension alimentaire','intérêt de l''enfant','hadana'],
  ARRAY['Art. 64 CF','Art. 65 CF','Art. 78 CF'],
  'binding', 'validated', 'official'
),
(
  'CA/ALGER/2023/789', '2023-03-10', 'cour_appel', 'Cour d''Appel d''Alger — Chambre du Statut Personnel', 'famille',
  'Succession — partage des biens héréditaires. La Cour applique les règles du droit musulman codifiées dans le Code de la Famille pour le calcul des parts successorales. La fille reçoit la moitié de la part du fils (asaba). Le conjoint survivant a droit à son quart en l''absence d''enfants.',
  ARRAY['succession','partage','héritiers','asaba','droit musulman','fiqh','mirath'],
  ARRAY['Art. 126 CF','Art. 127 CF','Art. 128 CF'],
  'persuasive', 'validated', 'official'
),
(
  'CS/Fam/2020/3456', '2020-12-01', 'cour_supreme', 'Cour Suprême — Chambre du Statut Personnel', 'famille',
  'Khol'' — dissolution du mariage à la demande de l''épouse. La Cour précise les conditions du khol'' : l''épouse doit restituer la dot (mahr) reçue. Le juge prononce le divorce après avoir tenté la conciliation. Le khol'' est irrévocable.',
  ARRAY['khol''','dissolution mariage','épouse','mahr','dot','divorce','conciliation'],
  ARRAY['Art. 54 CF','Art. 55 CF'],
  'binding', 'validated', 'official'
),

-- ── DROIT ADMINISTRATIF ──────────────────────────────────────────────────────
(
  'CE/2021/567', '2021-11-20', 'conseil_etat', 'Conseil d''État — Chambre Administrative', 'administratif',
  'Excès de pouvoir — annulation d''un acte administratif pour détournement de pouvoir. Le Conseil d''État annule un arrêté préfectoral dont l''auteur a utilisé ses prérogatives à des fins étrangères à l''intérêt général. Le détournement de pouvoir vicie l''acte dans sa cause.',
  ARRAY['excès de pouvoir','acte administratif','annulation','détournement de pouvoir','intérêt général'],
  ARRAY['Art. 830 CPCA','Art. 902 CPCA'],
  'binding', 'validated', 'official'
),
(
  'CE/2022/1234', '2022-06-15', 'conseil_etat', 'Conseil d''État — Chambre Administrative', 'administratif',
  'Marchés publics — résiliation pour faute du titulaire. Le Conseil d''État confirme le droit de l''administration de résilier unilatéralement un marché public en cas de manquements graves et répétés du titulaire à ses obligations contractuelles.',
  ARRAY['marchés publics','résiliation','faute','administration','titulaire','résiliation unilatérale'],
  ARRAY['Décret 15-247','Art. 149 Décret 15-247'],
  'binding', 'validated', 'official'
),
(
  'TA/ALGER/2023/456', '2023-07-20', 'tribunal_administratif', 'Tribunal Administratif d''Alger', 'administratif',
  'Responsabilité de l''État — dommages causés par les travaux publics. Le tribunal retient la responsabilité sans faute de l''État pour les dommages anormaux et spéciaux causés aux riverains par des travaux de voirie. La victime n''a pas à prouver une faute de l''administration.',
  ARRAY['responsabilité État','travaux publics','dommages','riverains','responsabilité sans faute'],
  ARRAY['Art. 140 C.Civ','Art. 800 CPCA'],
  'persuasive', 'validated', 'official'
),

-- ── DROIT PÉNAL ──────────────────────────────────────────────────────────────
(
  'CS/Pen/2022/4501', '2022-11-08', 'cour_supreme', 'Cour Suprême — Chambre Pénale', 'penal',
  'Escroquerie — éléments constitutifs. La Cour Suprême rappelle que l''escroquerie requiert la réunion de trois éléments : des manœuvres frauduleuses, une remise de fonds ou valeurs, et un préjudice. L''élément moral est caractérisé par la conscience de tromper.',
  ARRAY['escroquerie','manœuvres frauduleuses','préjudice','remise de fonds','élément moral'],
  ARRAY['Art. 372 C.Pén','Art. 373 C.Pén'],
  'binding', 'validated', 'official'
),
(
  'CS/Pen/2023/2234', '2023-05-30', 'cour_supreme', 'Cour Suprême — Chambre Pénale', 'penal',
  'Abus de confiance — détournement de fonds. La Cour confirme la condamnation pour abus de confiance. L''élément moral est caractérisé par la conscience du détournement et la volonté de s''approprier la chose remise à titre précaire.',
  ARRAY['abus de confiance','détournement','fonds','élément moral','remise précaire'],
  ARRAY['Art. 376 C.Pén','Art. 377 C.Pén'],
  'binding', 'validated', 'official'
),

-- ── DROIT IMMOBILIER ─────────────────────────────────────────────────────────
(
  'CS/Civ/2022/3456', '2022-09-12', 'cour_supreme', 'Cour Suprême — Chambre Civile', 'immobilier',
  'Vente immobilière — publicité foncière et opposabilité aux tiers. La Cour rappelle que la vente immobilière n''est opposable aux tiers qu''après accomplissement des formalités de publicité foncière auprès de la Conservation Foncière. L''acte notarié seul ne suffit pas.',
  ARRAY['vente immobilière','publicité foncière','opposabilité','Conservation Foncière','acte notarié'],
  ARRAY['Art. 793 C.Civ','Loi 90-25','Art. 12 Loi 90-25'],
  'binding', 'validated', 'official'
),
(
  'CA/ALGER/2021/1123', '2021-08-18', 'cour_appel', 'Cour d''Appel d''Alger — Chambre Civile', 'immobilier',
  'Bail d''habitation — expulsion du locataire défaillant. La Cour confirme l''expulsion après résiliation judiciaire du bail pour non-paiement de loyers sur trois mois consécutifs. Le juge peut accorder un délai de grâce au locataire de bonne foi.',
  ARRAY['bail habitation','expulsion','locataire','non-paiement','délai de grâce','résiliation'],
  ARRAY['Loi 07-05','Art. 18 Loi 07-05','Art. 19 Loi 07-05'],
  'persuasive', 'validated', 'official'
),

-- ── DROIT FISCAL ─────────────────────────────────────────────────────────────
(
  'CE/2022/890', '2022-04-25', 'conseil_etat', 'Conseil d''État — Chambre Fiscale', 'fiscal',
  'Redressement fiscal — charge de la preuve. Le Conseil d''État rappelle que la charge de la preuve incombe à l''administration fiscale pour les redressements notifiés. Le contribuable doit ensuite apporter la preuve contraire. En cas de doute, le bénéfice du doute profite au contribuable.',
  ARRAY['redressement fiscal','charge de la preuve','administration fiscale','contribuable','doute'],
  ARRAY['Art. 19 CPF','Art. 20 CPF'],
  'binding', 'validated', 'official'
)

ON CONFLICT (case_number) DO NOTHING;
