// Serveur de test final simplifié pour JuristDZ
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'JuristDZ API - Test Final',
    version: '1.0.0',
    status: 'running',
    features: [
      'Base de données PostgreSQL',
      'Authentification basique',
      'Gestion des utilisateurs',
      'Recherche juridique',
      'Codes algériens',
      'Tribunaux',
      'Facturation'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const docsCount = await pool.query('SELECT COUNT(*) FROM documents');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbResult.rows[0].now,
      stats: {
        users: parseInt(usersCount.rows[0].count),
        documents: parseInt(docsCount.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Authentification simple (sans bcrypt pour les tests)
app.post('/api/auth/simple-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await pool.query(
      'SELECT u.id, u.email, u.first_name, u.last_name, up.profession, up.organization_name FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.email = $1 AND u.is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = result.rows[0];
    const token = 'simple-token-' + Date.now();
    
    res.json({
      success: true,
      message: 'Connexion simple réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profession: user.profession,
        organization: user.organization_name
      }
    });
    
  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({ error: 'Erreur de connexion' });
  }
});

// Liste des utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.first_name, u.last_name, up.profession, up.organization_name, u.created_at FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.is_active = true ORDER BY u.created_at DESC'
    );
    
    res.json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération utilisateurs' });
  }
});

// Recherche suggestions
app.get('/api/search/suggestions', (req, res) => {
  const { q } = req.query;
  
  const suggestions = [
    'contrat de travail',
    'contrat de vente',
    'contrat de bail',
    'code civil algérien',
    'code pénal algérien',
    'procédure civile',
    'droit commercial',
    'droit de la famille',
    'jurisprudence algérienne',
    'tribunal d\'Alger'
  ].filter(s => !q || s.toLowerCase().includes(q.toLowerCase()));
  
  res.json({
    success: true,
    suggestions: suggestions.slice(0, 5),
    query: q
  });
});

// Codes juridiques algériens
app.get('/api/algerian-legal/codes', (req, res) => {
  const codes = [
    {
      id: 'civil',
      name: 'Code Civil Algérien',
      description: 'Code civil de la République algérienne démocratique et populaire',
      lastUpdate: '2023-01-01',
      articlesCount: 1853,
      status: 'active'
    },
    {
      id: 'penal',
      name: 'Code Pénal Algérien',
      description: 'Code pénal et procédure pénale algérienne',
      lastUpdate: '2023-01-01',
      articlesCount: 495,
      status: 'active'
    },
    {
      id: 'commerce',
      name: 'Code de Commerce',
      description: 'Réglementation du commerce en Algérie',
      lastUpdate: '2022-12-15',
      articlesCount: 892,
      status: 'active'
    },
    {
      id: 'famille',
      name: 'Code de la Famille',
      description: 'Statut personnel et relations familiales en droit algérien',
      lastUpdate: '2023-02-10',
      articlesCount: 222,
      status: 'active'
    },
    {
      id: 'procedure_civile',
      name: 'Code de Procédure Civile',
      description: 'Procédures judiciaires civiles et commerciales',
      lastUpdate: '2023-01-15',
      articlesCount: 1056,
      status: 'active'
    },
    {
      id: 'procedure_penale',
      name: 'Code de Procédure Pénale',
      description: 'Procédures judiciaires pénales',
      lastUpdate: '2023-01-15',
      articlesCount: 743,
      status: 'active'
    }
  ];
  
  res.json({
    success: true,
    codes,
    count: codes.length,
    lastSync: new Date().toISOString()
  });
});

// Tribunaux algériens
app.get('/api/algerian-specificities/courts', (req, res) => {
  const courts = [
    {
      id: 'cs-alger',
      name: 'Cour Suprême',
      type: 'supreme',
      location: 'Alger',
      jurisdiction: 'Nationale',
      address: 'Place de la République, Alger',
      phone: '+213 21 XX XX XX'
    },
    {
      id: 'ce-alger',
      name: 'Conseil d\'État',
      type: 'administrative_supreme',
      location: 'Alger',
      jurisdiction: 'Nationale (Administratif)',
      address: 'Rue Docteur Saadane, Alger',
      phone: '+213 21 XX XX XX'
    },
    {
      id: 'ca-alger',
      name: 'Cour d\'Appel d\'Alger',
      type: 'appeal',
      location: 'Alger',
      jurisdiction: 'Alger, Blida, Boumerdès, Tipaza',
      address: 'Place des Martyrs, Alger',
      phone: '+213 21 XX XX XX'
    },
    {
      id: 'ca-oran',
      name: 'Cour d\'Appel d\'Oran',
      type: 'appeal',
      location: 'Oran',
      jurisdiction: 'Oran, Sidi Bel Abbès, Tlemcen, Mostaganem',
      address: 'Boulevard de la République, Oran',
      phone: '+213 41 XX XX XX'
    },
    {
      id: 'ca-constantine',
      name: 'Cour d\'Appel de Constantine',
      type: 'appeal',
      location: 'Constantine',
      jurisdiction: 'Constantine, Annaba, Sétif, Batna',
      address: 'Place Ahmed Bey, Constantine',
      phone: '+213 31 XX XX XX'
    },
    {
      id: 'ti-alger-centre',
      name: 'Tribunal de Première Instance d\'Alger Centre',
      type: 'first_instance',
      location: 'Alger',
      jurisdiction: 'Alger Centre',
      address: 'Rue Larbi Ben M\'hidi, Alger',
      phone: '+213 21 XX XX XX'
    }
  ];
  
  res.json({
    success: true,
    courts,
    count: courts.length,
    wilayas: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Batna', 'Blida', 'Boumerdès']
  });
});

