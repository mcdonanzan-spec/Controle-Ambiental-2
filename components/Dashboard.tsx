
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line } from 'recharts';
import { Project, Report, InspectionStatus } from '../types';
import { BuildingOfficeIcon, DocumentChartBarIcon, ExclamationTriangleIcon } from './icons';

interface DashboardProps {
  projects: Project[];
  reports: Report[];
  onSelectProject: (project: Project) => void;
  onNavigateToSites: () => void;
  onNavigateToPendingActions: () => void;
}

const TrendChart: React.FC<{ reports: Report[], projects: Project[] }> = ({ reports, projects }) => {
    const trendData = useMemo(() => {
        const dataByMonth: { [month: string]: { [projectId: string]: number[] } } = {};

        // Agrupa os relatórios por Mês e por Projeto
        reports.forEach(report => {
            // Usa slice(0, 7) para pegar YYYY-MM. Isso agrupa por mês calendário.
            const monthKey = new Date(report.date).toISOString().slice(0, 7); 
            
            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = {};
            }
            if (!dataByMonth[monthKey][report.projectId]) {
                dataByMonth[monthKey][report.projectId] = [];
            }
            dataByMonth[monthKey][report.projectId].push(report.score);
        });

        // Transforma o agrupamento em array para o gráfico
        const formattedData = Object.keys(dataByMonth).map(monthKey => {
            const monthEntry: { month: string, displayMonth: string, [projectName: string]: number | string } = { 
                month: monthKey,
                // Formata para exibição PT-BR (Mês/Ano)
                displayMonth: new Date(monthKey + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) 
            };

            projects.forEach(project => {
                const scores = dataByMonth[monthKey][project.id];
                if (scores && scores.length > 0) {
                    // Calcula a média das notas daquele mês para suavizar a tendência
                    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                    monthEntry[project.name] = Math.round(avgScore);
                }
            });
            return monthEntry;
        });
        
        // ORDENAÇÃO CRITICA: Garante que os meses apareçam na ordem correta (Mais antigo -> Mais novo)
        return formattedData.sort((a, b) => a.month.localeCompare(b.month));
    }, [reports, projects]);

    const projectColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    // Se não tiver nenhum dado, avisa. Mas removemos a restrição de "mínimo 2 meses".
    if (trendData.length === 0) {
        return <div className="text-center text-gray-400 py-10 flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-100 rounded-lg">
            <p>Ainda não há dados suficientes.</p>
            <p className="text-xs mt-1">Conclua o primeiro relatório para visualizar.</p>
        </div>
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                    dataKey="displayMonth" 
                    tick={{fontSize: 12, fill: '#6B7280'}} 
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis 
                    domain={[0, 100]} 
                    tick={{fontSize: 12, fill: '#6B7280'}} 
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend iconType="circle" />
                {projects.map((project, index) => (
                     <Line 
                        key={project.id} 
                        type="monotone" 
                        dataKey={project.name} 
                        stroke={projectColors[index % projectColors.length]} 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} // Bolinha visível para marcar o mês
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        connectNulls={true} // Liga os pontos mesmo se houver um mês sem inspeção no meio
                        animationDuration={1500}
                     />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ projects, reports, onSelectProject, onNavigateToSites, onNavigateToPendingActions }) => {
  
  // 1. Identificar apenas o relatório MAIS RECENTE de cada obra para o "Retrato Atual"
  const latestReports = useMemo(() => {
      return projects.map(project => {
          const projectReports = reports.filter(r => r.projectId === project.id);
          if (projectReports.length === 0) return null;
          // Ordena por data decrescente e pega o primeiro
          return [...projectReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      }).filter((r): r is Report => r !== null);
  }, [projects, reports]);

  const data = projects.map(project => {
    // Usa a lista pré-calculada para consistência
    const lastReport = latestReports.find(r => r.projectId === project.id);
    
    const score = lastReport ? lastReport.score : 0;
    
    // Contagem de pendências baseada APENAS no último relatório vigente
    const pendingActions = lastReport 
        ? lastReport.results.filter(res => res.status === InspectionStatus.NC && (!res.actionPlan || !res.actionPlan.actions)).length 
        : 0;

    return {
      name: project.name,
      'Pontuação (%)': score,
      pendingActions: pendingActions,
      project,
    };
  });

  const totalPendingActions = data.reduce((sum, item) => sum + item.pendingActions, 0);

  // Status Geral baseia-se APENAS nos relatórios mais recentes (evita duplicar itens de relatórios antigos)
  const overallStatus = latestReports.flatMap(r => r.results)
    .filter(res => res.status !== null && res.status !== InspectionStatus.NA);

  const statusCounts = {
    [InspectionStatus.C]: overallStatus.filter(r => r.status === InspectionStatus.C).length,
    [InspectionStatus.NC]: overallStatus.filter(r => r.status === InspectionStatus.NC).length,
  };

  const pieData = [
    { name: 'Conforme', value: statusCounts[InspectionStatus.C] },
    { name: 'Não Conforme', value: statusCounts[InspectionStatus.NC] },
  ];
  
  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <h2 className="text-2xl font-bold text-gray-800">Painel Gerencial</h2>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={onNavigateToSites} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-full">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600"/>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Obras Ativas</p>
                <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
            </div>
        </div>
        <div onClick={onNavigateToSites} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 rounded-full">
                <DocumentChartBarIcon className="h-8 w-8 text-green-600"/>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Relatórios Totais</p>
                <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
            </div>
        </div>
        <div onClick={onNavigateToPendingActions} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="p-3 bg-red-50 rounded-full">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600"/>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Pendências Atuais</p>
                <p className="text-2xl font-bold text-gray-800">{totalPendingActions}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BAR CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Desempenho Atual por Obra</h2>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6B7280'}} interval={0} axisLine={false} tickLine={false}/>
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}}/>
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}/>
                {/* FIX: Explicitly type `d` as `any` to work around a type inference issue with recharts */}
                <Bar dataKey="Pontuação (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} onClick={(d: any) => onSelectProject(d.project)} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <LabelList 
                        dataKey="Pontuação (%)" 
                        position="top" 
                        formatter={(value: number) => `${value}%`} 
                        style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                    />
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Nenhuma obra cadastrada</div>
          )}
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Conformidade Geral</h2>
          {overallStatus.length > 0 ? (
            <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={5}
                        dataKey="value" 
                    >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: '8px' }}/>
                    <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
                {/* Central Score Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                    <p className="text-3xl font-bold text-gray-700">
                        {Math.round((statusCounts[InspectionStatus.C] / (statusCounts[InspectionStatus.C] + statusCounts[InspectionStatus.NC])) * 100 || 0)}%
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Aderência</p>
                </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Sem dados de inspeção</div>
          )}
        </div>
      </div>
      
      {/* TREND CHART */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-700">Histórico de Evolução (Média Mensal)</h2>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Últimos 12 meses</div>
          </div>
          <TrendChart reports={reports} projects={projects} />
      </div>
    </div>
  );
};

export default Dashboard;
