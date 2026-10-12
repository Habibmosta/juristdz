import { hashResetToken, emailService } from '@/services/emailService';

describe('emailService', () => {
  describe('hashResetToken', () => {
    it('retourne un hash SHA-256 hexadécimal stable de 64 caractères', () => {
      const token = '11111111-2222-3333-4444-555555555555';
      const hash1 = hashResetToken(token);
      const hash2 = hashResetToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('produit des hachages différents pour des jetons différents', () => {
      expect(hashResetToken('token-a')).not.toBe(hashResetToken('token-b'));
    });
  });

  describe('isConfigured', () => {
    it("reflète la présence des identifiants SMTP", () => {
      const expected = Boolean(
        process.env.SMTP_HOST &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASS &&
          process.env.SMTP_USER !== 'a-remplir-par-votre-email-brevo'
      );
      expect(emailService.isConfigured).toBe(expected);
    });
  });
});
