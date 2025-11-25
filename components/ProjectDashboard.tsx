
import React from 'react';
import { Project, Report, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PlusIcon, CubeTransparentIcon, FunnelIcon, WrenchScrewdriverIcon, BeakerIcon, FireIcon, DocumentCheckIcon, ClockIcon, CheckCircleIcon, EyeIcon } from './icons';

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

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project, reports, onViewReport, onNewReport, onEditReportCategory, onBack, readOnly = false }) => {

  // FIX: Usa spread operator [...reports] para criar cópia antes de ordenar, evitando mutação do estado original
  const latestReport = [...reports].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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

  return (
    <div className="space-y-6 animate-fade-in">
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
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Pontuação Geral da Inspeção</h2>
                        <p className="text-sm text-gray-500">Baseado no último relatório de {new Date(latestReport.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <span className="text-5xl font-bold text-blue-600">{latestReport.score}%</span>
                        <span className={`px-3 py-1 text-md font-bold rounded-full ${latestReport.evaluation === 'ÓTIMO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {latestReport.evaluation}
                        </span>
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
                            <div key={category.id} onClick={handleClick} className="bg-white p-5 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
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
             <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Histórico de Inspeções</h2>
                  <ul className="space-y-3">
                    {reports.map(report => (
                      <li key={report.id} onClick={() => onViewReport(report)} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">
                              Relatório - {new Date(report.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">Inspetor: {report.inspector}</p>
                          </div>
                           <span className="font-bold text-gray-700">{report.score}%</span>
                        </div>
                      </li>
                    ))}
                  </ul>
              </div>
        )}
    </div>
  );
};

export default ProjectDashboard;
