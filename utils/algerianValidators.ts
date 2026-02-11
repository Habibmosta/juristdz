/**
 * Validateurs spécifiques pour les formats algériens
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valider une CIN algérienne (18 chiffres)
 */
export function validateCIN(cin: string): ValidationResult {
  const cleaned = cin.replace(/\s/g, '');
  
  if (!cleaned) {
    return { valid: false, message: 'CIN requise' };
  }
  
  if (!/^\d{18}$/.test(cleaned)) {
    return { 
      valid: false, 
      message: 'CIN doit contenir exactement 18 chiffres' 
    };
  }
  
  return { valid: true };
}

/**
 * Valider un numéro de téléphone algérien
 */
export function validatePhoneAlgeria(phone: string): ValidationResult {
  const cleaned = phone.replace(/\s/g, '');
  
  if (!cleaned) {
    return { valid: false, message: 'Téléphone requis' };
  }
  
  // Format: 05XX XX XX XX, 06XX XX XX XX, 07XX XX XX XX, 021 XX XX XX
  const mobilePattern = /^(05|06|07)\d{8}$/;
  const fixePattern = /^0\d{9}$/;
  
  if (!mobilePattern.test(cleaned) && !fixePattern.test(cleaned)) {
    return { 
      valid: false, 
      message: 'Format invalide. Ex: 0555123456 ou 021234567' 
    };
  }
  
  return { valid: true };
}

/**
 * Valider un montant en DA
 */
export function validateAmount(amount: string): ValidationResult {
  if (!amount) {
    return { valid: false, message: 'Montant requis' };
  }
  
  const numAmount = parseFloat(amount.replace(/\s/g, ''));
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { 
      valid: false, 
      message: 'Montant doit être un nombre positif' 
    };
  }
  
  return { valid: true };
}

/**
 * Convertir un montant en lettres (français)
 */
export function amountToWords(amount: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (amount === 0) return 'zéro';
  if (amount === 1) return 'un';
  
  let words = '';
  
  // Millions
  if (amount >= 1000000) {
    const millions = Math.floor(amount / 1000000);
    words += (millions === 1 ? 'un million' : convertHundreds(millions) + ' millions') + ' ';
    amount %= 1000000;
  }
  
  // Milliers
  if (amount >= 1000) {
    const thousands = Math.floor(amount / 1000);
    words += (thousands === 1 ? 'mille' : convertHundreds(thousands) + ' mille') + ' ';
    amount %= 1000;
  }
  
  // Centaines
  if (amount > 0) {
    words += convertHundreds(amount);
  }
  
  return words.trim();
  
  function convertHundreds(n: number): string {
    let result = '';
    
    // Centaines
    const hundreds = Math.floor(n / 100);
    if (hundreds > 0) {
      result += (hundreds === 1 ? 'cent' : units[hundreds] + ' cent');
      if (n % 100 !== 0) result += ' ';
    }
    
    n %= 100;
    
    // Dizaines et unités
    if (n >= 20) {
      const tensDigit = Math.floor(n / 10);
      result += tens[tensDigit];
      if (n % 10 !== 0) {
        result += (tensDigit === 7 || tensDigit === 9 ? '-' : '-') + units[n % 10];
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += units[n];
    }
    
    return result;
  }
}

/**
 * Valider une date (pas dans le futur pour date de naissance)
 */
export function validateBirthDate(date: string): ValidationResult {
  if (!date) {
    return { valid: false, message: 'Date de naissance requise' };
  }
  
  const birthDate = new Date(date);
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  
  if (birthDate > today) {
    return { valid: false, message: 'Date ne peut pas être dans le futur' };
  }
  
  if (birthDate < minDate) {
    return { valid: false, message: 'Date invalide (trop ancienne)' };
  }
  
  if (birthDate > maxDate) {
    return { valid: false, message: 'Personne doit avoir au moins 18 ans' };
  }
  
  return { valid: true };
}

/**
 * Valider un code postal algérien (5 chiffres)
 */
export function validatePostalCode(code: string, wilayaCode?: string): ValidationResult {
  if (!code) {
    return { valid: false, message: 'Code postal requis' };
  }
  
  if (!/^\d{5}$/.test(code)) {
    return { valid: false, message: 'Code postal doit contenir 5 chiffres' };
  }
  
  if (wilayaCode) {
    const codeWilaya = code.substring(0, 2);
    if (codeWilaya !== wilayaCode) {
      return { 
        valid: false, 
        message: `Code postal doit commencer par ${wilayaCode}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Formater un numéro de téléphone algérien
 */
export function formatPhoneAlgeria(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  
  if (cleaned.length === 10) {
    // Format: 05XX XX XX XX
    return cleaned.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  
  return phone;
}

/**
 * Formater un montant en DA
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Valider un nom (lettres uniquement, majuscules)
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, message: 'Nom requis' };
  }
  
  if (name.length < 2) {
    return { valid: false, message: 'Nom trop court (minimum 2 caractères)' };
  }
  
  if (!/^[A-ZÀ-ÿ\s-]+$/i.test(name)) {
    return { 
      valid: false, 
      message: 'Nom doit contenir uniquement des lettres' 
    };
  }
  
  return { valid: true };
}

/**
 * Valider une adresse
 */
export function validateAddress(address: string): ValidationResult {
  if (!address) {
    return { valid: false, message: 'Adresse requise' };
  }
  
  if (address.length < 10) {
    return { 
      valid: false, 
      message: 'Adresse trop courte (minimum 10 caractères)' 
    };
  }
  
  return { valid: true };
}
