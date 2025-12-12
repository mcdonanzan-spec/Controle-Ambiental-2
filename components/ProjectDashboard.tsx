
import React from 'react';
import { Project, Report, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PlusIcon, CubeTransparentIcon, FunnelIcon, WrenchScrewdriverIcon, BeakerIcon, FireIcon, DocumentCheckIcon, ClockIcon, CheckCircleIcon, EyeIcon, PencilIcon, UserCircleIcon } from './icons';

interface ProjectDashboardProps {
  project: Project;
  reports: Report[];
  onViewReport: (report: Report) => void;
  onNewReport: () => void;
  onEditReportCategory: (report: Report, categoryId: string) => void;
  onBack: () => void;
  readOnly?: boolean;
}

const categoryIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    massa: CubeTransparentIcon,
    efluentes: FunnelIcon,
    campo: WrenchScrewdriverIcon,
    quimicos: BeakerIcon,
    combustivel: FireIcon,
    signatures: DocumentCheckIcon
};

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const size = 60;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 90) return 'text-green-500';
        if (s >= 70) return 'text-blue-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size}>
                <circle
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`transform -rotate-90 origin-center transition-all duration-1000 ${getColor(score)}`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`text-lg font-bold ${getColor(score)}`}>{score}</span>
        </div>
    );
};

