
import React from 'react';
import { Report, Project, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PencilIcon, ClockIcon, CheckCircleIcon, DocumentCheckIcon, BuildingOfficeIcon } from './icons';

interface ReportViewProps {
  report: Report;
  project: Project;
  onBack: () => void;
  onEdit: (report: Report) => void;
}

// Componente para o botão de imprimir
const PrintButton = () => (
    <button 
        onClick={() => window.print()}
        className="no-print flex items-center bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-900 transition duration-300 text-sm ml-2"
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5Zm-3 0h.008v.008h-.008V10.5Z" />
        </svg>
        Baixar PDF / Imprimir
    </button>
);

const TimelineStep: React.FC<{ label: string, date: string, icon: any, status: 'completed' | 'pending' | 'warning', subtext?: string }> = ({ label, date, icon: Icon, status, subtext }) => {
    let colorClass = 'bg-gray-200 text-gray-400 border-gray-300';
    if (status === 'completed') colorClass = 'bg-green-100 text-green-700 border-green-200';
    if (status === 'warning') colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';

    return (
        <div className="flex flex-col items-center relative z-10 w-32">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${colorClass} mb-2`}>
                <Icon className="h-5 w-5"/>
            </div>
            <p className="text-xs font-bold text-gray-800 uppercase text-center">{label}</p>
            <p className="text-xs text-gray-600 font-medium">{date}</p>
            {subtext && <p className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded-full">{subtext}</p>}
        </div>
    )
}

const ReportView: React.FC<ReportViewProps> = ({ report, project, onBack, onEdit }) => {
  const getStatusBadge = (status: InspectionStatus | null) => {
    switch (status) {
      case InspectionStatus.C:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Conforme</span>;
      case InspectionStatus.NC:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Não Conforme</span>;
      case InspectionStatus.NA:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">N/A</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>;
    }
  };
  
  const getEvaluationChip = (evaluation: string) => {
    switch (evaluation) {
      case 'ÓTIMO': return 'bg-green-100 text-green-800 border-green-200';
      case 'BOM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REGULAR': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RUIM': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const inspectionDate = report.inspectionDate || report.date;
  const closedDate = report.closedDate;
  
  // Cálculo do Lead Time (Dias entre vistoria e fechamento)
  let leadTimeDays = 0;
  let leadTimeAlert = false;
  
  if (closedDate) {
      const start = new Date(inspectionDate).getTime();
      const end = new Date(closedDate).getTime();
      leadTimeDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      if (leadTimeDays > 3) leadTimeAlert = true;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto print:shadow-none print:max-w-none print:w-full print:p-0">
      
      {/* Header - No Print Navigation */}
      <div className="no-print flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para o Projeto
        </button>
        <div className="flex">
            {report.status === 'Draft' && (
                <button
                onClick={() => onEdit(report)}
                className="flex items-center bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-yellow-600 transition duration-300 text-sm"
                >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar Rascunho
                </button>
            )}
            <PrintButton />
        </div>
      </div>
      
      {/* Relatório Header (Impresso e Tela) */}
      <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
         <div className="flex items-center gap-4">
             {/* Logo Placeholder para Impressão */}
             <div className="bg-yellow-400 p-2 rounded hidden print:block">
                 <span className="text-2xl font-bold text-gray-800">BRZ</span>
             </div>
             <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">Relatório de Inspeção Ambiental</h1>
                <div className="flex items-center text-gray-600 mt-1">
                    <BuildingOfficeIcon className="h-5 w-5 mr-1"/>
                    <span className="text-lg font-semibold">{project.name}</span>
                </div>
                <p className="text-sm text-gray-500">{project.location}</p>
             </div>
         </div>
         
         <div className="text-right">
             <div className={`inline-block px-4 py-2 rounded-lg border-2 ${getEvaluationChip(report.evaluation)} mb-2`}>
                 <span className="block text-xs uppercase tracking-wider font-bold opacity-70">Resultado</span>
                 <span className="text-2xl font-black">{report.score}% - {report.evaluation}</span>
             </div>
             <p className="text-xs text-gray-400 uppercase font-bold">ID: {report.id.slice(0,8)}</p>
         </div>
      </div>

      {/* Timeline de Processo (Lead Time) */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200 print:bg-white print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 border-b pb-2">Ciclo de Aprovação (Lead Time)</h3>
          <div className="relative flex justify-between items-center max-w-lg mx-auto">
              {/* Linha Conectora */}
              <div className="absolute top-[20px] left-0 w-full h-1 bg-gray-200 -z-0"></div>
              <div 
                className={`absolute top-[20px] left-0 h-1 bg-green-500 -z-0 transition-all`} 
                style={{ width: closedDate ? '100%' : '50%' }}
              ></div>

              {/* Passos */}
              <TimelineStep 
                label="Vistoria" 
                date={new Date(inspectionDate).toLocaleDateString()} 
                icon={ClockIcon} 
                status="completed" 
              />
              
              <TimelineStep 
                label="Processamento" 
                date="" 
                icon={PencilIcon} 
                status={closedDate ? "completed" : "warning"} 
              />
              
              <TimelineStep 
                label={closedDate ? "Fechado" : "Aberto"} 
                date={closedDate ? new Date(closedDate).toLocaleDateString() : "Em andamento"} 
                icon={closedDate ? DocumentCheckIcon : ClockIcon} 
                status={closedDate ? "completed" : "pending"}
                subtext={leadTimeAlert ? `+${leadTimeDays} dias (Atraso)` : undefined}
              />
          </div>
          {leadTimeAlert && (
              <p className="text-center text-xs text-red-600 mt-4 font-semibold">
                  ⚠️ Atenção: Este relatório levou {leadTimeDays} dias entre a vistoria e a assinatura final.
              </p>
          )}
      </div>

      {/* Conteúdo do Relatório */}
      <div className="space-y-8">
        {CHECKLIST_DEFINITIONS.map(category => (
            <div key={category.id} className="page-break-inside-avoid">
            <h2 className="text-lg font-bold text-white bg-gray-800 p-2 pl-4 rounded print:bg-gray-800 print:text-white mb-4 uppercase">
                {category.title}
            </h2>
            {category.subCategories.map(subCat => (
                <div key={subCat.title} className="mb-6">
                <h3 className="text-md font-bold text-gray-700 mb-3 border-l-4 border-gray-300 pl-2 uppercase">{subCat.title}</h3>
                <div className="space-y-3">
                    {subCat.items.map((item, index) => {
                    const result = report.results.find(r => r.itemId === item.id);
                    if (!result) return null;
                    
                    // Na impressão, se quiser esconder os "N/A" para economizar papel, descomente abaixo
                    // if (result.status === InspectionStatus.NA) return null;

                    return (
                        <div key={item.id} className={`p-3 rounded-lg border ${result.status === InspectionStatus.NC ? 'bg-red-50 border-red-100 print:border-red-300' : 'bg-white border-gray-100'} page-break-inside-avoid`}>
                            <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-800 flex-1 pr-4 font-medium">
                                    <span className="text-gray-400 mr-2 text-xs">{(index + 1).toString().padStart(2, '0')}</span>
                                    {item.text}
                                </p>
                                <div className="flex-shrink-0">
                                    {getStatusBadge(result.status)}
                                </div>
                            </div>
                            
                            {/* Comentários */}
                            {(result.comment || (result.status === InspectionStatus.NC)) && (
                                <div className="mt-2 text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded italic">
                                    <span className="font-bold not-italic text-gray-500 mr-1">Obs:</span> 
                                    {result.comment || "Sem observações registradas."}
                                </div>
                            )}

                            {/* Fotos */}
                            {result.photos.length > 0 && (
                                <div className="mt-2 flex items-center flex-wrap gap-2">
                                    {result.photos.map(photo => (
                                        <div key={photo.id} className="relative">
                                            <img src={photo.dataUrl} alt="evidence" className="h-20 w-20 object-cover rounded border border-gray-300"/>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Plano de Ação */}
                            {result.status === InspectionStatus.NC && result.actionPlan && (
                                <div className="mt-2 p-2 bg-white border-l-4 border-red-500 rounded text-xs shadow-sm">
                                    <h5 className="font-bold text-red-700 uppercase mb-1 flex items-center">
                                        <ClockIcon className="h-3 w-3 mr-1"/> Plano de Ação Obrigatório
                                    </h5>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><span className="font-bold text-gray-500 block text-[10px] uppercase">O que fazer?</span> {result.actionPlan.actions}</div>
                                        <div><span className="font-bold text-gray-500 block text-[10px] uppercase">Responsável</span> {result.actionPlan.responsible}</div>
                                        <div><span className="font-bold text-gray-500 block text-[10px] uppercase">Prazo</span> {new Date(result.actionPlan.deadline).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>
        ))}
      </div>
      
      {/* Rodapé de Assinaturas */}
      <div className="mt-10 pt-6 border-t-2 border-gray-300 page-break-inside-avoid">
        <h2 className="text-lg font-bold text-gray-800 mb-6 uppercase">Validação Digital</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 print:bg-white">
            <p className="text-xs text-gray-500 uppercase font-bold mb-4">Responsável Ambiental (Vistoria)</p>
            {report.signatures.inspector ? (
                <div className="text-center">
                    <p className="font-serif text-xl italic text-blue-900 border-b border-blue-200 inline-block px-4 pb-1 mb-1">{report.signatures.inspector}</p>
                    <p className="text-[10px] text-blue-600 font-bold flex justify-center items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-1"/> Assinado Digitalmente via Gov.br
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(closedDate || new Date()).toLocaleString()}</p>
                </div>
            ) : (
                <p className="text-center text-red-400 italic py-4">Pendente de Assinatura</p>
            )}
          </div>
          
          <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 print:bg-white">
            <p className="text-xs text-gray-500 uppercase font-bold mb-4">Engenheiro Responsável (Aprovação)</p>
            {report.signatures.manager ? (
                <div className="text-center">
                     <p className="font-serif text-xl italic text-blue-900 border-b border-blue-200 inline-block px-4 pb-1 mb-1">{report.signatures.manager}</p>
                     <p className="text-[10px] text-blue-600 font-bold flex justify-center items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-1"/> Assinado Digitalmente via Gov.br
                    </p>
                     <p className="text-[10px] text-gray-400">{new Date(closedDate || new Date()).toLocaleString()}</p>
                </div>
            ) : (
                <p className="text-center text-red-400 italic py-4">Pendente de Assinatura</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-[10px] text-gray-400 uppercase border-t pt-2">
            Documento gerado eletronicamente pelo sistema BRZ Ambiental em {new Date().toLocaleString()}. 
            <br/>A autenticidade deste documento pode ser verificada no sistema interno através do ID: {report.id}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
