import { DocumentTemplate, DocumentType, DocumentCategory, VariableType } from '@/types/document';
import { Profession } from '@/types/auth';
import { LegalDomain } from '@/types/search';

export const DEFAULT_DOCUMENT_TEMPLATES: Partial<DocumentTemplate>[] = [
  // Avocat Templates
  {
    name: 'Requête en Justice',
    description: 'Modèle de requête pour saisir une juridiction',
    type: DocumentType.REQUETE,
    category: DocumentCategory.PROCEDURE,
    roleRestrictions: [Profession.AVOCAT],
    template: `
REQUÊTE

À Monsieur le Président du {{tribunal}}

{{avocat_nom}}, Avocat au Barreau de {{barreau}}
Agissant pour et au nom de {{client_nom}}, {{client_qualite}}
Demeurant à {{client_adresse}}

A l'honneur d'exposer respectueusement ce qui suit :

EXPOSÉ DES FAITS

{{faits}}

EN DROIT

{{arguments_juridiques}}

PAR CES MOTIFS

Il vous plaît, Monsieur le Président :

{{demandes}}

Sous toutes réserves.

Fait à {{lieu}}, le {{date}}

{{avocat_signature}}
    `,
    variables: [
      {
        name: 'tribunal',
        type: VariableType.TEXT,
        label: 'Tribunal compétent',
        required: true,
        placeholder: 'Tribunal de première instance de...'
      },
      {
        name: 'avocat_nom',
        type: VariableType.TEXT,
        label: 'Nom de l\'avocat',
        required: true
      },
      {
        name: 'barreau',
        type: VariableType.TEXT,
        label: 'Barreau d\'inscription',
        required: true,
        placeholder: 'Alger, Oran, Constantine...'
      },
      {
        name: 'client_nom',
        type: VariableType.TEXT,
        label: 'Nom du client',
        required: true
      },
      {
        name: 'client_qualite',
        type: VariableType.TEXT,
        label: 'Qualité du client',
        required: true,
        placeholder: 'né(e) le..., de nationalité...'
      },
      {
        name: 'client_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du client',
        required: true
      },
      {
        name: 'faits',
        type: VariableType.TEXT,
        label: 'Exposé des faits',
        required: true,
        validation: { minLength: 50 }
      },
      {
        name: 'arguments_juridiques',
        type: VariableType.TEXT,
        label: 'Arguments juridiques',
        required: true,
        validation: { minLength: 100 }
      },
      {
        name: 'demandes',
        type: VariableType.TEXT,
        label: 'Demandes formulées',
        required: true
      },
      {
        name: 'lieu',
        type: VariableType.TEXT,
        label: 'Lieu de rédaction',
        required: true
      },
      {
        name: 'date',
        type: VariableType.DATE,
        label: 'Date de rédaction',
        required: true,
        defaultValue: new Date().toLocaleDateString('fr-FR')
      },
      {
        name: 'avocat_signature',
        type: VariableType.TEXT,
        label: 'Signature de l\'avocat',
        required: true
      }
    ],
    legalReferences: [
      {
        type: 'law',
        reference: 'Code de procédure civile et administrative',
        title: 'Procédure de saisine des tribunaux'
      }
    ],
    isPublic: true,
    isActive: true,
    version: 1,
    language: 'fr',
    legalDomain: LegalDomain.CIVIL,
    tags: ['requête', 'procédure', 'tribunal']
  },

  {
    name: 'Conclusions d\'Avocat',
    description: 'Modèle de conclusions pour plaidoirie',
    type: DocumentType.CONCLUSION,
    category: DocumentCategory.PROCEDURE,
    roleRestrictions: [Profession.AVOCAT],
    template: `
CONCLUSIONS

Affaire : {{affaire_numero}}
Devant : {{juridiction}}

Pour : {{client_nom}}, représenté par Maître {{avocat_nom}}
Contre : {{adversaire_nom}}

PLAISE À LA COUR

I. SUR LES FAITS

{{rappel_faits}}

II. EN DROIT

{{moyens_juridiques}}

III. SUR LES DEMANDES

{{analyse_demandes}}

PAR CES MOTIFS

Il plaît à la Cour :

{{conclusions_finales}}

Sous toutes réserves de droit.

Fait à {{lieu}}, le {{date}}

Maître {{avocat_nom}}
Avocat au Barreau de {{barreau}}
    `,
    variables: [
      {
        name: 'affaire_numero',
        type: VariableType.TEXT,
        label: 'Numéro d\'affaire',
        required: true
      },
      {
        name: 'juridiction',
        type: VariableType.TEXT,
        label: 'Juridiction saisie',
        required: true
      },
      {
        name: 'client_nom',
        type: VariableType.TEXT,
        label: 'Nom du client',
        required: true
      },
      {
        name: 'avocat_nom',
        type: VariableType.TEXT,
        label: 'Nom de l\'avocat',
        required: true
      },
      {
        name: 'adversaire_nom',
        type: VariableType.TEXT,
        label: 'Nom de la partie adverse',
        required: true
      },
      {
        name: 'rappel_faits',
        type: VariableType.TEXT,
        label: 'Rappel des faits',
        required: true
      },
      {
        name: 'moyens_juridiques',
        type: VariableType.TEXT,
        label: 'Moyens juridiques',
        required: true
      },
      {
        name: 'analyse_demandes',
        type: VariableType.TEXT,
        label: 'Analyse des demandes',
        required: true
      },
      {
        name: 'conclusions_finales',
        type: VariableType.TEXT,
        label: 'Conclusions finales',
        required: true
      },
      {
        name: 'lieu',
        type: VariableType.TEXT,
        label: 'Lieu',
        required: true
      },
      {
        name: 'date',
        type: VariableType.DATE,
        label: 'Date',
        required: true
      },
      {
        name: 'barreau',
        type: VariableType.TEXT,
        label: 'Barreau',
        required: true
      }
    ],
    legalReferences: [
      {
        type: 'law',
        reference: 'Code de procédure civile',
        title: 'Règles de procédure devant les tribunaux'
      }
    ],
    isPublic: true,
    isActive: true,
    version: 1,
    language: 'fr',
    legalDomain: LegalDomain.CIVIL,
    tags: ['conclusions', 'plaidoirie', 'avocat']
  },

  // Notaire Templates
  {
    name: 'Acte de Vente Immobilière',
    description: 'Modèle d\'acte authentique de vente d\'un bien immobilier',
    type: DocumentType.ACTE_VENTE,
    category: DocumentCategory.ACTE_NOTARIE,
    roleRestrictions: [Profession.NOTAIRE],
    template: `
ACTE DE VENTE

L'an {{annee}} et le {{date_complete}}

Par-devant Maître {{notaire_nom}}, Notaire à {{notaire_residence}}

ONT COMPARU :

1° {{vendeur_nom}}, {{vendeur_profession}}
   Né(e) le {{vendeur_naissance}} à {{vendeur_lieu_naissance}}
   Demeurant à {{vendeur_adresse}}
   Ci-après dénommé(e) "LE VENDEUR"

2° {{acquereur_nom}}, {{acquereur_profession}}
   Né(e) le {{acquereur_naissance}} à {{acquereur_lieu_naissance}}
   Demeurant à {{acquereur_adresse}}
   Ci-après dénommé(e) "L'ACQUÉREUR"

EXPOSÉ

Le vendeur déclare être propriétaire du bien ci-après désigné :

{{description_bien}}

Situé à {{bien_adresse}}

VENTE

Le vendeur vend à l'acquéreur qui accepte, le bien ci-dessus désigné.

PRIX

Cette vente est consentie moyennant le prix de {{prix_vente}} DA ({{prix_lettres}}).

CONDITIONS

{{conditions_particulieres}}

DONT ACTE

Fait et passé à {{lieu_acte}}, les jour, mois et an que dessus.

Et après lecture faite, les parties ont signé avec Nous, Notaire.

{{signatures}}
    `,
    variables: [
      {
        name: 'annee',
        type: VariableType.NUMBER,
        label: 'Année',
        required: true,
        defaultValue: new Date().getFullYear()
      },
      {
        name: 'date_complete',
        type: VariableType.DATE,
        label: 'Date complète',
        required: true
      },
      {
        name: 'notaire_nom',
        type: VariableType.TEXT,
        label: 'Nom du notaire',
        required: true
      },
      {
        name: 'notaire_residence',
        type: VariableType.TEXT,
        label: 'Résidence du notaire',
        required: true
      },
      {
        name: 'vendeur_nom',
        type: VariableType.PERSON,
        label: 'Nom du vendeur',
        required: true
      },
      {
        name: 'vendeur_profession',
        type: VariableType.TEXT,
        label: 'Profession du vendeur',
        required: true
      },
      {
        name: 'vendeur_naissance',
        type: VariableType.DATE,
        label: 'Date de naissance du vendeur',
        required: true
      },
      {
        name: 'vendeur_lieu_naissance',
        type: VariableType.TEXT,
        label: 'Lieu de naissance du vendeur',
        required: true
      },
      {
        name: 'vendeur_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du vendeur',
        required: true
      },
      {
        name: 'acquereur_nom',
        type: VariableType.PERSON,
        label: 'Nom de l\'acquéreur',
        required: true
      },
      {
        name: 'acquereur_profession',
        type: VariableType.TEXT,
        label: 'Profession de l\'acquéreur',
        required: true
      },
      {
        name: 'acquereur_naissance',
        type: VariableType.DATE,
        label: 'Date de naissance de l\'acquéreur',
        required: true
      },
      {
        name: 'acquereur_lieu_naissance',
        type: VariableType.TEXT,
        label: 'Lieu de naissance de l\'acquéreur',
        required: true
      },
      {
        name: 'acquereur_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse de l\'acquéreur',
        required: true
      },
      {
        name: 'description_bien',
        type: VariableType.TEXT,
        label: 'Description du bien',
        required: true,
        validation: { minLength: 100 }
      },
      {
        name: 'bien_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du bien',
        required: true
      },
      {
        name: 'prix_vente',
        type: VariableType.CURRENCY,
        label: 'Prix de vente (DA)',
        required: true
      },
      {
        name: 'prix_lettres',
        type: VariableType.TEXT,
        label: 'Prix en lettres',
        required: true
      },
      {
        name: 'conditions_particulieres',
        type: VariableType.TEXT,
        label: 'Conditions particulières',
        required: false
      },
      {
        name: 'lieu_acte',
        type: VariableType.TEXT,
        label: 'Lieu de l\'acte',
        required: true
      },
      {
        name: 'signatures',
        type: VariableType.TEXT,
        label: 'Signatures',
        required: true
      }
    ],
    legalReferences: [
      {
        type: 'law',
        reference: 'Code civil algérien',
        title: 'Dispositions relatives à la vente immobilière',
        article: 'Articles 351 et suivants'
      },
      {
        type: 'law',
        reference: 'Loi 90-25',
        title: 'Loi portant orientation foncière'
      }
    ],
    isPublic: true,
    isActive: true,
    version: 1,
    language: 'fr',
    legalDomain: LegalDomain.CIVIL,
    tags: ['vente', 'immobilier', 'acte authentique']
  },

  // Huissier Templates
  {
    name: 'Exploit de Signification',
    description: 'Modèle d\'exploit pour signification d\'acte judiciaire',
    type: DocumentType.EXPLOIT,
    category: DocumentCategory.SIGNIFICATION,
    roleRestrictions: [Profession.HUISSIER],
    template: `
EXPLOIT DE SIGNIFICATION

L'an {{annee}} et le {{date_signification}}

À la requête de {{demandeur_nom}}, {{demandeur_qualite}}
Demeurant à {{demandeur_adresse}}

J'ai, {{huissier_nom}}, Huissier de Justice près le {{tribunal_rattachement}}
Demeurant à {{huissier_adresse}}

SIGNIFIÉ à {{destinataire_nom}}, {{destinataire_qualite}}
{{#if destinataire_present}}
Parlant à sa personne
{{else}}
Parlant à {{personne_recevant}}, {{qualite_recevant}}
{{/if}}

L'acte ci-après :

{{acte_signifie}}

En date du {{date_acte}}

AVEC SOMMATION de {{sommation}}

Dans le délai de {{delai}} à compter de la présignification.

COÛT : {{cout_exploit}} DA

Dont acte, que j'ai laissé copie.

{{huissier_signature}}
    `,
    variables: [
      {
        name: 'annee',
        type: VariableType.NUMBER,
        label: 'Année',
        required: true
      },
      {
        name: 'date_signification',
        type: VariableType.DATE,
        label: 'Date de signification',
        required: true
      },
      {
        name: 'demandeur_nom',
        type: VariableType.TEXT,
        label: 'Nom du demandeur',
        required: true
      },
      {
        name: 'demandeur_qualite',
        type: VariableType.TEXT,
        label: 'Qualité du demandeur',
        required: true
      },
      {
        name: 'demandeur_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du demandeur',
        required: true
      },
      {
        name: 'huissier_nom',
        type: VariableType.TEXT,
        label: 'Nom de l\'huissier',
        required: true
      },
      {
        name: 'tribunal_rattachement',
        type: VariableType.TEXT,
        label: 'Tribunal de rattachement',
        required: true
      },
      {
        name: 'huissier_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse de l\'huissier',
        required: true
      },
      {
        name: 'destinataire_nom',
        type: VariableType.TEXT,
        label: 'Nom du destinataire',
        required: true
      },
      {
        name: 'destinataire_qualite',
        type: VariableType.TEXT,
        label: 'Qualité du destinataire',
        required: true
      },
      {
        name: 'destinataire_present',
        type: VariableType.BOOLEAN,
        label: 'Destinataire présent',
        required: true
      },
      {
        name: 'personne_recevant',
        type: VariableType.TEXT,
        label: 'Personne recevant (si absent)',
        required: false
      },
      {
        name: 'qualite_recevant',
        type: VariableType.TEXT,
        label: 'Qualité de la personne recevant',
        required: false
      },
      {
        name: 'acte_signifie',
        type: VariableType.TEXT,
        label: 'Acte à signifier',
        required: true
      },
      {
        name: 'date_acte',
        type: VariableType.DATE,
        label: 'Date de l\'acte',
        required: true
      },
      {
        name: 'sommation',
        type: VariableType.TEXT,
        label: 'Sommation',
        required: true
      },
      {
        name: 'delai',
        type: VariableType.TEXT,
        label: 'Délai',
        required: true
      },
      {
        name: 'cout_exploit',
        type: VariableType.CURRENCY,
        label: 'Coût de l\'exploit (DA)',
        required: true
      },
      {
        name: 'huissier_signature',
        type: VariableType.TEXT,
        label: 'Signature de l\'huissier',
        required: true
      }
    ],
    legalReferences: [
      {
        type: 'law',
        reference: 'Code de procédure civile et administrative',
        title: 'Dispositions relatives aux significations'
      },
      {
        type: 'decree',
        reference: 'Décret 91-65',
        title: 'Statut des huissiers de justice'
      }
    ],
    isPublic: true,
    isActive: true,
    version: 1,
    language: 'fr',
    legalDomain: LegalDomain.CIVIL,
    tags: ['signification', 'exploit', 'huissier']
  },

  // Magistrat Templates
  {
    name: 'Jugement Civil',
    description: 'Modèle de jugement en matière civile',
    type: DocumentType.JUGEMENT,
    category: DocumentCategory.DECISION_JUSTICE,
    roleRestrictions: [Profession.MAGISTRAT],
    template: `
JUGEMENT

RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
Au nom du peuple algérien

Le {{tribunal}}
Statuant en matière civile

Audience publique du {{date_audience}}

Composition du tribunal :
Président : {{president_nom}}
Assesseurs : {{assesseurs}}
Greffier : {{greffier_nom}}

ENTRE :

{{demandeur_nom}}, {{demandeur_qualite}}
Demeurant à {{demandeur_adresse}}
Représenté par Maître {{avocat_demandeur}}

ET :

{{defendeur_nom}}, {{defendeur_qualite}}
Demeurant à {{defendeur_adresse}}
Représenté par Maître {{avocat_defendeur}}

LE TRIBUNAL

Vu les pièces du dossier ;
Vu les conclusions des parties ;
Ouï les plaidoiries ;

SUR LES FAITS :

{{expose_faits}}

SUR LE DROIT :

{{motivation_juridique}}

PAR CES MOTIFS :

Le Tribunal, statuant publiquement, contradictoirement et en premier ressort :

{{dispositif}}

Condamne la partie qui succombe aux dépens.

Ainsi jugé et prononcé à {{lieu_jugement}}, le {{date_jugement}}

Le Président,                    Le Greffier,
{{president_signature}}          {{greffier_signature}}
    `,
    variables: [
      {
        name: 'tribunal',
        type: VariableType.TEXT,
        label: 'Nom du tribunal',
        required: true
      },
      {
        name: 'date_audience',
        type: VariableType.DATE,
        label: 'Date d\'audience',
        required: true
      },
      {
        name: 'president_nom',
        type: VariableType.TEXT,
        label: 'Nom du président',
        required: true
      },
      {
        name: 'assesseurs',
        type: VariableType.TEXT,
        label: 'Noms des assesseurs',
        required: true
      },
      {
        name: 'greffier_nom',
        type: VariableType.TEXT,
        label: 'Nom du greffier',
        required: true
      },
      {
        name: 'demandeur_nom',
        type: VariableType.TEXT,
        label: 'Nom du demandeur',
        required: true
      },
      {
        name: 'demandeur_qualite',
        type: VariableType.TEXT,
        label: 'Qualité du demandeur',
        required: true
      },
      {
        name: 'demandeur_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du demandeur',
        required: true
      },
      {
        name: 'avocat_demandeur',
        type: VariableType.TEXT,
        label: 'Avocat du demandeur',
        required: false
      },
      {
        name: 'defendeur_nom',
        type: VariableType.TEXT,
        label: 'Nom du défendeur',
        required: true
      },
      {
        name: 'defendeur_qualite',
        type: VariableType.TEXT,
        label: 'Qualité du défendeur',
        required: true
      },
      {
        name: 'defendeur_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du défendeur',
        required: true
      },
      {
        name: 'avocat_defendeur',
        type: VariableType.TEXT,
        label: 'Avocat du défendeur',
        required: false
      },
      {
        name: 'expose_faits',
        type: VariableType.TEXT,
        label: 'Exposé des faits',
        required: true,
        validation: { minLength: 100 }
      },
      {
        name: 'motivation_juridique',
        type: VariableType.TEXT,
        label: 'Motivation juridique',
        required: true,
        validation: { minLength: 200 }
      },
      {
        name: 'dispositif',
        type: VariableType.TEXT,
        label: 'Dispositif du jugement',
        required: true
      },
      {
        name: 'lieu_jugement',
        type: VariableType.TEXT,
        label: 'Lieu du jugement',
        required: true
      },
      {
        name: 'date_jugement',
        type: VariableType.DATE,
        label: 'Date du jugement',
        required: true
      },
      {
        name: 'president_signature',
        type: VariableType.TEXT,
        label: 'Signature du président',
        required: true
      },
      {
        name: 'greffier_signature',
        type: VariableType.TEXT,
        label: 'Signature du greffier',
        required: true
      }
    ],
    legalReferences: [
      {
        type: 'law',
        reference: 'Code de procédure civile et administrative',
        title: 'Dispositions relatives aux jugements'
      },
      {
        type: 'law',
        reference: 'Loi organique 04-11',
        title: 'Statut de la magistrature'
      }
    ],
    isPublic: false, // Restricted to magistrats
    isActive: true,
    version: 1,
    language: 'fr',
    legalDomain: LegalDomain.CIVIL,
    tags: ['jugement', 'civil', 'tribunal']
  },

  // Juriste Entreprise Templates
  {
    name: 'Contrat de Travail',
    description: 'Modèle de contrat de travail à durée indéterminée',
    type: DocumentType.CONTRAT_ENTREPRISE,
    category: DocumentCategory.CONTRAT,
    roleRestrictions: [Profession.JURISTE_ENTREPRISE, Profession.AVOCAT],
    template: `
CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE

Entre les soussignés :

L'EMPLOYEUR :
{{entreprise_nom}}, {{entreprise_forme_juridique}}
Au capital de {{entreprise_capital}} DA
Siège social : {{entreprise_adresse}}
Représentée par {{representant_nom}}, {{representant_qualite}}

ET

LE SALARIÉ :
{{salarie_nom}}, né(e) le {{salarie_naissance}} à {{salarie_lieu_naissance}}
Demeurant à {{salarie_adresse}}
Nationalité : {{salarie_nationalite}}

Il a été convenu ce qui suit :

ARTICLE 1 - ENGAGEMENT
L'employeur engage le salarié en qualité de {{poste}} à compter du {{date_debut}}.

ARTICLE 2 - FONCTIONS
Le salarié exercera les fonctions suivantes :
{{description_fonctions}}

ARTICLE 3 - LIEU DE TRAVAIL
Le lieu de travail est fixé à {{lieu_travail}}.

ARTICLE 4 - DURÉE DU TRAVAIL
La durée hebdomadaire de travail est fixée à {{duree_hebdomadaire}} heures.

ARTICLE 5 - RÉMUNÉRATION
Le salaire mensuel brut est fixé à {{salaire_brut}} DA.

ARTICLE 6 - CONGÉS
Le salarié bénéficie des congés légaux prévus par la législation du travail.

ARTICLE 7 - PÉRIODE D'ESSAI
Une période d'essai de {{duree_essai}} est prévue.

ARTICLE 8 - DISPOSITIONS DIVERSES
{{clauses_particulieres}}

Fait à {{lieu_signature}}, le {{date_signature}}, en deux exemplaires.

L'EMPLOYEUR                    LE SALARIÉ
{{signature_employeur}}        {{signature_salarie}}
    `,
    variables: [
      {
        name: 'entreprise_nom',
        type: VariableType.ORGANIZATION,
        label: 'Nom de l\'entreprise',
        required: true
      },
      {
        name: 'entreprise_forme_juridique',
        type: VariableType.SELECT,
        label: 'Forme juridique',
        required: true,
        options: [
          { value: 'SARL', label: 'SARL' },
          { value: 'SPA', label: 'SPA' },
          { value: 'EURL', label: 'EURL' },
          { value: 'SNC', label: 'SNC' }
        ]
      },
      {
        name: 'entreprise_capital',
        type: VariableType.CURRENCY,
        label: 'Capital social (DA)',
        required: true
      },
      {
        name: 'entreprise_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du siège social',
        required: true
      },
      {
        name: 'representant_nom',
        type: VariableType.TEXT,
        label: 'Nom du représentant',
        required: true
      },
      {
        name: 'representant_qualite',
        type: VariableType.TEXT,
        label: 'Qualité du représentant',
        required: true,
        placeholder: 'Gérant, Directeur Général...'
      },
      {
        name: 'salarie_nom',
        type: VariableType.PERSON,
        label: 'Nom du salarié',
        required: true
      },
      {
        name: 'salarie_naissance',
        type: VariableType.DATE,
        label: 'Date de naissance',
        required: true
      },
      {
        name: 'salarie_lieu_naissance',
        type: VariableType.TEXT,
        label: 'Lieu de naissance',
        required: true
      },
      {
        name: 'salarie_adresse',
        type: VariableType.ADDRESS,
        label: 'Adresse du salarié',
        required: true
      },
      {
        name: 'salarie_nationalite',
        type: VariableType.TEXT,
        label: 'Nationalité',
        required: true,
        defaultValue: 'Algérienne'
      },
      {
        name: 'poste',
        type: VariableType.TEXT,
        label: 'Poste occupé',
        required: true
      },
      {
        name: 'date_debut',
        type: VariableType.DATE,
        label: 'Date de début',
        required: true
      },
      {
        name: 'description_fonctions',
        type: VariableType.TEXT,
        label: 'Description des fonctions',
        required: true,
        validation: { minLength: 50 }
      },
      {
        name: 'lieu_travail',
        type: VariableType.TEXT,
        label: 'Lieu de travail',
        required: true
      },
      {
        name: 'duree_hebdomadaire',
        type: VariableType.NUMBER,
        label: 'Durée hebdomadaire (heures)',
        required: true,
        defaultValue: 40,
        validation: { min: 35, max: 48 }
      },
      {
        name: 'salaire_brut',
        type: VariableType.CURRENCY,
        label: 'Salaire mensuel brut (DA)',
        required: true
      },
      {
        name: 'duree_essai',
        type: VariableType.SELECT,
        label: 'Durée période d\'essai',
        required: true,
        options: [
          { value: '3 mois', label: '3 mois' },
          { value: '6 mois', label: '6 mois' },
          { value: '1 an', label: '1 an' }
        ]
      },
      {
        name: 'clauses_particulieres',
        type: VariableType.TEXT,
        label: 'Clauses particulières',
        required: false
      },
      {
        name: 'lieu_signature',
        type: VariableType.TEXT,
        label: 'Lieu de signature',
        required: true
      },
      {
        name: 'date_signature',
        type: VariableType.DATE,
        label: 'Date de signature',
        required: true
      },
      {
        name: 'signature_employeur',
        type: VariableType.TEXT,
        label: 'Signature employeur',
        required: true
      },
      {
        name: 'signature_salarie',
        type: VariableType.TEXT,
        label: 'Signature salarié',
        required: true
      }
    ],
    legalReferences: [
      {
        type: 'law',
        reference: 'Loi 90-11',
        title: 'Loi relative aux relations de travail'
      },
      {
        type: 'law',
        reference: 'Code du travail algérien',
        title: 'Dispositions relatives au contrat de travail'
      }
    ],
    isPublic: true,
    isActive: true,
    version: 1,
    language: 'fr',
    legalDomain: LegalDomain.LABOR,
    tags: ['contrat', 'travail', 'CDI', 'emploi']
  }
];

export function getTemplatesByRole(role: Profession): Partial<DocumentTemplate>[] {
  return DEFAULT_DOCUMENT_TEMPLATES.filter(template => 
    !template.roleRestrictions || 
    template.roleRestrictions.length === 0 || 
    template.roleRestrictions.includes(role)
  );
}

export function getTemplatesByDomain(domain: LegalDomain): Partial<DocumentTemplate>[] {
  return DEFAULT_DOCUMENT_TEMPLATES.filter(template => 
    template.legalDomain === domain
  );
}

export function getTemplatesByCategory(category: DocumentCategory): Partial<DocumentTemplate>[] {
  return DEFAULT_DOCUMENT_TEMPLATES.filter(template => 
    template.category === category
  );
}