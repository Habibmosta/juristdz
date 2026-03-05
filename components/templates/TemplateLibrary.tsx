import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../types';
import { 
  FileText, 
  Search, 
  Plus, 
  Star, 
  Filter,
  Download,
  Eye,
  Copy
} from 'lucide-react';
import TemplateGenerator from './TemplateGenerator';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  profession: string;
  is_official: boolean;
  usage_count: number;
  variables: any[];
}

interface TemplateLibraryProps {
  userId: string;
  userProfession: string;
  language: Language;
  caseId?: string;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  userId, 
  userProfession, 
  language,
  caseId 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    loadTemplates();
  }, [userId, userProfession]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .or(`profession.eq.${userProfession},profession.eq.all`)
        .order('is_official', { ascending: false })
        .order('usage_count', { ascending: false });

      if (!error && data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      contract: { fr: 'Contrat', ar: 'عقد' },
      pleading: { fr: 'Plaidoirie', ar: 'مرافعة' },
      letter: { fr: 'Lettre', ar: 'رسالة' },
      procedure: { fr: 'Procédure', ar: 'إجراء' },
      other: { fr: 'Autre', ar: 'أخرى' }
    };
    return labels[category]?.[language] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      contract: 'bg-blue-100 text-blue-600',
      pleading: 'bg-purple-100 text-purple-600',
      letter: 'bg-green-100 text-green-600',
      procedure: 'bg-orange-100 text-orange-600',
      other: 'bg-slate-100 text-slate-600'
    };
    return colors[category] || colors.other;
  };

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowGenerator(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {isAr ? 'مكتبة القوالب' : 'Bibliothèque de Templates'}
          </h2>
          <p className="text-slate-500 mt-1">
            {isAr ? 'قوالب جاهزة للاستخدام' : 'Templates prêts à l\'emploi'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن قالب...' : 'Rechercher un template...'}
            className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
        >
          <option value="all">{isAr ? 'كل الفئات' : 'Toutes les catégories'}</option>
          <option value="contract">{getCategoryLabel('contract')}</option>
          <option value="pleading">{getCategoryLabel('pleading')}</option>
          <option value="letter">{getCategoryLabel('letter')}</option>
          <option value="procedure">{getCategoryLabel('procedure')}</option>
          <option value="other">{getCategoryLabel('other')}</option>
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">
            {isAr ? 'لا توجد قوالب' : 'Aucun template trouvé'}
          </p>
          <p className="text-sm mt-2">
            {isAr ? 'جرب مصطلحات بحث مختلفة' : 'Essayez d\'autres termes de recherche'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleUseTemplate(template)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {template.is_official && (
                      <Star size={16} className="text-legal-gold fill-legal-gold" />
                    )}
                    <h3 className="font-bold text-lg line-clamp-1">{template.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <FileText size={24} className="text-slate-400 group-hover:text-legal-gold transition-colors" />
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                <span>
                  {template.variables?.length || 0} {isAr ? 'متغير' : 'variables'}
                </span>
                <span>
                  {template.usage_count} {isAr ? 'استخدام' : 'utilisations'}
                </span>
              </div>

              {/* Actions */}
              <button className="w-full px-4 py-2 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors flex items-center justify-center gap-2">
                <Copy size={16} />
                <span>{isAr ? 'استخدام القالب' : 'Utiliser ce template'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Template Generator Modal */}
      {showGenerator && selectedTemplate && (
        <TemplateGenerator
          template={selectedTemplate}
          caseId={caseId}
          userId={userId}
          language={language}
          onClose={() => {
            setShowGenerator(false);
            setSelectedTemplate(null);
          }}
          onGenerated={() => {
            setShowGenerator(false);
            setSelectedTemplate(null);
            loadTemplates(); // Reload to update usage count
          }}
        />
      )}
    </div>
  );
};

export default TemplateLibrary;
