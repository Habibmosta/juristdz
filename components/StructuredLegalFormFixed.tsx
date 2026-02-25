import React, { useState, useCallback } from 'react';
import { PersonnePhysique, InformationsCabinet, InformationsTribunal } from '../types/legalForms';
import { Language } from '../types';
import { User, Scale, Gavel, ChevronRight, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface StructuredLegalFormProps {
  templateId: string;
  language: Language;
  onFormChange: (formData: any) => void;
}

const StructuredLegalFormFixed: React.FC<StructuredLegalFormProps> = ({ templateId, language, onFormChange }) => {
  const isAr = language === 'ar';
  
  // États pour les différentes sections
  const [personnePhysique, setPersonnePhysique] = useState<Partial<PersonnePhysique>>({});
  const [cabinet, setCabinet] = useState<Partial<InformationsCabinet>>({});
  const [tribunal, setTribunal] = useState<Partial<InformationsTribunal>>({});
  
  // État pour les sections ouvertes/fermées
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['identite']));

  // Traductions simplifiées
  const t = {
    fr: {
      identite: 'Identité de la Personne',
      cabinet: 'Cabinet Juridique',
      tribunal: 'Tribunal Compétent',
      
      // Champs identité
      nom: 'Nom de famille',
      prenom: 'Prénom',
      nomPere: 'Nom du père',
      prenomPere: 'Prénom du père',
      nomMere: 'Nom de la mère',
      prenomMere: 'Prénom de la mère',
      dateNaissance: 'Date de naissance',
      lieuNaissance: 'Lieu de naissance',
      nationalite: 'Nationalité',
      situationFamiliale: 'Situation familiale',
      profession: 'Profession',
      adresse: 'Adresse complète',
      commune: 'Commune',
      daira: 'Daïra',
      wilaya: 'Wilaya',
      
      // Documents
      typeDocument: 'Type de document',
      numeroDocument: 'Numéro',
      dateDelivrance: 'Date de délivrance',
      lieuDelivrance: 'Lieu de délivrance',
      
      // Cabinet
      nomCabinet: 'Nom du cabinet',
      nomPraticien: 'Nom du praticien',
      prenomPraticien: 'Prénom du praticien',
      qualitePraticien: 'Qualité',
      adresseCabinet: 'Adresse du cabinet',
      telephoneCabinet: 'Téléphone',
      
      // Tribunal
      nomTribunal: 'Nom du tribunal',
      typeTribunal: 'Type de juridiction',
      adresseTribunal: 'Adresse',
      
      // Placeholders
      placeholders: {
        nom: 'Ex: BENALI',
        prenom: 'Ex: Ahmed Mohamed',
        nomPere: 'Ex: BENALI',
        prenomPere: 'Ex: Mohamed',
        adresse: 'Ex: 15 Rue Didouche Mourad, Alger Centre',
        commune: 'Ex: Alger Centre',
        daira: 'Ex: Sidi M\'Hamed',
        numeroDocument: 'Ex: 1234567890123456',
        telephoneCabinet: 'Ex: 021 XX XX XX',
        lieuNaissance: 'Ex: Alger',
        nationalite: 'Ex: Algérienne',
        profession: 'Ex: Enseignant'
      }
    },
    ar: {
      identite: 'هوية الشخص',
      cabinet: 'المكتب القانوني',
      tribunal: 'المحكمة المختصة',
      
      nom: 'اللقب',
      prenom: 'الاسم',
      nomPere: 'لقب الأب',
      prenomPere: 'اسم الأب',
      nomMere: 'لقب الأم',
      prenomMere: 'اسم الأم',
      dateNaissance: 'تاريخ الميلاد',
      lieuNaissance: 'مكان الميلاد',
      nationalite: 'الجنسية',
      situationFamiliale: 'الحالة المدنية',
      profession: 'المهنة',
      adresse: 'العنوان الكامل',
      commune: 'البلدية',
      daira: 'الدائرة',
      wilaya: 'الولاية',
      
      typeDocument: 'نوع الوثيقة',
      numeroDocument: 'الرقم',
      dateDelivrance: 'تاريخ الإصدار',
      lieuDelivrance: 'مكان الإصدار',
      
      nomCabinet: 'اسم المكتب',
      nomPraticien: 'لقب الممارس',
      prenomPraticien: 'اسم الممارس',
      qualitePraticien: 'الصفة',
      adresseCabinet: 'عنوان المكتب',
      telephoneCabinet: 'الهاتف',
      
      nomTribunal: 'اسم المحكمة',
      typeTribunal: 'نوع الجهة القضائية',
      adresseTribunal: 'العنوان',
      
      placeholders: {
        nom: 'مثال: بن علي',
        prenom: 'مثال: أحمد محمد',
        nomPere: 'مثال: بن علي',
        prenomPere: 'مثال: محمد',
        adresse: 'مثال: 15 شارع ديدوش مراد، وسط الجزائر',
        commune: 'مثال: وسط الجزائر',
        daira: 'مثال: سيدي امحمد',
        numeroDocument: 'مثال: 1234567890123456',
        telephoneCabinet: 'مثال: 021 XX XX XX',
        lieuNaissance: 'مثال: الجزائر',
        nationalite: 'مثال: جزائرية',
        profession: 'مثال: أستاذ'
      }
    }
  };