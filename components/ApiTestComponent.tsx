import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { CheckCircle, XCircle, Loader2, Users, Scale, Building, Search } from 'lucide-react';

interface ApiTestComponentProps {
  language: 'fr' | 'ar';
}

const ApiTestComponent: React.FC<ApiTestComponentProps> = ({ language }) => {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [codes, setCodes] = useState<any>(null);
  const [courts, setCourts] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      setConnectionStatus('loading');
      
      // Test de base
      const isConnected = await apiService.testConnection();
      if (!isConnected) {
        setConnectionStatus('error');
        return;
      }

      setConnectionStatus('connected');

      // Récupération des données
      const [
        serverInfoData,
        healthData,
        usersData,
        codesData,
        courtsData,
        billingData,
        statsData
      ] = await Promise.all([
        apiService.getServerInfo(),
        apiService.getHealth(),
        apiService.getUsers(),
        apiService.getAlgerianCodes(),
        apiService.getCourts(),
        apiService.getBillingRates(),
        apiService.getPlatformStats()
      ]);

      setServerInfo(serverInfoData);
      setHealth(healthData);
      setUsers(usersData);
      setCodes(codesData);
      setCourts(courtsData);
      setBilling(billingData);
      setStats(statsData);

    } catch (error) {
      console.error('API Test Error:', error);
      setConnectionStatus('error');
    }
  };

  const StatusIcon = ({ status }: { status: 'loading' | 'connected' | 'error' }) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: 'loading' | 'connected' | 'error') => {
    switch (status) {
      case 'loading':
        return language === 'fr' ? 'Connexion en cours...' : 'جاري الاتصال...';
      case 'connected':
        return language === 'fr' ? 'Connecté' : 'متصل';
      case 'error':
        return language === 'fr' ? 'Erreur de connexion' : 'خطأ في الاتصال';
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {language === 'fr' ? 'Test de Connectivité API' : 'اختبار الاتصال بواجهة البرمجة'}
        </h2>
        <div className="flex items-center gap-2">
          <StatusIcon status={connectionStatus} />
          <span className="text-sm font-medium">
            {getStatusText(connectionStatus)}
          </span>
        </div>
      </div>

      {connectionStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">
            {language === 'fr' 
              ? 'Impossible de se connecter à l\'API backend. Vérifiez que le serveur est démarré sur http://localhost:3000'
              : 'تعذر الاتصال بواجهة البرمجة الخلفية. تأكد من تشغيل الخادم على http://localhost:3000'
            }
          </p>
          <button 
            onClick={testApiConnection}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {language === 'fr' ? 'Réessayer' : 'إعادة المحاولة'}
          </button>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="space-y-6">
          {/* Informations serveur */}
          {serverInfo && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                {language === 'fr' ? 'Serveur API' : 'خادم واجهة البرمجة'}
              </h3>
              <div className="text-sm text-green-700 dark:text-green-400">
                <p><strong>Version:</strong> {serverInfo.version}</p>
                <p><strong>Status:</strong> {serverInfo.status}</p>
                <p><strong>Message:</strong> {serverInfo.message}</p>
              </div>
            </div>
          )}

          {/* Santé système */}
          {health && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {language === 'fr' ? 'Santé Système' : 'حالة النظام'}
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <p><strong>Base de données:</strong> {health.database}</p>
                <p><strong>Utilisateurs:</strong> {health.stats.users}</p>
                <p><strong>Documents:</strong> {health.stats.documents}</p>
              </div>
            </div>
          )}

          {/* Codes juridiques */}
          {codes && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                {language === 'fr' ? 'Codes Juridiques Algériens' : 'القوانين الجزائرية'}
              </h3>
              <div className="text-sm text-purple-700 dark:text-purple-400">
                <p><strong>Nombre de codes:</strong> {codes.count}</p>
                <p><strong>Total articles:</strong> {codes.codes.reduce((sum: number, code: any) => sum + code.articlesCount, 0)}</p>
                <div className="mt-2">
                  <strong>Codes disponibles:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    {codes.codes.slice(0, 3).map((code: any) => (
                      <li key={code.id}>{code.name} ({code.articlesCount} articles)</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tribunaux */}
          {courts && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                {language === 'fr' ? 'Tribunaux Algériens' : 'المحاكم الجزائرية'}
              </h3>
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p><strong>Nombre de tribunaux:</strong> {courts.count}</p>
                <p><strong>Wilayas couvertes:</strong> {courts.wilayas.length}</p>
                <div className="mt-2">
                  <strong>Principaux tribunaux:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    {courts.courts.slice(0, 3).map((court: any) => (
                      <li key={court.id}>{court.name} ({court.location})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques */}
          {stats && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h3 className="font-semibold text-slate-800 dark:text-slate-300 mb-2">
                {language === 'fr' ? 'Statistiques Plateforme' : 'إحصائيات المنصة'}
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-400">
                <p><strong>Utilisateurs totaux:</strong> {stats.stats.totalUsers}</p>
                <p><strong>Documents totaux:</strong> {stats.stats.totalDocuments}</p>
                <p><strong>Version plateforme:</strong> {stats.stats.platform.version}</p>
                <p><strong>Uptime:</strong> {Math.round(stats.stats.platform.uptime)} secondes</p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button 
              onClick={testApiConnection}
              className="px-6 py-2 bg-legal-gold text-white rounded-lg hover:bg-legal-gold/90 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {language === 'fr' ? 'Actualiser les Tests' : 'تحديث الاختبارات'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestComponent;