
import React, { useState, useMemo } from 'react';
import { Project, Report, InspectionStatus, ChecklistItem, InspectionItemResult, Photo, ActionPlan, UserProfile } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { saveReport, uploadPhoto } from '../services/api'; 
import { CameraIcon, CheckIcon, PaperAirplaneIcon, XMarkIcon, CubeTransparentIcon, FunnelIcon, WrenchScrewdriverIcon, BeakerIcon, FireIcon, DocumentCheckIcon, MinusIcon, ShieldCheckIcon, ExclamationTriangleIcon, ClockIcon } from './icons';

interface ReportFormProps {
  project: Project;
  existingReport: Report | null;
  userProfile: UserProfile;
  onSave: (status: 'Draft' | 'Completed') => void;
  onCancel: () => void;
  initialCategoryId?: string;
}

const PhotoUploader: React.FC<{ photos: Photo[], onAddPhoto: (photo: Photo) => void, onRemovePhoto: (id: string) => void, disabled?: boolean, compact?: boolean }> = ({ photos, onAddPhoto, onRemovePhoto, disabled, compact }) => {
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
    <div className={`flex items-center gap-2 flex-wrap ${compact ? 'mt-1' : 'mt-2'}`}>
      {photos.map(photo => (
        <div key={photo.id} className="relative group">
          <img src={photo.dataUrl} alt="inspection" className={`${compact ? 'h-12 w-12' : 'h-20 w-20'} rounded-md object-cover border border-gray-200`} />
          <button disabled={disabled} onClick={() => onRemovePhoto(photo.id)} className={`absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 transform translate-x-1/2 -translate-y-1/2 ${disabled ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity shadow-sm`}>
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled || uploading} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className={`${compact ? 'h-12 w-12' : 'h-20 w-20'} bg-gray-50 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed`}
        title="Adicionar Foto"
      >
        {uploading ? <span className="text-[8px]">...</span> : <CameraIcon className={`${compact ? 'h-5 w-5' : 'h-8 w-8'}`} />}
      </button>
    </div>
  );
};

// Componente botão Gov.br
const GovBrButton: React.FC<{ onClick: () => void, disabled?: boolean, loading?: boolean }> = ({ onClick, disabled, loading }) => (
    <button 
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full bg-[#1351B4] hover:bg-[#0c3c8c] text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {loading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
        ) : (
             <span className="font-bold tracking-wide">gov.br</span>
        )}
        <span className="text-sm">{loading ? 'Conectando...' : 'Assinar Digitalmente'}</span>
    </button>
);

// Selo de Assinatura Gov.br
const GovBrBadge: React.FC<{ name: string, date: string }> = ({ name, date }) => (
    <div className="mt-2 p-3 border-2 border-[#1351B4] rounded-lg bg-blue-50 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
            <div className="bg-[#1351B4] rounded-full p-1.5 text-white">
                <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Documento assinado digitalmente</p>
                <p className="text-sm font-bold text-[#1351B4] leading-tight">{name}</p>
                <p className="text-xs text-gray-600">Data: {new Date().toLocaleDateString()} - Verificado via Gov.br</p>
            </div>
        </div>
        {/* Background Watermark */}
        <div className="absolute -right-4 -bottom-4 opacity-5 text-[#1351B4]">
             <span className="text-6xl font-black">GOV.BR</span>
        </div>
    </div>
);


const ReportForm: React.FC<ReportFormProps> = ({ project, existingReport, userProfile, onSave, onCancel, initialCategoryId }) => {
  // Inicializa o estado com dados existentes ou novo draft
  const [reportData, setReportData] = useState<Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & {id?: string}>(
    existingReport ? {...existingReport} : {
        projectId: project.id,
        date: new Date().toISOString(),
        inspectionDate: new Date().toISOString().split('T')[0], // Hoje YYYY-MM-DD
        inspector: userProfile.full_name,
        status: 'Draft',
        results: [],
        signatures: { inspector: '', manager: '' }
    }
  );
  
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategoryId || CHECKLIST_DEFINITIONS[0].id);
  const [saving, setSaving] = useState(false);
  const [signingRole, setSigningRole] = useState<'inspector' | 'manager' | null>(null);

  const isReadOnly = useMemo(() => existingReport?.status === 'Completed', [existingReport]);
  
  const isAllItemsAnswered = useMemo(() => {
      if (!reportData.results || reportData.results.length === 0) return false;
      return reportData.results.every(r => r.status !== null);
  }, [reportData.results]);
  
  const uncheckedCount = useMemo(() => {
      if (!reportData.results) return 0;
      return reportData.results.filter(r => r.status === null).length;
  }, [reportData.results]);
  
  const areActionPlansValid = useMemo(() => {
      const ncItems = reportData.results.filter(r => r.status === InspectionStatus.NC);
      return ncItems.every(r => r.actionPlan && r.actionPlan.actions && r.actionPlan.responsible && r.actionPlan.deadline);
  }, [reportData.results]);

  const handleResultChange = (itemId: string, newResult: Partial<InspectionItemResult>) => {
    if (isReadOnly) return;
    setReportData(prev => ({
      ...prev,
      results: prev.results.map(res => (res.itemId === itemId ? { ...res, ...newResult } : res)),
    }));
  };
  
  const handleDateChange = (newDate: string) => {
      setReportData(prev => ({ ...prev, inspectionDate: newDate }));
  }

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

  const handleGovSign = async (role: 'inspector' | 'manager') => {
      setSigningRole(role);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const signatureText = userProfile.full_name;
      
      setReportData(prev => ({
          ...prev,
          signatures: {
              ...prev.signatures,
              [role]: signatureText
          }
      }));
      setSigningRole(null);
  };

  const handleSubmit = async (status: 'Draft' | 'Completed') => {
    if (isReadOnly) return;
    
    if (status === 'Completed') {
        if (!isAllItemsAnswered) {
            alert(`Atenção: Existem ${uncheckedCount} itens não verificados. Preencha todo o checklist antes de concluir.`);
            return;
        }
        
        if (!areActionPlansValid) {
            const invalidCount = reportData.results.filter(r => r.status === InspectionStatus.NC && (!r.actionPlan?.actions || !r.actionPlan?.responsible || !r.actionPlan?.deadline)).length;
            alert(`ERRO DE AUDITORIA: Existem ${invalidCount} itens "Não Conformes" sem Plano de Ação completo.`);
            return;
        }

        if (!reportData.signatures.inspector || !reportData.signatures.manager) {
            alert("Ambas as assinaturas Gov.br são necessárias para concluir o relatório.");
            return;
        }
    }

    setSaving(true);
    
    let currentData = { ...reportData };
    if (!currentData.inspector) {
        currentData.inspector = userProfile.full_name;
    }

    try {
        const finalData = { ...currentData, status };
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
  
  const renderItem = (item: ChecklistItem, index: number) => {
    const result = reportData.results.find(r => r.itemId === item.id);
    if (!result) return null;
    const isNC = result.status === InspectionStatus.NC;
    const isC = result.status === InspectionStatus.C;

    return (
      <div key={item.id} id={`item-${item.id}`} className={`py-4 border-b border-gray-200 last:border-b-0 scroll-mt-20 ${result.status === null ? 'bg-red-50/30 -mx-4 px-4' : ''}`}>
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 pt-1.5">
                <p className="font-medium text-gray-800">{(index + 1).toString().padStart(2, '0')}. {item.text}</p>
                {result.status === null && (
                    <span className="text-xs text-red-500 font-bold flex items-center mt-1">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1"/> Pendente de verificação
                    </span>
                )}
            </div>
            <div className="flex space-x-2">
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.C} icon={CheckIcon} color="green"/>
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.NC} icon={XMarkIcon} color="red"/>
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.NA} icon={MinusIcon} color="gray"/>
            </div>
        </div>
        
        {result.status === null && result.comment && result.comment.includes("PENDÊNCIA ANTERIOR") && (
             <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                {result.comment}
             </div>
        )}
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isC ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="p-3 bg-green-50/50 border border-green-200 rounded-lg flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-shrink-0">
                    <label className="text-[10px] uppercase font-bold text-green-700 mb-1 block">Evidência (Opcional)</label>
                    <PhotoUploader compact photos={result.photos} onAddPhoto={(photo) => handleAddPhoto(item.id, photo)} onRemovePhoto={(photoId) => handleRemovePhoto(item.id, photoId)} disabled={isReadOnly} />
                </div>
                <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase font-bold text-green-700 mb-1 block">Boas Práticas / Comentário</label>
                    <textarea 
                        value={result.comment && !result.comment.includes("PENDÊNCIA") ? result.comment : ''} 
                        onChange={e => handleResultChange(item.id, { comment: e.target.value.toUpperCase() })} 
                        placeholder="Ex: Local limpo e organizado..."
                        disabled={isReadOnly}
                        className="w-full p-2 border border-green-200 bg-white rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 text-sm h-[60px] uppercase"
                    />
                </div>
            </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isNC ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-4 shadow-sm">
                <div>
                    <label className="text-sm font-semibold text-gray-700">Descrição do Problema</label>
                    <textarea value={result.comment} onChange={e => handleResultChange(item.id, { comment: e.target.value.toUpperCase() })} placeholder="DESCREVA A NÃO CONFORMIDADE..."
                    disabled={isReadOnly}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 uppercase" rows={2}/>
                </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-700">Evidência Fotográfica</label>
                    <PhotoUploader photos={result.photos} onAddPhoto={(photo) => handleAddPhoto(item.id, photo)} onRemovePhoto={(photoId) => handleRemovePhoto(item.id, photoId)} disabled={isReadOnly} />
                </div>
                 <div className="bg-white p-3 rounded border border-red-100">
                    <h4 className="font-semibold text-red-800 text-sm flex items-center border-b border-red-100 pb-2 mb-2">
                        Plano de Ação Corretiva
                        <span className="ml-auto text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Obrigatório</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        <div className="md:col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Ação Necessária</label>
                            <input type="text" placeholder="O QUE SERÁ FEITO?" value={result.actionPlan?.actions} onChange={(e) => handleActionPlanChange(item.id, {actions: e.target.value.toUpperCase()})} disabled={isReadOnly} className="w-full p-2 border rounded-md text-sm disabled:bg-gray-100 border-red-300 focus:border-red-500 focus:ring-red-500 uppercase"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Responsável</label>
                            <input type="text" placeholder="QUEM FARÁ?" value={result.actionPlan?.responsible} onChange={(e) => handleActionPlanChange(item.id, {responsible: e.target.value.toUpperCase()})} disabled={isReadOnly} className="w-full p-2 border rounded-md text-sm disabled:bg-gray-100 border-red-300 focus:border-red-500 focus:ring-red-500 uppercase"/>
                        </div>
                        <div>
                             <label className="text-[10px] text-gray-500 uppercase font-bold">Prazo Limite</label>
                             <input type="date" value={result.actionPlan?.deadline} onChange={(e) => handleActionPlanChange(item.id, {deadline: e.target.value})} disabled={isReadOnly} className="w-full p-2 border rounded-md text-sm disabled:bg-gray-100 border-red-300 focus:border-red-500 focus:ring-red-500"/>
                        </div>
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
  
  const canSignInspector = !isReadOnly && (userProfile.role === 'assistant' || userProfile.role === 'admin');
  const canSignManager = !isReadOnly && (userProfile.role === 'manager' || userProfile.role === 'admin');

  return (
    <div className="bg-white pb-64"> 
        {/* Aumentado pb-48 para pb-64 para garantir espaço de sobra em mobile */}
        <div className="p-4 sm:p-6 min-h-[calc(100vh-200px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{existingReport ? 'Editar Relatório' : 'Novo Relatório de Inspeção'}</h2>
                
                {/* CAMPO DE DATA DA VISTORIA */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col md:flex-row items-start md:items-center gap-2">
                    <label className="text-xs font-bold text-blue-800 uppercase flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1"/> Data da Vistoria:
                    </label>
                    <input 
                        type="date" 
                        value={reportData.inspectionDate || reportData.date.split('T')[0]} 
                        onChange={(e) => handleDateChange(e.target.value)}
                        disabled={isReadOnly}
                        className="bg-white border border-blue-300 text-blue-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1 font-semibold disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    {!isReadOnly && <span className="text-[10px] text-blue-500 italic hidden md:inline ml-2">(Pode ser retroativa)</span>}
                </div>
            </div>
            
            {!isAllItemsAnswered && !isReadOnly && (
                <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 text-orange-700 p-4 shadow-sm rounded-r-md flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0"/>
                    <div>
                        <p className="font-bold">Checklist Incompleto</p>
                        <p className="text-sm">Ainda existem <strong>{uncheckedCount}</strong> itens sem verificação. A assinatura digital e o envio só estarão disponíveis após preencher todo o checklist.</p>
                    </div>
                </div>
            )}
            
            {isAllItemsAnswered && !areActionPlansValid && !isReadOnly && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 shadow-sm rounded-r-md flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0"/>
                    <div>
                        <p className="font-bold">Pendência de Auditoria</p>
                        <p className="text-sm">Você marcou itens como "Não Conforme" mas não definiu o Plano de Ação completo (Ação, Responsável e Prazo). Isso é obrigatório para concluir.</p>
                    </div>
                </div>
            )}

            {isReadOnly && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Modo de Leitura</p>
                <p>Este relatório foi concluído e assinado em {new Date(reportData.closedDate || reportData.date).toLocaleDateString()}.</p>
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
                            {subCat.items.map((item, itemIndex) => renderItem(item, itemIndex))}
                        </div>
                    ))}
                </div>
            )}
            
            {activeCategoryId === 'signatures' && (
                <div id="signatures" className="animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-gray-100 p-3 rounded-lg">Assinaturas Eletrônicas</h3>
                    
                    {(!isAllItemsAnswered || !areActionPlansValid) && !isReadOnly ? (
                        <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                            <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3"/>
                            <h4 className="text-lg font-bold text-gray-500">Assinatura Bloqueada</h4>
                            <p className="text-gray-400 text-sm max-w-md mx-auto mt-2">
                                Para garantir a integridade da auditoria, a assinatura digital só é liberada quando:
                                <ul className="list-disc text-left ml-8 mt-2">
                                    <li>Todos os itens foram verificados.</li>
                                    <li>Todas as "Não Conformidades" possuem Plano de Ação completo.</li>
                                </ul>
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 my-4">Para validade jurídica interna, utilize a assinatura digital via Gov.br abaixo.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                <div className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-gray-800 mb-1">Responsável Ambiental (Assistente)</h4>
                                    <p className="text-xs text-gray-400 mb-4">Inspeção de Campo</p>
                                    
                                    {reportData.signatures.inspector ? (
                                        <GovBrBadge name={reportData.signatures.inspector} date={new Date().toISOString()} />
                                    ) : (
                                        <div className="mt-4">
                                            {!canSignInspector ? (
                                                <div className="bg-gray-100 text-gray-500 text-sm p-3 rounded text-center">
                                                    Aguardando assinatura do responsável
                                                </div>
                                            ) : (
                                                <GovBrButton 
                                                    onClick={() => handleGovSign('inspector')} 
                                                    loading={signingRole === 'inspector'}
                                                    disabled={!!signingRole}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-gray-800 mb-1">Responsável Engenharia (Engenheiro)</h4>
                                    <p className="text-xs text-gray-400 mb-4">Validação Técnica</p>
                                    
                                    {reportData.signatures.manager ? (
                                        <GovBrBadge name={reportData.signatures.manager} date={new Date().toISOString()} />
                                    ) : (
                                        <div className="mt-4">
                                            {!canSignManager ? (
                                                <div className="bg-gray-100 text-gray-500 text-sm p-3 rounded text-center">
                                                    Aguardando assinatura do Engenheiro
                                                </div>
                                            ) : (
                                                <GovBrButton 
                                                    onClick={() => handleGovSign('manager')} 
                                                    loading={signingRole === 'manager'}
                                                    disabled={!!signingRole}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

      {/* BARRA DE CATEGORIAS - POSICIONADA ACIMA DA BARRA DE AÇÃO */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around p-2 z-[50] border-t border-gray-100">
        {CHECKLIST_DEFINITIONS.map(cat => {
            const isActive = activeCategoryId === cat.id;
            return (
                <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`flex flex-col items-center w-16 transition-colors ${isActive ? categoryColors[cat.id] : 'text-gray-400 hover:text-blue-600'}`}>
                    {React.createElement(categoryIcons[cat.id] || CubeTransparentIcon, {className: "h-6 w-6 mb-1"})}
                    <span className="text-[10px] text-center leading-tight font-medium uppercase">{cat.title.split(' ')[0]}</span>
                </button>
            )
        })}
        <button onClick={() => setActiveCategoryId('signatures')} className={`flex flex-col items-center w-16 transition-colors ${activeCategoryId === 'signatures' ? categoryColors['signatures'] : 'text-gray-400 hover:text-blue-600'}`}>
          <DocumentCheckIcon className="h-6 w-6 mb-1"/>
          <span className="text-[10px] font-medium uppercase">Assinar</span>
        </button>
      </div>
      
      {/* BARRA DE AÇÃO PRINCIPAL - RODAPÉ FIXO */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 flex flex-col sm:flex-row justify-end items-center gap-3 border-t-2 border-gray-200 z-[51] h-auto min-h-[80px] pb-[env(safe-area-inset-bottom)] pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button onClick={onCancel} className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold shadow-sm">Cancelar</button>
        <button onClick={() => handleSubmit('Draft')} disabled={isReadOnly || saving} className="w-full sm:w-auto flex justify-center items-center px-4 py-3 sm:py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 font-bold disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm">
            <PaperAirplaneIcon className="h-5 w-5 mr-2"/>
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </button>
        <button onClick={() => handleSubmit('Completed')} disabled={isReadOnly || saving || !isAllItemsAnswered || !areActionPlansValid} className="w-full sm:w-auto flex justify-center items-center px-4 py-3 sm:py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md">
            <CheckIcon className="h-5 w-5 mr-2"/>
            {saving ? 'Enviando...' : 'Concluir e Enviar'}
        </button>
      </div>
    </div>
  );
};

export default ReportForm;
