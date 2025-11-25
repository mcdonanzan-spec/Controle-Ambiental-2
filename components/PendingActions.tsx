
import React, { useMemo, useState } from 'react';
import { Project, Report, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon } from './icons';

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
    // Isso evita que pendências antigas (de relatórios passados) poluam a lista de tarefas atuais.
    
    const latestReports = projects.map(project => {
        const projectReports = reports.filter(r => r.projectId === project.id);
        if (projectReports.length === 0) return null;
        return [...projectReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }).filter((r): r is Report => r !== null);

    return latestReports
      .flatMap(report => {
        const project = projects.find(p => p.id === report.projectId);
        if (!project) return [];

        return report.results
          .filter(result => result.status === InspectionStatus.NC && (!result.actionPlan || !result.actionPlan.actions))
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
    <div className="space-y-6 animate-fade-in">
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline mb-2">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Voltar para Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Central de Ações Pendentes</h1>
            <p className="text-md text-gray-500">Acompanhe as não conformidades do checklist vigente (último relatório) que exigem plano de ação.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
            <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700">Filtrar por Obra</label>
            <select
                id="project-filter"
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">Todas as Obras</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>

        <div className="space-y-4">
            {filteredItems.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-gray-600 font-semibold text-lg">Nenhuma ação pendente!</p>
                    <p className="text-gray-400 text-sm mt-2">Todas as não conformidades do último ciclo possuem um plano de ação cadastrado.</p>
                </div>
            ) : (
                filteredItems.map(({ report, project, result, itemText, categoryId }, index) => (
                    <div key={`${report.id}-${result.itemId}-${index}`} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-gray-800">{itemText}</p>
                                <p className="text-sm text-gray-500">{project.name} - Checklist Vigente ({new Date(report.date).toLocaleDateString()})</p>
                                {result.comment && <p className="text-sm text-gray-600 mt-2 pl-2 border-l-2">"{result.comment}"</p>}
                            </div>
                            <button 
                                onClick={() => onNavigateToReportItem(report, categoryId)}
                                className="ml-4 flex-shrink-0 bg-blue-500 text-white text-xs font-semibold py-1 px-3 rounded-full hover:bg-blue-600"
                            >
                                Resolver
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default PendingActions;
