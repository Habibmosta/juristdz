import { 
  CLAUSES_STANDARDS, 
  Clause, 
  getClausesForDocument,
  getMandatoryClauses,
  populateClause 
} from '../data/clausesStandards';

export interface ClauseTemplate {
  documentType: string;
  selectedClauseIds: string[];
  variables: { [key: string]: string };
  customClauses?: string[];
}

class ClauseService {
  /**
   * Générer le texte complet d'un document avec les clauses sélectionnées
   */
  generateDocumentWithClauses(
    template: ClauseTemplate,
    language: 'fr' | 'ar'
  ): string {
    const clauses = template.selectedClauseIds
      .map(id => CLAUSES_STANDARDS.find(c => c.id === id))
      .filter((c): c is Clause => c !== undefined);

    let document = '';

    // Grouper les clauses par catégorie
    const clausesByCategory = this.groupClausesByCategory(clauses);

    // Générer le document section par section
    Object.entries(clausesByCategory).forEach(([category, categoryClauses]) => {
      // Titre de la section (optionnel)
      document += '\n\n';
      
      categoryClauses.forEach((clause, index) => {
        const clauseText = populateClause(clause, template.variables, language);
        document += clauseText;
        
        // Ajouter un saut de ligne entre les clauses
        if (index < categoryClauses.length - 1) {
          document += '\n\n';
        }
      });
    });

    // Ajouter les clauses personnalisées
    if (template.customClauses && template.customClauses.length > 0) {
      document += '\n\n';
      document += language === 'ar' ? 'بنود إضافية:' : 'CLAUSES ADDITIONNELLES:';
      document += '\n\n';
      template.customClauses.forEach((customClause, index) => {
        document += customClause;
        if (index < template.customClauses!.length - 1) {
          document += '\n\n';
        }
      });
    }

    return document.trim();
  }

  /**
   * Grouper les clauses par catégorie
   */
  private groupClausesByCategory(clauses: Clause[]): { [category: string]: Clause[] } {
    const grouped: { [category: string]: Clause[] } = {};

    clauses.forEach(clause => {
      if (!grouped[clause.category]) {
        grouped[clause.category] = [];
      }
      grouped[clause.category].push(clause);
    });

    return grouped;
  }

  /**
   * Valider qu'un document a toutes les clauses obligatoires
   */
  validateMandatoryClauses(
    documentType: string,
    selectedClauseIds: string[]
  ): { valid: boolean; missingClauses: Clause[] } {
    const mandatory = getMandatoryClauses(documentType);
    const missing = mandatory.filter(clause => !selectedClauseIds.includes(clause.id));

    return {
      valid: missing.length === 0,
      missingClauses: missing
    };
  }

  /**
   * Obtenir les variables manquantes dans les clauses sélectionnées
   */
  getMissingVariables(
    selectedClauseIds: string[],
    providedVariables: { [key: string]: string }
  ): string[] {
    const allVariables = new Set<string>();

    selectedClauseIds.forEach(id => {
      const clause = CLAUSES_STANDARDS.find(c => c.id === id);
      if (clause?.variables) {
        clause.variables.forEach(v => allVariables.add(v));
      }
    });

    return Array.from(allVariables).filter(v => !providedVariables[v]);
  }

  /**
   * Suggérer des clauses complémentaires
   */
  suggestComplementaryClauses(
    documentType: string,
    selectedClauseIds: string[]
  ): Clause[] {
    const available = getClausesForDocument(documentType);
    const selected = new Set(selectedClauseIds);

    // Logique de suggestion basée sur les clauses déjà sélectionnées
    const suggestions: Clause[] = [];

    // Si une clause de prix est sélectionnée, suggérer une clause de paiement
    if (selectedClauseIds.some(id => id.includes('prix'))) {
      const paymentClauses = available.filter(c => 
        c.category === 'prix_paiement' && !selected.has(c.id)
      );
      suggestions.push(...paymentClauses);
    }

    // Si une clause de vente est sélectionnée, suggérer les garanties
    if (selectedClauseIds.some(id => id.includes('vente'))) {
      const garantieClauses = available.filter(c => 
        c.category === 'garanties' && !selected.has(c.id)
      );
      suggestions.push(...garantieClauses);
    }

    return suggestions;
  }

