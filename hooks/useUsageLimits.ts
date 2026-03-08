/**
 * HOOK PERSONNALISÉ POUR LA GESTION DES LIMITES D'UTILISATION
 * 
 * Ce hook facilite l'intégration du système de limites dans les composants
 */

import { useState, useEffect, useCallback } from 'react';
import { usageLimitService, LimitCheckResult, LimitStatus } from '../services/usageLimitService';
import { useAuth } from './useAuth';

export const useUsageLimits = () => {
  const { user } = useAuth();
  const [limitResult, setLimitResult] = useState<LimitCheckResult | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  /**
   * Vérifier les limites avant une action
   */
  const checkLimits = useCallback(async (action: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsChecking(true);
    
    try {
      const result = await usageLimitService.checkAllLimits(user.id, action);
      setLimitResult(result);
      
      // Afficher le modal si limite atteinte ou avertissement critique
      if (!result.allowed || result.status === LimitStatus.CRITICAL) {
        setShowLimitModal(true);
      }
      
      return result.allowed;
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      return true; // En cas d'erreur, autoriser l'action
    } finally {
      setIsChecking(false);
    }
  }, [user]);
  
  /**
   * Déduire des crédits après une action réussie
   */
  const deductCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await usageLimitService.deductCredits(user.id, amount);
      
      if (success) {
        // Incrémenter les compteurs d'usage
        await usageLimitService.incrementUsage(user.id, 'credits');
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la déduction des crédits:', error);
      return false;
    }
  }, [user]);
  
  /**
   * Incrémenter le compteur d'appels API
   */
  const incrementApiCalls = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      await usageLimitService.incrementUsage(user.id, 'api_calls');
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des appels API:', error);
    }
  }, [user]);
  
  /**
   * Fermer le modal de limite
   */
  const closeLimitModal = useCallback(() => {
    setShowLimitModal(false);
  }, []);
  
  /**
   * Récupérer l'usage actuel de l'utilisateur
   */
  const refreshUsage = useCallback(async () => {
    if (!user) return null;
    
    try {
      return await usageLimitService.getUserUsage(user.id);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'usage:', error);
      return null;
    }
  }, [user]);
  
  return {
    // État
    limitResult,
    showLimitModal,
    isChecking,
    
    // Actions
    checkLimits,
    deductCredits,
    incrementApiCalls,
    closeLimitModal,
    refreshUsage
  };
};