// Barèmes de facturation
app.get('/api/billing/rates', (req, res) => {
  const rates = {
    avocat: {
      consultation: { min: 5000, max: 15000, unit: 'DZD/heure' },
      plaidoirie: { min: 20000, max: 50000, unit: 'DZD/affaire' },
      redaction_acte: { min: 10000, max: 30000, unit: 'DZD/document' },
      representation: { min: 15000, max: 40000, unit: 'DZD/audience' }
    },
    notaire: {
      acte_vente: { rate: 0.5, max: 500000, unit: '% de la valeur (max 500k DZD)' },
      testament: { min: 8000, max: 15000, unit: 'DZD/acte' },
      contrat_mariage: { min: 12000, max: 25000, unit: 'DZD/contrat' },
      procuration: { min: 3000, max: 8000, unit: 'DZD/procuration' }
    },
    huissier: {
      signification: { base: 3000, frais: 2000, unit: 'DZD + frais déplacement' },
      constat: { min: 8000, max: 20000, unit: 'DZD/constat' },
      saisie: { rate: 2, min: 5000, unit: '% du montant saisi (min 5k DZD)' },
      commandement: { base: 4000, unit: 'DZD + frais' }
    },
    magistrat: {
      note: 'Les magistrats ne facturent pas - salaire fixe de l\'État'
    },
    etudiant: {
      note: 'Tarifs réduits pour consultations pédagogiques uniquement'
    },
    juriste_entreprise: {
      consultation: { min: 8000, max: 20000, unit: 'DZD/heure' },
      audit_juridique: { min: 50000, max: 200000, unit: 'DZD/mission' },
      formation: { min: 15000, max: 30000, unit: 'DZD/jour' }
    }
  };
  
  res.json({
    success: true,
    rates,
    currency: 'DZD',
    lastUpdate: '2024-01-01',
    note: 'Barèmes indicatifs selon les usages professionnels algériens'
  });
});

// Statistiques de la plateforme
app.get('/api/stats', async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const docsCount = await pool.query('SELECT COUNT(*) FROM documents');
    const professionStats = await pool.query('SELECT profession, COUNT(*) as count FROM user_profiles GROUP BY profession');
    
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalDocuments: parseInt(docsCount.rows[0].count),
        professionBreakdown: professionStats.rows,
        platform: {
          version: '1.0.0',
          uptime: process.uptime(),
          environment: 'test'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération statistiques' });
  }
});

// Test database connection
async function testDatabase() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Démarrage du serveur
async function startServer() {
  const dbConnected = await testDatabase();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }
  
  app.listen(port, () => {
    console.log(`🚀 JuristDZ Final Test Server running on http://localhost:${port}`);
    console.log(`📊 Database: Connected`);
    console.log(`🇩🇿 Features: Algerian Legal System, Courts, Billing, Search`);
    console.log(`🧪 Ready for comprehensive testing!`);
    console.log(`📋 Test endpoints:`);
    console.log(`   GET  /                           - Server info`);
    console.log(`   GET  /health                     - Health check with stats`);
    console.log(`   POST /api/auth/simple-login      - Simple login (email only)`);
    console.log(`   GET  /api/users                  - List users`);
    console.log(`   GET  /api/search/suggestions     - Search suggestions`);
    console.log(`   GET  /api/algerian-legal/codes   - Algerian legal codes`);
    console.log(`   GET  /api/algerian-specificities/courts - Algerian courts`);
    console.log(`   GET  /api/billing/rates          - Billing rates by profession`);
    console.log(`   GET  /api/stats                  - Platform statistics`);
  });
}

startServer().catch(console.error);