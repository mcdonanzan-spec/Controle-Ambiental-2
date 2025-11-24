
import React, { useState, useEffect } from 'react';
import { Project, Report, UserProfile } from './types';
import { getProjects, getReports } from './services/api'; // Usando API real
import { supabase } from './services/supabaseClient';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import ReportForm from './components/ReportForm';
import ReportView from './components/ReportView';
import PendingActions from './components/PendingActions';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { LogoIcon, BuildingOfficeIcon, ChartPieIcon, ArrowLeftIcon, WrenchScrewdriverIcon } from './components/icons';

type View = 'SITES_LIST' | 'PROJECT_DASHBOARD' | 'REPORT_FORM' | 'REPORT_VIEW' | 'MANAGEMENT_DASHBOARD' | 'PENDING_ACTIONS' | 'ADMIN_PANEL';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<View>('SITES_LIST');
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        setUserProfile(data as UserProfile);
    }
    refreshData();
    setLoading(false);
  }

  const refreshData = async () => {
     setProjects(await getProjects());
     setReports(await getReports());
  };
  
  // Controle de Permissões
  const filteredProjects = projects.filter(p => {
      if (!userProfile) return false;
      if (userProfile.role === 'admin') return true; // Diretoria vê tudo
      return userProfile.assigned_project_ids?.includes(p.id);
  });

  const filteredReports = reports.filter(r => {
      if (!userProfile) return false;
      const projectForReport = projects.find(p => p.id === r.projectId);
      if (!projectForReport) return false;
      
      if (userProfile.role === 'admin') return true;
      return userProfile.assigned_project_ids?.includes(projectForReport.id);
  });

  const handleLogout = async () => {
      await supabase.auth.signOut();
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setView('PROJECT_DASHBOARD');
  };
  
  const handleNavigateToPendingActions = () => {
    setView('PENDING_ACTIONS');
  }

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setView('REPORT_VIEW');
  };

  const handleCreateNewReport = (project: Project) => {
    setEditingReport(null);
    setSelectedProject(project);
    setInitialCategoryId(undefined);
    setView('REPORT_FORM');
  };
  
  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setSelectedProject(projects.find(p => p.id === report.projectId) || null);
    setInitialCategoryId(undefined);
    setView('REPORT_FORM');
  }
  
  const handleEditReportCategory = (report: Report, categoryId: string) => {
    setEditingReport(report);
    setSelectedProject(projects.find(p => p.id === report.projectId) || null);
    setInitialCategoryId(categoryId);
    setView('REPORT_FORM');
  }

  const handleSaveReport = (status: 'Draft' | 'Completed') => {
    refreshData();
    if (status === 'Draft') {
        setToastMessage('Rascunho salvo com sucesso!');
    } else {
        setToastMessage('Relatório concluído e enviado!');
    }
    if (selectedProject) {
      setView('PROJECT_DASHBOARD');
    } else {
      setView('SITES_LIST');
    }
  };

  const navigateToSitesList = () => {
    setSelectedProject(null);
    setSelectedReport(null);
    setView('SITES_LIST');
  };
  
  const Header: React.FC = () => {
    let title = 'Painel de Obras';
    if (view === 'MANAGEMENT_DASHBOARD') title = 'Dashboard Diretoria';
    else if (view === 'PENDING_ACTIONS') title = 'Central de Pendências';
    else if (view === 'PROJECT_DASHBOARD' && selectedProject) title = selectedProject.name;
    else if (view === 'REPORT_FORM' || view === 'REPORT_VIEW') title = 'Relatório de Inspeção';
    else if (view === 'ADMIN_PANEL') title = 'Administração';
    
    return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('SITES_LIST')}>
        <LogoIcon className="h-10 w-auto" />
        <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-800">Controle Ambiental</h1>
            {userProfile && <p className="text-xs text-gray-500">Olá, {userProfile.full_name} ({userProfile.role})</p>}
        </div>
      </div>
      <div className="hidden md:block text-md font-semibold text-gray-700">
        {title}
      </div>
      <button onClick={handleLogout} className="text-sm text-red-600 font-semibold hover:text-red-800">Sair</button>
    </header>
  )};

  const SitesList: React.FC = () => {
    const data = filteredProjects.map(project => {
      const projectReports = filteredReports.filter(r => r.projectId === project.id);
      const lastReport = projectReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const score = lastReport ? lastReport.score : null;
      const pendingActions = projectReports.flatMap(r => r.results).filter(res => res.status === 'Não Conforme' && (!res.actionPlan || !res.actionPlan.actions)).length;
      return { project, score, pendingActions };
    });
    
    const getScoreBorderColor = (score: number | null) => {
        if (score === null) return 'border-gray-300';
        if (score >= 90) return 'border-green-500';
        if (score >= 70) return 'border-blue-500';
        if (score >= 50) return 'border-yellow-500';
        return 'border-red-500';
    }

    if (data.length === 0 && userProfile?.role !== 'admin') {
        return (
            <div className="text-center mt-20">
                <h3 className="text-lg font-medium text-gray-900">Nenhuma obra vinculada</h3>
                <p className="mt-1 text-sm text-gray-500">Solicite acesso ao administrador.</p>
            </div>
        )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(({ project, score, pendingActions }) => (
          <div key={project.id} onClick={() => handleSelectProject(project)} className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col border-l-4 ${getScoreBorderColor(score)}`}>
            <div className="p-5 flex-grow">
              <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
              <p className="text-sm text-gray-500">{project.location}</p>
            </div>
            <div className="bg-gray-50 px-5 py-3 rounded-b-lg flex justify-between items-center text-sm">
                <div>
                    <span className="font-semibold text-gray-700">Pontuação: </span>
                    <span className="font-bold">{score !== null ? `${score}%` : 'N/A'}</span>
                </div>
                <div className={`${pendingActions > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    <span className="font-semibold">{pendingActions}</span>
                    <span> pendências</span>
                </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    switch (view) {
      case 'PROJECT_DASHBOARD':
        if (!selectedProject) return null;
        return (
          <ProjectDashboard
            project={selectedProject}
            reports={filteredReports.filter(r => r.projectId === selectedProject.id)}
            onViewReport={handleViewReport}
            onNewReport={() => handleCreateNewReport(selectedProject)}
            onEditReportCategory={handleEditReportCategory}
            onBack={navigateToSitesList}
          />
        );
      case 'REPORT_FORM':
        if (!selectedProject) return null;
        return (
          <ReportForm
            project={selectedProject}
            existingReport={editingReport}
            userProfile={userProfile!}
            onSave={handleSaveReport}
            onCancel={() => selectedProject ? setView('PROJECT_DASHBOARD') : navigateToSitesList()}
            initialCategoryId={initialCategoryId}
          />
        );
      case 'REPORT_VIEW':
        if (!selectedReport) return null;
        const projectForReport = projects.find(p => p.id === selectedReport.projectId);
        if (!projectForReport) return null;
        return (
          <ReportView
            report={selectedReport}
            project={projectForReport}
            onBack={() => setView('PROJECT_DASHBOARD')}
            onEdit={handleEditReport}
          />
        );
      case 'MANAGEMENT_DASHBOARD':
        return <Dashboard projects={projects} reports={reports} onSelectProject={handleSelectProject} onNavigateToSites={navigateToSitesList} onNavigateToPendingActions={handleNavigateToPendingActions} />;
      case 'PENDING_ACTIONS':
        return <PendingActions projects={projects} reports={reports} onNavigateToReportItem={handleEditReportCategory} onBack={() => setView('MANAGEMENT_DASHBOARD')}/>;
      case 'ADMIN_PANEL':
        return <AdminPanel projects={projects} onProjectCreated={refreshData} />;
      case 'SITES_LIST':
      default:
        return <SitesList />;
    }
  };
  
  const BottomNav: React.FC = () => {
    if (!userProfile) return null;

    const navItems: { view: View; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; roles: UserProfile['role'][] }[] = [
      { view: 'SITES_LIST', label: 'Obras', icon: BuildingOfficeIcon, roles: ['admin', 'manager', 'assistant', 'viewer'] },
      { view: 'MANAGEMENT_DASHBOARD', label: 'KPIs', icon: ChartPieIcon, roles: ['admin'] },
      { view: 'ADMIN_PANEL', label: 'Admin', icon: WrenchScrewdriverIcon, roles: ['admin'] },
    ];
    
    const availableNavItems = navItems.filter(item => item.roles.includes(userProfile.role));

    if (availableNavItems.length <= 1) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around items-center z-50 h-16">
          {availableNavItems.map(item => {
            const isActive = view === item.view || (item.view === 'SITES_LIST' && ['PROJECT_DASHBOARD', 'REPORT_FORM', 'REPORT_VIEW'].includes(view));
            return (
              <button key={item.label} onClick={() => setView(item.view)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
                <item.icon className="h-6 w-6 mb-1"/>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!session || !userProfile) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toast message={toastMessage} onClear={() => setToastMessage('')} />
      <Header />
      <main className="p-4 md:p-8 pb-24">
        {renderContent()}
      </main>
      <BottomNav/>
    </div>
  );
};

export default App;
