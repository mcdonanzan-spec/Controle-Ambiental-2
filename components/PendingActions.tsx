
import React, { useMemo } from 'react';
import { Project, Report, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, ExclamationTriangleIcon, ClockIcon, UserCircleIcon, WrenchScrewdriverIcon, BuildingOfficeIcon } from './icons';

interface PendingActionsProps {
  projects: Project[];
  reports: Report[];
  onNavigateToReportItem: (report: Report, categoryId: string) => void;
  onBack: () => void;
  selectedPeriod: string; // Contexto vindo do Dashboard
}

const PendingActions: React.FC<PendingActionsProps> = ({ projects, reports, onNavigateToReportItem, onBack, selectedPeriod }) => {

  // Lógica de Filtragem e Agrupamento
  const groupedPendingItems = useMemo(() => {
    // 1. Filtrar relatórios relevantes baseados no período
    let relevantReports: Report[] = [];

    if (selectedPeriod === 'latest') {
        // Modo "Hoje": Pega apenas o ÚLTIMO relatório de cada obra
        relevantReports = projects.map(project => {
            const projectReports = reports.filter(r => r.projectId === project.id);
            if (projectReports.length === 0) return null;
            // Ordena e pega o primeiro
            return [...projectReports].sort((a, b) => {
                 const dateA = a.inspectionDate || a.date;
                 const dateB = b.inspectionDate || b.date;
                 return dateB.localeCompare(dateA);
            })[0];
        }).filter((r): r is Report => r !== null);
    } else {
        // Modo "Histórico": Pega TODOS os relatórios daquele mês
        relevantReports = reports.filter(r => {
            const refDate = r.inspectionDate || r.date;
            return refDate.substring(0, 7) === selectedPeriod;
        });
    }

    // 2. Extrair NCs desses relatórios
    const allNCs = relevantReports.flatMap(report => {
        const project = projects.find(p => p.id === report.projectId);
        if (!project) return [];

        return report.results
            .filter(result => result.status === InspectionStatus.NC)
            .map(result => {
                const itemDef = CHECKLIST_DEFINITIONS
                  .flatMap(c => c.subCategories.flatMap(sc => sc.items))
                  .find(i => i.id === result.itemId);
                
                const categoryDef = CHECKLIST_DEFINITIONS.find(cat => cat.subCategories.some(sc => sc.items.some(i => i.id === result.itemId)));

                return {
                    id: `${report.id}-${result.itemId}`,
                    report,
                    project,
                    result,
                    itemText: itemDef?.text || 'Item não encontrado',
                    categoryId: categoryDef?.id || '',
                };
            });
    });

    // 3. Agrupar por Projeto
    const grouped: { [projectId: string]: { project: Project, items: typeof allNCs } } = {};
    
    allNCs.forEach(item => {
        if (!grouped[item.project.id]) {
            grouped[item.project.id] = { project: item.project, items: [] };
        }
        grouped[item.project.id].items.push(item);
    });

    return Object.values(grouped).sort((a, b) => b.items.length - a.items.length); // Ordena obras com mais problemas primeiro

  }, [reports, projects, selectedPeriod]);

  const formatPeriod = (iso: string) => {
      if (iso === 'latest') return 'Relatórios Vigentes (Atual)';
      const [year, month] = iso.split('-').map(Number);
      return new Date(year, month - 1, 2).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline mb-2">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Voltar para Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
                {selectedPeriod === 'latest' ? 'Central de Pendências Ativas' : 'Histórico de Não Conformidades'}
            </h1>
            <p className="text-md text-gray-500 flex items-center mt-1">
                <ClockIcon className="h-4 w-4 mr-1 text-gray-400"/>
                Exibindo dados referentes a: <strong className="ml-1 text-gray-800">{formatPeriod(selectedPeriod)}</strong>
            </p>
        </div>

        {groupedPendingItems.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="bg-green-100 text-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Tudo Conforme!</h3>
                <p className="text-gray-500 mt-2">Nenhuma não conformidade encontrada nos relatórios deste período.</p>
            </div>
        ) : (
            <div className="space-y-8">
                {groupedPendingItems.map(group => (
                    <div key={group.project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header da Obra */}
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <BuildingOfficeIcon className="h-5 w-5 text-blue-700"/>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 leading-tight">{group.project.name}</h2>
                                    <p className="text-xs text-gray-500">{group.items.length} apontamentos neste período</p>
                                </div>
                            </div>
                        </div>

                        {/* Lista de NCs da Obra */}
                        <div className="divide-y divide-gray-100">
                            {group.items.map(({ id, report, result, itemText, categoryId }) => {
                                const hasActionPlan = result.actionPlan && result.actionPlan.actions;
                                return (
                                    <div key={id} className="p-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-200 px-2 rounded-full">
                                                        Vistoria: {new Date(report.inspectionDate || report.date).toLocaleDateString()}
                                                    </span>
                                                    {selectedPeriod !== 'latest' && (
                                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 rounded-full font-bold">
                                                            Registro Histórico
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <h3 className="font-bold text-gray-800 text-md mb-2">{itemText}</h3>
                                                
                                                {result.comment && (
                                                    <div className="text-sm text-red-700 bg-red-50 p-3 rounded-md border-l-4 border-red-400 mb-3 italic">
                                                        "{result.comment}"
                                                    </div>
                                                )}

                                                {/* Plano de Ação */}
                                                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    {hasActionPlan ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <span className="block font-bold text-gray-400 uppercase text-[10px]">Ação Corretiva</span>
                                                                <span className="font-semibold text-gray-800">{result.actionPlan!.actions}</span>
                                                            </div>
                                                            <div className="flex justify-between sm:justify-start gap-4">
                                                                <div>
                                                                    <span className="block font-bold text-gray-400 uppercase text-[10px]">Responsável</span>
                                                                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">{result.actionPlan!.responsible}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="block font-bold text-gray-400 uppercase text-[10px]">Prazo</span>
                                                                    <span className="text-red-600 font-bold">{new Date(result.actionPlan!.deadline).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-yellow-700 text-xs font-bold">
                                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1"/>
                                                            Plano de Ação Pendente
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => onNavigateToReportItem(report, categoryId)}
                                                className="self-start mt-2 md:mt-0 bg-white border border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-400 text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all whitespace-nowrap"
                                            >
                                                Ver no Relatório
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default PendingActions;
