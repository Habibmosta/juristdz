/**
 * Service pour convertir des nombres et dates en toutes lettres
 * Conforme aux standards algériens
 */

export class NumberToWordsService {
  private static instance: NumberToWordsService;

  private constructor() {}

  static getInstance(): NumberToWordsService {
    if (!NumberToWordsService.instance) {
      NumberToWordsService.instance = new NumberToWordsService();
    }
    return NumberToWordsService.instance;
  }

  /**
   * Convertit un nombre en toutes lettres (français)
   * Ex: 1200000 -> "un million deux cent mille"
   */
  numberToWords(num: number): string {
    if (num === 0) return 'zéro';
    if (num < 0) return 'moins ' + this.numberToWords(-num);

    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      
      if (ten === 7 || ten === 9) {
        // 70-79: soixante-dix, soixante-onze, etc.
        // 90-99: quatre-vingt-dix, quatre-vingt-onze, etc.
        const base = tens[ten];
        if (unit === 0 && ten === 8) return 'quatre-vingts'; // 80
        if (unit === 0) return base;
        if (ten === 7 || ten === 9) {
          return base + '-' + (unit < 10 ? teens[unit] : this.numberToWords(10 + unit));
        }
        return base + '-' + units[unit];
      }
      
      if (unit === 0) return tens[ten];
      if (unit === 1 && ten !== 8) return tens[ten] + ' et un';
      return tens[ten] + '-' + units[unit];
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      let result = hundred === 1 ? 'cent' : units[hundred] + ' cent';
      if (rest === 0 && hundred > 1) result += 's';
      if (rest > 0) result += ' ' + this.numberToWords(rest);
      return result;
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      let result = thousand === 1 ? 'mille' : this.numberToWords(thousand) + ' mille';
      if (rest > 0) result += ' ' + this.numberToWords(rest);
      return result;
    }
    if (num < 1000000000) {
      const million = Math.floor(num / 1000000);
      const rest = num % 1000000;
      let result = million === 1 ? 'un million' : this.numberToWords(million) + ' millions';
      if (rest > 0) result += ' ' + this.numberToWords(rest);
      return result;
    }

    return num.toString(); // Fallback pour très grands nombres
  }

  /**
   * Convertit un montant en toutes lettres avec devise
   * Ex: 1200000 -> "UN MILLION DEUX CENT MILLE DINARS ALGÉRIENS"
   */
  amountToWords(amount: number, currency: string = 'DINARS ALGÉRIENS'): string {
    const words = this.numberToWords(amount);
    return words.toUpperCase() + ' ' + currency;
  }

  /**
   * Convertit une date en toutes lettres
   * Ex: new Date(1985, 2, 15) -> "quinze mars mil neuf cent quatre-vingt-cinq"
   */
  dateToWords(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    const dayWords = this.numberToWords(day);
    const monthWord = months[month];
    const yearWords = this.yearToWords(year);

    return `${dayWords} ${monthWord} ${yearWords}`;
  }

  /**
   * Convertit une année en toutes lettres
   * Ex: 1985 -> "mil neuf cent quatre-vingt-cinq"
   * Ex: 2026 -> "deux mille vingt-six"
   */
  private yearToWords(year: number): string {
    if (year < 1000 || year > 9999) {
      return this.numberToWords(year);
    }

    // Pour les années 1000-1999: "mil" au lieu de "mille"
    if (year >= 1000 && year < 2000) {
      const rest = year - 1000;
      if (rest === 0) return 'mil';
      return 'mil ' + this.numberToWords(rest);
    }

    // Pour les années 2000+: "deux mille"
    return this.numberToWords(year);
  }

  /**
   * Formate un montant avec séparateurs de milliers
   * Ex: 1200000 -> "1 200 000"
   */
  formatAmount(amount: number): string {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /**
   * Formate une date au format algérien
   * Ex: new Date(1985, 2, 15) -> "15/03/1985"
   */
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export const numberToWordsService = NumberToWordsService.getInstance();
