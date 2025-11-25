
import React, { useMemo, useState } from 'react';
import { Project, Report, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, ExclamationTriangleIcon, ClockIcon, UserCircleIcon, WrenchScrewdriverIcon } from './icons';

interface PendingActionsProps {
  projects: Project[];
  reports: Report[];
  onNavigateToReportItem: (report: Report, categoryId: string) => void;
  onBack: () => void;
}

const PendingActions: React.FC<PendingActionsProps> = ({ projects, reports, onNavigateToReportItem, onBack }) => {
  const [filterProjectId, setFilterProjectId] = useState<string>('all');

  const pendingItems = useMemo(() => {
    // Para consistência com o Dashboard Gerencial, consideramos apenas pendências do checklist MAIS RECENTE de cada obra.
    
    const latestReports = projects.map(project => {
        const projectReports = reports.filter(r => r.projectId === project.id);
        if (projectReports.length === 0) return null;
        return [...projectReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }).filter((r): r is Report => r !== null);

    return latestReports
      .flatMap(report => {
        const project = projects.find(p => p.id === report.projectId);
        if (!project) return [];

        // ALTERAÇÃO: Removemos o filtro (!result.actionPlan) para mostrar TUDO que é NC.
        return report.results
          .filter(result => result.status === InspectionStatus.NC) 
          .map(result => {
            const itemDef = CHECKLIST_DEFINITIONS
              .flatMap(c => c.subCategories.flatMap(sc => sc.items))
              .find(i => i.id === result.itemId);
            
            const categoryDef = CHECKLIST_DEFINITIONS.find(cat => cat.subCategories.some(sc => sc.items.some(i => i.id === result.itemId)));

            return {
              report,
              project,
              result,
              itemText: itemDef?.text || 'Item não encontrado',
              categoryId: categoryDef?.id || '',
            };
          });
      })
      .sort((a, b) => new Date(b.report.date).getTime() - new Date(a.report.date).getTime());
  }, [reports, projects]);

  const filteredItems = useMemo(() => {
    if (filterProjectId === 'all') {
      return pendingItems;
    }
    return pendingItems.filter(item => item.project.id === filterProjectId);
  }, [pendingItems, filterProjectId]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline mb-2">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Voltar para Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Central de Pendências Ambientais</h1>
            <p className="text-md text-gray-500">
                Monitoramento de todas as não conformidades ativas nos canteiros de obra.
            </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <label htmlFor="project-filter" className="block text-sm font-bold text-gray-700 mb-1">Filtrar Visualização</label>
            <select
                id="project-filter"
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">Todas as Obras ({pendingItems.length} pendências)</option>
                {projects.map(p => {
                    const count = pendingItems.filter(i => i.project.id === p.id).length;
                    return <option key={p.id} value={p.id}>{p.name} ({count})</option>
                })}
            </select>
        </div>

        <div className="space-y-4">
            {filteredItems.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-lg shadow-md border border-gray-100">
                    <div className="bg-green-100 text-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Tudo Conforme!</h3>
                    <p className="text-gray-500 mt-2">Nenhuma não conformidade encontrada nos relatórios vigentes.</p>
                </div>
            ) : (
                filteredItems.map(({ report, project, result, itemText, categoryId }, index) => {
                    const hasActionPlan = result.actionPlan && result.actionPlan.actions;
                    
                    return (
                        <div key={`${report.id}-${result.itemId}-${index}`} className="bg-white rounded-lg shadow-md border-l-8 border-red-500 overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                {project.name}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium flex items-center">
                                                <ClockIcon className="h-3 w-3 mr-1"/>
                                                Reportado em: {new Date(report.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg leading-snug">{itemText}</h3>
                                        
                                        {result.comment && (
                                            <div className="mt-3 text-sm text-gray-700 bg-red-50 p-3 rounded-md border border-red-100">
                                                <span className="font-bold text-red-800 block text-xs uppercase mb-1">Observação do Inspetor:</span>
                                                "{result.comment}"
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => onNavigateToReportItem(report, categoryId)}
                                        className="hidden sm:inline-flex bg-white border border-blue-500 text-blue-600 text-xs font-bold py-2 px-4 rounded-full hover:bg-blue-50 transition-colors whitespace-nowrap"
                                    >
                                        Ver no Relatório
                                    </button>
                                </div>

                                {/* Seção do Plano de Ação - Agora visível */}
                                <div className="mt-5 pt-4 border-t border-gray-100">
                                    {hasActionPlan ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center">
                                                    <WrenchScrewdriverIcon className="h-3 w-3 mr-1"/> Ação Corretiva Definida
                                                </p>
                                                <p className="text-sm font-semibold text-gray-800">{result.actionPlan!.actions}</p>
                                            </div>
                                            <div>
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center">
                                                            <UserCircleIcon className="h-3 w-3 mr-1"/> Responsável
                                                        </p>
                                                        <p className="text-sm font-medium text-blue-800 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
                                                            {result.actionPlan!.responsible}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center text-red-400">
                                                            <ClockIcon className="h-3 w-3 mr-1"/> Prazo Limite
                                                        </p>
                                                        <p className="text-sm font-bold text-red-700">
                                                            {new Date(result.actionPlan!.deadline).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-yellow-50 p-3 rounded text-yellow-800 text-sm font-medium border border-yellow-200">
                                            <span className="flex items-center">
                                                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                                Pendente de Plano de Ação!
                                            </span>
                                            <button 
                                                onClick={() => onNavigateToReportItem(report, categoryId)}
                                                className="underline hover:text-yellow-900"
                                            >
                                                Definir Agora
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => onNavigateToReportItem(report, categoryId)}
                                    className="sm:hidden mt-4 w-full bg-blue-500 text-white text-sm font-bold py-3 rounded-lg"
                                >
                                    Gerenciar Item
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};

export default PendingActions;
