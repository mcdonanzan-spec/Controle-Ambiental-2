
import React from 'react';
import { Report, Project, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PencilIcon, ClockIcon, CheckCircleIcon, DocumentCheckIcon, BuildingOfficeIcon, UserCircleIcon, CalendarDaysIcon } from './icons';

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
      <div className="border-b-4 border-gray-800 pb-4 mb-6 flex justify-between items-start">
         <div className="flex items-center gap-4">
             {/* Logo Placeholder para Impressão */}
             <div className="bg-yellow-400 p-2 rounded hidden print:block border border-gray-900">
                 <span className="text-2xl font-bold text-gray-900">BRZ</span>
             </div>
             <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Relatório de Inspeção Ambiental</h1>
                <div className="flex items-center text-gray-700 mt-1">
                    <BuildingOfficeIcon className="h-5 w-5 mr-1"/>
                    <span className="text-lg font-bold">{project.name}</span>
                </div>
                <p className="text-sm text-gray-500 uppercase font-medium">{project.location}</p>
             </div>
         </div>
         
         <div className="text-right hidden sm:block">
             <div className={`inline-block px-4 py-2 rounded-lg border-2 ${getEvaluationChip(report.evaluation)} mb-2`}>
                 <span className="block text-[10px] uppercase tracking-wider font-bold opacity-70">Desempenho</span>
                 <span className="text-xl font-black">{report.score}% - {report.evaluation}</span>
             </div>
             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">ID DOC: {report.id.slice(0,8)}</p>
         </div>
      </div>

      {/* Matriz de Controle (Datas e Responsáveis) - NOVO LAYOUT PROFISSIONAL */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-0 mb-8 overflow-hidden print:bg-gray-50 print:border-gray-400">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-300 divide-y md:divide-y-0">
              
              <div className="p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                      <CalendarDaysIcon className="h-4 w-4 mr-1"/>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Data da Vistoria</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 block">
                      {new Date(inspectionDate).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-gray-500">(Realização em Campo)</span>
              </div>

              <div className="p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                      <DocumentCheckIcon className="h-4 w-4 mr-1"/>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Data de Emissão</span>
                  </div>
                  <span className={`text-sm font-bold block ${closedDate ? 'text-gray-900' : 'text-yellow-600'}`}>
                      {closedDate ? new Date(closedDate).toLocaleDateString() : "Em Andamento"}
                  </span>
                  <span className="text-[10px] text-gray-500">(Fechamento/Assinatura)</span>
              </div>

              <div className="p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                      <UserCircleIcon className="h-4 w-4 mr-1"/>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Responsável Técnico</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 block truncate" title={report.inspector}>
                      {report.inspector || "Não identificado"}
                  </span>
                  <span className="text-[10px] text-gray-500">Inspetor Ambiental</span>
              </div>

               <div className="p-4 bg-gray-100 print:bg-gray-100">
                  <div className="flex items-center text-gray-500 mb-1">
                      <CheckCircleIcon className="h-4 w-4 mr-1"/>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Status Atual</span>
                  </div>
                  <span className={`text-sm font-bold block ${report.status === 'Completed' ? 'text-green-700' : 'text-yellow-600'}`}>
                      {report.status === 'Completed' ? 'CONCLUÍDO' : 'RASCUNHO / ABERTO'}
                  </span>
                  {leadTimeAlert && (
                       <span className="text-[10px] text-red-600 font-bold block mt-0.5">⚠️ Atraso na aprovação</span>
                  )}
              </div>
          </div>
      </div>

      {/* Timeline de Processo (Visualização de Tela - Escondido na Impressão se quiser, mas deixamos pois é útil) */}
      <div className="no-print bg-white border border-gray-100 rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Fluxo de Aprovação e Prazos</h3>
          <div className="relative flex justify-between items-center max-w-lg mx-auto">
              <div className="absolute top-[20px] left-0 w-full h-1 bg-gray-100 -z-0"></div>
              <div className={`absolute top-[20px] left-0 h-1 bg-green-500 -z-0 transition-all`} style={{ width: closedDate ? '100%' : '50%' }}></div>

              <TimelineStep label="Vistoria" date={new Date(inspectionDate).toLocaleDateString()} icon={ClockIcon} status="completed" />
              <TimelineStep label="Análise" date={leadTimeAlert ? `${leadTimeDays} dias` : ''} icon={PencilIcon} status={closedDate ? "completed" : "warning"} />
              <TimelineStep label={closedDate ? "Fechado" : "Aberto"} date={closedDate ? new Date(closedDate).toLocaleDateString() : "Pendente"} icon={closedDate ? DocumentCheckIcon : ClockIcon} status={closedDate ? "completed" : "pending"} subtext={leadTimeAlert ? `Lead Time Alto` : undefined} />
          </div>
      </div>

      {/* Conteúdo do Relatório */}
      <div className="space-y-8">
        {CHECKLIST_DEFINITIONS.map(category => (
            <div key={category.id} className="page-break-inside-avoid">
            <h2 className="text-md font-bold text-white bg-gray-800 p-2 pl-4 rounded-t print:bg-gray-800 print:text-white uppercase tracking-wide border-b-2 border-yellow-400">
                {category.title}
            </h2>
            <div className="border-x border-b border-gray-200 p-4 rounded-b bg-white">
                {category.subCategories.map(subCat => (
                    <div key={subCat.title} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">{subCat.title}</h3>
                    <div className="space-y-3">
                        {subCat.items.map((item, index) => {
                        const result = report.results.find(r => r.itemId === item.id);
                        if (!result) return null;
                        
                        return (
                            <div key={item.id} className={`p-3 rounded-lg border ${result.status === InspectionStatus.NC ? 'bg-red-50 border-red-200 print:bg-red-50' : 'bg-white border-gray-100'} page-break-inside-avoid`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800 font-medium">
                                            <span className="text-gray-400 mr-2 text-xs font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                                            {item.text}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {getStatusBadge(result.status)}
                                    </div>
                                </div>
                                
                                {/* Comentários */}
                                {(result.comment || (result.status === InspectionStatus.NC)) && (
                                    <div className="mt-2 text-xs text-gray-700 bg-white bg-opacity-60 p-2 rounded border border-gray-100">
                                        <span className="font-bold text-gray-600 mr-1 uppercase text-[10px]">Observação:</span> 
                                        {result.comment || "Sem observações registradas."}
                                    </div>
                                )}

                                {/* Fotos */}
                                {result.photos.length > 0 && (
                                    <div className="mt-3">
                                        <span className="font-bold text-gray-400 uppercase text-[10px] mb-1 block">Evidências Fotográficas</span>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {result.photos.map(photo => (
                                                <div key={photo.id} className="relative group">
                                                    <img src={photo.dataUrl} alt="evidence" className="h-24 w-24 object-cover rounded border border-gray-300 shadow-sm"/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Plano de Ação */}
                                {result.status === InspectionStatus.NC && result.actionPlan && (
                                    <div className="mt-3 p-3 bg-white border border-red-200 rounded text-xs shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                        <h5 className="font-bold text-red-700 uppercase mb-2 flex items-center border-b border-red-100 pb-1">
                                            <ClockIcon className="h-3 w-3 mr-1"/> Ação Corretiva Exigida
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <span className="font-bold text-gray-500 block text-[10px] uppercase">O que será feito?</span> 
                                                <span className="text-gray-900 font-medium">{result.actionPlan.actions}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 block text-[10px] uppercase">Responsável</span> 
                                                <span className="text-blue-800 bg-blue-50 px-1 rounded">{result.actionPlan.responsible}</span>
                                            </div>
                                            <div className="md:col-span-3 mt-1 pt-1 border-t border-gray-100 flex justify-between items-center">
                                                <span className="text-[10px] text-gray-400 uppercase">Prazo Limite:</span>
                                                <span className="font-bold text-red-700">{new Date(result.actionPlan.deadline).toLocaleDateString()}</span>
                                            </div>
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
            </div>
        ))}
      </div>
      
      {/* Rodapé de Assinaturas */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300 page-break-inside-avoid">
        <h2 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider flex items-center">
            <DocumentCheckIcon className="h-5 w-5 mr-2 text-blue-600"/>
            Validação e Assinaturas Digitais
        </h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="border border-gray-300 p-6 rounded-lg bg-gray-50 print:bg-white relative">
             <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-bl">VISTORIA</div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-4">Responsável Ambiental</p>
            {report.signatures.inspector ? (
                <div className="text-center">
                    <p className="font-serif text-xl italic text-blue-900 border-b-2 border-blue-100 inline-block px-8 pb-1 mb-2 min-w-[200px]">{report.signatures.inspector}</p>
                    <p className="text-[10px] text-blue-600 font-bold flex justify-center items-center uppercase tracking-wide bg-blue-50 py-1 rounded">
                        <CheckCircleIcon className="h-3 w-3 mr-1"/> Assinado Digitalmente
                    </p>
                    <p className="text-[10px] text-gray-500 mt-2">Data da Assinatura: {new Date(closedDate || new Date()).toLocaleString()}</p>
                </div>
            ) : (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-white">
                    <p className="text-gray-400 italic text-sm">Pendente</p>
                </div>
            )}
          </div>
          
          <div className="border border-gray-300 p-6 rounded-lg bg-gray-50 print:bg-white relative">
             <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-bl">APROVAÇÃO</div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-4">Engenheiro Responsável</p>
            {report.signatures.manager ? (
                <div className="text-center">
                     <p className="font-serif text-xl italic text-blue-900 border-b-2 border-blue-100 inline-block px-8 pb-1 mb-2 min-w-[200px]">{report.signatures.manager}</p>
                     <p className="text-[10px] text-blue-600 font-bold flex justify-center items-center uppercase tracking-wide bg-blue-50 py-1 rounded">
                        <CheckCircleIcon className="h-3 w-3 mr-1"/> Assinado Digitalmente
                    </p>
                     <p className="text-[10px] text-gray-500 mt-2">Data da Assinatura: {new Date(closedDate || new Date()).toLocaleString()}</p>
                </div>
            ) : (
                 <div className="h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-white">
                    <p className="text-gray-400 italic text-sm">Pendente</p>
                </div>
            )}
          </div>
        </div>
        
        {/* Rodapé Final Técnico */}
        <div className="mt-8 border-t pt-4 flex justify-between items-center text-[9px] text-gray-400 uppercase font-mono">
            <div>
                BRZ Ambiental - Sistema de Gestão de Qualidade
                <br/>Relatório ID: {report.id}
            </div>
            <div className="text-right">
                Página 1 de 1
                <br/>Gerado em: {new Date().toLocaleString()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
