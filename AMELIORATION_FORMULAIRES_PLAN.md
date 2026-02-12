# 📋 Plan d'Amélioration des Formulaires - Statut

## ✅ Formulaires Complétés

### 1. Requête Pension Alimentaire ✅
**Champs ajoutés** (8 nouveaux):
- Demandeur: dateNaissance, lieuNaissance, cin, adresse, profession
- Débiteur: dateNaissance, lieuNaissance, cin, adresse, profession

### 2. Requête d'Expulsion ✅ (RÉFÉRENCE)
**Statut**: Formulaire de référence complet avec 18 champs

### 3. Requête de Divorce ✅
**Champs ajoutés** (12 nouveaux):
- Époux: dateNaissance, lieuNaissance, cin, profession, adresse
- Épouse: dateNaissance, lieuNaissance, cin, profession, adresse
- Mariage: numeroActeMariage, tribunalMariage

---

## 🔄 Formulaires à Améliorer (12 restants)

### 4. Requête Garde d'Enfants ⏳
**À ajouter**:
- Demandeur: dateNaissance, lieuNaissance, cin
- Autre parent: dateNaissance, lieuNaissance, cin, adresse, profession
- Enfants: dates/lieux naissance individuels

### 5. Requête en Succession ⏳
**À ajouter**:
- Demandeur: identité complète (nom, prénom, date/lieu naissance, cin, adresse)
- Défunt: cin, numeroActeDeces
- Héritiers: identités complètes (dates/lieux naissance, cin, adresses)
- Biens: numéros titres de propriété

### 6. Conclusions Civiles ⏳
**À ajouter**:
- Demandeur: nom, prénom, date/lieu naissance, cin, adresse, profession
- Défendeur: nom, prénom, date/lieu naissance, cin, adresse, profession

### 7. Assignation Civile ⏳
**À ajouter**:
- Huissier: prénom, étude
- Demandeur: date/lieu naissance, cin, profession
- Défendeur: date/lieu naissance, cin, profession

### 8. Requête Pénale ⏳
**À ajouter**:
- Plaignant: date/lieu naissance, cin, profession
- Mis en cause: identité complète si connu

### 9. Constitution Partie Civile ⏳
**À ajouter**:
- Victime: date/lieu naissance, date/lieu délivrance cin, profession

### 10. Mémoire Défense Pénale ⏳
**À ajouter**:
- Prévenu: date/lieu naissance, cin, adresse, profession, situation familiale

### 11. Requête Commerciale ⏳
**À ajouter**:
- Demandeur: formeJuridique, capitalSocial, siegeSocial, representantLegal, nif
- Défendeur: rc, siegeSocial

### 12. Requête en Faillite ⏳
**À ajouter**:
- Entreprise: formeJuridique, capitalSocial, nif, dateCreation
- Représentant: identité complète

### 13. Recours Administratif ⏳
**À ajouter**:
- Requérant: date/lieu naissance, cin, profession
- Acte: référence précise (numéro, date)

### 14. Requête en Référé ⏳
**À ajouter**:
- Demandeur: nom, prénom, date/lieu naissance, cin, profession
- Défendeur: nom, prénom, date/lieu naissance, cin, profession

### 15. Requête Dommages-Intérêts ✅ (PRESQUE COMPLET)
**À ajouter** (3 champs):
- Victime: date/lieu délivrance cin
- Responsable: date/lieu naissance, cin

---

## 📊 Progression

- ✅ Complétés: 3/15 (20%)
- ⏳ En attente: 12/15 (80%)

## 🎯 Prochaines Étapes

Continuer l'amélioration des formulaires 4-15 en suivant le modèle de `requete_expulsion`.
