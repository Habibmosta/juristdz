/**
 * Service d'envoi d'emails pour le système d'essai gratuit
 * Gère les emails de bienvenue, rappels et expiration
 */

import { supabase } from '../lib/supabase';

interface EmailTemplate {
  subject: string;
  body: string;
}

interface TrialUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  trial_ends_at: string;
  days_remaining: number;
}

export class TrialEmailService {
  
  /**
   * Email de bienvenue pour nouvel essai gratuit
   */
  static getWelcomeEmail(user: TrialUser, isAr: boolean = false): EmailTemplate {
    if (isAr) {
      return {
        s