  /**
   * Exporter les clauses en format structuré
   */
  exportClauses(
    template: ClauseTemplate,
    language: 'fr' | 'ar',
    format: 'text' | 'json' | 'markdown'
  ): string {
    const clauses = template.selectedClauseIds
      .map(id => CLAUSES_STANDARDS.find(c => c.id === id))
      .filter((c): c is Clause => c !== undefined);

    switch (format) {
      case 'json':
        return JSON.stringify({
          documentType: template.documentType,
          clauses: clauses.map(c => ({
            id: c.id,
            name: language === 'ar' ? c.name_ar : c.name_fr,
            text: populateClause(c, template.variables, language),
            legal_reference: c.legal_reference
          })),
          customClauses: template.customClauses
        }, null, 2);

      case 'markdown':
        let md = `# ${template.documentType}\n\n`;
        clauses.forEach((clause, index) => {
          md += `## ${index + 1}. ${language === 'ar' ? clause.name_ar : clause.name_fr}\n\n`;
          md += populateClause(clause, template.variables, language);
          md += '\n\n';
          if (clause.legal_reference) {
            md += `*Référence: ${clause.legal_reference}*\n\n`;
          }
        });
        return md;

      case 'text':
      default:
        return this.generateDocumentWithClauses(template, language);
    }
  }

  /**
   * Rechercher des clauses par mots-clés
   */
  searchClauses(
    query: string,
    documentType?: string,
    language: 'fr' | 'ar' = 'fr'
  ): Clause[] {
    const searchIn = documentType 
      ? getClausesForDocument(documentType)
      : CLAUSES_STANDARDS;

    const lowerQuery = query.toLowerCase();

    return searchIn.filter(clause => {
      const name = language === 'ar' ? clause.name_ar : clause.name_fr;
      const text = language === 'ar' ? clause.text_ar : clause.text_fr;
      
      return name.toLowerCase().includes(lowerQuery) ||
             text.toLowerCase().includes(lowerQuery) ||
             clause.legal_reference?.toLowerCase().includes(lowerQuery);
    });
  }

  /**
   * Obtenir des statistiques sur l'utilisation des clauses
   */
  getClauseStatistics(documentType: string): {
    total: number;
    mandatory: number;
    optional: number;
    byCategory: { [category: string]: number };
  } {
    const clauses = getClausesForDocument(documentType);
    const mandatory = clauses.filter(c => c.mandatory);
    const optional = clauses.filter(c => !c.mandatory);

    const byCategory: { [category: string]: number } = {};
    clauses.forEach(clause => {
      byCategory[clause.category] = (byCategory[clause.category] || 0) + 1;
    });

    return {
      total: clauses.length,
      mandatory: mandatory.length,
      optional: optional.length,
      byCategory
    };
  }

  /**
   * Créer un template de document avec clauses par défaut
   */
  createDefaultTemplate(documentType: string): ClauseTemplate {
    const mandatoryClauses = getMandatoryClauses(documentType);
    
    return {
      documentType,
      selectedClauseIds: mandatoryClauses.map(c => c.id),
      variables: {},
      customClauses: []
    };
  }

  /**
   * Valider la cohérence des clauses sélectionnées
   */
  validateClauseCoherence(selectedClauseIds: string[]): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Vérifier les conflits potentiels
    const hasPaymentCash = selectedClauseIds.includes('prix_vente_comptant');
    const hasPaymentInstallment = selectedClauseIds.includes('prix_echelonne');

    if (hasPaymentCash && hasPaymentInstallment) {
      warnings.push('Conflit: Paiement comptant ET échelonné sélectionnés');
    }

    // Vérifier les dépendances
    const hasVente = selectedClauseIds.some(id => id.includes('vente'));
    const hasGarantie = selectedClauseIds.some(id => id.includes('garantie'));

    if (hasVente && !hasGarantie) {
      warnings.push('Recommandation: Ajouter des clauses de garantie pour une vente');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}

export const clauseService = new ClauseService();
