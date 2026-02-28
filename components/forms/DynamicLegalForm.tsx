import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Language } from '../../types';

interface DynamicLegalFormProps {
  language: Language;
  templateId: string;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const DynamicLegalForm: React.FC<DynamicLegalFormProps> = ({ 
  language, 
  templateId, 
  onSubmit, 
  onClose 
}) => {
  const [formData, setFormData] = useState<any>({});
  const isAr = language === 'ar';

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Fonction pour obtenir les champs selon le template
  const getFieldsForTemplate = () => {
    switch (templateId) {
      case 'requete_pension_alimentaire':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'طلب نفقة' : 'Requête Pension Alimentaire'}
            </h3>
            
            {/* Demandeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الطالب' : 'Demandeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurNom || ''}
                    onChange={(e) => handleChange('demandeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurPrenom || ''}
                    onChange={(e) => handleChange('demandeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.demandeurDateNaissance || ''}
                    onChange={(e) => handleChange('demandeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurLieuNaissance || ''}
                    onChange={(e) => handleChange('demandeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurCIN || ''}
                  onChange={(e) => handleChange('demandeurCIN', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  maxLength={18}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurAdresse || ''}
                  onChange={(e) => handleChange('demandeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المهنة' : 'Profession'}
                </label>
                <input
                  type="text"
                  value={formData.demandeurProfession || ''}
                  onChange={(e) => handleChange('demandeurProfession', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Débiteur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدين' : 'Débiteur (personne qui doit payer)'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.debiteurNom || ''}
                    onChange={(e) => handleChange('debiteurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.debiteurPrenom || ''}
                    onChange={(e) => handleChange('debiteurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.debiteurDateNaissance || ''}
                    onChange={(e) => handleChange('debiteurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.debiteurLieuNaissance || ''}
                    onChange={(e) => handleChange('debiteurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                </label>
                <input
                  type="text"
                  value={formData.debiteurCIN || ''}
                  onChange={(e) => handleChange('debiteurCIN', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  maxLength={18}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={formData.debiteurAdresse || ''}
                  onChange={(e) => handleChange('debiteurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.debiteurProfession || ''}
                    onChange={(e) => handleChange('debiteurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الدخل الشهري المقدر' : 'Revenus mensuels estimés'} *
                  </label>
                  <input
                    type="number"
                    value={formData.debiteurRevenus || ''}
                    onChange={(e) => handleChange('debiteurRevenus', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'دج' : 'DA'}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bénéficiaires */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المستفيدون' : 'Bénéficiaires de la pension'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عدد الأطفال' : 'Nombre d\'enfants'} *
                </label>
                <input
                  type="number"
                  value={formData.nombreEnfants || ''}
                  onChange={(e) => handleChange('nombreEnfants', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  min="1"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'أعمار الأطفال' : 'Âges des enfants'}
                </label>
                <input
                  type="text"
                  value={formData.agesEnfants || ''}
                  onChange={(e) => handleChange('agesEnfants', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder={isAr ? 'مثال: 5، 8، 12 سنة' : 'Ex: 5, 8, 12 ans'}
                />
              </div>
            </div>

            {/* Montant demandé */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'المبلغ المطلوب' : 'Montant demandé'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المبلغ الشهري المطلوب' : 'Montant mensuel demandé'} *
                </label>
                <input
                  type="number"
                  value={formData.montantDemande || ''}
                  onChange={(e) => handleChange('montantDemande', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder={isAr ? 'دج' : 'DA'}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تفاصيل الحاجيات' : 'Détails des besoins'}
                </label>
                <textarea
                  value={formData.detailsBesoins || ''}
                  onChange={(e) => handleChange('detailsBesoins', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'مثال: مصاريف المدرسة، الطعام، الملابس، الصحة...' : 'Ex: frais de scolarité, nourriture, vêtements, santé...'}
                />
              </div>
            </div>
          </div>
        );

      case 'requete_succession':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة ميراث' : 'Requête en Succession'}
            </h3>
            
            {/* Demandeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الطالب' : 'Demandeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurNom || ''}
                    onChange={(e) => handleChange('demandeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurPrenom || ''}
                    onChange={(e) => handleChange('demandeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.demandeurDateNaissance || ''}
                    onChange={(e) => handleChange('demandeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurLieuNaissance || ''}
                    onChange={(e) => handleChange('demandeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurCIN || ''}
                    onChange={(e) => handleChange('demandeurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurProfession || ''}
                    onChange={(e) => handleChange('demandeurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurAdresse || ''}
                  onChange={(e) => handleChange('demandeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'صلة القرابة بالمتوفى' : 'Lien de parenté avec le défunt'} *
                </label>
                <input
                  type="text"
                  value={formData.lienParente || ''}
                  onChange={(e) => handleChange('lienParente', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder={isAr ? 'مثال: ابن، زوجة، أخ...' : 'Ex: Fils, Épouse, Frère...'}
                  required
                />
              </div>
            </div>
            
            {/* Défunt */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المتوفى' : 'Défunt'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defuntNom || ''}
                    onChange={(e) => handleChange('defuntNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defuntPrenom || ''}
                    onChange={(e) => handleChange('defuntPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.defuntCIN || ''}
                    onChange={(e) => handleChange('defuntCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم شهادة الوفاة' : 'Numéro acte de décès'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroActeDeces || ''}
                    onChange={(e) => handleChange('numeroActeDeces', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الوفاة' : 'Date de décès'} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateDeces || ''}
                    onChange={(e) => handleChange('dateDeces', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الوفاة' : 'Lieu de décès'} *
                  </label>
                  <input
                    type="text"
                    value={formData.lieuDeces || ''}
                    onChange={(e) => handleChange('lieuDeces', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Héritiers */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الورثة' : 'Héritiers'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'قائمة الورثة' : 'Liste des héritiers'} *
                </label>
                <textarea
                  value={formData.listeHeritiers || ''}
                  onChange={(e) => handleChange('listeHeritiers', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={5}
                  placeholder={isAr ? 'مثال:\n- الزوجة: فاطمة بن علي\n- الابن: أحمد (25 سنة)\n- البنت: خديجة (22 سنة)' : 'Ex:\n- Épouse: Fatima Ben Ali\n- Fils: Ahmed (25 ans)\n- Fille: Khadija (22 ans)'}
                  required
                />
              </div>
            </div>

            {/* Patrimoine */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'التركة' : 'Patrimoine Successoral'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الأموال العقارية' : 'Biens immobiliers'}
                </label>
                <textarea
                  value={formData.biensImmobiliers || ''}
                  onChange={(e) => handleChange('biensImmobiliers', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'مثال: شقة بالجزائر العاصمة، أرض بسطيف...' : 'Ex: Appartement à Alger, Terrain à Sétif...'}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الأموال المنقولة' : 'Biens mobiliers'}
                </label>
                <textarea
                  value={formData.biensMobiliers || ''}
                  onChange={(e) => handleChange('biensMobiliers', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'مثال: سيارة، حسابات بنكية، مجوهرات...' : 'Ex: Véhicule, Comptes bancaires, Bijoux...'}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'القيمة الإجمالية المقدرة' : 'Valeur totale estimée'}
                </label>
                <input
                  type="number"
                  value={formData.valeurTotale || ''}
                  onChange={(e) => handleChange('valeurTotale', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="DA"
                />
              </div>
            </div>

            {/* Dettes */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الديون' : 'Dettes Éventuelles'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'هل توجد ديون؟' : 'Y a-t-il des dettes?'}
                </label>
                <textarea
                  value={formData.dettes || ''}
                  onChange={(e) => handleChange('dettes', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'اذكر الديون إن وجدت...' : 'Mentionnez les dettes s\'il y en a...'}
                />
              </div>
            </div>

            {/* Objet de la demande */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'موضوع الطلب' : 'Objet de la Demande'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'نوع الطلب' : 'Type de demande'} *
                </label>
                <select
                  value={formData.typeDemandeSuccession || ''}
                  onChange={(e) => handleChange('typeDemandeSuccession', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="partage">{isAr ? 'قسمة التركة' : 'Partage successoral'}</option>
                  <option value="contestation">{isAr ? 'منازعة في الميراث' : 'Contestation d\'héritage'}</option>
                  <option value="inventaire">{isAr ? 'جرد التركة' : 'Inventaire des biens'}</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تفاصيل الطلب' : 'Détails de la demande'} *
                </label>
                <textarea
                  value={formData.detailsDemande || ''}
                  onChange={(e) => handleChange('detailsDemande', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اشرح بالتفصيل ما تطلبه...' : 'Expliquez en détail votre demande...'}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'conclusions_civiles':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'مذكرة دفاع مدنية' : 'Conclusions Civiles'}
            </h3>
            
            {/* Tribunal */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المحكمة' : 'Tribunal'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المحكمة' : 'Tribunal'} *
                  </label>
                  <input
                    type="text"
                    value={formData.tribunal || ''}
                    onChange={(e) => handleChange('tribunal', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'مثال: محكمة الجزائر' : 'Ex: Tribunal d\'Alger'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم الملف' : 'Numéro de dossier'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroDossier || ''}
                    onChange={(e) => handleChange('numeroDossier', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Demandeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعي' : 'Demandeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurNom || ''}
                    onChange={(e) => handleChange('demandeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurPrenom || ''}
                    onChange={(e) => handleChange('demandeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.demandeurDateNaissance || ''}
                    onChange={(e) => handleChange('demandeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurLieuNaissance || ''}
                    onChange={(e) => handleChange('demandeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurCIN || ''}
                    onChange={(e) => handleChange('demandeurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurProfession || ''}
                    onChange={(e) => handleChange('demandeurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurAdresse || ''}
                  onChange={(e) => handleChange('demandeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Défendeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعى عليه' : 'Défendeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurNom || ''}
                    onChange={(e) => handleChange('defendeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurPrenom || ''}
                    onChange={(e) => handleChange('defendeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.defendeurDateNaissance || ''}
                    onChange={(e) => handleChange('defendeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurLieuNaissance || ''}
                    onChange={(e) => handleChange('defendeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurCIN || ''}
                    onChange={(e) => handleChange('defendeurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurProfession || ''}
                    onChange={(e) => handleChange('defendeurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={formData.defendeurAdresse || ''}
                  onChange={(e) => handleChange('defendeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* En fait */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'في الوقائع' : 'En Fait'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عرض الوقائع' : 'Exposé des faits'} *
                </label>
                <textarea
                  value={formData.exposeFaits || ''}
                  onChange={(e) => handleChange('exposeFaits', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={6}
                  placeholder={isAr ? 'اشرح الوقائع بالتفصيل وبترتيب زمني...' : 'Exposez les faits de manière détaillée et chronologique...'}
                  required
                />
              </div>
            </div>

            {/* En droit */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'في القانون' : 'En Droit'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الحجج القانونية' : 'Arguments juridiques'} *
                </label>
                <textarea
                  value={formData.argumentsJuridiques || ''}
                  onChange={(e) => handleChange('argumentsJuridiques', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={6}
                  placeholder={isAr ? 'اذكر المواد القانونية والحجج القانونية...' : 'Citez les articles de loi et développez vos arguments juridiques...'}
                  required
                />
              </div>
            </div>

            {/* Preuves */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الأدلة' : 'Preuves'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'قائمة الوثائق المرفقة' : 'Liste des pièces jointes'}
                </label>
                <textarea
                  value={formData.preuves || ''}
                  onChange={(e) => handleChange('preuves', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'مثال:\n- الوثيقة رقم 1: عقد البيع\n- الوثيقة رقم 2: الفواتير' : 'Ex:\n- Pièce n°1: Contrat de vente\n- Pièce n°2: Factures'}
                />
              </div>
            </div>

            {/* Par ces motifs */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'لهذه الأسباب' : 'Par Ces Motifs'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الطلبات' : 'Demandes précises'} *
                </label>
                <textarea
                  value={formData.demandes || ''}
                  onChange={(e) => handleChange('demandes', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={5}
                  placeholder={isAr ? 'اذكر طلباتك بدقة...' : 'Formulez vos demandes de manière précise...'}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'assignation_civile':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'كلف بالحضور مدني' : 'Assignation Civile'}
            </h3>
            
            {/* Huissier */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المحضر القضائي' : 'Huissier de Justice'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.huissierNom || ''}
                    onChange={(e) => handleChange('huissierNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.huissierPrenom || ''}
                    onChange={(e) => handleChange('huissierPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'مكتب المحضر' : 'Étude d\'huissier'}
                </label>
                <input
                  type="text"
                  value={formData.etudeHuissier || ''}
                  onChange={(e) => handleChange('etudeHuissier', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Demandeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعي' : 'Demandeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurNom || ''}
                    onChange={(e) => handleChange('demandeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurPrenom || ''}
                    onChange={(e) => handleChange('demandeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.demandeurDateNaissance || ''}
                    onChange={(e) => handleChange('demandeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurLieuNaissance || ''}
                    onChange={(e) => handleChange('demandeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurCIN || ''}
                    onChange={(e) => handleChange('demandeurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurProfession || ''}
                    onChange={(e) => handleChange('demandeurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurAdresse || ''}
                  onChange={(e) => handleChange('demandeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Défendeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعى عليه' : 'Défendeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurNom || ''}
                    onChange={(e) => handleChange('defendeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurPrenom || ''}
                    onChange={(e) => handleChange('defendeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.defendeurDateNaissance || ''}
                    onChange={(e) => handleChange('defendeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurLieuNaissance || ''}
                    onChange={(e) => handleChange('defendeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurCIN || ''}
                    onChange={(e) => handleChange('defendeurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurProfession || ''}
                    onChange={(e) => handleChange('defendeurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.defendeurAdresse || ''}
                  onChange={(e) => handleChange('defendeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Tribunal */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المحكمة المختصة' : 'Tribunal Compétent'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المحكمة' : 'Tribunal'} *
                </label>
                <input
                  type="text"
                  value={formData.tribunalCompetent || ''}
                  onChange={(e) => handleChange('tribunalCompetent', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Objet du litige */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'موضوع النزاع' : 'Objet du Litige'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف النزاع' : 'Description du litige'} *
                </label>
                <textarea
                  value={formData.objetLitige || ''}
                  onChange={(e) => handleChange('objetLitige', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={5}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المبلغ المطالب به' : 'Montant réclamé'}
                </label>
                <input
                  type="number"
                  value={formData.montantReclame || ''}
                  onChange={(e) => handleChange('montantReclame', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="DA"
                />
              </div>
            </div>

            {/* Fondement juridique */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الأساس القانوني' : 'Fondement Juridique'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المواد القانونية' : 'Articles de loi'} *
                </label>
                <textarea
                  value={formData.fondementJuridique || ''}
                  onChange={(e) => handleChange('fondementJuridique', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اذكر المواد القانونية المعنية...' : 'Citez les articles de loi applicables...'}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'requete_garde_enfants':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'طلب حضانة' : 'Requête Garde d\'Enfants'}
            </h3>
            
            {/* Demandeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الطالب' : 'Demandeur (Parent)'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurNom || ''}
                    onChange={(e) => handleChange('demandeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurPrenom || ''}
                    onChange={(e) => handleChange('demandeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.demandeurDateNaissance || ''}
                    onChange={(e) => handleChange('demandeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurLieuNaissance || ''}
                    onChange={(e) => handleChange('demandeurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurCIN || ''}
                  onChange={(e) => handleChange('demandeurCIN', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  maxLength={18}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الصفة' : 'Qualité'} *
                </label>
                <select
                  value={formData.demandeurQualite || ''}
                  onChange={(e) => handleChange('demandeurQualite', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="mere">{isAr ? 'الأم' : 'Mère'}</option>
                  <option value="pere">{isAr ? 'الأب' : 'Père'}</option>
                  <option value="grand_mere">{isAr ? 'الجدة' : 'Grand-mère'}</option>
                  <option value="autre">{isAr ? 'آخر' : 'Autre'}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurProfession || ''}
                    onChange={(e) => handleChange('demandeurProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الدخل الشهري' : 'Revenus mensuels'} *
                  </label>
                  <input
                    type="number"
                    value={formData.demandeurRevenus || ''}
                    onChange={(e) => handleChange('demandeurRevenus', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="DA"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurAdresse || ''}
                  onChange={(e) => handleChange('demandeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Autre parent */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الطرف الآخر' : 'Autre Parent'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.autreParentNom || ''}
                    onChange={(e) => handleChange('autreParentNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.autreParentPrenom || ''}
                    onChange={(e) => handleChange('autreParentPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.autreParentDateNaissance || ''}
                    onChange={(e) => handleChange('autreParentDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.autreParentLieuNaissance || ''}
                    onChange={(e) => handleChange('autreParentLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.autreParentCIN || ''}
                    onChange={(e) => handleChange('autreParentCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.autreParentProfession || ''}
                    onChange={(e) => handleChange('autreParentProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={formData.autreParentAdresse || ''}
                  onChange={(e) => handleChange('autreParentAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Enfants */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الأطفال' : 'Enfants Concernés'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عدد الأطفال' : 'Nombre d\'enfants'} *
                </label>
                <input
                  type="number"
                  value={formData.nombreEnfants || ''}
                  onChange={(e) => handleChange('nombreEnfants', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  min="1"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تفاصيل الأطفال' : 'Détails des enfants'} *
                </label>
                <textarea
                  value={formData.detailsEnfants || ''}
                  onChange={(e) => handleChange('detailsEnfants', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'مثال: أحمد 8 سنوات ذكر، فاطمة 5 سنوات أنثى' : 'Ex: Ahmed 8 ans garçon, Fatima 5 ans fille'}
                  required
                />
              </div>
            </div>

            {/* Situation actuelle */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الوضعية الحالية' : 'Situation Actuelle'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'من يحتفظ بالأطفال حالياً؟' : 'Qui a la garde actuellement?'} *
                </label>
                <select
                  value={formData.gardeActuelle || ''}
                  onChange={(e) => handleChange('gardeActuelle', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="mere">{isAr ? 'الأم' : 'La mère'}</option>
                  <option value="pere">{isAr ? 'الأب' : 'Le père'}</option>
                  <option value="autre">{isAr ? 'آخر' : 'Autre'}</option>
                </select>
              </div>
            </div>

            {/* Type de garde demandée */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'نوع الحضانة المطلوبة' : 'Type de Garde Demandée'}</h4>
              <div>
                <select
                  value={formData.typeGarde || ''}
                  onChange={(e) => handleChange('typeGarde', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="exclusive">{isAr ? 'حضانة كاملة' : 'Garde exclusive'}</option>
                  <option value="alternee">{isAr ? 'حضانة متناوبة' : 'Garde alternée'}</option>
                  <option value="visite">{isAr ? 'حق الزيارة' : 'Droit de visite'}</option>
                </select>
              </div>
            </div>

            {/* Motifs */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الأسباب' : 'Motifs de la Demande'}</h4>
              <textarea
                value={formData.motifsGarde || ''}
                onChange={(e) => handleChange('motifsGarde', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={6}
                placeholder={isAr ? 'اشرح لماذا تطلب الحضانة ولماذا هذا في مصلحة الأطفال...' : 'Expliquez pourquoi vous demandez la garde et pourquoi c\'est dans l\'intérêt des enfants...'}
                required
              />
            </div>
          </div>
        );

      case 'requete_dommages_interets':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'طلب تعويض' : 'Requête Dommages-Intérêts'}
            </h3>
            
            {/* Demandeur (Victime) */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعي (الضحية)' : 'Demandeur (Victime)'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeNom || ''}
                    onChange={(e) => handleChange('victimeNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimePrenom || ''}
                    onChange={(e) => handleChange('victimePrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.victimeDateNaissance || ''}
                    onChange={(e) => handleChange('victimeDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeLieuNaissance || ''}
                    onChange={(e) => handleChange('victimeLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeCIN || ''}
                    onChange={(e) => handleChange('victimeCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeProfession || ''}
                    onChange={(e) => handleChange('victimeProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.victimeAdresse || ''}
                  onChange={(e) => handleChange('victimeAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Défendeur (Responsable) */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعى عليه (المسؤول)' : 'Défendeur (Responsable)'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.responsableNom || ''}
                    onChange={(e) => handleChange('responsableNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.responsablePrenom || ''}
                    onChange={(e) => handleChange('responsablePrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.responsableAdresse || ''}
                  onChange={(e) => handleChange('responsableAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Faits */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الوقائع' : 'Les Faits'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الواقعة' : 'Date de l\'incident'} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateIncident || ''}
                    onChange={(e) => handleChange('dateIncident', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الواقعة' : 'Lieu de l\'incident'} *
                  </label>
                  <input
                    type="text"
                    value={formData.lieuIncident || ''}
                    onChange={(e) => handleChange('lieuIncident', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف الخطأ المرتكب' : 'Description de la faute commise'} *
                </label>
                <textarea
                  value={formData.descriptionFaute || ''}
                  onChange={(e) => handleChange('descriptionFaute', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اشرح بالتفصيل الخطأ الذي ارتكبه المسؤول...' : 'Décrivez en détail la faute commise par le responsable...'}
                  required
                />
              </div>
            </div>

            {/* Préjudices */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الأضرار' : 'Préjudices Subis'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الضرر المادي' : 'Préjudice matériel'}
                </label>
                <textarea
                  value={formData.prejudiceMateriel || ''}
                  onChange={(e) => handleChange('prejudiceMateriel', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'مثال: تلف السيارة، خسارة مالية، مصاريف طبية...' : 'Ex: dégâts matériels, perte financière, frais médicaux...'}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الضرر المعنوي' : 'Préjudice moral'}
                </label>
                <textarea
                  value={formData.prejudiceMoral || ''}
                  onChange={(e) => handleChange('prejudiceMoral', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'مثال: معاناة نفسية، ألم، إهانة...' : 'Ex: souffrance psychologique, douleur, atteinte à l\'honneur...'}
                />
              </div>
            </div>

            {/* Lien causal */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الرابطة السببية' : 'Lien de Causalité'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'اشرح العلاقة بين الخطأ والضرر' : 'Expliquez le lien entre la faute et le préjudice'} *
                </label>
                <textarea
                  value={formData.lienCausal || ''}
                  onChange={(e) => handleChange('lienCausal', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'كيف تسبب خطأ المسؤول في الضرر الذي لحق بك؟' : 'Comment la faute du responsable a-t-elle causé votre préjudice?'}
                  required
                />
              </div>
            </div>

            {/* Montant demandé */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'التعويض المطلوب' : 'Montant des Dommages-Intérêts'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المبلغ المطلوب (دج)' : 'Montant demandé (DA)'} *
                </label>
                <input
                  type="number"
                  value={formData.montantDemande || ''}
                  onChange={(e) => handleChange('montantDemande', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder={isAr ? 'دج' : 'DA'}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تفاصيل حساب المبلغ' : 'Détails du calcul du montant'}
                </label>
                <textarea
                  value={formData.detailsCalcul || ''}
                  onChange={(e) => handleChange('detailsCalcul', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'كيف تم حساب المبلغ المطلوب؟' : 'Comment avez-vous calculé le montant demandé?'}
                />
              </div>
            </div>
          </div>
        );

      case 'requete_divorce':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة طلاق' : 'Requête de Divorce'}
            </h3>
            
            {/* Époux */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الزوج' : 'Époux'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouxNom || ''}
                    onChange={(e) => handleChange('epouxNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouxPrenom || ''}
                    onChange={(e) => handleChange('epouxPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.epouxDateNaissance || ''}
                    onChange={(e) => handleChange('epouxDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouxLieuNaissance || ''}
                    onChange={(e) => handleChange('epouxLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouxCIN || ''}
                    onChange={(e) => handleChange('epouxCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.epouxProfession || ''}
                    onChange={(e) => handleChange('epouxProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.epouxAdresse || ''}
                  onChange={(e) => handleChange('epouxAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Épouse */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الزوجة' : 'Épouse'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouseNom || ''}
                    onChange={(e) => handleChange('epouseNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epousePrenom || ''}
                    onChange={(e) => handleChange('epousePrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.epouseDateNaissance || ''}
                    onChange={(e) => handleChange('epouseDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouseLieuNaissance || ''}
                    onChange={(e) => handleChange('epouseLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.epouseCIN || ''}
                    onChange={(e) => handleChange('epouseCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.epouseProfession || ''}
                    onChange={(e) => handleChange('epouseProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.epouseAdresse || ''}
                  onChange={(e) => handleChange('epouseAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Mariage */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الزواج' : 'Mariage'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الزواج' : 'Date du mariage'} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateMariage || ''}
                    onChange={(e) => handleChange('dateMariage', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الزواج' : 'Lieu du mariage'} *
                  </label>
                  <input
                    type="text"
                    value={formData.lieuMariage || ''}
                    onChange={(e) => handleChange('lieuMariage', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم عقد الزواج' : 'Numéro d\'acte de mariage'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroActeMariage || ''}
                    onChange={(e) => handleChange('numeroActeMariage', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المحكمة التي احتفلت بالزواج' : 'Tribunal du mariage'}
                  </label>
                  <input
                    type="text"
                    value={formData.tribunalMariage || ''}
                    onChange={(e) => handleChange('tribunalMariage', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Type de divorce */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'نوع الطلاق' : 'Type de divorce'}</h4>
              <select
                value={formData.typeDivorce || ''}
                onChange={(e) => handleChange('typeDivorce', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              >
                <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                <option value="khol">{isAr ? 'خلع' : 'Khol (divorce à la demande de l\'épouse)'}</option>
                <option value="tatliq">{isAr ? 'تطليق' : 'Tatliq (divorce judiciaire)'}</option>
                <option value="mubarat">{isAr ? 'مبارات' : 'Mubarat (consentement mutuel)'}</option>
              </select>
            </div>

            {/* Motifs */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الأسباب' : 'Motifs du divorce'}</h4>
              <textarea
                value={formData.motifsDivorce || ''}
                onChange={(e) => handleChange('motifsDivorce', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={6}
                placeholder={isAr ? 'اذكر الأسباب بالتفصيل...' : 'Détaillez les motifs du divorce...'}
                required
              />
            </div>

            {/* Enfants */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الأطفال' : 'Enfants'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عدد الأطفال' : 'Nombre d\'enfants'}
                </label>
                <input
                  type="number"
                  value={formData.nombreEnfants || '0'}
                  onChange={(e) => handleChange('nombreEnfants', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 'requete_expulsion':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة طرد' : 'Requête d\'Expulsion'}
            </h3>
            
            {/* Bailleur (Propriétaire) */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المؤجر (المالك)' : 'Bailleur (Propriétaire)'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.bailleurNom || ''}
                    onChange={(e) => handleChange('bailleurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.bailleurPrenom || ''}
                    onChange={(e) => handleChange('bailleurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.bailleurDateNaissance || ''}
                    onChange={(e) => handleChange('bailleurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.bailleurLieuNaissance || ''}
                    onChange={(e) => handleChange('bailleurLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                </label>
                <input
                  type="text"
                  value={formData.bailleurCIN || ''}
                  onChange={(e) => handleChange('bailleurCIN', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  maxLength={18}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.bailleurAdresse || ''}
                  onChange={(e) => handleChange('bailleurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المهنة' : 'Profession'}
                </label>
                <input
                  type="text"
                  value={formData.bailleurProfession || ''}
                  onChange={(e) => handleChange('bailleurProfession', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Locataire */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المستأجر' : 'Locataire'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.locataireNom || ''}
                    onChange={(e) => handleChange('locataireNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.locatairePrenom || ''}
                    onChange={(e) => handleChange('locatairePrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.locataireDateNaissance || ''}
                    onChange={(e) => handleChange('locataireDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.locataireLieuNaissance || ''}
                    onChange={(e) => handleChange('locataireLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                </label>
                <input
                  type="text"
                  value={formData.locataireCIN || ''}
                  onChange={(e) => handleChange('locataireCIN', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  maxLength={18}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.locataireAdresse || ''}
                  onChange={(e) => handleChange('locataireAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المهنة' : 'Profession'}
                </label>
                <input
                  type="text"
                  value={formData.locataireProfession || ''}
                  onChange={(e) => handleChange('locataireProfession', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Bail */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'عقد الإيجار' : 'Contrat de Bail'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ العقد' : 'Date du bail'} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateBail || ''}
                    onChange={(e) => handleChange('dateBail', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الإيجار الشهري' : 'Loyer mensuel'} *
                  </label>
                  <input
                    type="number"
                    value={formData.loyerMensuel || ''}
                    onChange={(e) => handleChange('loyerMensuel', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="DA"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف العقار المؤجر' : 'Description du bien loué'} *
                </label>
                <textarea
                  value={formData.descriptionBien || ''}
                  onChange={(e) => handleChange('descriptionBien', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={2}
                  placeholder={isAr ? 'مثال: شقة من 3 غرف، الطابق الثاني...' : 'Ex: Appartement F3, 2ème étage...'}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عنوان العقار' : 'Adresse du bien'} *
                </label>
                <input
                  type="text"
                  value={formData.adresseBien || ''}
                  onChange={(e) => handleChange('adresseBien', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder={isAr ? 'العنوان الكامل للعقار المؤجر' : 'Adresse complète du bien loué'}
                  required
                />
              </div>
            </div>

            {/* Motifs d'expulsion */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'أسباب الطرد' : 'Motifs d\'Expulsion'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'نوع الإخلال' : 'Type de manquement'} *
                </label>
                <select
                  value={formData.typeManquement || ''}
                  onChange={(e) => handleChange('typeManquement', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="non_paiement">{isAr ? 'عدم دفع الإيجار' : 'Non-paiement du loyer'}</option>
                  <option value="degradation">{isAr ? 'إتلاف العقار' : 'Dégradation du bien'}</option>
                  <option value="trouble">{isAr ? 'إزعاج الجيران' : 'Trouble de voisinage'}</option>
                  <option value="sous_location">{isAr ? 'تأجير من الباطن' : 'Sous-location non autorisée'}</option>
                  <option value="autre">{isAr ? 'أخرى' : 'Autre'}</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تفاصيل الإخلالات' : 'Détails des manquements'} *
                </label>
                <textarea
                  value={formData.detailsManquements || ''}
                  onChange={(e) => handleChange('detailsManquements', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اشرح بالتفصيل الإخلالات المرتكبة...' : 'Décrivez en détail les manquements constatés...'}
                  required
                />
              </div>
            </div>

            {/* Mises en demeure */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الإنذارات' : 'Mises en Demeure'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'هل تم توجيه إنذار؟' : 'Mise en demeure effectuée?'} *
                </label>
                <select
                  value={formData.miseEnDemeure || ''}
                  onChange={(e) => handleChange('miseEnDemeure', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="oui">{isAr ? 'نعم' : 'Oui'}</option>
                  <option value="non">{isAr ? 'لا' : 'Non'}</option>
                </select>
              </div>
              {formData.miseEnDemeure === 'oui' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الإنذار' : 'Date de la mise en demeure'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateMiseEnDemeure || ''}
                    onChange={(e) => handleChange('dateMiseEnDemeure', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'requete_penale':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة جزائية' : 'Requête Pénale'}
            </h3>
            
            {/* Plaignant */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المشتكي' : 'Plaignant'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.plaignantNom || ''}
                    onChange={(e) => handleChange('plaignantNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.plaignantPrenom || ''}
                    onChange={(e) => handleChange('plaignantPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.plaignantDateNaissance || ''}
                    onChange={(e) => handleChange('plaignantDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.plaignantLieuNaissance || ''}
                    onChange={(e) => handleChange('plaignantLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.plaignantCIN || ''}
                    onChange={(e) => handleChange('plaignantCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.plaignantProfession || ''}
                    onChange={(e) => handleChange('plaignantProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.plaignantAdresse || ''}
                  onChange={(e) => handleChange('plaignantAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Mis en cause */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المتهم' : 'Mis en Cause'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'}
                  </label>
                  <input
                    type="text"
                    value={formData.misenCauseNom || ''}
                    onChange={(e) => handleChange('misenCauseNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'إذا كان معروفاً' : 'Si connu'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'}
                  </label>
                  <input
                    type="text"
                    value={formData.misenCausePrenom || ''}
                    onChange={(e) => handleChange('misenCausePrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'إذا كان معروفاً' : 'Si connu'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.misenCauseCIN || ''}
                    onChange={(e) => handleChange('misenCauseCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    placeholder={isAr ? 'إذا كان معروفاً' : 'Si connu'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'العنوان' : 'Adresse'}
                  </label>
                  <input
                    type="text"
                    value={formData.misenCauseAdresse || ''}
                    onChange={(e) => handleChange('misenCauseAdresse', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'إذا كان معروفاً' : 'Si connu'}
                  />
                </div>
              </div>
            </div>

            {/* Faits */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الوقائع' : 'Les Faits'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الواقعة' : 'Date des faits'} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateFaits || ''}
                    onChange={(e) => handleChange('dateFaits', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الواقعة' : 'Lieu des faits'} *
                  </label>
                  <input
                    type="text"
                    value={formData.lieuFaits || ''}
                    onChange={(e) => handleChange('lieuFaits', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف الوقائع' : 'Description des faits'} *
                </label>
                <textarea
                  value={formData.descriptionFaitsPenale || ''}
                  onChange={(e) => handleChange('descriptionFaitsPenale', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={5}
                  placeholder={isAr ? 'اشرح الوقائع بالتفصيل...' : 'Décrivez les faits en détail...'}
                  required
                />
              </div>
            </div>

            {/* Qualification */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'التكييف القانوني' : 'Qualification Juridique'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'نوع الجريمة' : 'Type d\'infraction'} *
                </label>
                <select
                  value={formData.typeInfraction || ''}
                  onChange={(e) => handleChange('typeInfraction', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="vol">{isAr ? 'سرقة' : 'Vol'}</option>
                  <option value="escroquerie">{isAr ? 'نصب' : 'Escroquerie'}</option>
                  <option value="coups_blessures">{isAr ? 'ضرب وجرح' : 'Coups et blessures'}</option>
                  <option value="diffamation">{isAr ? 'قذف' : 'Diffamation'}</option>
                  <option value="abus_confiance">{isAr ? 'خيانة أمانة' : 'Abus de confiance'}</option>
                  <option value="autre">{isAr ? 'أخرى' : 'Autre'}</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المواد القانونية المنطبقة' : 'Articles de loi applicables'}
                </label>
                <input
                  type="text"
                  value={formData.articlesLoi || ''}
                  onChange={(e) => handleChange('articlesLoi', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder={isAr ? 'مثال: المادة 350 من قانون العقوبات' : 'Ex: Article 350 du Code Pénal'}
                />
              </div>
            </div>

            {/* Préjudice */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الضرر' : 'Préjudice Subi'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف الضرر' : 'Description du préjudice'}
                </label>
                <textarea
                  value={formData.prejudicePenal || ''}
                  onChange={(e) => handleChange('prejudicePenal', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={isAr ? 'الضرر المادي والمعنوي...' : 'Préjudice matériel et moral...'}
                />
              </div>
            </div>

            {/* Preuves */}
            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الأدلة' : 'Preuves'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'قائمة الأدلة' : 'Liste des preuves'}
                </label>
                <textarea
                  value={formData.preuvesPenale || ''}
                  onChange={(e) => handleChange('preuvesPenale', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'مثال: شهود، وثائق، صور...' : 'Ex: Témoins, documents, photos...'}
                />
              </div>
            </div>
          </div>
        );

      case 'constitution_partie_civile':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'تكوين طرف مدني' : 'Constitution de Partie Civile'}
            </h3>
            
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الضحية' : 'Victime'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeNomPC || ''}
                    onChange={(e) => handleChange('victimeNomPC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimePrenomPC || ''}
                    onChange={(e) => handleChange('victimePrenomPC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.victimeDateNaissancePC || ''}
                    onChange={(e) => handleChange('victimeDateNaissancePC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeLieuNaissancePC || ''}
                    onChange={(e) => handleChange('victimeLieuNaissancePC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                </label>
                <input
                  type="text"
                  value={formData.victimeCINPC || ''}
                  onChange={(e) => handleChange('victimeCINPC', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  maxLength={18}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.victimeProfessionPC || ''}
                    onChange={(e) => handleChange('victimeProfessionPC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'العنوان' : 'Adresse'} *
                  </label>
                  <input
                    type="text"
                    value={formData.victimeAdressePC || ''}
                    onChange={(e) => handleChange('victimeAdressePC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الإجراءات الجزائية' : 'Procédure Pénale'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الجهة القضائية' : 'Juridiction'} *
                  </label>
                  <input
                    type="text"
                    value={formData.juridictionPC || ''}
                    onChange={(e) => handleChange('juridictionPC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم الملف' : 'Numéro de dossier'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroDossierPC || ''}
                    onChange={(e) => handleChange('numeroDossierPC', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الجريمة' : 'Infraction'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'نوع الجريمة' : 'Nature de l\'infraction'} *
                </label>
                <input
                  type="text"
                  value={formData.natureInfraction || ''}
                  onChange={(e) => handleChange('natureInfraction', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف الوقائع' : 'Description des faits'} *
                </label>
                <textarea
                  value={formData.descriptionFaitsPC || ''}
                  onChange={(e) => handleChange('descriptionFaitsPC', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الضرر' : 'Préjudice'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الضرر المادي' : 'Préjudice matériel'}
                </label>
                <textarea
                  value={formData.prejudiceMaterielPC || ''}
                  onChange={(e) => handleChange('prejudiceMaterielPC', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={2}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الضرر المعنوي' : 'Préjudice moral'}
                </label>
                <textarea
                  value={formData.prejudiceMoralPC || ''}
                  onChange={(e) => handleChange('prejudiceMoralPC', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={2}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المبلغ المطلوب' : 'Montant demandé'} *
                </label>
                <input
                  type="number"
                  value={formData.montantDemandePC || ''}
                  onChange={(e) => handleChange('montantDemandePC', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="DA"
                  required
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'المستندات' : 'Pièces Jointes'}</h4>
              <textarea
                value={formData.piecesJointesPC || ''}
                onChange={(e) => handleChange('piecesJointesPC', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={3}
                placeholder={isAr ? 'مثال: شهادة طبية، فواتير...' : 'Ex: Certificat médical, factures...'}
              />
            </div>
          </div>
        );

      case 'memoire_defense_penale':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'مذكرة دفاع جزائية' : 'Mémoire de Défense Pénale'}
            </h3>
            
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الجهة القضائية' : 'Juridiction'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المحكمة' : 'Tribunal'} *
                  </label>
                  <input
                    type="text"
                    value={formData.tribunalDefense || ''}
                    onChange={(e) => handleChange('tribunalDefense', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم الملف' : 'Numéro de dossier'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroDossierDefense || ''}
                    onChange={(e) => handleChange('numeroDossierDefense', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المتهم' : 'Prévenu'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.prevenuNom || ''}
                    onChange={(e) => handleChange('prevenuNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.prevenuPrenom || ''}
                    onChange={(e) => handleChange('prevenuPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.prevenuDateNaissance || ''}
                    onChange={(e) => handleChange('prevenuDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
                  </label>
                  <input
                    type="text"
                    value={formData.prevenuLieuNaissance || ''}
                    onChange={(e) => handleChange('prevenuLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.prevenuCIN || ''}
                    onChange={(e) => handleChange('prevenuCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.prevenuProfession || ''}
                    onChange={(e) => handleChange('prevenuProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.prevenuAdresse || ''}
                  onChange={(e) => handleChange('prevenuAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الحالة العائلية' : 'Situation familiale'}
                </label>
                <select
                  value={formData.prevenuSituationFamiliale || ''}
                  onChange={(e) => handleChange('prevenuSituationFamiliale', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="celibataire">{isAr ? 'أعزب' : 'Célibataire'}</option>
                  <option value="marie">{isAr ? 'متزوج' : 'Marié(e)'}</option>
                  <option value="divorce">{isAr ? 'مطلق' : 'Divorcé(e)'}</option>
                  <option value="veuf">{isAr ? 'أرمل' : 'Veuf/Veuve'}</option>
                </select>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'التهم' : 'Charges Retenues'}</h4>
              <textarea
                value={formData.faitsReproches || ''}
                onChange={(e) => handleChange('faitsReproches', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder={isAr ? 'اذكر التهم الموجهة...' : 'Énumérez les charges retenues...'}
                required
              />
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'وسائل الدفاع' : 'Moyens de Défense'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الدفوع الشكلية' : 'Moyens de forme'}
                </label>
                <textarea
                  value={formData.moyensForme || ''}
                  onChange={(e) => handleChange('moyensForme', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الدفوع الموضوعية' : 'Moyens de fond'} *
                </label>
                <textarea
                  value={formData.moyensFond || ''}
                  onChange={(e) => handleChange('moyensFond', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={5}
                  required
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الظروف المخففة' : 'Circonstances Atténuantes'}</h4>
              <textarea
                value={formData.circonstancesAttenuantes || ''}
                onChange={(e) => handleChange('circonstancesAttenuantes', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={4}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الطلبات' : 'Demandes'}</h4>
              <textarea
                value={formData.demandesDefense || ''}
                onChange={(e) => handleChange('demandesDefense', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder={isAr ? 'مثال: البراءة، تخفيف العقوبة...' : 'Ex: Relaxe, atténuation de peine...'}
                required
              />
            </div>
          </div>
        );

      case 'requete_commerciale':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة تجارية' : 'Requête Commerciale'}
            </h3>
            
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المحكمة التجارية' : 'Tribunal de Commerce'}</h4>
              <input
                type="text"
                value={formData.tribunalCommerce || ''}
                onChange={(e) => handleChange('tribunalCommerce', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder={isAr ? 'مثال: المحكمة التجارية بالجزائر' : 'Ex: Tribunal de Commerce d\'Alger'}
                required
              />
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعي (الشركة/التاجر)' : 'Demandeur (Société/Commerçant)'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الاسم التجاري' : 'Raison sociale'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurCommercial || ''}
                  onChange={(e) => handleChange('demandeurCommercial', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الشكل القانوني' : 'Forme juridique'} *
                  </label>
                  <select
                    value={formData.formeJuridiqueDemandeur || ''}
                    onChange={(e) => handleChange('formeJuridiqueDemandeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                    <option value="SARL">{isAr ? 'شركة ذات مسؤولية محدودة' : 'SARL'}</option>
                    <option value="SPA">{isAr ? 'شركة مساهمة' : 'SPA'}</option>
                    <option value="EURL">{isAr ? 'مؤسسة فردية' : 'EURL'}</option>
                    <option value="SNC">{isAr ? 'شركة تضامن' : 'SNC'}</option>
                    <option value="Personne physique">{isAr ? 'شخص طبيعي' : 'Personne physique'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رأس المال' : 'Capital social'}
                  </label>
                  <input
                    type="number"
                    value={formData.capitalDemandeur || ''}
                    onChange={(e) => handleChange('capitalDemandeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="DA"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم السجل التجاري' : 'Numéro RC'} *
                  </label>
                  <input
                    type="text"
                    value={formData.rcDemandeur || ''}
                    onChange={(e) => handleChange('rcDemandeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم التعريف الجبائي' : 'Numéro NIF'}
                  </label>
                  <input
                    type="text"
                    value={formData.nifDemandeur || ''}
                    onChange={(e) => handleChange('nifDemandeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المقر الاجتماعي' : 'Siège social'} *
                </label>
                <input
                  type="text"
                  value={formData.siegeDemandeur || ''}
                  onChange={(e) => handleChange('siegeDemandeur', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الممثل القانوني' : 'Représentant légal'} *
                  </label>
                  <input
                    type="text"
                    value={formData.representantDemandeur || ''}
                    onChange={(e) => handleChange('representantDemandeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'الاسم الكامل' : 'Nom complet'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الصفة' : 'Qualité'}
                  </label>
                  <input
                    type="text"
                    value={formData.qualiteRepresentantDemandeur || ''}
                    onChange={(e) => handleChange('qualiteRepresentantDemandeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'مثال: مدير عام، مسير...' : 'Ex: Gérant, PDG...'}
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعى عليه (الشركة/التاجر)' : 'Défendeur (Société/Commerçant)'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'الاسم التجاري' : 'Raison sociale'} *
                </label>
                <input
                  type="text"
                  value={formData.defendeurCommercial || ''}
                  onChange={(e) => handleChange('defendeurCommercial', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم السجل التجاري' : 'Numéro RC'}
                  </label>
                  <input
                    type="text"
                    value={formData.rcDefendeur || ''}
                    onChange={(e) => handleChange('rcDefendeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المقر الاجتماعي' : 'Siège social'}
                  </label>
                  <input
                    type="text"
                    value={formData.siegeDefendeur || ''}
                    onChange={(e) => handleChange('siegeDefendeur', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'العلاقة التجارية' : 'Relation Commerciale'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'نوع العقد' : 'Type de contrat'} *
                </label>
                <select
                  value={formData.typeContrat || ''}
                  onChange={(e) => handleChange('typeContrat', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="vente">{isAr ? 'عقد بيع' : 'Contrat de vente'}</option>
                  <option value="prestation">{isAr ? 'عقد خدمات' : 'Contrat de prestation'}</option>
                  <option value="fourniture">{isAr ? 'عقد توريد' : 'Contrat de fourniture'}</option>
                  <option value="partenariat">{isAr ? 'شراكة' : 'Partenariat'}</option>
                  <option value="autre">{isAr ? 'أخرى' : 'Autre'}</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تاريخ العقد' : 'Date du contrat'}
                </label>
                <input
                  type="date"
                  value={formData.dateContrat || ''}
                  onChange={(e) => handleChange('dateContrat', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'النزاع' : 'Litige'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'موضوع النزاع' : 'Objet du litige'} *
                </label>
                <textarea
                  value={formData.objetLitigeCommercial || ''}
                  onChange={(e) => handleChange('objetLitigeCommercial', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المبلغ المتنازع عليه' : 'Montant en litige'}
                </label>
                <input
                  type="number"
                  value={formData.montantLitige || ''}
                  onChange={(e) => handleChange('montantLitige', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="DA"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الطلبات' : 'Demandes'}</h4>
              <textarea
                value={formData.demandesCommerciales || ''}
                onChange={(e) => handleChange('demandesCommerciales', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder={isAr ? 'اذكر طلباتك بدقة...' : 'Formulez vos demandes précisément...'}
                required
              />
            </div>
          </div>
        );

      case 'requete_faillite':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة إفلاس' : 'Requête en Faillite'}
            </h3>
            
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المحكمة' : 'Tribunal'}</h4>
              <input
                type="text"
                value={formData.tribunalFaillite || ''}
                onChange={(e) => handleChange('tribunalFaillite', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder={isAr ? 'المحكمة التجارية' : 'Tribunal de Commerce'}
                required
              />
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدين (الشركة)' : 'Débiteur (Entreprise)'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'اسم الشركة' : 'Nom de l\'entreprise'} *
                </label>
                <input
                  type="text"
                  value={formData.nomEntreprise || ''}
                  onChange={(e) => handleChange('nomEntreprise', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الشكل القانوني' : 'Forme juridique'} *
                  </label>
                  <select
                    value={formData.formeJuridiqueEntreprise || ''}
                    onChange={(e) => handleChange('formeJuridiqueEntreprise', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                    <option value="SARL">{isAr ? 'شركة ذات مسؤولية محدودة' : 'SARL'}</option>
                    <option value="SPA">{isAr ? 'شركة مساهمة' : 'SPA'}</option>
                    <option value="EURL">{isAr ? 'مؤسسة فردية' : 'EURL'}</option>
                    <option value="SNC">{isAr ? 'شركة تضامن' : 'SNC'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رأس المال' : 'Capital social'}
                  </label>
                  <input
                    type="number"
                    value={formData.capitalEntreprise || ''}
                    onChange={(e) => handleChange('capitalEntreprise', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="DA"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم السجل التجاري' : 'Numéro RC'} *
                  </label>
                  <input
                    type="text"
                    value={formData.rcEntreprise || ''}
                    onChange={(e) => handleChange('rcEntreprise', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم التعريف الجبائي' : 'Numéro NIF'}
                  </label>
                  <input
                    type="text"
                    value={formData.nifEntreprise || ''}
                    onChange={(e) => handleChange('nifEntreprise', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'المقر الاجتماعي' : 'Siège social'} *
                </label>
                <input
                  type="text"
                  value={formData.siegeSocial || ''}
                  onChange={(e) => handleChange('siegeSocial', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تاريخ التأسيس' : 'Date de création'}
                </label>
                <input
                  type="date"
                  value={formData.dateCreationEntreprise || ''}
                  onChange={(e) => handleChange('dateCreationEntreprise', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الممثل القانوني' : 'Représentant légal'} *
                  </label>
                  <input
                    type="text"
                    value={formData.representantLegal || ''}
                    onChange={(e) => handleChange('representantLegal', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الصفة' : 'Qualité'}
                  </label>
                  <input
                    type="text"
                    value={formData.qualiteRepresentant || ''}
                    onChange={(e) => handleChange('qualiteRepresentant', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'مثال: مدير عام، مسير...' : 'Ex: Gérant, PDG...'}
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الوضعية المالية' : 'Situation Financière'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'إجمالي الديون' : 'Total des dettes'} *
                </label>
                <input
                  type="number"
                  value={formData.totalDettes || ''}
                  onChange={(e) => handleChange('totalDettes', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="DA"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'إجمالي الأصول' : 'Total des actifs'}
                </label>
                <input
                  type="number"
                  value={formData.totalActifs || ''}
                  onChange={(e) => handleChange('totalActifs', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="DA"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف الوضعية المالية' : 'Description de la situation financière'} *
                </label>
                <textarea
                  value={formData.situationFinanciere || ''}
                  onChange={(e) => handleChange('situationFinanciere', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اشرح الصعوبات المالية...' : 'Expliquez les difficultés financières...'}
                  required
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الدائنون' : 'Créanciers'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عدد الدائنين' : 'Nombre de créanciers'}
                </label>
                <input
                  type="number"
                  value={formData.nombreCreanciers || ''}
                  onChange={(e) => handleChange('nombreCreanciers', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'قائمة الدائنين الرئيسيين' : 'Liste des principaux créanciers'}
                </label>
                <textarea
                  value={formData.listeCreanciers || ''}
                  onChange={(e) => handleChange('listeCreanciers', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اذكر الدائنين الرئيسيين والمبالغ...' : 'Listez les principaux créanciers et montants...'}
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'نوع الإجراء المطلوب' : 'Type de Procédure Demandée'}</h4>
              <select
                value={formData.typeProcedure || ''}
                onChange={(e) => handleChange('typeProcedure', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              >
                <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                <option value="redressement">{isAr ? 'التسوية القضائية' : 'Redressement judiciaire'}</option>
                <option value="liquidation">{isAr ? 'التصفية القضائية' : 'Liquidation judiciaire'}</option>
              </select>
            </div>
          </div>
        );

      case 'recours_administratif':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'طعن إداري' : 'Recours Administratif'}
            </h3>
            
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الجهة القضائية' : 'Juridiction'}</h4>
              <input
                type="text"
                value={formData.juridictionAdmin || ''}
                onChange={(e) => handleChange('juridictionAdmin', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder={isAr ? 'مثال: المحكمة الإدارية بالجزائر' : 'Ex: Tribunal Administratif d\'Alger'}
                required
              />
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الطاعن' : 'Requérant'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.requerantNom || ''}
                    onChange={(e) => handleChange('requerantNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.requerantPrenom || ''}
                    onChange={(e) => handleChange('requerantPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.requerantDateNaissance || ''}
                    onChange={(e) => handleChange('requerantDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.requerantLieuNaissance || ''}
                    onChange={(e) => handleChange('requerantLieuNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.requerantCIN || ''}
                    onChange={(e) => handleChange('requerantCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.requerantProfession || ''}
                    onChange={(e) => handleChange('requerantProfession', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الصفة' : 'Qualité'}
                  </label>
                  <input
                    type="text"
                    value={formData.qualiteRequerant || ''}
                    onChange={(e) => handleChange('qualiteRequerant', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder={isAr ? 'مثال: موظف، مواطن...' : 'Ex: Fonctionnaire, Citoyen...'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'العنوان' : 'Adresse'} *
                  </label>
                  <input
                    type="text"
                    value={formData.requerantAdresse || ''}
                    onChange={(e) => handleChange('requerantAdresse', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الإدارة المعنية' : 'Administration Concernée'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'اسم الإدارة' : 'Nom de l\'administration'} *
                </label>
                <input
                  type="text"
                  value={formData.nomAdministration || ''}
                  onChange={(e) => handleChange('nomAdministration', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عنوان الإدارة' : 'Adresse de l\'administration'}
                </label>
                <input
                  type="text"
                  value={formData.adresseAdministration || ''}
                  onChange={(e) => handleChange('adresseAdministration', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'القرار المطعون فيه' : 'Acte Contesté'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'نوع القرار' : 'Nature de l\'acte'} *
                </label>
                <select
                  value={formData.natureActe || ''}
                  onChange={(e) => handleChange('natureActe', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="decision">{isAr ? 'قرار إداري' : 'Décision administrative'}</option>
                  <option value="arrete">{isAr ? 'قرار' : 'Arrêté'}</option>
                  <option value="refus">{isAr ? 'رفض' : 'Refus'}</option>
                  <option value="silence">{isAr ? 'سكوت الإدارة' : 'Silence de l\'administration'}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم القرار' : 'Numéro de l\'acte'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroActe || ''}
                    onChange={(e) => handleChange('numeroActe', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ القرار' : 'Date de l\'acte'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateActe || ''}
                    onChange={(e) => handleChange('dateActe', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف القرار' : 'Description de l\'acte'} *
                </label>
                <textarea
                  value={formData.descriptionActe || ''}
                  onChange={(e) => handleChange('descriptionActe', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'أوجه الطعن' : 'Moyens du Recours'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'أسباب عدم المشروعية' : 'Motifs d\'illégalité'} *
                </label>
                <textarea
                  value={formData.motifsIllegalite || ''}
                  onChange={(e) => handleChange('motifsIllegalite', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={5}
                  placeholder={isAr ? 'مثال: عيب الشكل، تجاوز السلطة، مخالفة القانون...' : 'Ex: Vice de forme, excès de pouvoir, violation de la loi...'}
                  required
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'الطلبات' : 'Demandes'}</h4>
              <textarea
                value={formData.demandesAdmin || ''}
                onChange={(e) => handleChange('demandesAdmin', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder={isAr ? 'مثال: إلغاء القرار، التعويض...' : 'Ex: Annulation de l\'acte, indemnisation...'}
                required
              />
            </div>
          </div>
        );

      case 'requete_refere':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'عريضة استعجال' : 'Requête en Référé'}
            </h3>
            
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'قاضي الأمور المستعجلة' : 'Juge des Référés'}</h4>
              <input
                type="text"
                value={formData.jugeRefere || ''}
                onChange={(e) => handleChange('jugeRefere', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder={isAr ? 'مثال: قاضي الأمور المستعجلة بمحكمة الجزائر' : 'Ex: Juge des référés du Tribunal d\'Alger'}
                required
              />
            </div>

            {/* Demandeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الطالب' : 'Demandeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurNomRefere || ''}
                    onChange={(e) => handleChange('demandeurNomRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurPrenomRefere || ''}
                    onChange={(e) => handleChange('demandeurPrenomRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.demandeurDateNaissanceRefere || ''}
                    onChange={(e) => handleChange('demandeurDateNaissanceRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurLieuNaissanceRefere || ''}
                    onChange={(e) => handleChange('demandeurLieuNaissanceRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurCINRefere || ''}
                    onChange={(e) => handleChange('demandeurCINRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.demandeurProfessionRefere || ''}
                    onChange={(e) => handleChange('demandeurProfessionRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeurAdresseRefere || ''}
                  onChange={(e) => handleChange('demandeurAdresseRefere', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Défendeur */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'المدعى عليه' : 'Défendeur'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurNomRefere || ''}
                    onChange={(e) => handleChange('defendeurNomRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurPrenomRefere || ''}
                    onChange={(e) => handleChange('defendeurPrenomRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    value={formData.defendeurDateNaissanceRefere || ''}
                    onChange={(e) => handleChange('defendeurDateNaissanceRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurLieuNaissanceRefere || ''}
                    onChange={(e) => handleChange('defendeurLieuNaissanceRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurCINRefere || ''}
                    onChange={(e) => handleChange('defendeurCINRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المهنة' : 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={formData.defendeurProfessionRefere || ''}
                    onChange={(e) => handleChange('defendeurProfessionRefere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.defendeurAdresseRefere || ''}
                  onChange={(e) => handleChange('defendeurAdresseRefere', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الاستعجال' : 'Urgence'}</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'طبيعة الاستعجال' : 'Nature de l\'urgence'} *
                </label>
                <select
                  value={formData.natureUrgence || ''}
                  onChange={(e) => handleChange('natureUrgence', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
                  <option value="provision">{isAr ? 'تدبير وقتي' : 'Mesure provisoire'}</option>
                  <option value="conservation">{isAr ? 'حفظ الحقوق' : 'Mesure conservatoire'}</option>
                  <option value="cessation">{isAr ? 'وقف الإزعاج' : 'Cessation de trouble'}</option>
                  <option value="expertise">{isAr ? 'خبرة عاجلة' : 'Expertise urgente'}</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تبرير الاستعجال' : 'Justification de l\'urgence'} *
                </label>
                <textarea
                  value={formData.justificationUrgence || ''}
                  onChange={(e) => handleChange('justificationUrgence', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                  placeholder={isAr ? 'اشرح لماذا الأمر مستعجل...' : 'Expliquez pourquoi la situation est urgente...'}
                  required
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">{isAr ? 'الوقائع' : 'Faits'}</h4>
              <textarea
                value={formData.faitsRefere || ''}
                onChange={(e) => handleChange('faitsRefere', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder={isAr ? 'عرض موجز للوقائع...' : 'Exposé succinct des faits...'}
                required
              />
            </div>

            <div>
              <h4 className="font-semibold mb-3">{isAr ? 'التدابير المطلوبة' : 'Mesures Demandées'}</h4>
              <textarea
                value={formData.mesuresDemandees || ''}
                onChange={(e) => handleChange('mesuresDemandees', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={5}
                placeholder={isAr ? 'اذكر التدابير العاجلة المطلوبة بدقة...' : 'Précisez les mesures urgentes demandées...'}
                required
              />
            </div>
          </div>
        );


// FORMULAIRE 1: ACTE DE VENTE IMMOBILIÈRE

case 'acte_vente_immobiliere':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'عقد بيع عقار' : 'Acte de Vente Immobilière'}
      </h3>
      
      {/* Notaire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموثق' : 'Notaire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.notaireNom || ''}
              onChange={(e) => handleChange('notaireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.notairePrenom || ''}
              onChange={(e) => handleChange('notairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب التوثيق' : 'Étude notariale'} *
          </label>
          <input
            type="text"
            value={formData.etudeNotariale || ''}
            onChange={(e) => handleChange('etudeNotariale', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Vendeur */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'البائع' : 'Vendeur'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.vendeurNom || ''}
              onChange={(e) => handleChange('vendeurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.vendeurPrenom || ''}
              onChange={(e) => handleChange('vendeurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.vendeurDateNaissance || ''}
              onChange={(e) => handleChange('vendeurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.vendeurLieuNaissance || ''}
              onChange={(e) => handleChange('vendeurLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
          </label>
          <input
            type="text"
            value={formData.vendeurCIN || ''}
            onChange={(e) => handleChange('vendeurCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.vendeurAdresse || ''}
            onChange={(e) => handleChange('vendeurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Acheteur */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'المشتري' : 'Acheteur'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.acheteurNom || ''}
              onChange={(e) => handleChange('acheteurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.acheteurPrenom || ''}
              onChange={(e) => handleChange('acheteurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.acheteurDateNaissance || ''}
              onChange={(e) => handleChange('acheteurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.acheteurLieuNaissance || ''}
              onChange={(e) => handleChange('acheteurLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
          </label>
          <input
            type="text"
            value={formData.acheteurCIN || ''}
            onChange={(e) => handleChange('acheteurCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.acheteurAdresse || ''}
            onChange={(e) => handleChange('acheteurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Bien Immobilier */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'العقار' : 'Bien Immobilier'}</h4>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'نوع العقار' : 'Type de bien'} *
          </label>
          <select
            value={formData.typeBien || ''}
            onChange={(e) => handleChange('typeBien', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          >
            <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
            <option value="appartement">{isAr ? 'شقة' : 'Appartement'}</option>
            <option value="maison">{isAr ? 'منزل' : 'Maison'}</option>
            <option value="terrain">{isAr ? 'أرض' : 'Terrain'}</option>
            <option value="local_commercial">{isAr ? 'محل تجاري' : 'Local commercial'}</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان الكامل' : 'Adresse complète'} *
          </label>
          <input
            type="text"
            value={formData.adresseBien || ''}
            onChange={(e) => handleChange('adresseBien', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'المساحة (م²)' : 'Superficie (m²)'} *
            </label>
            <input
              type="number"
              value={formData.superficie || ''}
              onChange={(e) => handleChange('superficie', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم السند' : 'Numéro de titre'} *
            </label>
            <input
              type="text"
              value={formData.numeroTitre || ''}
              onChange={(e) => handleChange('numeroTitre', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
      </div>

      {/* Prix et Modalités */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'السعر وطريقة الدفع' : 'Prix et Modalités'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'السعر (دج)' : 'Prix de vente (DA)'} *
            </label>
            <input
              type="number"
              value={formData.prixVente || ''}
              onChange={(e) => handleChange('prixVente', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'طريقة الدفع' : 'Mode de paiement'} *
            </label>
            <select
              value={formData.modePaiement || ''}
              onChange={(e) => handleChange('modePaiement', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            >
              <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
              <option value="comptant">{isAr ? 'نقدا' : 'Comptant'}</option>
              <option value="echelonne">{isAr ? 'بالتقسيط' : 'Échelonné'}</option>
              <option value="credit">{isAr ? 'قرض بنكي' : 'Crédit bancaire'}</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'شروط خاصة' : 'Conditions particulières'}
          </label>
          <textarea
            value={formData.conditionsParticulieres || ''}
            onChange={(e) => handleChange('conditionsParticulieres', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={3}
          />
        </div>
      </div>
    </div>
  );


// FORMULAIRE 2: ACTE DE VENTE MOBILIÈRE
case 'acte_vente_mobiliere':
case 'acte_vente_fonds_commerce':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {templateId === 'acte_vente_fonds_commerce' 
          ? (isAr ? 'عقد بيع محل تجاري' : 'Acte de Vente de Fonds de Commerce')
          : (isAr ? 'عقد بيع منقول' : 'Acte de Vente Mobilière')}
      </h3>
      
      {/* VENDEUR (CÉDANT) */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3 text-legal-gold">
          {isAr ? 'البائع (المتنازل)' : 'Vendeur (Cédant)'}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.vendeurNom || ''}
              onChange={(e) => handleChange('vendeurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.vendeurPrenom || ''}
              onChange={(e) => handleChange('vendeurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.vendeurDateNaissance || ''}
              onChange={(e) => handleChange('vendeurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.vendeurLieuNaissance || ''}
              onChange={(e) => handleChange('vendeurLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'N° CIN'} *
            </label>
            <input
              type="text"
              value={formData.vendeurCin || ''}
              onChange={(e) => handleChange('vendeurCin', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الإصدار' : 'Date de délivrance'}
            </label>
            <input
              type="date"
              value={formData.vendeurCinDate || ''}
              onChange={(e) => handleChange('vendeurCinDate', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.vendeurAdresse || ''}
            onChange={(e) => handleChange('vendeurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'المهنة' : 'Profession'}
          </label>
          <input
            type="text"
            value={formData.vendeurProfession || ''}
            onChange={(e) => handleChange('vendeurProfession', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* ACHETEUR (CESSIONNAIRE) */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3 text-legal-gold">
          {isAr ? 'المشتري (المتنازل له)' : 'Acheteur (Cessionnaire)'}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.acheteurNom || ''}
              onChange={(e) => handleChange('acheteurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.acheteurPrenom || ''}
              onChange={(e) => handleChange('acheteurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.acheteurDateNaissance || ''}
              onChange={(e) => handleChange('acheteurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.acheteurLieuNaissance || ''}
              onChange={(e) => handleChange('acheteurLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'N° CIN'} *
            </label>
            <input
              type="text"
              value={formData.acheteurCin || ''}
              onChange={(e) => handleChange('acheteurCin', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الإصدار' : 'Date de délivrance'}
            </label>
            <input
              type="date"
              value={formData.acheteurCinDate || ''}
              onChange={(e) => handleChange('acheteurCinDate', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.acheteurAdresse || ''}
            onChange={(e) => handleChange('acheteurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'المهنة' : 'Profession'}
          </label>
          <input
            type="text"
            value={formData.acheteurProfession || ''}
            onChange={(e) => handleChange('acheteurProfession', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* BIEN VENDU */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3 text-legal-gold">
          {isAr ? 'المال المبيع' : 'Bien Vendu'}
        </h4>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'نوع المال' : 'Type de bien'} *
          </label>
          <select
            value={formData.typeBien || ''}
            onChange={(e) => handleChange('typeBien', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          >
            <option value="">{isAr ? 'اختر النوع' : 'Sélectionner'}</option>
            <option value="vehicule">{isAr ? 'مركبة' : 'Véhicule'}</option>
            <option value="fonds_commerce">{isAr ? 'محل تجاري' : 'Fonds de commerce'}</option>
            <option value="materiel">{isAr ? 'معدات' : 'Matériel'}</option>
            <option value="mobilier">{isAr ? 'أثاث' : 'Mobilier'}</option>
            <option value="autre">{isAr ? 'أخرى' : 'Autre'}</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'وصف المال' : 'Description du bien'} *
          </label>
          <textarea
            value={formData.descriptionBien || ''}
            onChange={(e) => handleChange('descriptionBien', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={4}
            placeholder={isAr ? 'وصف تفصيلي للمال المبيع...' : 'Description détaillée du bien vendu...'}
            required
          />
        </div>
        {formData.typeBien === 'fonds_commerce' && (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'موقع المحل' : 'Emplacement du fonds'} *
              </label>
              <input
                type="text"
                value={formData.emplacementFonds || ''}
                onChange={(e) => handleChange('emplacementFonds', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'المساحة (م²)' : 'Surface (m²)'}
              </label>
              <input
                type="number"
                value={formData.surfaceFonds || ''}
                onChange={(e) => handleChange('surfaceFonds', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'نشاط المحل' : 'Activité du fonds'}
              </label>
              <input
                type="text"
                value={formData.activiteFonds || ''}
                onChange={(e) => handleChange('activiteFonds', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder={isAr ? 'مثال: مطعم، محل بقالة، صيدلية...' : 'Ex: Restaurant, épicerie, pharmacie...'}
              />
            </div>
          </>
        )}
      </div>

      {/* PRIX ET CONDITIONS */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3 text-legal-gold">
          {isAr ? 'الثمن والشروط' : 'Prix et Conditions'}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الثمن (دج)' : 'Prix (DA)'} *
            </label>
            <input
              type="number"
              value={formData.prixVente || ''}
              onChange={(e) => handleChange('prixVente', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'طريقة الدفع' : 'Mode de paiement'} *
            </label>
            <select
              value={formData.modePaiement || ''}
              onChange={(e) => handleChange('modePaiement', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            >
              <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
              <option value="comptant">{isAr ? 'نقدا' : 'Comptant'}</option>
              <option value="cheque">{isAr ? 'شيك' : 'Chèque'}</option>
              <option value="virement">{isAr ? 'تحويل بنكي' : 'Virement bancaire'}</option>
              <option value="echelonne">{isAr ? 'على دفعات' : 'Échelonné'}</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'أجل التسليم (أيام)' : 'Délai de livraison (jours)'}
          </label>
          <input
            type="number"
            value={formData.delaiLivraison || ''}
            onChange={(e) => handleChange('delaiLivraison', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            placeholder="15"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مدة الضمان (سنوات)' : 'Durée de garantie (années)'}
          </label>
          <input
            type="number"
            value={formData.dureeGarantie || ''}
            onChange={(e) => handleChange('dureeGarantie', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            placeholder="2"
          />
        </div>
      </div>

      {/* INFORMATIONS COMPLÉMENTAIRES */}
      <div>
        <h4 className="font-semibold mb-3 text-legal-gold">
          {isAr ? 'معلومات إضافية' : 'Informations Complémentaires'}
        </h4>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'ملاحظات' : 'Observations'}
          </label>
          <textarea
            value={formData.observations || ''}
            onChange={(e) => handleChange('observations', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={3}
            placeholder={isAr ? 'أي معلومات إضافية...' : 'Toute information complémentaire...'}
          />
        </div>
      </div>
    </div>
  );

// FORMULAIRE 3: TESTAMENT AUTHENTIQUE
case 'testament_authentique':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'وصية رسمية' : 'Testament Authentique'}
      </h3>
      
      {/* Notaire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموثق' : 'Notaire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.notaireNom || ''}
              onChange={(e) => handleChange('notaireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.notairePrenom || ''}
              onChange={(e) => handleChange('notairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب التوثيق' : 'Étude notariale'} *
          </label>
          <input
            type="text"
            value={formData.etudeNotariale || ''}
            onChange={(e) => handleChange('etudeNotariale', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Testateur */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموصي' : 'Testateur'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.testateurNom || ''}
              onChange={(e) => handleChange('testateurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.testateurPrenom || ''}
              onChange={(e) => handleChange('testateurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.testateurDateNaissance || ''}
              onChange={(e) => handleChange('testateurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.testateurLieuNaissance || ''}
              onChange={(e) => handleChange('testateurLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
          </label>
          <input
            type="text"
            value={formData.testateurCIN || ''}
            onChange={(e) => handleChange('testateurCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.testateurAdresse || ''}
            onChange={(e) => handleChange('testateurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Légataires */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموصى لهم' : 'Légataires'}</h4>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'قائمة الموصى لهم' : 'Liste des légataires'}
          </label>
          <textarea
            value={formData.legataires || ''}
            onChange={(e) => handleChange('legataires', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={4}
            placeholder={isAr ? 'مثال:\n- أحمد بن علي (ابن)\n- فاطمة بنت علي (بنت)' : 'Ex:\n- Ahmed Ben Ali (fils)\n- Fatima Bent Ali (fille)'}
          />
        </div>
      </div>

      {/* Dispositions */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'الأحكام' : 'Dispositions Testamentaires'}</h4>
        <textarea
          value={formData.dispositionsTestamentaires || ''}
          onChange={(e) => handleChange('dispositionsTestamentaires', e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          rows={6}
          placeholder={isAr ? 'تفاصيل الوصية...' : 'Détails des dispositions testamentaires...'}
          required
        />
      </div>
    </div>
  );





case 'contrat_mariage':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'عقد زواج' : 'Contrat de Mariage'}
      </h3>
      
      {/* Notaire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموثق' : 'Notaire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.notaireNom || ''}
              onChange={(e) => handleChange('notaireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.notairePrenom || ''}
              onChange={(e) => handleChange('notairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب التوثيق' : 'Étude notariale'} *
          </label>
          <input
            type="text"
            value={formData.etudeNotariale || ''}
            onChange={(e) => handleChange('etudeNotariale', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Époux */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الزوج' : 'Époux'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.epouxNom || ''}
              onChange={(e) => handleChange('epouxNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.epouxPrenom || ''}
              onChange={(e) => handleChange('epouxPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.epouxDateNaissance || ''}
              onChange={(e) => handleChange('epouxDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
            </label>
            <input
              type="text"
              value={formData.epouxCIN || ''}
              onChange={(e) => handleChange('epouxCIN', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              maxLength={18}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.epouxAdresse || ''}
            onChange={(e) => handleChange('epouxAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Épouse */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الزوجة' : 'Épouse'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.epouseNom || ''}
              onChange={(e) => handleChange('epouseNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.epousePrenom || ''}
              onChange={(e) => handleChange('epousePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.epouseDateNaissance || ''}
              onChange={(e) => handleChange('epouseDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
            </label>
            <input
              type="text"
              value={formData.epouseCIN || ''}
              onChange={(e) => handleChange('epouseCIN', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              maxLength={18}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.epouseAdresse || ''}
            onChange={(e) => handleChange('epouseAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Régime Matrimonial */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'النظام المالي للزواج' : 'Régime Matrimonial'}</h4>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'نوع النظام' : 'Type de régime'} *
          </label>
          <select
            value={formData.regimeMatrimonial || ''}
            onChange={(e) => handleChange('regimeMatrimonial', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          >
            <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
            <option value="separation">{isAr ? 'فصل الأموال' : 'Séparation de biens'}</option>
            <option value="communaute">{isAr ? 'اشتراك الأموال' : 'Communauté de biens'}</option>
            <option value="participation">{isAr ? 'المشاركة في المكاسب' : 'Participation aux acquêts'}</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'شروط خاصة' : 'Clauses particulières'}
          </label>
          <textarea
            value={formData.clausesParticulieres || ''}
            onChange={(e) => handleChange('clausesParticulieres', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={4}
          />
        </div>
      </div>
    </div>
  );





case 'donation_simple':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'هبة بسيطة' : 'Donation Simple'}
      </h3>
      
      {/* Notaire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموثق' : 'Notaire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.notaireNom || ''}
              onChange={(e) => handleChange('notaireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.notairePrenom || ''}
              onChange={(e) => handleChange('notairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب التوثيق' : 'Étude notariale'} *
          </label>
          <input
            type="text"
            value={formData.etudeNotariale || ''}
            onChange={(e) => handleChange('etudeNotariale', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Donateur */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الواهب' : 'Donateur'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.donateurNom || ''}
              onChange={(e) => handleChange('donateurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.donateurPrenom || ''}
              onChange={(e) => handleChange('donateurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.donateurDateNaissance || ''}
              onChange={(e) => handleChange('donateurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
            </label>
            <input
              type="text"
              value={formData.donateurCIN || ''}
              onChange={(e) => handleChange('donateurCIN', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              maxLength={18}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.donateurAdresse || ''}
            onChange={(e) => handleChange('donateurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Donataire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموهوب له' : 'Donataire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.donataireNom || ''}
              onChange={(e) => handleChange('donataireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.donatairePrenom || ''}
              onChange={(e) => handleChange('donatairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.donataireDateNaissance || ''}
              onChange={(e) => handleChange('donataireDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
            </label>
            <input
              type="text"
              value={formData.donataireCIN || ''}
              onChange={(e) => handleChange('donataireCIN', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              maxLength={18}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.donataireAdresse || ''}
            onChange={(e) => handleChange('donataireAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Objet de la Donation */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'موضوع الهبة' : 'Objet de la Donation'}</h4>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'نوع الهبة' : 'Type de bien donné'} *
          </label>
          <select
            value={formData.typeDonation || ''}
            onChange={(e) => handleChange('typeDonation', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          >
            <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
            <option value="immobilier">{isAr ? 'عقار' : 'Bien immobilier'}</option>
            <option value="mobilier">{isAr ? 'منقول' : 'Bien mobilier'}</option>
            <option value="somme">{isAr ? 'مبلغ مالي' : 'Somme d\'argent'}</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'وصف الهبة' : 'Description de la donation'} *
          </label>
          <textarea
            value={formData.descriptionDonation || ''}
            onChange={(e) => handleChange('descriptionDonation', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={4}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'شروط الهبة' : 'Conditions de la donation'}
          </label>
          <textarea
            value={formData.conditionsDonation || ''}
            onChange={(e) => handleChange('conditionsDonation', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            rows={3}
          />
        </div>
      </div>
    </div>
  );


// FORMULAIRE 5: PROCURATION GÉNÉRALE

case 'procuration_generale':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'توكيل عام' : 'Procuration Générale'}
      </h3>
      
      {/* Notaire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموثق' : 'Notaire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.notaireNom || ''}
              onChange={(e) => handleChange('notaireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.notairePrenom || ''}
              onChange={(e) => handleChange('notairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب التوثيق' : 'Étude notariale'} *
          </label>
          <input
            type="text"
            value={formData.etudeNotariale || ''}
            onChange={(e) => handleChange('etudeNotariale', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Mandant */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الموكل' : 'Mandant'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.mandantNom || ''}
              onChange={(e) => handleChange('mandantNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.mandantPrenom || ''}
              onChange={(e) => handleChange('mandantPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.mandantDateNaissance || ''}
              onChange={(e) => handleChange('mandantDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
            </label>
            <input
              type="text"
              value={formData.mandantCIN || ''}
              onChange={(e) => handleChange('mandantCIN', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              maxLength={18}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.mandantAdresse || ''}
            onChange={(e) => handleChange('mandantAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Mandataire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الوكيل' : 'Mandataire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.mandataireNom || ''}
              onChange={(e) => handleChange('mandataireNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.mandatairePrenom || ''}
              onChange={(e) => handleChange('mandatairePrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.mandataireDateNaissance || ''}
              onChange={(e) => handleChange('mandataireDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
            </label>
            <input
              type="text"
              value={formData.mandataireCIN || ''}
              onChange={(e) => handleChange('mandataireCIN', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              maxLength={18}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.mandataireAdresse || ''}
            onChange={(e) => handleChange('mandataireAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Pouvoirs */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'الصلاحيات' : 'Pouvoirs Conférés'}</h4>
        <textarea
          value={formData.pouvoirsConferes || ''}
          onChange={(e) => handleChange('pouvoirsConferes', e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          rows={6}
          placeholder={isAr ? 'تفاصيل الصلاحيات الممنوحة...' : 'Détails des pouvoirs conférés...'}
          required
        />
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مدة التوكيل' : 'Durée de la procuration'}
          </label>
          <input
            type="text"
            value={formData.dureeProcuration || ''}
            onChange={(e) => handleChange('dureeProcuration', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            placeholder={isAr ? 'مثال: سنة واحدة، غير محدودة...' : 'Ex: 1 an, Indéterminée...'}
          />
        </div>
      </div>
    </div>
  );


// FORMULAIRE 1: MISE EN DEMEURE

case 'mise_en_demeure':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'إنذار' : 'Mise en Demeure'}
      </h3>
      
      {/* Huissier */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'المحضر القضائي' : 'Huissier de Justice'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.huissierNom || ''}
              onChange={(e) => handleChange('huissierNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.huissierPrenom || ''}
              onChange={(e) => handleChange('huissierPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب المحضر' : 'Étude'} *
          </label>
          <input
            type="text"
            value={formData.etudeHuissier || ''}
            onChange={(e) => handleChange('etudeHuissier', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Créancier */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الدائن' : 'Créancier'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.creancierNom || ''}
              onChange={(e) => handleChange('creancierNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.creancierPrenom || ''}
              onChange={(e) => handleChange('creancierPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.creancierDateNaissance || ''}
              onChange={(e) => handleChange('creancierDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.creancierLieuNaissance || ''}
              onChange={(e) => handleChange('creancierLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
          </label>
          <input
            type="text"
            value={formData.creancierCIN || ''}
            onChange={(e) => handleChange('creancierCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.creancierAdresse || ''}
            onChange={(e) => handleChange('creancierAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Débiteur */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'المدين' : 'Débiteur'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.debiteurNom || ''}
              onChange={(e) => handleChange('debiteurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.debiteurPrenom || ''}
              onChange={(e) => handleChange('debiteurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.debiteurDateNaissance || ''}
              onChange={(e) => handleChange('debiteurDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.debiteurLieuNaissance || ''}
              onChange={(e) => handleChange('debiteurLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
          </label>
          <input
            type="text"
            value={formData.debiteurCIN || ''}
            onChange={(e) => handleChange('debiteurCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.debiteurAdresse || ''}
            onChange={(e) => handleChange('debiteurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Objet de la Créance */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'موضوع الدين' : 'Objet de la Créance'}</h4>
        <textarea
          value={formData.objetCreance || ''}
          onChange={(e) => handleChange('objetCreance', e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          rows={4}
          placeholder={isAr ? 'وصف الدين أو الالتزام...' : 'Description de la créance ou obligation...'}
          required
        />
      </div>

      {/* Montant et Délai */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'المبلغ والمهلة' : 'Montant et Délai'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'المبلغ المستحق (دج)' : 'Montant dû (DA)'} *
            </label>
            <input
              type="number"
              value={formData.montantDu || ''}
              onChange={(e) => handleChange('montantDu', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مهلة الدفع (أيام)' : 'Délai de paiement (jours)'} *
            </label>
            <input
              type="number"
              value={formData.delaiPaiement || '8'}
              onChange={(e) => handleChange('delaiPaiement', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="8"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );


// FORMULAIRE 2: SOMMATION DE PAYER

case 'sommation_payer':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'إنذار بالدفع' : 'Sommation de Payer'}
      </h3>
      
      {/* Huissier */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'المحضر القضائي' : 'Huissier de Justice'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.huissierNom || ''}
              onChange={(e) => handleChange('huissierNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.huissierPrenom || ''}
              onChange={(e) => handleChange('huissierPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب المحضر' : 'Étude'} *
          </label>
          <input
            type="text"
            value={formData.etudeHuissier || ''}
            onChange={(e) => handleChange('etudeHuissier', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Créancier */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الدائن' : 'Créancier'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.creancierNom || ''}
              onChange={(e) => handleChange('creancierNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.creancierPrenom || ''}
              onChange={(e) => handleChange('creancierPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
          </label>
          <input
            type="text"
            value={formData.creancierCIN || ''}
            onChange={(e) => handleChange('creancierCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.creancierAdresse || ''}
            onChange={(e) => handleChange('creancierAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Débiteur */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'المدين' : 'Débiteur'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.debiteurNom || ''}
              onChange={(e) => handleChange('debiteurNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.debiteurPrenom || ''}
              onChange={(e) => handleChange('debiteurPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
          </label>
          <input
            type="text"
            value={formData.debiteurCIN || ''}
            onChange={(e) => handleChange('debiteurCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.debiteurAdresse || ''}
            onChange={(e) => handleChange('debiteurAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Titre Exécutoire */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'السند التنفيذي' : 'Titre Exécutoire'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'نوع السند' : 'Type de titre'} *
            </label>
            <select
              value={formData.typeTitre || ''}
              onChange={(e) => handleChange('typeTitre', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            >
              <option value="">{isAr ? 'اختر' : 'Sélectionner'}</option>
              <option value="jugement">{isAr ? 'حكم' : 'Jugement'}</option>
              <option value="ordonnance">{isAr ? 'أمر' : 'Ordonnance'}</option>
              <option value="acte_notarie">{isAr ? 'عقد توثيقي' : 'Acte notarié'}</option>
              <option value="contrat">{isAr ? 'عقد' : 'Contrat'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'رقم السند' : 'Référence du titre'} *
            </label>
            <input
              type="text"
              value={formData.referenceTitre || ''}
              onChange={(e) => handleChange('referenceTitre', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'الجهة المصدرة' : 'Autorité émettrice'}
          </label>
          <input
            type="text"
            value={formData.autoriteEmettrice || ''}
            onChange={(e) => handleChange('autoriteEmettrice', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            placeholder={isAr ? 'المحكمة، الموثق...' : 'Tribunal, Notaire...'}
          />
        </div>
      </div>

      {/* Montant et Délai */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'المبلغ والمهلة' : 'Montant et Délai'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'المبلغ المطلوب (دج)' : 'Montant à payer (DA)'} *
            </label>
            <input
              type="number"
              value={formData.montantAPayer || ''}
              onChange={(e) => handleChange('montantAPayer', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'المهلة (أيام)' : 'Délai (jours)'} *
            </label>
            <input
              type="number"
              value={formData.delai || '15'}
              onChange={(e) => handleChange('delai', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="15"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );


// FORMULAIRE 3: PROCÈS-VERBAL DE CONSTAT

case 'pv_constat':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'محضر معاينة' : 'Procès-Verbal de Constat'}
      </h3>
      
      {/* Huissier */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'المحضر القضائي' : 'Huissier de Justice'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.huissierNom || ''}
              onChange={(e) => handleChange('huissierNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.huissierPrenom || ''}
              onChange={(e) => handleChange('huissierPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'مكتب المحضر' : 'Étude'} *
          </label>
          <input
            type="text"
            value={formData.etudeHuissier || ''}
            onChange={(e) => handleChange('etudeHuissier', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      {/* Requérant */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'الطالب' : 'Requérant'}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'اللقب' : 'Nom'} *
            </label>
            <input
              type="text"
              value={formData.requerantNom || ''}
              onChange={(e) => handleChange('requerantNom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'الاسم' : 'Prénom'} *
            </label>
            <input
              type="text"
              value={formData.requerantPrenom || ''}
              onChange={(e) => handleChange('requerantPrenom', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
            </label>
            <input
              type="date"
              value={formData.requerantDateNaissance || ''}
              onChange={(e) => handleChange('requerantDateNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'مكان الميلاد' : 'Lieu de naissance'} *
            </label>
            <input
              type="text"
              value={formData.requerantLieuNaissance || ''}
              onChange={(e) => handleChange('requerantLieuNaissance', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
          </label>
          <input
            type="text"
            value={formData.requerantCIN || ''}
            onChange={(e) => handleChange('requerantCIN', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            maxLength={18}
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان' : 'Adresse'} *
          </label>
          <input
            type="text"
            value={formData.requerantAdresse || ''}
            onChange={(e) => handleChange('requerantAdresse', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'الصفة' : 'Qualité'}
          </label>
          <input
            type="text"
            value={formData.qualiteRequerant || ''}
            onChange={(e) => handleChange('qualiteRequerant', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            placeholder={isAr ? 'مالك، مستأجر، شاهد...' : 'Propriétaire, Locataire, Témoin...'}
          />
        </div>
      </div>

      {/* Lieu du Constat */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-3">{isAr ? 'مكان المعاينة' : 'Lieu du Constat'}</h4>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
            {isAr ? 'العنوان الكامل' : 'Adresse complète'} *
          </label>
          <input
            type="text"
            value={formData.lieuConstat || ''}
            onChange={(e) => handleChange('lieuConstat', e.target.value)}
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'تاريخ المعاينة' : 'Date du constat'} *
            </label>
            <input
              type="date"
              value={formData.dateConstat || ''}
              onChange={(e) => handleChange('dateConstat', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
              {isAr ? 'ساعة المعاينة' : 'Heure du constat'} *
            </label>
            <input
              type="time"
              value={formData.heureConstat || ''}
              onChange={(e) => handleChange('heureConstat', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
      </div>

      {/* Constatations */}
      <div>
        <h4 className="font-semibold mb-3">{isAr ? 'المعاينات' : 'Constatations'}</h4>
        <textarea
          value={formData.constatations || ''}
          onChange={(e) => handleChange('constatations', e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          rows={8}
          placeholder={isAr ? 'وصف دقيق للمعاينات...' : 'Description détaillée des constatations...'}
          required
        />
        <p className="text-sm text-slate-500 mt-2">
          {isAr ? 'يجب أن تكون المعاينات دقيقة وموضوعية' : 'Les constatations doivent être précises et objectives'}
        </p>
      </div>
    </div>
  );


            // Formulaire générique pour les autres templates
      default:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'معلومات الوثيقة' : 'Informations du document'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'الاسم الكامل' : 'Nom complet'} *
              </label>
              <input
                type="text"
                value={formData.nomComplet || ''}
                onChange={(e) => handleChange('nomComplet', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
              </label>
              <input
                type="text"
                value={formData.cin || ''}
                onChange={(e) => handleChange('cin', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                maxLength={18}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'العنوان' : 'Adresse'}
              </label>
              <input
                type="text"
                value={formData.adresse || ''}
                onChange={(e) => handleChange('adresse', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                {isAr ? 'تفاصيل إضافية' : 'Détails supplémentaires'}
              </label>
              <textarea
                value={formData.details || ''}
                onChange={(e) => handleChange('details', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                rows={6}
                placeholder={isAr ? 'أضف أي معلومات إضافية...' : 'Ajoutez toute information pertinente...'}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'نموذج بيانات الوثيقة' : 'Formulaire de Saisie'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {getFieldsForTemplate()}
        </form>

        {/* Footer */}
        <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-legal-gold text-white rounded-lg hover:bg-legal-gold/90 flex items-center gap-2"
          >
            <Check size={20} />
            {isAr ? 'حفظ' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicLegalForm;
