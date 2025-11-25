
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line, TooltipProps } from 'recharts';
import { Project, Report, InspectionStatus } from '../types';
import { BuildingOfficeIcon, DocumentChartBarIcon, ExclamationTriangleIcon } from './icons';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

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

        reports.forEach(report => {
            const month = new Date(report.date).toISOString().slice(0, 7); // YYYY-MM
            if (!dataByMonth[month]) {
                dataByMonth[month] = {};
            }
            if (!dataByMonth[month][report.projectId]) {
                dataByMonth[month][report.projectId] = [];
            }
            dataByMonth[month][report.projectId].push(report.score);
        });

        const formattedData = Object.keys(dataByMonth).sort().map(month => {
            const monthEntry: { month: string, [projectName: string]: number | string } = { month };
            projects.forEach(project => {
                const scores = dataByMonth[month][project.id];
                if (scores && scores.length > 0) {
                    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                    monthEntry[project.name] = Math.round(avgScore);
                }
            });
            return monthEntry;
        });
        
        return formattedData;
    }, [reports, projects]);

    const projectColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (trendData.length < 2) {
        return <div className="text-center text-gray-500 py-10">Dados insuficientes para exibir tendência. (Mínimo de 2 meses com relatórios)</div>
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {projects.map((project, index) => (
                     <Line key={project.id} type="monotone" dataKey={project.name} stroke={projectColors[index % projectColors.length]} strokeWidth={2} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ projects, reports, onSelectProject, onNavigateToSites, onNavigateToPendingActions }) => {
  const data = projects.map(project => {
    const projectReports = reports.filter(r => r.projectId === project.id);
    // FIX: Usa spread operator [...projectReports] para evitar crash por mutação de estado
    const lastReport = [...projectReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const score = lastReport ? lastReport.score : 0;
    const pendingActions = projectReports.flatMap(r => r.results).filter(res => res.status === InspectionStatus.NC && (!res.actionPlan || !res.actionPlan.actions)).length;
    return {
      name: project.name,
      'Pontuação (%)': score,
      pendingActions: pendingActions,
      project,
    };
  });

  const totalPendingActions = data.reduce((sum, item) => sum + item.pendingActions, 0);

  const overallStatus = reports.flatMap(r => r.results)
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
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Painel Gerencial</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={onNavigateToSites} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow">
            <BuildingOfficeIcon className="h-10 w-10 text-blue-500"/>
            <div>
                <p className="text-sm text-gray-500">Total de Obras</p>
                <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
            </div>
        </div>
        <div onClick={onNavigateToSites} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow">
            <DocumentChartBarIcon className="h-10 w-10 text-green-500"/>
            <div>
                <p className="text-sm text-gray-500">Relatórios Enviados</p>
                <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
            </div>
        </div>
        <div onClick={onNavigateToPendingActions} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-500"/>
            <div>
                <p className="text-sm text-gray-500">Ações Pendentes</p>
                <p className="text-2xl font-bold text-gray-800">{totalPendingActions}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Pontuação de Conformidade por Obra</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* FIX: Explicitly type `d` as `any` to work around a type inference issue with recharts, allowing access to the custom `project` property from the data payload. */}
              <Bar dataKey="Pontuação (%)" fill="#3B82F6" onClick={(d: any) => onSelectProject(d.project)} className="cursor-pointer">
                 <LabelList 
                    dataKey="Pontuação (%)" 
                    position="top" 
                    formatter={(value: number) => `${value}%`} 
                    style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                 />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Status Geral dos Itens</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]}/>
               <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tendência de Conformidade Mensal</h2>
          <TrendChart reports={reports} projects={projects} />
      </div>
    </div>
  );
};

export default Dashboard;