// Helper para formatar data evitando problemas de timezone (Assume YYYY-MM-DD)
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return new Date(dateString).toLocaleDateString();
    return new Date(year, month - 1, day).toLocaleDateString();
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project, reports, onViewReport, onNewReport, onEditReportCategory, onBack, readOnly = false }) => {

  // Lógica de ordenação robusta (Data de Vistoria > Data de Criação)
  const sortedReports = [...reports].sort((a,b) => {
      const dateA = new Date(a.inspectionDate || a.date).getTime();
      const dateB = new Date(b.inspectionDate || b.date).getTime();
      return dateB - dateA;
  });

  const latestReport = sortedReports[0];
  const isLatestReportCompleted = latestReport?.status === 'Completed';

  const getCategoryStatus = (categoryId: string) => {
      if (!latestReport) return { isComplete: false };
      const categoryItemIds = CHECKLIST_DEFINITIONS.find(c => c.id === categoryId)?.subCategories.flatMap(sc => sc.items.map(i => i.id));
      if (!categoryItemIds) return { isComplete: false };
      
      const allAnswered = categoryItemIds.every(itemId => {
          const result = latestReport.results.find(r => r.itemId === itemId);
          return result && result.status !== null;
      });
      return { isComplete: allAnswered };
  }

  // Helper para Status Visual do Histórico
  const getReportStatusInfo = (report: Report) => {
      // Data de referência (para exibição de assinatura)
      const refDate = report.closedDate || report.date;
      
      if (report.status === 'Completed') {
          return { label: 'Concluído', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircleIcon, subtext: `Assinado em ${new Date(refDate).toLocaleDateString()}` };
      }
      
      // Análise de Assinaturas Pendentes (Safe Access)
      const missingSignatures = [];
      if (!report.signatures?.inspector) missingSignatures.push('Inspetor');
      if (!report.signatures?.manager) missingSignatures.push('Engenheiro');

      if (missingSignatures.length > 0) {
           // Se faltam assinaturas
           return { 
               label: 'Pendente Assinatura', 
               color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
               icon: PencilIcon,
               subtext: `Falta: ${missingSignatures.join(' e ')}`
           };
      } else {
           // Tem assinaturas mas status não é Completed (Raro, mas possível se não clicou em Concluir)
           return { 
               label: 'Pronto para Concluir', 
               color: 'bg-blue-100 text-blue-700 border-blue-200', 
               icon: CheckCircleIcon,
               subtext: 'Assinaturas coletadas'
           };
      }

      // Fallback padrão (se algo falhar na lógica acima)
      return { label: 'Em Andamento', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: ClockIcon, subtext: 'Preenchimento incompleto' };
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex justify-between items-start">
            <div>
                <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline mb-2">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Voltar para Obras
                </button>
                <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
                <p className="text-md text-gray-500">{project.location}</p>
            </div>
            
            {!readOnly && (
                <button
                onClick={() => (latestReport && !isLatestReportCompleted) ? onEditReportCategory(latestReport, 'massa') : onNewReport()}
                className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition duration-300"
                >
                <PlusIcon className="h-5 w-5 mr-2" />
                {(latestReport && !isLatestReportCompleted) ? 'Continuar Inspeção' : 'Nova Inspeção'}
                </button>
            )}
        </div>
        
        {readOnly && (
            <div className="bg-gray-100 border-l-4 border-gray-400 p-3 rounded-r text-gray-700 text-sm flex items-center">
                <EyeIcon className="h-5 w-5 mr-2" />
                <span><strong>Modo Leitura:</strong> Você está visualizando esta obra para consulta. Apenas usuários vinculados podem realizar inspeções.</span>
            </div>
        )}
      
        { !latestReport ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 font-semibold text-lg">Nenhum relatório encontrado para esta obra.</p>
                {!readOnly && <p className="text-gray-400 text-sm mt-2">Clique em "Nova Inspeção" para começar.</p>}
            </div>
        ) : (
            <>
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between border-l-4 border-blue-500">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Status Geral da Obra</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <ClockIcon className="h-4 w-4 text-gray-400"/>
                            <p className="text-sm text-gray-500">
                                Vistoria mais recente: <strong>{formatDate(latestReport.inspectionDate || latestReport.date.split('T')[0])}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 sm:mt-0 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold">Nota Atual</p>
                            <span className="text-3xl font-bold text-blue-600">{latestReport.score}%</span>
                        </div>
                        <div className={`px-3 py-1 text-md font-bold rounded-full ${latestReport.evaluation === 'ÓTIMO' ? 'bg-green-100 text-green-800' : latestReport.evaluation === 'BOM' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {latestReport.evaluation}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {CHECKLIST_DEFINITIONS.map(category => {
                        const score = latestReport.categoryScores[category.id] ?? 0;
                        const status = getCategoryStatus(category.id);
                        const Icon = categoryIcons[category.id];
                        
                        // Se for ReadOnly, o clique sempre leva para a visualização, se editável, leva para edição se não estiver completo
                        const handleClick = () => {
                             if (readOnly || isLatestReportCompleted) {
                                 onViewReport(latestReport);
                             } else {
                                 onEditReportCategory(latestReport, category.id);
                             }
                        }

                        return (
                            <div key={category.id} onClick={handleClick} className="bg-white p-5 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer border border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {Icon && <Icon className="h-8 w-8 text-gray-400 mb-2"/>}
                                        <h3 className="font-bold text-gray-800 text-lg">{category.title}</h3>
                                    </div>
                                    <ScoreRing score={score} />
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs">
                                    {status.isComplete ? (
                                        <span className="flex items-center font-semibold text-green-600"><CheckCircleIcon className="h-4 w-4 mr-1"/> Concluído</span>
                                    ) : (
                                        <span className="flex items-center font-semibold text-yellow-600"><ClockIcon className="h-4 w-4 mr-1"/> Pendente</span>
                                    )}
                                    <span className="text-gray-500">Ver detalhes →</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </>
        )}
        
        {reports.length > 0 && (
             <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="flex items-center mb-4">
                    <DocumentCheckIcon className="h-6 w-6 text-gray-400 mr-2"/>
                    <h2 className="text-xl font-bold text-gray-800">Histórico e Aprovações</h2>
                </div>
                  <ul className="space-y-3">
                    {sortedReports.map(report => {
                      const statusInfo = getReportStatusInfo(report);
                      const StatusIcon = statusInfo.icon;
                      const dateStr = formatDate(report.inspectionDate || report.date.split('T')[0]);

                      return (
                        <li key={report.id} onClick={() => onViewReport(report)} className="group bg-gray-50 p-4 rounded-lg hover:bg-white hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-gray-200">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            
                            {/* Esquerda: Dados Básicos */}
                            <div className="flex items-start space-x-3">
                                <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${statusInfo.color.split(' ')[0]}`}>
                                    <StatusIcon className={`h-5 w-5 ${statusInfo.color.split(' ')[1]}`}/>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-lg">
                                        Vistoria: {dateStr}
                                    </p>
                                    <div className="flex items-center text-sm text-gray-500 mt-0.5">
                                        <UserCircleIcon className="h-3 w-3 mr-1"/>
                                        {report.inspector || 'Inspetor não identificado'}
                                    </div>
                                    <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>

                            {/* Direita: Status de Assinatura e Nota */}
                            <div className="flex flex-col sm:flex-end items-end w-full sm:w-auto mt-2 sm:mt-0 pl-11 sm:pl-0">
                                 <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{report.score}%</span>
                                 
                                 {/* Alerta de Assinatura */}
                                 {statusInfo.subtext && (
                                     <div className={`text-xs mt-1 font-medium ${report.status === 'Completed' ? 'text-green-600' : 'text-red-500 animate-pulse'}`}>
                                         {statusInfo.subtext}
                                     </div>
                                 )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
              </div>
        )}
    </div>
  );
};

export default ProjectDashboard;
