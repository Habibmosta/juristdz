import React, { useState } from 'react';
import { X, FileText, User, Calendar, AlertCircle, Save, MapPin, Bell } from 'lucide-react';
import { Language } from '../../types';

interface HuissierMissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: any) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

interface MissionFormData {
  typeMission: string;
  numeroOrdonnance: string;
  dateMission: string;
  requérant: {
    nom: string;
    prenom: string;
    qualite: string;
    adresse: string;
    telephone: string;
  };
  destinataire: {
    nom: string;
    prenom: string;
    adresse: string;
    telephone: string;
  };
  objetMission: string;
  montantCreance: string;
  fraisHuissier: string;
  lieuExecution: string;
  dateExecution: string;
  observations: string;
}

const TYPES_MISSIONS = {
  fr: [
    'Signification de Jugement',
    'Signification d\'Acte',
    'Commandement de Payer',
    'Saisie-Exécution',
    'Saisie Conservatoire',
    'Saisie-Arrêt',