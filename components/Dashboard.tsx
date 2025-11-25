
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line, ReferenceArea } from 'recharts';
import { Project, Report, InspectionStatus } from '../types';
import { BuildingOfficeIcon, DocumentChartBarIcon, ExclamationTriangleIcon, ChartPieIcon } from './icons';

interface DashboardProps {
  projects: Project[];
  reports: Report[];
  onSelectProject: (project: Project) => void;
  onNavigateToSites: () => void;
  onNavigateToPendingActions: () => void;
}

// --- CUSTOM TOOLTIP PARA O GRÁFICO DE TENDÊNCIA ---
const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 text-xs">
                <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label}</p>
                {payload.map((entry: any, index: number) => {
                    // Extrai metadados escondidos no payload original
                    const count = entry.payload[`${entry.dataKey}_count`] || 0;
                    return (
                        <div key={index} className="mb-2 last:mb-0">
                            <p className="font-semibold" style={{ color: entry.color }}>{entry.name}</p>
                            <div className="flex justify-between gap-4 text-gray-600">
                                <span>Média: <span className="font-bold text-gray-800">{entry.value}%</span></span>
                                <span>({count} {count === 1 ? 'relatório' : 'relatórios'})</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const TrendChart: React.FC<{ reports: Report[], projects: Project[] }> = ({ reports, projects }) => {
    const trendData = useMemo(() => {
        const dataByMonth: { [month: string]: { [projectId: string]: { sum: number, count: number } } } = {};

        reports.forEach(report => {
            const monthKey = new Date(report.date).toISOString().slice(0, 7); 
            
            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = {};
            }
            if (!dataByMonth[monthKey][report.projectId]) {
                dataByMonth[monthKey][report.projectId] = { sum: 0, count: 0 };
            }
            dataByMonth[monthKey][report.projectId].sum += report.score;
            dataByMonth[monthKey][report.projectId].count += 1;
        });

        const formattedData = Object.keys(dataByMonth).map(monthKey => {
            const monthEntry: any = { 
                month: monthKey,
                displayMonth: new Date(monthKey + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
            };

            projects.forEach(project => {
                const data = dataByMonth[monthKey][project.id];
                if (data) {
                    // Calcula média
                    const avgScore = Math.round(data.sum / data.count);
                    monthEntry[project.name] = avgScore;
                    // Armazena a contagem em uma chave separada para o Tooltip usar
                    monthEntry[`${project.name}_count`] = data.count;
                }
            });
            return monthEntry;
        });
        
        return formattedData.sort((a, b) => a.month.localeCompare(b.month));
    }, [reports, projects]);

    const projectColors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];

    if (trendData.length === 0) {
        return <div className="text-center text-gray-400 py-10 flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-100 rounded-lg">
            <ChartPieIcon className="h-10 w-10 mb-2 opacity-20"/>
            <p>Aguardando dados históricos.</p>
        </div>
    }

    return (
        <div className="relative">
            {/* Legenda de Zonas */}
            <div className="absolute right-0 -top-8 flex gap-3 text-[10px] text-gray-500 font-medium uppercase">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-100 mr-1 border border-red-200"></span>Crítico</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span>Atenção</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-100 mr-1 border border-green-200"></span>Meta</span>
            </div>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    
                    {/* Zonas de Background */}
                    <ReferenceArea y1={0} y2={69} fill="#FEF2F2" fillOpacity={0.5} />
                    <ReferenceArea y1={70} y2={89} fill="#FFFBEB" fillOpacity={0.5} />
                    <ReferenceArea y1={90} y2={100} fill="#ECFDF5" fillOpacity={0.5} />

                    <XAxis 
                        dataKey="displayMonth" 
                        tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 600}} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis 
                        domain={[0, 100]} 
                        tick={{fontSize: 11, fill: '#9CA3AF'}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTrendTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}/>
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                    
                    {projects.map((project, index) => (
                        <Line 
                            key={project.id} 
                            type="monotone" 
                            dataKey={project.name} 
                            stroke={projectColors[index % projectColors.length]} 
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 7, strokeWidth: 0, fill: projectColors[index % projectColors.length] }}
                            connectNulls={true}
                            animationDuration={1500}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ projects, reports, onSelectProject, onNavigateToSites, onNavigateToPendingActions }) => {
  
  const latestReports = useMemo(() => {
      return projects.map(project => {
          const projectReports = reports.filter(r => r.projectId === project.id);
          if (projectReports.length === 0) return null;
          return [...projectReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      }).filter((r): r is Report => r !== null);
  }, [projects, reports]);

  const data = projects.map(project => {
    const lastReport = latestReports.find(r => r.projectId === project.id);
    const score = lastReport ? lastReport.score : 0;
    
    // ATUALIZAÇÃO: Contamos TUDO que é NC, independente de ter plano de ação.
    const pendingActions = lastReport 
        ? lastReport.results.filter(res => res.status === InspectionStatus.NC).length 
        : 0;

    return {
      name: project.name,
      'Pontuação (%)': score,
      pendingActions: pendingActions,
      project, // Guardado para o onClick
    };
  });

  const totalPendingActions = data.reduce((sum, item) => sum + item.pendingActions, 0);

  // Média Geral da Empresa (Baseada nos últimos relatórios)
  const averageCompanyScore = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item['Pontuação (%)'], 0) / data.length)
    : 0;

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

  const handlePieClick = (entry: any) => {
    if (entry.name === 'Não Conforme') {
        onNavigateToPendingActions();
    } else {
        onNavigateToSites();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Painel Executivo</h2>
            <p className="text-sm text-gray-500">Visão consolidada do desempenho ambiental</p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-xs text-gray-400 uppercase font-bold">Nota Média Global</p>
             <p className={`text-3xl font-bold ${averageCompanyScore >= 90 ? 'text-green-600' : averageCompanyScore >= 70 ? 'text-blue-600' : 'text-yellow-600'}`}>
                {averageCompanyScore}%
             </p>
          </div>
      </div>
      
      {/* KPI CARDS INTERATIVOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={onNavigateToSites} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-600"/>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Obras Monitoradas</p>
                    <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
                </div>
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-semibold group-hover:bg-blue-100">Ver Lista</div>
        </div>

        <div onClick={onNavigateToSites} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <DocumentChartBarIcon className="h-8 w-8 text-green-600"/>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Relatórios Emitidos</p>
                    <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
                </div>
            </div>
        </div>

        <div onClick={onNavigateToPendingActions} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg transition-colors ${totalPendingActions > 0 ? 'bg-red-50 group-hover:bg-red-100' : 'bg-gray-50'}`}>
                    <ExclamationTriangleIcon className={`h-8 w-8 ${totalPendingActions > 0 ? 'text-red-600' : 'text-gray-400'}`}/>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Não Conformidades</p>
                    <p className="text-2xl font-bold text-gray-800">{totalPendingActions}</p>
                </div>
            </div>
            {totalPendingActions > 0 && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-semibold group-hover:bg-red-100 animate-pulse">Ver Detalhes</div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BAR CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700">Ranking de Conformidade Atual</h2>
            <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded border">Clique na barra para detalhar</span>
          </div>
          
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                    <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6B7280', fontWeight: 600}} interval={0} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}}/>
                    <Tooltip 
                        cursor={{fill: '#F3F4F6'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#374151', fontWeight: 600 }}
                    />
                    <Bar 
                        dataKey="Pontuação (%)" 
                        radius={[4, 4, 0, 0]} 
                        onClick={(d: any) => onSelectProject(d.project)} 
                        className="cursor-pointer transition-all duration-300 hover:opacity-80"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry['Pontuação (%)'] >= 90 ? '#10B981' : entry['Pontuação (%)'] >= 70 ? '#3B82F6' : '#F59E0B'} />
                        ))}
                        <LabelList 
                            dataKey="Pontuação (%)" 
                            position="top" 
                            formatter={(value: number) => `${value}%`} 
                            style={{ fill: '#6B7280', fontSize: '12px', fontWeight: 'bold' }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Nenhuma obra cadastrada</div>
          )}
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">Aderência aos Processos</h2>
            <div className="flex justify-between items-start">
                 <p className="text-xs text-gray-500 mb-6">Proporção de itens conformes em todas as obras ativas.</p>
                 <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-semibold whitespace-nowrap">Clique na fatia</span>
            </div>
          </div>
          
          {overallStatus.length > 0 ? (
            <div className="relative flex-grow flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                    <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={65} 
                        outerRadius={90} 
                        paddingAngle={5}
                        dataKey="value" 
                        stroke="none"
                        onClick={handlePieClick}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}/>
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                </ResponsiveContainer>
                {/* Score Central */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-15px]">
                    <p className={`text-3xl font-bold ${statusCounts[InspectionStatus.C] > statusCounts[InspectionStatus.NC] ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round((statusCounts[InspectionStatus.C] / (statusCounts[InspectionStatus.C] + statusCounts[InspectionStatus.NC])) * 100 || 0)}%
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Índice Geral</p>
                </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">Sem dados</div>
          )}
        </div>
      </div>
      
      {/* TREND CHART */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
            <div>
                <h2 className="text-lg font-bold text-gray-700">Evolução Histórica (Tendência)</h2>
                <p className="text-xs text-gray-500">Média ponderada mensal das inspeções. Acompanhe se as obras estão melhorando ou piorando ao longo do tempo.</p>
            </div>
            <div className="flex items-center space-x-2 text-xs bg-gray-50 p-2 rounded border">
                <span className="font-semibold text-gray-600">Período:</span>
                <span className="text-gray-500">Últimos 12 Meses</span>
            </div>
          </div>
          <TrendChart reports={reports} projects={projects} />
      </div>
    </div>
  );
};

export default Dashboard;
