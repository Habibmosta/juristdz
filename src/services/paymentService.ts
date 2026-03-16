import { supabase } from '../lib/supabase';

export type PaymentGateway = 'paypal' | 'baridimob';
export type SubscriptionPlan = 'pro' | 'cabinet';

export interface PaymentOrder {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number; // en DZD
  amountUSD: number; // pour PayPal
  gateway: PaymentGateway;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  createdAt: string;
}

export const PLAN_PRICES: Record<SubscriptionPlan, { dzd: number; usd: number; label: string }> = {
  pro:     { dzd: 15000, usd: 11, label: 'Pro' },
  cabinet: { dzd: 50000, usd: 37, label: 'Cabinet' },
};

// Taux de change approximatif DZD/USD (à mettre à jour)
const DZD_TO_USD = 0.0074;

export const paymentService = {

  /**
   * Créer un ordre de paiement en base
   */
  async createOrder(
    userId: string,
    plan: SubscriptionPlan,
    gateway: PaymentGateway,
    reference?: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const prices = PLAN_PRICES[plan];
      const { data, error } = await supabase
        .from('payment_orders')
        .insert({
          user_id: userId,
          plan,
          amount_dzd: prices.dzd,
          amount_usd: prices.usd,
          gateway,
          status: 'pending',
          reference: reference || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, orderId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Confirmer un paiement et activer l'abonnement
   */
  async confirmPayment(
    orderId: string,
    userId: string,
    plan: SubscriptionPlan,
    gateway: PaymentGateway,
    transactionRef: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Mettre à jour l'ordre
      const { error: orderError } = await supabase
        .from('payment_orders')
        .update({ status: 'completed', reference: transactionRef, confirmed_at: new Date().toISOString() })
        .eq('id', orderId);
      if (orderError) throw orderError;

      // 2. Activer l'abonnement (1 mois)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan,
          status: 'active',
          payment_method: gateway,
          last_payment_ref: transactionRef,
          expires_at: expiresAt.toISOString(),
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (subError) throw subError;

      // 3. Audit log
      try {
        const { auditService } = await import('./auditService');
        await auditService.log({
          user_id: userId,
          action: 'subscription.activated',
          resource_type: 'subscription',
          details: { plan, gateway, transactionRef, orderId },
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Initier un paiement PayPal — retourne l'URL de redirection
   */
  initiatePayPal(plan: SubscriptionPlan, orderId: string): string {
    const prices = PLAN_PRICES[plan];
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment=success&gateway=paypal&orderId=${orderId}&plan=${plan}`);
    const cancelUrl = encodeURIComponent(`${window.location.origin}?payment=cancel`);

    // PayPal.me link (simple) — à remplacer par PayPal Checkout SDK en production
    // Pour une vraie intégration, utiliser l'API PayPal Orders v2
    return `https://www.paypal.com/paypalme/JuristDZ/${prices.usd}USD?return=${returnUrl}&cancel_return=${cancelUrl}`;
  },

  /**
   * Générer les instructions BaridiMob
   */
  getBaridiMobInstructions(plan: SubscriptionPlan, orderId: string): {
    steps: string[];
    steps_ar: string[];
    amount: number;
    reference: string;
    rib: string;
  } {
    const prices = PLAN_PRICES[plan];
    const ref = `JDZ-${orderId.slice(0, 8).toUpperCase()}`;
    return {
      amount: prices.dzd,
      reference: ref,
      rib: '00799999000123456789', // RIB CCP JuristDZ — à remplacer par le vrai
      steps: [
        'Ouvrez l\'application BaridiMob sur votre téléphone',
        'Allez dans "Virement" → "Virement CCP"',
        `Entrez le RIB destinataire : 00799999000123456789`,
        `Montant : ${prices.dzd.toLocaleString()} DA`,
        `Motif / Référence : ${ref}`,
        'Confirmez avec votre code PIN',
        'Copiez le numéro de transaction et collez-le ci-dessous',
      ],
      steps_ar: [
        'افتح تطبيق بريدي موب على هاتفك',
        'اذهب إلى "تحويل" ← "تحويل CCP"',
        `أدخل رقم الحساب المستفيد: 00799999000123456789`,
        `المبلغ: ${prices.dzd.toLocaleString()} دج`,
        `المرجع / السبب: ${ref}`,
        'أكد بكود PIN الخاص بك',
        'انسخ رقم المعاملة والصقه أدناه',
      ],
    };
  },

  /**
   * Vérifier le statut d'un abonnement
   */
  async getSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at, trial_ends_at, payment_method')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },
};
