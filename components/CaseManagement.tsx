
import React, { useState } from 'react';
import { Case, Language } from '../types';
import { UI_TRANSLATIONS } from '../constants';
import { Briefcase, Plus, Search, Filter, MoreVertical, ChevronRight, Clock, User } from 'lucide-react';

interface CaseManagementProps {
  language: Language;
  cases: Case[];
  activeCaseId: string;
  onSelectCase: (id: string) => void;
}

const CaseManagement: React.FC<CaseManagementProps> = ({ language, cases, activeCaseId, onSelectCase }) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
       <div className="max-w-5xl mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100">{t.case_title}</h1>
                <p className="text-slate-500 mt-1">{t.case_subtitle}</p>
             </div>
             <button className="px-6 py-3 bg-legal-blue dark:bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 active:scale-95 transition-all">
                <Plus size={20} />
                {t.case_new}
             </button>
          </div>

          <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
             <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder={isAr ? 'البحث عن ملف...' : 'Rechercher un dossier...'} 
                  className="bg-transparent border-none outline-none w-full text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-slate-500 hover:text-legal-gold">
                <Filter size={18} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {filteredCases.length > 0 ? filteredCases.map(c => (
               <div 
                 key={c.id}
                 onClick={() => onSelectCase(c.id)}
                 className={`group p-6 bg-white dark:bg-slate-900 rounded-3xl border transition-all cursor-pointer hover:shadow-xl hover:scale-[1.01] ${activeCaseId === c.id ? 'border-legal-gold ring-1 ring-legal-gold' : 'border-slate-100 dark:border-slate-800'}`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-legal-gold/10 group-hover:text-legal-gold transition-colors">
                        <Briefcase size={24} />
                     </div>
                     <button className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100">
                        <MoreVertical size={20} />
                     </button>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 dark:text-white">{c.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                     <User size={12} className="text-legal-gold" />
                     {c.clientName}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-6 h-8 italic">
                     {c.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Clock size={12} />
                        {c.createdAt.toLocaleDateString()}
                     </div>
                     <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status.toUpperCase()}
                     </div>
                  </div>
               </div>
             )) : (
               <div className="col-span-full py-20 text-center text-slate-400">
                  <Briefcase size={60} className="mx-auto mb-4 opacity-20" />
                  <p>{t.case_empty}</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default CaseManagement;
