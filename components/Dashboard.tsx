
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line, ReferenceArea } from 'recharts';
import { Project, Report, InspectionStatus } from '../types';
import { BuildingOfficeIcon, DocumentChartBarIcon, ExclamationTriangleIcon, ChartPieIcon, FunnelIcon, ClockIcon } from './icons';

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
            const refDate = report.inspectionDate || report.date;
            const monthKey = refDate.substring(0, 7); 
            
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
            const [year, month] = monthKey.split('-').map(Number);
            const dateObj = new Date(year, month - 1, 2);
            
            const monthEntry: any = { 
                month: monthKey,
                displayMonth: dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
            };

            projects.forEach(project => {
                const data = dataByMonth[monthKey][project.id];
                if (data) {
                    const avgScore = Math.round(data.sum / data.count);
                    monthEntry[project.name] = avgScore;
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
            <div className="absolute right-0 -top-8 flex gap-3 text-[10px] text-gray-500 font-medium uppercase">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-100 mr-1 border border-red-200"></span>Crítico</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span>Atenção</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-100 mr-1 border border-green-200"></span>Meta</span>
            </div>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <ReferenceArea y1={0} y2={69} fill="#FEF2F2" fillOpacity={0.5} />
                    <ReferenceArea y1={70} y2={89} fill="#FFFBEB" fillOpacity={0.5} />
                    <ReferenceArea y1={90} y2={100} fill="#ECFDF5" fillOpacity={0.5} />
                    <XAxis dataKey="displayMonth" tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis domain={[0, 100]} tick={{fontSize: 11, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('latest');

  // 1. Identificar Meses Disponíveis
  const availableMonths = useMemo(() => {
      const months = new Set<string>();
      reports.forEach(r => {
          const refDate = r.inspectionDate || r.date;
          if (refDate && refDate.length >= 7) {
            months.add(refDate.substring(0, 7)); 
          }
      });
      return Array.from(months).sort().reverse();
  }, [reports]);

  // 2. Processamento dos Dados (Núcleo da Correção)
  const dashboardData = useMemo(() => {
      return projects.map(project => {
          // Filtra relatórios da obra
          const projectReports = reports.filter(r => r.projectId === project.id);
          
          let targetReports: Report[] = [];

          if (selectedPeriod === 'latest') {
             // Lógica: Apenas o MAIS RECENTE
             const sorted = [...projectReports].sort((a, b) => {
                 const dateA = a.inspectionDate || a.date;
                 const dateB = b.inspectionDate || b.date;
                 return dateB.localeCompare(dateA);
             });
             if (sorted.length > 0) targetReports = [sorted[0]];
          } else {
             // Lógica: TODOS do mês (Média)
             targetReports = projectReports.filter(r => {
                 const refDate = r.inspectionDate || r.date;
                 return refDate.substring(0, 7) === selectedPeriod;
             });
          }

          if (targetReports.length === 0) return null;

          // CÁLCULOS AGREGADOS
          const reportsCount = targetReports.length;
          
          // Média de Nota
          const sumScore = targetReports.reduce((acc, r) => acc + r.score, 0);
          const avgScore = Math.round(sumScore / reportsCount);

          // Total de NCs (Soma, pois é acumulativo no período)
          const totalNCs = targetReports.reduce((acc, r) => {
              const ncsInReport = r.results.filter(res => res.status === InspectionStatus.NC).length;
              return acc + ncsInReport;
          }, 0);

          // Contagem de Itens Conform/Não Conforme (Para Gráfico de Pizza Global)
          const itemsC = targetReports.reduce((acc, r) => acc + r.results.filter(i => i.status === InspectionStatus.C).length, 0);
          const itemsNC = targetReports.reduce((acc, r) => acc + r.results.filter(i => i.status === InspectionStatus.NC).length, 0);

          return {
              name: project.name,
              project: project,
              score: avgScore, // Média ou Nota Única
              pendingActions: totalNCs,
              reportCount: reportsCount,
              itemsC,
              itemsNC
          };

      }).filter(item => item !== null);
  }, [projects, reports, selectedPeriod]);

  // 3. Totais Globais para os Cards
  const totalProjectsWithData = dashboardData.length;
  
  const totalPendingActions = dashboardData.reduce((sum, item) => sum + item.pendingActions, 0);
  
  // Média Geral da Empresa (Média das médias das obras)
  const averageCompanyScore = totalProjectsWithData > 0 
    ? Math.round(dashboardData.reduce((sum, item) => sum + item.score, 0) / totalProjectsWithData)
    : 0;

  // 4. Dados para o Gráfico de Pizza (Agregado de todas as obras filtradas)
  const totalItemsC = dashboardData.reduce((sum, item) => sum + item.itemsC, 0);
  const totalItemsNC = dashboardData.reduce((sum, item) => sum + item.itemsNC, 0);

  const pieData = [
    { name: 'Conforme', value: totalItemsC },
    { name: 'Não Conforme', value: totalItemsNC },
  ];
  
  const COLORS = ['#10B981', '#EF4444'];

  const handlePieClick = (entry: any) => {
    if (entry.name === 'Não Conforme') {
        onNavigateToPendingActions();
    } else {
        onNavigateToSites();
    }
  };

  const formatMonth = (isoMonth: string) => {
      const [year, month] = isoMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 2);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  }

  // Preparar dados para o BarChart (Mapeamento simples)
  const barChartData = dashboardData.map(d => ({
      name: d.name,
      'Pontuação (%)': d.score,
      project: d.project,
      reportCount: d.reportCount
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-10 print:bg-white">
      
      {/* HEADER + SELETOR DE PERÍODO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-4 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Painel Executivo</h2>
            <p className="text-sm text-gray-500">Visão consolidada do desempenho ambiental</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end gap-4 w-full md:w-auto">
             <div className="flex flex-col items-end gap-2 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                    <FunnelIcon className="h-3 w-3 mr-1"/> Período de Análise
                </label>
                <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-64 p-2.5 shadow-sm font-medium"
                >
                    <option value="latest">📌 VISÃO ATUAL (Última Inspeção)</option>
                    <option disabled>──────────</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{formatMonth(month)}</option>
                    ))}
                </select>
             </div>
             <button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-900 text-white p-2.5 rounded-lg shadow transition-colors" title="Exportar PDF">
                 <DocumentChartBarIcon className="h-5 w-5"/>
             </button>
          </div>
      </div>
      
      {/* BANNER DE MODO HISTÓRICO */}
      {selectedPeriod !== 'latest' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm flex items-start animate-fade-in no-print">
              <ClockIcon className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0"/>
              <div>
                  <h3 className="text-sm font-bold text-yellow-800 uppercase">Modo de Análise Consolidada</h3>
                  <p className="text-sm text-yellow-700">
                      Visualizando média de desempenho de <strong>{formatMonth(selectedPeriod)}</strong>. 
                      Os valores representam a média de todas as inspeções realizadas neste mês.
                  </p>
              </div>
              <button 
                onClick={() => setSelectedPeriod('latest')}
                className="ml-auto text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 rounded font-bold"
              >
                  VOLTAR PARA HOJE
              </button>
          </div>
      )}
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 page-break-inside-avoid">
        <div onClick={() => onNavigateToSites()} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between transition-all group cursor-pointer hover:shadow-md">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors print:bg-blue-50">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-600"/>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Obras com Dados</p>
                    <p className="text-2xl font-bold text-gray-800">{totalProjectsWithData} <span className="text-xs text-gray-400 font-normal">/ {projects.length}</span></p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-50 rounded-lg transition-colors print:bg-green-50">
                    <DocumentChartBarIcon className="h-8 w-8 text-green-600"/>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Nota Média {selectedPeriod !== 'latest' && '(Mensal)'}</p>
                    <p className={`text-2xl font-bold ${averageCompanyScore >= 90 ? 'text-green-600' : averageCompanyScore >= 70 ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {averageCompanyScore}%
                    </p>
                </div>
            </div>
        </div>

        <div onClick={onNavigateToPendingActions} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between transition-all group cursor-pointer hover:shadow-md">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg transition-colors ${totalPendingActions > 0 ? 'bg-red-50 group-hover:bg-red-100' : 'bg-gray-50'}`}>
                    <ExclamationTriangleIcon className={`h-8 w-8 ${totalPendingActions > 0 ? 'text-red-600' : 'text-gray-400'}`}/>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">NCs no Período</p>
                    <p className="text-2xl font-bold text-gray-800">{totalPendingActions}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 page-break-inside-avoid">
        {/* BAR CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-700">Ranking de Desempenho {selectedPeriod !== 'latest' && <span className="text-yellow-600">(Média do Mês)</span>}</h2>
            <p className="text-xs text-gray-500 mt-1 no-print">Comparativo entre obras baseado no período selecionado.</p>
          </div>
          
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                    <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6B7280', fontWeight: 600}} interval={0} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}}/>
                    <Tooltip 
                        cursor={{fill: '#F3F4F6'}} 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-3 rounded shadow-lg border border-gray-100 text-xs">
                                        <p className="font-bold mb-1">{data.name}</p>
                                        <p>Nota: <strong>{data['Pontuação (%)']}%</strong></p>
                                        <p className="text-gray-500">Baseado em {data.reportCount} relatório(s)</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar 
                        dataKey="Pontuação (%)" 
                        radius={[4, 4, 0, 0]} 
                        onClick={(d: any) => onSelectProject(d.project)} 
                        className="cursor-pointer hover:opacity-80 transition-all duration-300"
                    >
                        {barChartData.map((entry, index) => (
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
            <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                <p>Nenhum dado encontrado para este período.</p>
            </div>
          )}
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">Aderência aos Processos</h2>
            <div className="flex justify-between items-start">
                 <p className="text-xs text-gray-500 mb-6">Proporção total de itens verificados no período.</p>
            </div>
          </div>
          
          {(totalItemsC + totalItemsNC) > 0 ? (
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
                    <p className={`text-3xl font-bold ${totalItemsC > totalItemsNC ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round((totalItemsC / (totalItemsC + totalItemsNC)) * 100 || 0)}%
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Índice Geral</p>
                </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">Sem dados</div>
          )}
        </div>
      </div>
      
      {/* TREND CHART - Sempre mostra o histórico completo para contexto */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 page-break-inside-avoid">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
            <div>
                <h2 className="text-lg font-bold text-gray-700">Evolução Histórica (Tendência)</h2>
                <p className="text-xs text-gray-500">Média ponderada mensal das inspeções. Acompanhe se as obras estão melhorando ou piorando ao longo do tempo.</p>
            </div>
          </div>
          <TrendChart reports={reports} projects={projects} />
      </div>
    </div>
  );
};

export default Dashboard;
