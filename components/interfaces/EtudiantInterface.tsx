import React, { useState } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  Award, 
  Clock,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Star,
  Users,
  Calendar,
  FileText,
  Search,
  Lightbulb,
  HelpCircle,
  Brain,
  Trophy,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';

interface EtudiantInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface Cours {
  id: string;
  titre: string;
  domaine: string;
  niveau: 'debutant' | 'intermediaire' | 'avance';
  progression: number;
  duree: string;
  statut: 'non_commence' | 'en_cours' | 'termine';
  verrouille: boolean;
}

interface Exercice {
  id: string;
  titre: string;
  type: 'qcm' | 'cas_pratique' | 'dissertation';
  domaine: string;
  difficulte: 'facile' | 'moyen' | 'difficile';
  score?: number;
  dateCompletion?: Date;
  statut: 'non_tente' | 'en_cours' | 'termine';
}

/**
 * Specialized interface for Etudiant (Student) role
 * Features: Learning mode, educational content, practice exercises, limited access
 * Validates: Requirements 2.5 - Student interface with learning mode and restricted access
 */
const EtudiantInterface: React.FC<EtudiantInterfaceProps> = ({
  user,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  
  // Mock data for courses
  const [cours] = useState<Cours[]>([
    {
      id: '1',
      titre: 'Introduction au Droit Civil Algérien',
      domaine: 'Droit Civil',
      niveau: 'debutant',
      progression: 85,
      duree: '12h',
      statut: 'en_cours',
      verrouille: false
    },
    {
      id: '2',
      titre: 'Droit des Obligations et Contrats',
      domaine: 'Droit Civil',
      niveau: 'intermediaire',
      progression: 45,
      duree: '18h',
      statut: 'en_cours',
      verrouille: false
    },
    {
      id: '3',
      titre: 'Procédure Civile Algérienne',
      domaine: 'Procédure',
      niveau: 'avance',
      progression: 0,
      duree: '15h',
      statut: 'non_commence',
      verrouille: true
    },
    {
      id: '4',
      titre: 'Droit Commercial et des Sociétés',
      domaine: 'Droit Commercial',
      niveau: 'intermediaire',
      progression: 100,
      duree: '14h',
      statut: 'termine',
      verrouille: false
    }
  ]);

  // Mock data for exercises
  const [exercices] = useState<Exercice[]>([
    {
      id: '1',
      titre: 'QCM - Les Sources du Droit',
      type: 'qcm',
      domaine: 'Droit Civil',
      difficulte: 'facile',
      score: 85,
      dateCompletion: new Date('2024-03-01'),
      statut: 'termine'
    },
    {
      id: '2',
      titre: 'Cas Pratique - Responsabilité Contractuelle',
      type: 'cas_pratique',
      domaine: 'Droit Civil',
      difficulte: 'moyen',
      score: 78,
      dateCompletion: new Date('2024-03-05'),
      statut: 'termine'
    },
    {
      id: '3',
      titre: 'Dissertation - La Nullité des Contrats',
      type: 'dissertation',
      domaine: 'Droit Civil',
      difficulte: 'difficile',
      statut: 'en_cours'
    }
  ]);

  const [statistiques] = useState({
    progressionGlobale: 68,
    coursTermines: 4,
    exercicesReussis: 12,
    tempsEtude: 45,
    niveau: 'Intermédiaire',
    prochainObjectif: 'Maîtriser les contrats'
  });

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'debutant': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediaire': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'avance': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficulteColor = (difficulte: string) => {
    switch (difficulte) {
      case 'facile': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'moyen': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'difficile': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'non_commence': return <Play size={14} />;
      case 'en_cours': return <Pause size={14} />;
      case 'termine': return <CheckCircle size={14} />;
      case 'non_tente': return <Target size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <GraduationCap className="text-blue-500" size={32} />
              {isAr ? 'منصة التعلم القانوني' : 'Plateforme d\'Apprentissage Juridique'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً ${user.firstName} - تعلم القانون بطريقة تفاعلية` : `Bienvenue ${user.firstName} - Apprenez le droit de manière interactive`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-blue-500 transition-colors">
              <Search size={16} className="inline mr-2" />
              {isAr ? 'البحث في المحتوى' : 'Rechercher'}
            </button>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Play size={18} />
              {isAr ? 'متابعة التعلم' : 'Continuer l\'Apprentissage'}
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {isAr ? 'تقدمك الأكاديمي' : 'Votre Progression Académique'}
              </h2>
              <p className="text-blue-100">
                {isAr ? `المستوى الحالي: ${statistiques.niveau}` : `Niveau actuel: ${statistiques.niveau}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{statistiques.progressionGlobale}%</div>
              <div className="text-blue-100 text-sm">
                {isAr ? 'مكتمل' : 'Complété'}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-blue-400/30 rounded-full h-3 mb-6">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${statistiques.progressionGlobale}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{statistiques.coursTermines}</div>
              <div className="text-blue-100 text-sm">{isAr ? 'دورات مكتملة' : 'Cours terminés'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{statistiques.exercicesReussis}</div>
              <div className="text-blue-100 text-sm">{isAr ? 'تمارين ناجحة' : 'Exercices réussis'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{statistiques.tempsEtude}h</div>
              <div className="text-blue-100 text-sm">{isAr ? 'ساعات دراسة' : 'Heures d\'étude'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">A+</div>
              <div className="text-blue-100 text-sm">{isAr ? 'المعدل العام' : 'Moyenne générale'}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Courses */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Courses */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-500" />
                  {isAr ? 'دوراتي' : 'Mes Cours'}
                </h2>
                <button className="text-sm text-blue-500 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {cours.map(cour => (
                  <div key={cour.id} className={`p-4 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer ${cour.verrouille ? 'opacity-60' : 'hover:border-blue-500'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {cour.titre}
                          </h3>
                          {cour.verrouille ? (
                            <Lock size={16} className="text-slate-400" />
                          ) : (
                            <Unlock size={16} className="text-green-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getNiveauColor(cour.niveau)}`}>
                            {isAr ? 
                              (cour.niveau === 'debutant' ? 'مبتدئ' : 
                               cour.niveau === 'intermediaire' ? 'متوسط' : 'متقدم') :
                              cour.niveau.toUpperCase()
                            }
                          </span>
                          <span className="text-xs text-slate-500">
                            {cour.domaine} • {cour.duree}
                          </span>
                        </div>
                        
                        {!cour.verrouille && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-600 dark:text-slate-400">
                                {isAr ? 'التقدم' : 'Progression'}
                              </span>
                              <span className="font-bold text-blue-500">
                                {cour.progression}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                                style={{ width: `${cour.progression}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {cour.statut === 'termine' && (
                          <Trophy size={20} className="text-yellow-500" />
                        )}
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </div>
                    
                    {cour.verrouille && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                          <Lock size={14} />
                          {isAr ? 'يتطلب إكمال الدورات السابقة' : 'Nécessite la completion des cours précédents'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Exercises */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Target size={20} className="text-green-500" />
                  {isAr ? 'التمارين الأخيرة' : 'Exercices Récents'}
                </h2>
                <button className="text-sm text-green-500 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {exercices.map(exercice => (
                  <div key={exercice.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {exercice.titre}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficulteColor(exercice.difficulte)}`}>
                            {isAr ? 
                              (exercice.difficulte === 'facile' ? 'سهل' : 
                               exercice.difficulte === 'moyen' ? 'متوسط' : 'صعب') :
                              exercice.difficulte.toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <span>{exercice.domaine}</span>
                          <span>•</span>
                          <span>
                            {isAr ? 
                              (exercice.type === 'qcm' ? 'أسئلة متعددة الخيارات' : 
                               exercice.type === 'cas_pratique' ? 'حالة عملية' : 'مقال') :
                              exercice.type.replace('_', ' ').toUpperCase()
                            }
                          </span>
                        </div>
                        
                        {exercice.score && (
                          <div className="flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" />
                            <span className="text-sm font-bold text-green-600">
                              {isAr ? `النتيجة: ${exercice.score}%` : `Score: ${exercice.score}%`}
                            </span>
                            {exercice.dateCompletion && (
                              <span className="text-xs text-slate-500">
                                • {exercice.dateCompletion.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatutIcon(exercice.statut)}
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Next Objective */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Target size={18} />
                {isAr ? 'الهدف التالي' : 'Prochain Objectif'}
              </h3>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain size={24} className="text-white" />
                </div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {statistiques.prochainObjectif}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  {isAr ? 'أكمل 3 تمارين إضافية لفتح المستوى التالي' : 'Complétez 3 exercices supplémentaires pour débloquer le niveau suivant'}
                </p>
                <button className="w-full py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors">
                  {isAr ? 'ابدأ الآن' : 'Commencer Maintenant'}
                </button>
              </div>
            </div>

            {/* Learning Tools */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-yellow-500" />
                {isAr ? 'أدوات التعلم' : 'Outils d\'Apprentissage'}
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-yellow-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'قاموس المصطلحات القانونية' : 'Dictionnaire Juridique'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-yellow-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'نماذج الوثائق' : 'Modèles de Documents'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-yellow-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'بحث مبسط في القوانين' : 'Recherche Simplifiée'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-yellow-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'اسأل المساعد الذكي' : 'Assistant IA Pédagogique'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Study Statistics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" />
                {isAr ? 'إحصائيات الدراسة' : 'Statistiques d\'Étude'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'هذا الأسبوع' : 'Cette semaine'}
                  </span>
                  <span className="font-bold">8.5h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'متوسط النتائج' : 'Moyenne des scores'}
                  </span>
                  <span className="font-bold text-green-600">82%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'أيام متتالية' : 'Jours consécutifs'}
                  </span>
                  <span className="font-bold text-blue-600">12</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'الترتيب في الصف' : 'Classement'}
                  </span>
                  <span className="font-bold text-purple-600">3/45</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Award size={18} />
                {isAr ? 'الإنجازات' : 'Récompenses'}
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy size={16} className="text-white" />
                  </div>
                  <div className="text-xs font-bold text-yellow-800 dark:text-yellow-200">
                    {isAr ? 'أول حكم' : 'Premier As'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star size={16} className="text-white" />
                  </div>
                  <div className="text-xs font-bold text-blue-800 dark:text-blue-200">
                    {isAr ? 'متعلم نشط' : 'Étudiant Actif'}
                  </div>
                </div>
                
                <div className="text-center opacity-50">
                  <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users size={16} className="text-slate-500" />
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    {isAr ? 'قريباً' : 'Bientôt'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Notice */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'وضع التعلم النشط' : 'Mode Apprentissage Actif'}
              </h3>
              <p className="text-blue-100 text-sm">
                {isAr ? 'هذه المنصة مصممة خصيصاً للطلاب مع شروحات مبسطة وتمارين تفاعلية' : 'Cette plateforme est spécialement conçue pour les étudiants avec des explications simplifiées et des exercices interactifs'}
              </p>
              <p className="text-blue-100 text-xs mt-1">
                {isAr ? 'الوصول محدود للمحتوى التعليمي فقط - للاستخدام المهني، يرجى الترقية' : 'Accès limité au contenu éducatif uniquement - Pour usage professionnel, veuillez upgrader'}
              </p>
            </div>
            <GraduationCap size={48} className="text-blue-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtudiantInterface;