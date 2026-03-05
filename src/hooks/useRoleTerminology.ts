import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { getTerminology, getTerm, RoleTerminology } from '../config/roleTerminology';
import { UserRole } from '../../types';

/**
 * Hook pour obtenir la terminologie adaptée au rôle de l'utilisateur
 * Permet une interface ultra-personnalisée selon la profession
 */
export function useRoleTerminology(language: 'fr' | 'ar' = 'fr') {
  const { user } = useAuth();
  const userRole = (user?.profession as UserRole) || UserRole.AVOCAT;

  const terminology = useMemo(() => {
    return getTerminology(userRole);
  }, [userRole]);

  // Fonctions helper pour obtenir les termes facilement
  const t = useMemo(() => ({
    // Termes principaux
    case: (plural = false) => getTerm(userRole, 'case', language, plural),
    client: (plural = false) => getTerm(userRole, 'client', language, plural),
    document: (plural = false) => getTerm(userRole, 'document', language, plural),
    event: (plural = false) => getTerm(userRole, 'event', language, plural),
    
    // Actions
    createCase: () => terminology.createCase[language],
    viewCase: () => terminology.viewCase[language],
    editCase: () => terminology.editCase[language],
    closeCase: () => terminology.closeCase[language],
    
    // Statuts
    status: (key: string) => terminology.statuses[key]?.[language] || key,
    
    // Types de documents
    documentType: (key: string) => terminology.documentTypes[key]?.[language] || key,
    
    // Types d'événements
    eventType: (key: string) => terminology.eventTypes[key]?.[language] || key,
    
    // Accès direct à la terminologie complète
    full: terminology
  }), [userRole, language, terminology]);

  return {
    t,
    terminology,
    userRole
  };
}
