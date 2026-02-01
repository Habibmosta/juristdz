// Serveur de test avancé pour JuristDZ avec fonctionnalités spécialisées
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Middleware d'authentification simple
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.first_name, u.last_name, up.profession FROM users u JOIN user_sessions us ON u.id = us.user_id JOIN user_profiles up ON u.id = up.user_id WHERE us.token_hash = $1 AND us.expires_at > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'JuristDZ API - Serveur de Test Avancé',
    version: '1.0.0',
    features: [
      'Authentification multi-rôles',
      'Gestion documentaire',
      'Recherche juridique',
      'Spécificités algériennes',
      'Gestion des dossiers',
      'Facturation'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    services: {
      auth: 'active',
      documents: 'active',
      search: 'active',
      billing: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, profession, organizationName, barNumber } = req.body;
    
    // Vérifier si l'utilisateur existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Utilisateur déjà existant' });
    }
    
    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Créer l'utilisateur
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_active, is_email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name',
      [email, passwordHash, firstName, lastName, true, true]
    );
    
    const user = userResult.rows[0];
    
    // Créer le profil
    await pool.query(
      'INSERT INTO user_profiles (user_id, profession, organization_name, registration_number, is_primary) VALUES ($1, $2, $3, $4, $5)',
      [user.id, profession, organizationName, barNumber, true]
    );
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profession,
        organizationName,
        barNumber
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT u.id, u.email, u.first_name, u.last_name, u.password_hash, up.profession, up.organization_name, up.registration_number FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.email = $1 AND u.is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const user = result.rows[0];
    
    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Créer une session
    const sessionToken = 'jwt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    
    await pool.query(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, sessionToken, expiresAt]
    );
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profession: user.profession,
        organizationName: user.organization_name,
        barNumber: user.registration_number
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Routes protégées - Profil utilisateur
app.get('/api/users/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

app.get('/api/users', authenticate, async (req, res) => {
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
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Routes Documents
app.get('/api/documents', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.id, d.title, d.status, d.created_at, dt.name as type_name FROM documents d LEFT JOIN document_types dt ON d.type_id = dt.id WHERE d.owner_id = $1 ORDER BY d.created_at DESC LIMIT 20',
      [req.user.id]
    );
    
    res.json({
      success: true,
      documents: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Documents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
});

app.post('/api/documents', authenticate, async (req, res) => {
  try {
    const { title, content, typeId } = req.body;
    
    const result = await pool.query(
      'INSERT INTO documents (title, content, type_id, owner_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, status, created_at',
      [title, content, typeId, req.user.id, 'draft']
    );
    
    res.status(201).json({
      success: true,
      message: 'Document créé avec succès',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du document' });
  }
});

// Routes Recherche Juridique
app.get('/api/search/suggestions', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }
  
  try {
    // Suggestions basiques pour les tests
    const suggestions = [
      'contrat de travail',
      'contrat de vente',
      'contrat de bail',
      'code civil algérien',
      'code pénal algérien',
      'procédure civile',
      'droit commercial',
      'droit de la famille'
    ].filter(s => s.toLowerCase().includes(q.toLowerCase()));
    
    res.json({
      success: true,
      suggestions: suggestions.slice(0, 5),
      query: q
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la recherche de suggestions' });
  }
});

app.get('/api/search/jurisprudence', authenticate, async (req, res) => {
  const { q, court, year } = req.query;
  
  try {
    // Simulation de résultats de jurisprudence
    const results = [
      {
        id: '1',
        caseNumber: 'CA-2023-001',
        title: 'Arrêt relatif au contrat de travail',
        court: 'Cour d\'Appel d\'Alger',
        date: '2023-06-15',
        summary: 'Décision concernant la rupture abusive du contrat de travail...',
        relevance: 0.95
      },
      {
        id: '2',
        caseNumber: 'CS-2023-045',
        title: 'Décision en matière commerciale',
        court: 'Cour Suprême',
        date: '2023-08-22',
        summary: 'Jurisprudence sur les contrats commerciaux internationaux...',
        relevance: 0.87
      }
    ].filter(r => !q || r.title.toLowerCase().includes(q.toLowerCase()));
    
    res.json({
      success: true,
      results,
      count: results.length,
      query: { q, court, year }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la recherche jurisprudentielle' });
  }
});

// Routes Spécificités Algériennes
app.get('/api/algerian-legal/codes', async (req, res) => {
  try {
    const codes = [
      {
        id: 'civil',
        name: 'Code Civil Algérien',
        description: 'Code civil de la République algérienne',
        lastUpdate: '2023-01-01',
        articlesCount: 1853
      },
      {
        id: 'penal',
        name: 'Code Pénal Algérien',
        description: 'Code pénal et procédure pénale',
        lastUpdate: '2023-01-01',
        articlesCount: 495
      },
      {
        id: 'commerce',
        name: 'Code de Commerce',
        description: 'Réglementation commerciale algérienne',
        lastUpdate: '2022-12-15',
        articlesCount: 892
      },
      {
        id: 'famille',
        name: 'Code de la Famille',
        description: 'Statut personnel et relations familiales',
        lastUpdate: '2023-02-10',
        articlesCount: 222
      }
    ];
    
    res.json({
      success: true,
      codes,
      count: codes.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des codes' });
  }
});

app.get('/api/algerian-specificities/courts', async (req, res) => {
  try {
    const courts = [
      {
        id: 'cs-alger',
        name: 'Cour Suprême',
        type: 'supreme',
        location: 'Alger',
        jurisdiction: 'Nationale'
      },
      {
        id: 'ca-alger',
        name: 'Cour d\'Appel d\'Alger',
        type: 'appeal',
        location: 'Alger',
        jurisdiction: 'Alger, Blida, Boumerdès'
      },
      {
        id: 'ti-alger',
        name: 'Tribunal de Première Instance d\'Alger',
        type: 'first_instance',
        location: 'Alger',
        jurisdiction: 'Alger Centre'
      }
    ];
    
    res.json({
      success: true,
      courts,
      count: courts.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tribunaux' });
  }
});

// Routes Facturation (pour avocats, huissiers, notaires)
app.get('/api/billing/rates', authenticate, async (req, res) => {
  try {
    const { profession } = req.user;
    
    const rates = {
      avocat: {
        consultation: { min: 5000, max: 15000, unit: 'DZD/heure' },
        plaidoirie: { min: 20000, max: 50000, unit: 'DZD/affaire' },
        redaction: { min: 10000, max: 30000, unit: 'DZD/document' }
      },
      notaire: {
        acte_vente: { rate: 0.5, unit: '% de la valeur' },
        testament: { min: 8000, max: 15000, unit: 'DZD/acte' },
        contrat: { min: 12000, max: 25000, unit: 'DZD/contrat' }
      },
      huissier: {
        signification: { base: 3000, unit: 'DZD + frais' },
        constat: { min: 8000, max: 20000, unit: 'DZD/constat' },
        saisie: { rate: 2, unit: '% du montant saisi' }
      }
    };
    
    res.json({
      success: true,
      profession,
      rates: rates[profession] || {},
      currency: 'DZD',
      lastUpdate: '2024-01-01'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des barèmes' });
  }
});

app.post('/api/billing/calculate', authenticate, async (req, res) => {
  try {
    const { type, amount, hours, complexity } = req.body;
    const { profession } = req.user;
    
    let calculation = {
      type,
      profession,
      baseAmount: amount || 0,
      hours: hours || 1,
      complexity: complexity || 'normal',
      total: 0,
      breakdown: {}
    };
    
    // Calculs simplifiés selon la profession
    switch (profession) {
      case 'avocat':
        if (type === 'consultation') {
          calculation.total = hours * 10000; // 10k DZD/heure
        } else if (type === 'plaidoirie') {
          calculation.total = 35000; // Forfait
        }
        break;
        
      case 'notaire':
        if (type === 'acte_vente' && amount) {
          calculation.total = amount * 0.005; // 0.5%
        } else {
          calculation.total = 12000; // Forfait
        }
        break;
        
      case 'huissier':
        if (type === 'signification') {
          calculation.total = 3000 + (hours * 2000);
        }
        break;
        
      default:
        calculation.total = hours * 8000;
    }
    
    // Ajustement selon la complexité
    const complexityMultiplier = {
      simple: 0.8,
      normal: 1.0,
      complex: 1.5,
      very_complex: 2.0
    };
    
    calculation.total *= complexityMultiplier[complexity] || 1.0;
    calculation.total = Math.round(calculation.total);
    
    res.json({
      success: true,
      calculation,
      currency: 'DZD'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du calcul de facturation' });
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
    console.log(`🚀 JuristDZ Advanced Test Server running on http://localhost:${port}`);
    console.log(`📊 Database: Connected`);
    console.log(`🔧 Features: Auth, Documents, Search, Billing, Algerian Legal`);
    console.log(`🧪 Ready for advanced testing!`);
  });
}

startServer().catch(console.error);