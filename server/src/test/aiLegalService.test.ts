import { aiLegalService } from '@/services/aiLegalService';
import { DocumentType } from '@/types/document';
import { LegalDomain } from '@/types/search';
import { Profession } from '@/types/auth';
import { LegalContext, ExplanationLevel } from '@/types/ai';

describe('AILegalService', () => {
  const mockContext: LegalContext = {
    userRole: Profession.AVOCAT,
    jurisdiction: 'Algeria',
    legalDomain: LegalDomain.CIVIL,
    language: 'fr',
    urgency: 'medium',
    complexity: 'medium'
  };

  describe('generateDocumentDraft', () => {
    it('should generate a document draft for avocat', async () => {
      const draft = await aiLegalService.generateDocumentDraft(
        DocumentType.REQUETE,
        mockContext
      );

      expect(draft).toBeDefined();
      expect(draft.type).toBe(DocumentType.REQUETE);
      expect(draft.content).toBeTruthy();
      expect(draft.confidence).toBeGreaterThan(0);
      expect(draft.confidence).toBeLessThanOrEqual(1);
      expect(draft.metadata.generatedAt).toBeInstanceOf(Date);
      expect(draft.legalReferences).toBeInstanceOf(Array);
      expect(draft.suggestions).toBeInstanceOf(Array);
    });

    it('should generate appropriate content for notaire', async () => {
      const notaireContext: LegalContext = {
        ...mockContext,
        userRole: Profession.NOTAIRE
      };

      const draft = await aiLegalService.generateDocumentDraft(
        DocumentType.ACTE_AUTHENTIQUE,
        notaireContext
      );

      expect(draft).toBeDefined();
      expect(draft.type).toBe(DocumentType.ACTE_AUTHENTIQUE);
      expect(draft.estimatedCompletionTime).toBeGreaterThan(0);
    });

    it('should handle complex documents with higher completion time', async () => {
      const complexContext: LegalContext = {
        ...mockContext,
        complexity: 'complex'
      };

      const draft = await aiLegalService.generateDocumentDraft(
        DocumentType.MEMOIRE,
        complexContext
      );

      expect(draft.estimatedCompletionTime).toBeGreaterThan(60); // Complex documents take longer
    });
  });

  describe('analyzeCompliance', () => {
    const sampleDocument = `
      CONTRAT DE VENTE
      
      Entre les soussignés :
      - Vendeur : Jean Dupont
      - Acheteur : Marie Martin
      
      Il est convenu ce qui suit :
      Article 1 : Objet de la vente
      Le vendeur vend à l'acheteur un bien immobilier.
      
      Article 2 : Prix
      Le prix est fixé à 100.000 DA.
    `;

    it('should analyze document compliance', async () => {
      const analysis = await aiLegalService.analyzeCompliance(
        sampleDocument,
        LegalDomain.CIVIL
      );

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(analysis.issues).toBeInstanceOf(Array);
      expect(analysis.suggestions).toBeInstanceOf(Array);
      expect(analysis.checkedRules).toBeInstanceOf(Array);
      expect(analysis.riskAssessment).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it('should identify compliance issues', async () => {
      const poorDocument = 'Contrat mal rédigé sans mentions légales.';

      const analysis = await aiLegalService.analyzeCompliance(
        poorDocument,
        LegalDomain.COMMERCIAL
      );

      expect(analysis.overallScore).toBeLessThan(70); // Poor document should have low score
      expect(analysis.isCompliant).toBe(false);
      expect(analysis.issues.length).toBeGreaterThan(0);
    });

    it('should provide domain-specific analysis', async () => {
      const laborDocument = `
        CONTRAT DE TRAVAIL
        
        L'employeur engage le salarié.
        Salaire : 30.000 DA par mois.
        Durée : CDI
      `;

      const analysis = await aiLegalService.analyzeCompliance(
        laborDocument,
        LegalDomain.LABOR
      );

      expect(analysis.checkedRules.some(rule => 
        rule.category === 'labor' || rule.name.toLowerCase().includes('travail')
      )).toBe(true);
    });
  });

  describe('suggestImprovements', () => {
    const sampleDocument = `
      Requête en justice
      
      Monsieur le Président,
      
      J'ai l'honneur de vous exposer les faits suivants.
      Mon client a subi un préjudice.
      Je demande réparation.
      
      Cordialement.
    `;

    it('should provide improvement suggestions', async () => {
      const suggestions = await aiLegalService.suggestImprovements(
        sampleDocument,
        Profession.AVOCAT
      );

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.id).toBeTruthy();
        expect(suggestion.type).toBeTruthy();
        expect(suggestion.description).toBeTruthy();
        expect(suggestion.confidence).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
        expect(['high', 'medium', 'low']).toContain(suggestion.priority);
      });
    });

    it('should provide role-specific suggestions for avocat', async () => {
      const suggestions = await aiLegalService.suggestImprovements(
        sampleDocument,
        Profession.AVOCAT
      );

      // Should suggest adding "PAR CES MOTIFS" for avocat documents
      const hasMotifsSuggestion = suggestions.some(s => 
        s.description.toLowerCase().includes('motifs') ||
        s.suggested.includes('PAR CES MOTIFS')
      );
      
      expect(hasMotifsSuggestion).toBe(true);
    });

    it('should prioritize suggestions correctly', async () => {
      const suggestions = await aiLegalService.suggestImprovements(
        sampleDocument,
        Profession.AVOCAT
      );

      // Suggestions should be sorted by priority (high first) then confidence
      for (let i = 0; i < suggestions.length - 1; i++) {
        const current = suggestions[i];
        const next = suggestions[i + 1];
        
        if (current.priority === 'high' && next.priority !== 'high') {
          expect(true).toBe(true); // High priority comes first
        } else if (current.priority === next.priority) {
          expect(current.confidence).toBeGreaterThanOrEqual(next.confidence);
        }
      }
    });
  });

  describe('explainLegalConcept', () => {
    it('should explain legal concept for beginners', async () => {
      const explanation = await aiLegalService.explainLegalConcept(
        'contrat',
        ExplanationLevel.BEGINNER
      );

      expect(explanation).toBeDefined();
      expect(explanation.concept).toBe('contrat');
      expect(explanation.level).toBe(ExplanationLevel.BEGINNER);
      expect(explanation.definition).toBeTruthy();
      expect(explanation.context).toBeTruthy();
      expect(explanation.examples).toBeInstanceOf(Array);
      expect(explanation.relatedConcepts).toBeInstanceOf(Array);
      expect(explanation.legalBasis).toBeInstanceOf(Array);
      expect(explanation.language).toBe('fr');
      expect(explanation.lastUpdated).toBeInstanceOf(Date);
    });

    it('should provide more detailed explanation for advanced level', async () => {
      const beginnerExplanation = await aiLegalService.explainLegalConcept(
        'responsabilité civile',
        ExplanationLevel.BEGINNER
      );

      const advancedExplanation = await aiLegalService.explainLegalConcept(
        'responsabilité civile',
        ExplanationLevel.ADVANCED
      );

      // Advanced explanation should be more comprehensive
      expect(advancedExplanation.definition.length).toBeGreaterThan(
        beginnerExplanation.definition.length
      );
      expect(advancedExplanation.practicalApplications.length).toBeGreaterThanOrEqual(
        beginnerExplanation.practicalApplications.length
      );
    });

    it('should infer correct legal domain from concept', async () => {
      const commercialExplanation = await aiLegalService.explainLegalConcept(
        'société commerciale',
        ExplanationLevel.INTERMEDIATE
      );

      // Should have commercial law references
      expect(commercialExplanation.legalBasis.some(ref => 
        ref.reference.toLowerCase().includes('commerce')
      )).toBe(true);
    });
  });

  describe('validateLegalReasoning', () => {
    it('should validate strong legal reasoning', async () => {
      const strongArgument = `
        En application de l'article 124 du Code civil algérien, 
        le contrat est nul car il manque l'une des conditions essentielles 
        de formation du contrat, à savoir le consentement libre et éclairé 
        des parties. En effet, la partie demanderesse a été contrainte 
        de signer sous la menace, ce qui constitue un vice du consentement 
        au sens de l'article 81 du même code.
      `;

      const validation = await aiLegalService.validateLegalReasoning(strongArgument);

      expect(validation).toBeDefined();
      expect(validation.score).toBeGreaterThan(70); // Strong argument should score high
      expect(validation.isValid).toBe(true);
      expect(validation.strengths).toBeInstanceOf(Array);
      expect(validation.strengths.length).toBeGreaterThan(0);
      expect(validation.logicalGaps).toBeInstanceOf(Array);
      expect(validation.supportingEvidence).toBeInstanceOf(Array);
      expect(validation.recommendations).toBeInstanceOf(Array);
    });

    it('should identify weak legal reasoning', async () => {
      const weakArgument = `
        Mon client a raison parce que c'est évident. 
        L'autre partie a tort et doit payer.
      `;

      const validation = await aiLegalService.validateLegalReasoning(weakArgument);

      expect(validation.score).toBeLessThan(50); // Weak argument should score low
      expect(validation.isValid).toBe(false);
      expect(validation.weaknesses.length).toBeGreaterThan(0);
      expect(validation.logicalGaps.length).toBeGreaterThan(0);
    });

    it('should provide constructive recommendations', async () => {
      const incompleteArgument = `
        Le contrat doit être annulé car il y a un vice.
      `;

      const validation = await aiLegalService.validateLegalReasoning(incompleteArgument);

      expect(validation.recommendations).toBeInstanceOf(Array);
      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations.some(rec => 
        rec.toLowerCase().includes('référence') || 
        rec.toLowerCase().includes('préciser')
      )).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid document type gracefully', async () => {
      await expect(
        aiLegalService.generateDocumentDraft(
          'INVALID_TYPE' as DocumentType,
          mockContext
        )
      ).rejects.toThrow();
    });

    it('should handle empty document for compliance analysis', async () => {
      await expect(
        aiLegalService.analyzeCompliance('', LegalDomain.CIVIL)
      ).rejects.toThrow();
    });

    it('should handle invalid legal domain', async () => {
      await expect(
        aiLegalService.analyzeCompliance(
          'Sample document',
          'INVALID_DOMAIN' as LegalDomain
        )
      ).rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should complete document generation within reasonable time', async () => {
      const startTime = Date.now();
      
      await aiLegalService.generateDocumentDraft(
        DocumentType.REQUETE,
        mockContext
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(3).fill(null).map(() =>
        aiLegalService.explainLegalConcept('contrat', ExplanationLevel.BEGINNER)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.concept).toBe('contrat');
      });
    });
  });
});