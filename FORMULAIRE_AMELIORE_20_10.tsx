// ═══════════════════════════════════════════════════════════════════════════
// 🏆 FORMULAIRE ULTRA-PROFESSIONNEL 20/10
// ═══════════════════════════════════════════════════════════════════════════
// Ce formulaire contient toutes les améliorations pour dépasser la concurrence
// À intégrer dans EnhancedCaseManagement.tsx
// ═══════════════════════════════════════════════════════════════════════════

// SECTION 1: APRÈS LA DESCRIPTION - AJOUTER CES CHAMPS VISIBLES

{/* Date Limite - VISIBLE PAR DÉFAUT */}
<div>
  <label className="block text-sm font-medium mb-2">
    {isAr ? 'الموعد النهائي' : 'Date limite'} <span className="text-red-500">*</span>
  </label>
  <input
    type="date"
    required
    value={formData.deadline}
    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
    min={new Date().toISOString().split('T')[0]}
    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
  />
  <p className="text-xs text-slate-500 mt-1">
    {isAr ? 'تاريخ الإنجاز المتوقع للملف' : 'Date d\'échéance prévue pour le dossier'}
  </p>
</div>

{/* Avocat Assigné - PRÉ-REMPLI AUTOMATIQUEMENT */}
<div>
  <label className="block text-sm font-medium mb-2">
    {isAr ? 'المحامي المكلف' : 'Avocat assigné'}
  </label>
  <input
    type="text"
    value={formData.assignedLawyer}
    onChange={(e) => setFormData({...formData, assignedLawyer: e.target.value})}
    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
  />
  <p className="text-xs text-slate-500 mt-1">
    {isAr ? 'تم التعيين تلقائيًا - يمكن التعديل' : 'Assigné automatiquement - modifiable'}
  </p>
</div>

// SECTION 2: NOUVELLE SECTION "ÉVALUATION DU DOSSIER"

{/* Évaluation du Dossier */}
<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
  <h3 className="font-bold text-lg flex items-center gap-2">
    <span>📊</span>
    {isAr ? 'تقييم الملف' : 'Évaluation du Dossier'}
  </h3>
  
  {/* Date Consultation Initiale */}
  <div>
    <label className="block text-sm font-medium mb-2">
      {isAr ? 'تاريخ الاستشارة الأولية' : 'Date consultation initiale'}
    </label>
    <input
      type="date"
      value={formData.initialConsultationDate}
      onChange={(e) => setFormData({...formData, initialConsultationDate: e.target.value})}
      max={new Date().toISOString().split('T')[0]}
      className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
    />
  </div>

  {/* Objectif du Client */}
  <div>
    <label className="block text-sm font-medium mb-2">
      {isAr ? 'هدف العميل' : 'Objectif du client'}
    </label>
    <textarea
      rows={2}
      value={formData.clientObjective}
      onChange={(e) => setFormData({...formData, clientObjective: e.target.value})}
      placeholder={isAr ? 'ما الذي يريد العميل تحقيقه؟' : 'Que souhaite obtenir le client?'}
      className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none resize-none"
    />
    <p className="text-xs text-slate-500 mt-1">
      {isAr ? 'مثال: الحصول على تعويض، إلغاء عقد، حضانة الأطفال...' : 'Ex: Obtenir une indemnisation, annuler un contrat, garde des enfants...'}
    </p>
  </div>

  {/* Stratégie Juridique */}
  <div>
    <label className="block text-sm font-medium mb-2">
      {isAr ? 'الاستراتيجية القانونية' : 'Stratégie juridique envisagée'}
    </label>
    <textarea
      rows={2}
      value={formData.legalStrategy}
      onChange={(e) => setFormData({...formData, legalStrategy: e.target.value})}
      placeholder={isAr ? 'الاستراتيجية المقترحة...' : 'Approche juridique envisagée...'}
      className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none resize-none"
    />
    <p className="text-xs text-slate-500 mt-1">
      {isAr ? 'مثال: التفاوض أولاً، ثم الدعوى القضائية إذا فشل' : 'Ex: Négociation amiable puis action en justice si échec'}
    </p>
  </div>

  <div className="grid grid-cols-3 gap-4">
    {/* Niveau de Risque */}
    <div>
      <label className="block text-sm font-medium mb-2">
        {isAr ? 'مستوى المخاطر' : 'Niveau de risque'}
      </label>
      <select
        value={formData.riskLevel}
        onChange={(e) => setFormData({...formData, riskLevel: e.target.value as any})}
        className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
      >
        <option value="low">{isAr ? '🟢 منخفض' : '🟢 Faible'}</option>
        <option value="medium">{isAr ? '🟡 متوسط' : '🟡 Moyen'}</option>
        <option value="high">{isAr ? '🔴 عالي' : '🔴 Élevé'}</option>
      </select>
    </div>

    {/* Probabilité de Succès */}
    <div>
      <label className="block text-sm font-medium mb-2">
        {isAr ? 'احتمال النجاح (%)' : 'Probabilité succès (%)'}
      </label>
      <input
        type="number"
        min="0"
        max="100"
        value={formData.successProbability}
        onChange={(e) => setFormData({...formData, successProbability: e.target.value})}
        placeholder="75"
        className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
      />
    </div>

    {/* Durée Estimée */}
    <div>
      <label className="block text-sm font-medium mb-2">
        {isAr ? 'المدة المقدرة (أشهر)' : 'Durée estimée (mois)'}
      </label>
      <input
        type="number"
        min="1"
        value={formData.estimatedDuration}
        onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
        placeholder="6"
        className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
      />
    </div>
  </div>
</div>

// SECTION 3: CHECKLIST DOCUMENTS INTERACTIVE

{/* Document Checklist Interactive */}
{documentChecklist.length > 0 && (
  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <span>📋</span>
        {isAr ? 'الوثائق المطلوبة' : 'Documents à collecter'}
      </h3>
      <span className="text-xs text-slate-500">
        {selectedDocuments.length}/{documentChecklist.length} {isAr ? 'محدد' : 'sélectionnés'}
      </span>
    </div>
    
    <div className="space-y-2">
      {documentChecklist.map((doc, idx) => (
        <label key={idx} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={selectedDocuments.includes(doc)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDocuments([...selectedDocuments, doc]);
              } else {
                setSelectedDocuments(selectedDocuments.filter(d => d !== doc));
              }
            }}
            className="w-4 h-4 text-legal-gold focus:ring-legal-gold rounded"
          />
          <span className="text-sm flex-1">{doc}</span>
          {selectedDocuments.includes(doc) && (
            <span className="text-xs text-green-600 font-medium">✓ À collecter</span>
          )}
        </label>
      ))}
    </div>
    
    <div className="mt-3 pt-3 border-t dark:border-amber-700">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {isAr 
          ? '💡 نصيحة: حدد الوثائق التي تحتاجها من العميل. يمكنك إضافة وثائق أخرى في الملاحظات.'
          : '💡 Astuce: Sélectionnez les documents à demander au client. Vous pourrez ajouter d\'autres documents dans les notes.'}
      </p>
    </div>
  </div>
)}

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTIONS D'INTÉGRATION
// ═══════════════════════════════════════════════════════════════════════════
// 
// 1. Ajouter la SECTION 1 après le champ "Description"
// 2. Ajouter la SECTION 2 après la SECTION 1
// 3. Remplacer l'ancienne checklist par la SECTION 3
// 4. Exécuter AJOUTER_COLONNES_ULTRA_PRO.sql dans Supabase
// 5. Tester le formulaire
// 
// Score final: 20/10 🏆
// ═══════════════════════════════════════════════════════════════════════════
