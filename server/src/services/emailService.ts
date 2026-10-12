import nodemailer from 'nodemailer';
import { createHash } from 'crypto';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

export interface ResetEmailParams {
  to: string;
  resetLink: string;
  language?: 'fr' | 'ar';
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor() {
    this.from =
      process.env.MAIL_FROM || 'JuristDZ <no-reply@juristdz.com>';

    const { host, port, user, pass } = config.email;
    const isPlaceholder = (v?: string) => !v || v.startsWith('a-remplir');

    if (
      host &&
      !isPlaceholder(user) &&
      !isPlaceholder(pass)
    ) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      logger.info('Service email initialisé (SMTP)', { host, port });
    } else {
      logger.warn(
        'SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS) : les emails de réinitialisation ne seront pas envoyés.'
      );
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetEmail({ to, resetLink, language = 'fr' }: ResetEmailParams): Promise<boolean> {
    const { subject, text, html } = this.buildResetTemplate(resetLink, language);

    if (!this.transporter) {
      logger.warn('Email de réinitialisation non envoyé (SMTP absent)', { to });
      logger.info(`[DEV] Lien de réinitialisation pour ${to} : ${resetLink}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html
      });
      logger.info('Email de réinitialisation envoyé', { to });
      return true;
    } catch (error) {
      logger.error("Échec de l'envoi de l'email de réinitialisation", { to, error });
      throw error;
    }
  }

  private buildResetTemplate(resetLink: string, language: 'fr' | 'ar'): {
    subject: string;
    text: string;
    html: string;
  } {
    if (language === 'ar') {
      return {
        subject: 'JuristDZ — إعادة تعيين كلمة المرور',
        text:
          `مرحباً،\n\n` +
          `لإعادة تعيين كلمة المرور الخاصة بحسابك على JuristDZ، اضغط على الرابط التالي (صالح لمدة ساعة):\n\n` +
          `${resetLink}\n\n` +
          `إذا لم تطلب إعادة التعيين، تتجاهل هذه الرسالة.\n\n` +
          `فريق JuristDZ`,
        html: `<!doctype html><html dir="rtl" lang="ar"><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px">` +
          `<div style="max-width:480px;margin:auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px">` +
          `<h2 style="color:#f59e0b;margin-top:0">JuristDZ</h2>` +
          `<p>لإعادة تعيين كلمة المرور، اضغط على الزر أدناه (صالح لمدة ساعة):</p>` +
          `<p style="text-align:center"><a href="${resetLink}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold">إعادة تعيين كلمة المرور</a></p>` +
          `<p style="font-size:12px;color:#94a3b8">إذا لم تطلب ذلك، تجاهل هذه الرسالة.<br><a href="${resetLink}" style="color:#94a3b8">${resetLink}</a></p>` +
          `</div></body></html>`
      };
    }

    return {
      subject: 'JuristDZ — Réinitialisation de votre mot de passe',
      text:
        `Bonjour,\n\n` +
        `Pour réinitialiser le mot de passe de votre compte JuristDZ, cliquez sur le lien ci-dessous (valable 1 heure) :\n\n` +
        `${resetLink}\n\n` +
        `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n` +
        `L'équipe JuristDZ`,
      html: `<!doctype html><html lang="fr"><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px">` +
        `<div style="max-width:480px;margin:auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px">` +
        `<h2 style="color:#f59e0b;margin-top:0">JuristDZ</h2>` +
        `<p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous (lien valable 1 heure) :</p>` +
        `<p style="text-align:center"><a href="${resetLink}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold">Réinitialiser mon mot de passe</a></p>` +
        `<p style="font-size:12px;color:#94a3b8">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br><a href="${resetLink}" style="color:#94a3b8">${resetLink}</a></p>` +
        `</div></body></html>`
    };
  }
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const emailService = new EmailService();
