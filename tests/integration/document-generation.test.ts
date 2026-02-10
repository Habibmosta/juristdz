/**
 * Tests d'intégration pour la génération de documents
 * Teste la combinaison de tous les systèmes
 */

import { wilayaTemplateService } from '../../services/wilayaTemplateService';
import { clauseService } from '../../services/clauseService';
import { getWilayaData } from '../../data/wilayaSpecificData';
import { CLAUSES_STANDARDS } from '../../data/clausesStandards';

describe('Document Generation Integration Tests', () => {
  
  describe('Acte de Vente Immobilière - Alger', () => {
    it('should generate complete document with all systems', () => {
      // 1. Configuration
      const wilayaCode = '16'; // Alger
      const tribunalName = 'Tribunal de Sidi M\'Hamed';
      const language = 'fr';
      
      // 2. Générer l'en-tête
      const header = wilayaTemplateService.generateDocumentHeader(
        wilayaCode,
        tribunalName,
        language
      );
      
      expect(header).toContain('RÉPUBLIQUE ALGÉRIENNE');
      expect(header).toContain('Tribunal de Sidi M\'Hamed');
      expect(header).toContain('Wilaya de Alger');
      
      // 3. Sélectionner les clauses
      const selectedClauses = [
        'id_personne_physique',
        'objet_vente_immobiliere',
        'prix_vente_comptant',
        'garantie_eviction',
        'garantie_vices_caches'
      ];
      
      // 4. Variables
      const variables = {
        // Vendeur
        NOM: 'BENALI',
        PRENOM: 'Ahmed',
        DATE_NAISSANCE: '15/03/1980',
        LIEU_NAISSANCE: 'Alger',
        CIN: '123456789',
        DATE_CIN: '01/01/2015',
        LIEU_CIN: 'Alger',
        ADRESSE: '10 Rue Didouche Mourad, Alger',
        PROFESSION: 'Commerçant',
        
        // Bien
        NATURE_BIEN: 'Appartement F3',
        SUPERFICIE: '85',
        ADRESSE_BIEN: '25 Rue Larbi Ben M\'hidi, Alger',
        NUMERO_TITRE_FONCIER: '12345/16',
        SECTION_CADASTRALE: 'A-123',
        
        // Prix
        PRIX_VENTE: '5000000',
        PRIX_LETTRES: 'Cinq millions',
        
        // Délais
        DELAI_DELIVRANCE: '30'
      };
      
      // 5. Générer les clauses
      const clauseTemplate = {
        documentType: 'acte_vente_immobiliere',
        selectedClauseIds: selectedClauses,
        variables: variables
      };
      
      const clausesText = clauseService.generateDocumentWithClauses(
        clauseTemplate,
        language
      );
      
      expect(clausesText).toContain('BENALI');
      expect(clausesText).toContain('Ahmed');
      expect(clausesText).toContain('Appartement F3');
      expect(clausesText).toContain('5000000');
      
      // 6. Combiner tout
      const finalDocument = header + '\n\n' + clausesText;
      
      // 7. Appliquer les variables de wilaya
      const populatedDocument = wilayaTemplateService.populateTemplate(
        finalDocument,
        wilayaCode,
        tribunalName
      );
      
      // 8. Vérifications finales
      expect(populatedDocument).toContain('Tribunal de Sidi M\'Hamed');
      expect(populatedDocument).toContain('BENALI');
      expect(populatedDocument).toContain('garantit l\'acquéreur');
      expect(populatedDocument.length).toBeGreaterThan(500);
    });
    
    it('should validate RC format for Alger', () => {
      const validation = wilayaTemplateService.validateRC('16/12345678', '16');
      expect(validation.valid).toBe(true);
      
      const invalidValidation = wilayaTemplateService.validateRC('31/12345678', '16');
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.message).toContain('16/XXXXXXXX');
    });
    
    it('should validate NIF format for Alger', () => {
      const validation = wilayaTemplateService.validateNIF('099916123456789', '16');
      expect(validation.valid).toBe(true);
      
      const invalidValidation = wilayaTemplateService.validateNIF('099931123456789', '16');
      expect(invalidValidation.valid).toBe(false);
    });
  });
  
  describe('Requête de Divorce - Oran', () => {
    it('should generate complete divorce request with family clauses', () => {
      const wilayaCode = '31'; // Oran
      const tribunalName = 'Tribunal d\'Oran';
      const language = 'ar';
      
      // En-tête en arabe
      const header = wilayaTemplateService.generateDocumentHeader(
        wilayaCode,
        tribunalName,
        language
      );
      
      expect(header).toContain('الجمهورية الجزائرية');
      expect(header).toContain('محكمة وهران');
      
      // Clauses famille
      const selectedClauses = [
        'id_personne_physique',
        'pension_alimentaire',
        'garde_enfants'
      ];
      
      const variables = {
        NOM: 'بن علي',
        PRENOM: 'أحمد',
        DATE_NAISSANCE: '15/03/1980',
        LIEU_NAISSANCE: 'وهران',
        CIN: '987654321',
        ADRESSE: 'شارع الأمير عبد القادر، وهران',
        PROFESSION: 'تاجر',
        MONTANT_PENSION: '15000',
        BENEFICIAIRE: 'الأطفال القصر',
        JOUR_PAIEMENT: '1',
        NOMS_ENFANTS: 'ياسمين وكريم',
        PARENT_GARDIEN: 'الأم',
        MODALITES_VISITE: 'نهاية أسبوع من كل اثنين ونصف العطل المدرسية'
      };
      
      const clauseTemplate = {
        documentType: 'requete_divorce',
        selectedClauseIds: selectedClauses,
        variables: variables
      };
      
      const clausesText = clauseService.generateDocumentWithClauses(
        clauseTemplate,
        language
      );
      
      expect(clausesText).toContain('بن علي');
      expect(clausesText).toContain('15000');
      expect(clausesText).toContain('ياسمين وكريم');
      
      const finalDocument = header + '\n\n' + clausesText;
      expect(finalDocument.length).toBeGreaterThan(300);
    });
  });
  
  describe('Bail d\'Habitation - Constantine', () => {
    it('should generate complete rental agreement', () => {
      const wilayaCode = '25'; // Constantine
      const tribunalName = 'Tribunal de Constantine';
      const language = 'fr';
      
      const selectedClauses = [
        'id_personne_physique', // Bailleur
        'objet_bail_habitation',
        'loyer_mensuel',
        'depot_garantie',
        'obligation_entretien_bailleur',
        'obligation_usage_locataire'
      ];
      
      const variables = {
        // Bailleur
        NOM: 'KHELIFI',
        PRENOM: 'Rachid',
        DATE_NAISSANCE: '20/05/1975',
        LIEU_NAISSANCE: 'Constantine',
        CIN: '456789123',
        ADRESSE: '15 Rue Larbi Ben M\'hidi, Constantine',
        PROFESSION: 'Propriétaire',
        
        // Logement
        ADRESSE_LOGEMENT: '30 Boulevard de la République, Constantine',
        NOMBRE_PIECES: '4',
        SUPERFICIE: '95',
        
        // Loyer
        MONTANT_LOYER: '30000',
        LOYER_LETTRES: 'Trente mille',
        JOUR_PAIEMENT: '5',
        
        // Garantie
        MONTANT_DEPOT: '60000',
        NOMBRE_MOIS: '2'
      };
      
      const clauseTemplate = {
        documentType: 'bail_habitation',
        selectedClauseIds: selectedClauses,
        variables: variables
      };
      
      const document = clauseService.generateDocumentWithClauses(
        clauseTemplate,
        language
      );
      
      expect(document).toContain('KHELIFI');
      expect(document).toContain('30000');
      expect(document).toContain('30 Boulevard de la République');
      expect(document).toContain('jouissance paisible');
    });
  });
  
  describe('Clause Validation', () => {
    it('should validate mandatory clauses for acte de vente', () => {
      const selectedClauses = ['id_personne_physique', 'prix_vente_comptant'];
      
      const validation = clauseService.validateMandatoryClauses(
        'acte_vente_immobiliere',
        selectedClauses
      );
      
      expect(validation.valid).toBe(false);
      expect(validation.missingClauses.length).toBeGreaterThan(0);
    });
    
    it('should detect missing variables', () => {
      const selectedClauses = ['id_personne_physique', 'prix_vente_comptant'];
      const providedVariables = { NOM: 'BENALI', PRENOM: 'Ahmed' };
      
      const missing = clauseService.getMissingVariables(
        selectedClauses,
        providedVariables
      );
      
      expect(missing.length).toBeGreaterThan(0);
      expect(missing).toContain('DATE_NAISSANCE');
      expect(missing).toContain('PRIX_VENTE');
    });
    
    it('should suggest complementary clauses', () => {
      const selectedClauses = ['objet_vente_immobiliere', 'prix_vente_comptant'];
      
      const suggestions = clauseService.suggestComplementaryClauses(
        'acte_vente_immobiliere',
        selectedClauses
      );
      
      expect(suggestions.length).toBeGreaterThan(0);
      const hasGarantie = suggestions.some(c => c.category === 'garanties');
      expect(hasGarantie).toBe(true);
    });
  });
  
  describe('Wilaya Data Integrity', () => {
    it('should have complete data for all wilayas', () => {
      const wilayaCodes = ['16', '31', '25', '23', '09', '15', '06', '19'];
      
      wilayaCodes.forEach(code => {
        const data = getWilayaData(code);
        
        expect(data).toBeDefined();
        expect(data?.name_fr).toBeDefined();
        expect(data?.name_ar).toBeDefined();
        expect(data?.tribunaux.length).toBeGreaterThan(0);
        expect(data?.format_rc).toMatch(/^\d{2}\/X{8}$/);
        expect(data?.format_nif).toMatch(/^0999\d{2}X{9}$/);
      });
    });
    
    it('should have tribunal information for each wilaya', () => {
      const wilayaCode = '16';
      const data = getWilayaData(wilayaCode);
      
      expect(data?.tribunaux.length).toBeGreaterThan(0);
      
      data?.tribunaux.forEach(tribunal => {
        expect(tribunal.name_fr).toBeDefined();
        expect(tribunal.name_ar).toBeDefined();
        expect(tribunal.address).toBeDefined();
        expect(tribunal.type).toBeDefined();
      });
    });
  });
  
  describe('Clause Library Integrity', () => {
    it('should have all required fields for each clause', () => {
      CLAUSES_STANDARDS.forEach(clause => {
        expect(clause.id).toBeDefined();
        expect(clause.category).toBeDefined();
        expect(clause.name_fr).toBeDefined();
        expect(clause.name_ar).toBeDefined();
        expect(clause.text_fr).toBeDefined();
        expect(clause.text_ar).toBeDefined();
        expect(clause.applicable_to).toBeDefined();
        expect(Array.isArray(clause.applicable_to)).toBe(true);
      });
    });
    
    it('should have legal references for important clauses', () => {
      const importantClauses = CLAUSES_STANDARDS.filter(c => c.mandatory);
      
      importantClauses.forEach(clause => {
        if (clause.category !== 'identification') {
          expect(clause.legal_reference).toBeDefined();
        }
      });
    });
  });
  
  describe('Export Functionality', () => {
    it('should export document in text format', () => {
      const template = {
        documentType: 'acte_vente_immobiliere',
        selectedClauseIds: ['id_personne_physique', 'prix_vente_comptant'],
        variables: {
          NOM: 'TEST',
          PRENOM: 'User',
          PRIX_VENTE: '1000000'
        }
      };
      
      const exported = clauseService.exportClauses(template, 'fr', 'text');
      
      expect(exported).toContain('TEST');
      expect(exported).toContain('1000000');
    });
    
    it('should export document in JSON format', () => {
      const template = {
        documentType: 'acte_vente_immobiliere',
        selectedClauseIds: ['id_personne_physique'],
        variables: { NOM: 'TEST' }
      };
      
      const exported = clauseService.exportClauses(template, 'fr', 'json');
      const parsed = JSON.parse(exported);
      
      expect(parsed.documentType).toBe('acte_vente_immobiliere');
      expect(parsed.clauses).toBeDefined();
      expect(Array.isArray(parsed.clauses)).toBe(true);
    });
    
    it('should export document in markdown format', () => {
      const template = {
        documentType: 'acte_vente_immobiliere',
        selectedClauseIds: ['id_personne_physique'],
        variables: { NOM: 'TEST' }
      };
      
      const exported = clauseService.exportClauses(template, 'fr', 'markdown');
      
      expect(exported).toContain('#');
      expect(exported).toContain('##');
      expect(exported).toContain('TEST');
    });
  });
});
