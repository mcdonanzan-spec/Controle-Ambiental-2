
import React, { useState, useMemo } from 'react';
import { Project, Report, InspectionStatus, ChecklistItem, InspectionItemResult, Photo, ActionPlan, UserProfile } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { getNewReportTemplate, saveReport, uploadPhoto } from '../services/api'; // API real
import { CameraIcon, CheckIcon, PaperAirplaneIcon, XMarkIcon, CubeTransparentIcon, FunnelIcon, WrenchScrewdriverIcon, BeakerIcon, FireIcon, DocumentCheckIcon, MinusIcon } from './icons';

interface ReportFormProps {
  project: Project;
  existingReport: Report | null;
  userProfile: UserProfile;
  onSave: (status: 'Draft' | 'Completed') => void;
  onCancel: () => void;
  initialCategoryId?: string;
}

const PhotoUploader: React.FC<{ photos: Photo[], onAddPhoto: (photo: Photo) => void, onRemovePhoto: (id: string) => void, disabled?: boolean }> = ({ photos, onAddPhoto, onRemovePhoto, disabled }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploading(true);
      const file = event.target.files[0];
      
      try {
          const publicUrl = await uploadPhoto(file);
          if (publicUrl) {
              const newPhoto: Photo = {
                id: `photo-${Date.now()}`,
                dataUrl: publicUrl,
              };
              onAddPhoto(newPhoto);
          } else {
              alert("Erro ao enviar foto.");
          }
      } catch (e) {
          console.error(e);
          alert("Erro ao enviar foto.");
      } finally {
          setUploading(false);
      }
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      {photos.map(photo => (
        <div key={photo.id} className="relative group">
          <img src={photo.dataUrl} alt="inspection" className="h-20 w-20 rounded-md object-cover" />
          <button disabled={disabled} onClick={() => onRemovePhoto(photo.id)} className={`absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 ${disabled ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled || uploading} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="h-20 w-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200 hover:border-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
      >
        {uploading ? <span className="text-xs">Enviando...</span> : <CameraIcon className="h-8 w-8" />}
        {!uploading && <span className="text-xs mt-1">Adicionar</span>}
      </button>
    </div>
  );
};

const ReportForm: React.FC<ReportFormProps> = ({ project, existingReport, userProfile, onSave, onCancel, initialCategoryId }) => {
  const [reportData, setReportData] = useState<Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & {id?: string}>(
    existingReport ? {...existingReport} : getNewReportTemplate(project.id)
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategoryId || CHECKLIST_DEFINITIONS[0].id);
  const [saving, setSaving] = useState(false);

  const isReadOnly = useMemo(() => existingReport?.status === 'Completed', [existingReport]);
  
  const handleResultChange = (itemId: string, newResult: Partial<InspectionItemResult>) => {
    if (isReadOnly) return;
    setReportData(prev => ({
      ...prev,
      results: prev.results.map(res => (res.itemId === itemId ? { ...res, ...newResult } : res)),
    }));
  };

  const handleAddPhoto = (itemId: string, photo: Photo) => {
    const result = reportData.results.find(r => r.itemId === itemId);
    if (result) {
      handleResultChange(itemId, { photos: [...result.photos, photo] });
    }
  };

  const handleRemovePhoto = (itemId: string, photoId: string) => {
    const result = reportData.results.find(r => r.itemId === itemId);
    if (result) {
      handleResultChange(itemId, { photos: result.photos.filter(p => p.id !== photoId) });
    }
  };

  const handleActionPlanChange = (itemId: string, newPlan: Partial<ActionPlan>) => {
      const result = reportData.results.find(r => r.itemId === itemId);
      if(result) {
          handleResultChange(itemId, { actionPlan: { ...result.actionPlan!, ...newPlan } });
      }
  }

  const handleSubmit = async (status: 'Draft' | 'Completed') => {
    if (isReadOnly) return;
    setSaving(true);
    
    // Auto-preencher inspetor se estiver vazio e for assistente
    let currentData = { ...reportData };
    if (!currentData.inspector) {
        currentData.inspector = userProfile.full_name;
    }

    if (status === 'Completed' && (!currentData.signatures.inspector || !currentData.signatures.manager)) {
        alert("Ambas as assinaturas são necessárias para concluir o relatório.");
        setSaving(false);
        return;
    }

    try {
        const finalData = { ...currentData, status, date: new Date().toISOString() };
        await saveReport(finalData);
        onSave(status);
    } catch (e) {
        alert("Erro ao salvar relatório.");
        console.error(e);
    } finally {
        setSaving(false);
    }
  };
  
  const StatusButton: React.FC<{result: InspectionItemResult; itemId: string; status: InspectionStatus; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string;}> = ({ result, itemId, status, icon: Icon, color }) => {
    const isSelected = result.status === status;
    return (
      <button
        type="button"
        onClick={() => handleResultChange(itemId, { status })}
        disabled={isReadOnly}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
          isSelected
            ? `bg-${color}-500 text-white border-${color}-600 shadow-md`
            : `bg-white text-${color}-500 border-gray-300 hover:bg-${color}-50`
        } disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed`}
        aria-label={status}
        aria-pressed={isSelected}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };
  
  const renderItem = (item: ChecklistItem) => {
    const result = reportData.results.find(r => r.itemId === item.id);
    if (!result) return null;
    const isNC = result.status === InspectionStatus.NC;

    return (
      <div key={item.id} id={`item-${item.id}`} className="py-4 border-b border-gray-200 last:border-b-0 scroll-mt-20">
        <div className="flex justify-between items-start gap-4">
            <p className="flex-1 font-medium text-gray-800 pt-1.5">{item.id.split('-').pop()?.padStart(2, '0')}. {item.text}</p>
            <div className="flex space-x-2">
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.C} icon={CheckIcon} color="green"/>
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.NC} icon={XMarkIcon} color="red"/>
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.NA} icon={MinusIcon} color="gray"/>
            </div>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isNC ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-4">
                <div>
                    <label className="text-sm font-semibold text-gray-700">Observações</label>
                    <textarea value={result.comment} onChange={e => handleResultChange(item.id, { comment: e.target.value })} placeholder="Descreva a não conformidade..."
                    disabled={isReadOnly}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" rows={2}/>
                </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-700">Evidência Fotográfica</label>
                    <PhotoUploader photos={result.photos} onAddPhoto={(photo) => handleAddPhoto(item.id, photo)} onRemovePhoto={(photoId) => handleRemovePhoto(item.id, photoId)} disabled={isReadOnly} />
                </div>
                 <div>
                    <h4 className="font-semibold text-red-800 text-sm">Plano de Ação Corretiva</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                        <input type="text" placeholder="Ações / Provisões" value={result.actionPlan?.actions} onChange={(e) => handleActionPlanChange(item.id, {actions: e.target.value})} disabled={isReadOnly} className="p-2 border rounded-md text-sm disabled:bg-gray-100"/>
                        <input type="text" placeholder="Responsável" value={result.actionPlan?.responsible} onChange={(e) => handleActionPlanChange(item.id, {responsible: e.target.value})} disabled={isReadOnly} className="p-2 border rounded-md text-sm disabled:bg-gray-100"/>
                        <input type="date" placeholder="Prazo" value={result.actionPlan?.deadline} onChange={(e) => handleActionPlanChange(item.id, {deadline: e.target.value})} disabled={isReadOnly} className="p-2 border rounded-md text-sm disabled:bg-gray-100"/>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  const categoryIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    massa: CubeTransparentIcon,
    efluentes: FunnelIcon,
    campo: WrenchScrewdriverIcon,
    quimicos: BeakerIcon,
    combustivel: FireIcon,
    signatures: DocumentCheckIcon
  };
  
  const categoryColors: { [key: string]: string } = {
    massa: 'text-blue-600',
    efluentes: 'text-teal-600',
    campo: 'text-orange-600',
    quimicos: 'text-purple-600',
    combustivel: 'text-red-600',
    signatures: 'text-green-700',
  }

  const activeCategory = CHECKLIST_DEFINITIONS.find(c => c.id === activeCategoryId);
  
  // Controle de permissão de assinatura
  const canSignInspector = !isReadOnly && (userProfile.role === 'assistant' || userProfile.role === 'admin');
  const canSignManager = !isReadOnly && (userProfile.role === 'manager' || userProfile.role === 'admin');

  return (
    <div className="bg-white pb-32">
        <div className="p-4 sm:p-6 min-h-[calc(100vh-200px)]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{existingReport ? 'Editar Relatório' : 'Novo Relatório de Inspeção'}</h2>
            {isReadOnly && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Modo de Leitura</p>
                <p>Este relatório foi concluído e não pode ser alterado.</p>
              </div>
            )}
            
            {activeCategory && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-700 bg-gray-100 p-3 rounded-lg">{activeCategory.title}</h2>
                    {activeCategory.subCategories.map((subCat, index) => (
                        <div key={subCat.title} className={index > 0 ? 'mt-8' : 'mt-4'}>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 pb-3 border-b-2 border-gray-200">
                                {subCat.title}
                            </h3>
                            {subCat.items.map(renderItem)}
                        </div>
                    ))}
                </div>
            )}
            
            {activeCategoryId === 'signatures' && (
                <div id="signatures" className="animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-gray-100 p-3 rounded-lg">Assinaturas</h3>
                    <p className="text-sm text-gray-500 my-4">Para concluir, é necessário as assinaturas do Responsável Ambiental e do Engenheiro.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Responsável Ambiental (Assistente)</label>
                            {reportData.signatures.inspector ? (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-green-800 font-bold">
                                    Assinado por: {reportData.signatures.inspector}
                                </div>
                            ) : (
                                <button 
                                    disabled={!canSignInspector}
                                    onClick={() => setReportData({...reportData, signatures: {...reportData.signatures, inspector: userProfile.full_name}})}
                                    className="mt-2 w-full py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {canSignInspector ? 'Assinar Digitalmente' : 'Aguardando Responsável'}
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Responsável Engenharia (Engenheiro)</label>
                            {reportData.signatures.manager ? (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-green-800 font-bold">
                                    Assinado por: {reportData.signatures.manager}
                                </div>
                            ) : (
                                <button 
                                    disabled={!canSignManager}
                                    onClick={() => setReportData({...reportData, signatures: {...reportData.signatures, manager: userProfile.full_name}})}
                                    className="mt-2 w-full py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {canSignManager ? 'Assinar Digitalmente' : 'Aguardando Responsável'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around p-2 z-50 border-t">
        {CHECKLIST_DEFINITIONS.map(cat => {
            const isActive = activeCategoryId === cat.id;
            return (
                <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`flex flex-col items-center w-16 transition-colors ${isActive ? categoryColors[cat.id] : 'text-gray-500 hover:text-blue-600'}`}>
                    {React.createElement(categoryIcons[cat.id] || CubeTransparentIcon, {className: "h-6 w-6 mb-1"})}
                    <span className="text-xs text-center leading-tight font-medium">{cat.title.split(' ')[0]}</span>
                </button>
            )
        })}
        <button onClick={() => setActiveCategoryId('signatures')} className={`flex flex-col items-center w-16 transition-colors ${activeCategoryId === 'signatures' ? categoryColors['signatures'] : 'text-gray-500 hover:text-blue-600'}`}>
          <DocumentCheckIcon className="h-6 w-6 mb-1"/>
          <span className="text-xs font-medium">Assinar</span>
        </button>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-3 flex flex-col sm:flex-row justify-end items-center gap-3 border-t-2 z-[51] h-auto sm:h-16">
        <button onClick={onCancel} className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-semibold">Cancelar</button>
        <button onClick={() => handleSubmit('Draft')} disabled={isReadOnly || saving} className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 font-semibold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
            <PaperAirplaneIcon className="h-5 w-5 mr-2"/>
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </button>
        <button onClick={() => handleSubmit('Completed')} disabled={isReadOnly || saving} className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
            <CheckIcon className="h-5 w-5 mr-2"/>
            {saving ? 'Enviando...' : 'Concluir e Enviar'}
        </button>
      </div>
    </div>
  );
};

export default ReportForm;
