/**
 * TESTS UNITAIRES - SYSTÈME DE LIMITES D'UTILISATION
 * 
 * Tests pour le service usageLimitService et le hook useUsageLimits
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { usageLimitService, LimitStatus, LimitType } from '../services/usageLimitService';

// Mock du hook useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock du service Supabase
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      })),
      rpc: vi.fn()
    }))
  }
}));

describe('usageLimitService', () => {
  
  describe('checkCredits', () => {
    it('devrait autoriser l\'action avec crédits suffisants', async () => {
      // Mock: utilisateur avec 50 crédits
      const mockUser = {
        credits_remaining: 50,
        plan: 'free'
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkCredits('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(LimitStatus.OK);
      expect(result.current).toBe(0); // 50 crédits restants = 0 utilisés
    });
    
    it('devrait bloquer l\'action avec crédits épuisés', async () => {
      const mockUser = {
        credits_remaining: 0,
        plan: 'free'
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkCredits('test-user-id');
      
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(LimitStatus.EXCEEDED);
      expect(result.limitType).toBe(LimitType.CREDITS);
      expect(result.action.type).toBe('block');
      expect(result.action.showUpgradeModal).toBe(true);
    });
    
    it('devrait afficher un avertissement à 80%', async () => {
      const mockUser = {
        credits_remaining: 10, // 10/50 = 80% utilisés
        plan: 'free'
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkCredits('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(LimitStatus.WARNING);
      expect(result.percentage).toBeGreaterThanOrEqual(80);
    });
    
    it('devrait afficher un avertissement critique à 95%', async () => {
      const mockUser = {
        credits_remaining: 2, // 2/50 = 96% utilisés
        plan: 'free'
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkCredits('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(LimitStatus.CRITICAL);
      expect(result.percentage).toBeGreaterThanOrEqual(95);
    });
  });
  
  describe('checkExpiration', () => {
    it('devrait autoriser avec abonnement valide', async () => {
      const mockUser = {
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkExpiration('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(LimitStatus.OK);
    });
    
    it('devrait bloquer avec abonnement expiré', async () => {
      const mockUser = {
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // -1 jour
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkExpiration('test-user-id');
      
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(LimitStatus.EXCEEDED);
      expect(result.limitType).toBe(LimitType.EXPIRATION);
    });
    
    it('devrait avertir 7 jours avant expiration', async () => {
      const mockUser = {
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // +5 jours
      };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      
      const result = await usageLimitService.checkExpiration('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(LimitStatus.WARNING);
    });
  });
  
  describe('checkDailyQuota', () => {
    it('devrait autoriser en dessous du quota (Plan Free)', async () => {
      const mockUser = { plan: 'free' };
      const mockStats = { credits_used_today: 5 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkDailyQuota('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
    });
    
    it('devrait bloquer au quota (Plan Free)', async () => {
      const mockUser = { plan: 'free' };
      const mockStats = { credits_used_today: 10 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkDailyQuota('test-user-id');
      
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(LimitStatus.EXCEEDED);
      expect(result.limitType).toBe(LimitType.DAILY_QUOTA);
    });
    
    it('devrait autoriser Plan Pro avec quota plus élevé', async () => {
      const mockUser = { plan: 'pro' };
      const mockStats = { credits_used_today: 50 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkDailyQuota('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(50);
      expect(result.limit).toBe(100);
    });
    
    it('devrait autoriser Plan Cabinet (illimité)', async () => {
      const mockUser = { plan: 'cabinet' };
      const mockStats = { credits_used_today: 1000 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkDailyQuota('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1); // Illimité
    });
  });
  
  describe('checkMonthlyQuota', () => {
    it('devrait autoriser en dessous du quota mensuel', async () => {
      const mockUser = { plan: 'pro' };
      const mockStats = { credits_used_this_month: 250 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkMonthlyQuota('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(250);
      expect(result.limit).toBe(500);
    });
    
    it('devrait bloquer au quota mensuel', async () => {
      const mockUser = { plan: 'pro' };
      const mockStats = { credits_used_this_month: 500 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkMonthlyQuota('test-user-id');
      
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(LimitStatus.EXCEEDED);
      expect(result.limitType).toBe(LimitType.MONTHLY_QUOTA);
    });
  });
  
  describe('checkStorage', () => {
    it('devrait autoriser en dessous de la limite de stockage', async () => {
      const mockUser = { plan: 'free' };
      const mockStats = { storage_used_gb: 0.5 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkStorage('test-user-id');
      
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0.5);
      expect(result.limit).toBe(1);
    });
    
    it('devrait bloquer au stockage plein', async () => {
      const mockUser = { plan: 'free' };
      const mockStats = { storage_used_gb: 1.0 };
      
      vi.spyOn(usageLimitService as any, 'getUserSubscription').mockResolvedValue(mockUser);
      vi.spyOn(usageLimitService as any, 'getUserUsageStats').mockResolvedValue(mockStats);
      
      const result = await usageLimitService.checkStorage('test-user-id');
      
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(LimitStatus.EXCEEDED);
      expect(result.limitType).toBe(LimitType.STORAGE);
    });
  });
  
  describe('deductCredits', () => {
    it('devrait déduire les crédits correctement', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      
      vi.spyOn(usageLimitService as any, 'supabase').mockReturnValue({
        rpc: mockRpc
      });
      
      const result = await usageLimitService.deductCredits('test-user-id', 3);
      
      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('deduct_credits', {
        p_user_id: 'test-user-id',
        p_amount: 3
      });
    });
    
    it('devrait retourner false en cas d\'erreur', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Insufficient credits' } 
      });
      
      vi.spyOn(usageLimitService as any, 'supabase').mockReturnValue({
        rpc: mockRpc
      });
      
      const result = await usageLimitService.deductCredits('test-user-id', 3);
      
      expect(result).toBe(false);
    });
  });
  
  describe('checkAllLimits', () => {
    it('devrait vérifier toutes les limites et retourner la première bloquante', async () => {
      // Mock: crédits OK mais quota journalier dépassé
      vi.spyOn(usageLimitService, 'checkCredits').mockResolvedValue({
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.CREDITS,
        current: 10,
        limit: 50,
        percentage: 20,
        message: { fr: 'OK', ar: 'OK' },
        action: { type: 'allow' }
      });
      
      vi.spyOn(usageLimitService, 'checkExpiration').mockResolvedValue({
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.EXPIRATION,
        current: 0,
        limit: -1,
        percentage: 0,
        message: { fr: 'OK', ar: 'OK' },
        action: { type: 'allow' }
      });
      
      vi.spyOn(usageLimitService, 'checkDailyQuota').mockResolvedValue({
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.DAILY_QUOTA,
        current: 10,
        limit: 10,
        percentage: 100,
        message: { fr: 'Quota dépassé', ar: 'تم تجاوز الحصة' },
        action: { type: 'block', showUpgradeModal: true }
      });
      
      const result = await usageLimitService.checkAllLimits('test-user-id', 'research');
      
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe(LimitType.DAILY_QUOTA);
    });
    
    it('devrait autoriser si toutes les limites sont OK', async () => {
      const okResult = {
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.CREDITS,
        current: 0,
        limit: 50,
        percentage: 0,
        message: { fr: 'OK', ar: 'OK' },
        action: { type: 'allow' as const }
      };
      
      vi.spyOn(usageLimitService, 'checkCredits').mockResolvedValue(okResult);
      vi.spyOn(usageLimitService, 'checkExpiration').mockResolvedValue(okResult);
      vi.spyOn(usageLimitService, 'checkDailyQuota').mockResolvedValue(okResult);
      vi.spyOn(usageLimitService, 'checkMonthlyQuota').mockResolvedValue(okResult);
      vi.spyOn(usageLimitService, 'checkStorage').mockResolvedValue(okResult);
      vi.spyOn(usageLimitService, 'checkApiCalls').mockResolvedValue(okResult);
      
      const result = await usageLimitService.checkAllLimits('test-user-id', 'research');
      
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(LimitStatus.OK);
    });
  });
});

describe('useUsageLimits hook', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('devrait initialiser avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useUsageLimits());
    
    expect(result.current.limitResult).toBeNull();
    expect(result.current.showLimitModal).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });
  
  it('devrait vérifier les limites et autoriser l\'action', async () => {
    const mockResult = {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.CREDITS,
      current: 10,
      limit: 50,
      percentage: 20,
      message: { fr: 'OK', ar: 'OK' },
      action: { type: 'allow' as const }
    };
    
    vi.spyOn(usageLimitService, 'checkAllLimits').mockResolvedValue(mockResult);
    
    const { result } = renderHook(() => useUsageLimits());
    
    let allowed = false;
    
    await act(async () => {
      allowed = await result.current.checkLimits('research');
    });
    
    expect(allowed).toBe(true);
    expect(result.current.showLimitModal).toBe(false);
  });
  
  it('devrait afficher le modal quand limite atteinte', async () => {
    const mockResult = {
      allowed: false,
      status: LimitStatus.EXCEEDED,
      limitType: LimitType.CREDITS,
      current: 50,
      limit: 50,
      percentage: 100,
      message: { fr: 'Crédits épuisés', ar: 'نفدت النقاط' },
      action: { type: 'block' as const, showUpgradeModal: true }
    };
    
    vi.spyOn(usageLimitService, 'checkAllLimits').mockResolvedValue(mockResult);
    
    const { result } = renderHook(() => useUsageLimits());
    
    let allowed = false;
    
    await act(async () => {
      allowed = await result.current.checkLimits('research');
    });
    
    expect(allowed).toBe(false);
    expect(result.current.showLimitModal).toBe(true);
    expect(result.current.limitResult).toEqual(mockResult);
  });
  
  it('devrait afficher le modal pour avertissement critique', async () => {
    const mockResult = {
      allowed: true,
      status: LimitStatus.CRITICAL,
      limitType: LimitType.CREDITS,
      current: 48,
      limit: 50,
      percentage: 96,
      message: { fr: 'Alerte critique', ar: 'تنبيه حرج' },
      action: { type: 'warn' as const, showUpgradeModal: true }
    };
    
    vi.spyOn(usageLimitService, 'checkAllLimits').mockResolvedValue(mockResult);
    
    const { result } = renderHook(() => useUsageLimits());
    
    await act(async () => {
      await result.current.checkLimits('research');
    });
    
    expect(result.current.showLimitModal).toBe(true);
  });
  
  it('devrait déduire les crédits', async () => {
    vi.spyOn(usageLimitService, 'deductCredits').mockResolvedValue(true);
    vi.spyOn(usageLimitService, 'incrementUsage').mockResolvedValue();
    
    const { result } = renderHook(() => useUsageLimits());
    
    let success = false;
    
    await act(async () => {
      success = await result.current.deductCredits(2);
    });
    
    expect(success).toBe(true);
    expect(usageLimitService.deductCredits).toHaveBeenCalledWith('test-user-id', 2);
    expect(usageLimitService.incrementUsage).toHaveBeenCalledWith('test-user-id', 'credits');
  });
  
  it('devrait fermer le modal', async () => {
    const { result } = renderHook(() => useUsageLimits());
    
    // Simuler l'ouverture du modal
    const mockResult = {
      allowed: false,
      status: LimitStatus.EXCEEDED,
      limitType: LimitType.CREDITS,
      current: 50,
      limit: 50,
      percentage: 100,
      message: { fr: 'Crédits épuisés', ar: 'نفدت النقاط' },
      action: { type: 'block' as const, showUpgradeModal: true }
    };
    
    vi.spyOn(usageLimitService, 'checkAllLimits').mockResolvedValue(mockResult);
    
    await act(async () => {
      await result.current.checkLimits('research');
    });
    
    expect(result.current.showLimitModal).toBe(true);
    
    // Fermer le modal
    act(() => {
      result.current.closeLimitModal();
    });
    
    expect(result.current.showLimitModal).toBe(false);
  });
});
