import { useState, useEffect, useCallback } from 'react';
import { legalDeadlineService } from '../services/legalDeadlineService';
import { AppMode, UserRole } from '../../types';

// Rôles qui ont accès aux délais légaux
const DEADLINE_ROLES: UserRole[] = [
  UserRole.AVOCAT,
  UserRole.NOTAIRE,
  UserRole.HUISSIER,
  UserRole.MAGISTRAT,
];

export interface DeadlineAlertCounts {
  overdue: number;   // Délais dépassés
  urgent: number;    // Délais ≤ 3 jours
  total: number;     // overdue + urgent (pour le badge)
}

export function useDeadlineAlerts(userId: string | null, userRole: UserRole | null) {
  const [counts, setCounts] = useState<DeadlineAlertCounts>({ overdue: 0, urgent: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const hasAccess = userRole && DEADLINE_ROLES.includes(userRole);

  const refresh = useCallback(async () => {
    if (!userId || !hasAccess) return;
    try {
      setLoading(true);
      // Récupère les délais des 0 prochains jours = uniquement urgents/dépassés
      const upcoming = await legalDeadlineService.getUpcoming(userId, 3);
      const overdue = upcoming.filter(d => d.status === 'overdue').length;
      const urgent = upcoming.filter(d => d.status === 'urgent').length;
      setCounts({ overdue, urgent, total: overdue + urgent });
    } catch {
      // Silencieux — ne pas bloquer l'UI
    } finally {
      setLoading(false);
    }
  }, [userId, hasAccess]);

  useEffect(() => {
    refresh();
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { counts, loading, refresh };
}
