
import React, { useState, useEffect } from 'react';
import { Project, Report, UserProfile } from './types';
import { getProjects, getReports, createReportDraft, changeOwnPassword } from './services/api';
import { supabase } from './services/supabaseClient';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import ReportForm from './components/ReportForm';
import ReportView from './components/ReportView';
import PendingActions from './components/PendingActions';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { LogoIcon, BuildingOfficeIcon, ChartPieIcon, ArrowLeftIcon, WrenchScrewdriverIcon, EyeIcon, PencilIcon, KeyIcon, XMarkIcon } from './components/icons';

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
  
  // States para Alteração de Senha
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
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
        let role = data.role;
        if (role === 'administrador') role = 'admin';
        if (role === 'Diretoria') role = 'executive';
        if (role === 'Engenheiro') role = 'manager';
        if (role === 'Assistente') role = 'assistant';
        
        setUserProfile({ ...data, role } as UserProfile);
    }
    refreshData();
    setLoading(false);
  }

  const refreshData = async () => {
     setProjects(await getProjects());
     setReports(await getReports());
  };
  
  // MUDANÇA ARQUITETURAL: Todos veem todos os projetos e relatórios (Transparência)
  // A restrição será apenas na hora de Editar/Criar (Write Permission)
  const allProjects = projects;
  const allReports = reports;

  // Função auxiliar para verificar permissão de ESCRITA
  const canUserEditProject = (projectId: string) => {
      if (!userProfile) return false;
      if (userProfile.role === 'admin') return true; // Admin edita tudo
      if (userProfile.role === 'executive') return false; // Diretoria só vê
      
      // Engenheiros e Assistentes só editam se estiverem vinculados
      return userProfile.assigned_project_ids?.includes(projectId);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setView('SITES_LIST');
  }
  
  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword.length < 6) {
          alert("A senha deve ter no mínimo 6 caracteres.");
          return;
      }
      if (newPassword !== confirmPassword) {
          alert("As senhas não coincidem.");
          return;
      }
      
      setIsChangingPassword(true);
      try {
          await changeOwnPassword(newPassword);
          setToastMessage("Senha alterada com sucesso!");
          setIsChangePasswordOpen(false);
          setNewPassword('');
          setConfirmPassword('');
      } catch (error: any) {
          alert("Erro ao alterar senha: " + error.message);
      } finally {
          setIsChangingPassword(false);
      }
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

  const handleCreateNewReport = async (project: Project) => {
    if (!canUserEditProject(project.id)) {
        alert("Você tem acesso apenas de LEITURA a esta obra.");
        return;
    }
    
    try {
        setLoading(true);
        const newTemplate = await createReportDraft(project.id);
        
        setEditingReport({ ...newTemplate, id: '', score: 0, evaluation: '', categoryScores: {} } as Report);
        
        setSelectedProject(project);
        setInitialCategoryId(undefined);
        setView('REPORT_FORM');
    } catch (error) {
        console.error("Erro ao criar draft", error);
        alert("Erro ao iniciar relatório. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleEditReport = (report: Report) => {
    if (!canUserEditProject(report.projectId)) {
        alert("Você tem acesso apenas de LEITURA a esta obra.");
        return;
    }
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

  const handleSaveReport = async (status: 'Draft' | 'Completed') => {
    await refreshData();
    
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
    if (view === 'MANAGEMENT_DASHBOARD') title = 'Dashboard Gerencial';
    else if (view === 'PENDING_ACTIONS') title = 'Central de Pendências';
    else if (view === 'PROJECT_DASHBOARD' && selectedProject) title = selectedProject.name;
    else if (view === 'REPORT_FORM' || view === 'REPORT_VIEW') title = 'Relatório de Inspeção';
    else if (view === 'ADMIN_PANEL') title = 'Administração';
    
    return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-40 h-16">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('SITES_LIST')}>
        <LogoIcon className="h-10 w-auto flex-shrink-0" />
        <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-xl font-bold text-gray-800 uppercase leading-tight tracking-tight">CONTROLE AMBIENTAL</h1>
            {userProfile && <p className="text-xs text-gray-500 hidden sm:block">Olá, {userProfile.full_name}</p>}
        </div>
      </div>
      <div className="hidden md:block text-md font-semibold text-gray-700 truncate max-w-xs uppercase">
        {title}
      </div>
      <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsChangePasswordOpen(true)}
            className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Alterar Senha"
          >
              <KeyIcon className="h-5 w-5"/>
          </button>
          <button onClick={handleLogout} className="text-sm text-red-600 font-semibold hover:text-red-800 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Sair</button>
      </div>
    </header>
  )};

  const SitesList: React.FC = () => {
    const data = allProjects.map(project => {
      const projectReports = allReports.filter(r => r.projectId === project.id);
      const lastReport = [...projectReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const score = lastReport ? lastReport.score : null;
      const pendingActions = projectReports.flatMap(r => r.results).filter(res => res.status === 'Não Conforme').length;
      const hasWriteAccess = canUserEditProject(project.id);
      
      return { project, score, pendingActions, hasWriteAccess };
    });
    
    const getScoreBorderColor = (score: number | null) => {
        if (score === null) return 'border-gray-300';
        if (score >= 90) return 'border-green-500';
        if (score >= 70) return 'border-blue-500';
        if (score >= 50) return 'border-yellow-500';
        return 'border-red-500';
    }

    if (data.length === 0) {
        return (
            <div className="text-center mt-20 p-8">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
                    <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4"/>
                    <h3 className="text-lg font-bold text-gray-900">Nenhuma obra cadastrada</h3>
                    <p className="mt-2 text-sm text-gray-500">
                         Vá ao menu "Admin" para cadastrar obras.
                    </p>
                </div>
            </div>
        )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {data.map(({ project, score, pendingActions, hasWriteAccess }) => (
          <div key={project.id} onClick={() => handleSelectProject(project)} className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col border-l-4 ${getScoreBorderColor(score)} relative overflow-hidden group`}>
            {/* Indicador de Permissão */}
            <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold uppercase rounded-bl-lg shadow-sm z-10 ${hasWriteAccess ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {hasWriteAccess ? (
                    <span className="flex items-center"><PencilIcon className="h-3 w-3 mr-1"/> Editor</span>
                ) : (
                    <span className="flex items-center"><EyeIcon className="h-3 w-3 mr-1"/> Leitor</span>
                )}
            </div>

            <div className="p-5 flex-grow">
              <h3 className="font-bold text-lg text-gray-800 pr-16">{project.name}</h3>
              <p className="text-sm text-gray-500">{project.location}</p>
            </div>
            <div className="bg-gray-50 px-5 py-3 rounded-b-lg flex justify-between items-center text-sm border-t border-gray-100">
                <div>
                    <span className="font-semibold text-gray-700">Pontuação: </span>
                    <span className={`font-bold ${score !== null && score < 70 ? 'text-red-600' : 'text-gray-900'}`}>{score !== null ? `${score}%` : 'N/A'}</span>
                </div>
                <div className={`${pendingActions > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    <span className="font-semibold">{pendingActions}</span>
                    <span> Não Conformidades</span>
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
        const isReadOnlyProject = !canUserEditProject(selectedProject.id);
        return (
          <ProjectDashboard
            project={selectedProject}
            reports={allReports.filter(r => r.projectId === selectedProject.id)}
            onViewReport={handleViewReport}
            onNewReport={() => handleCreateNewReport(selectedProject)}
            onEditReportCategory={handleEditReportCategory}
            onBack={navigateToSitesList}
            readOnly={isReadOnlyProject}
          />
        );
      case 'REPORT_FORM':
        if (!selectedProject) return null;
        if (userProfile?.role === 'executive' && editingReport) {
            return <ReportView report={editingReport} project={selectedProject} onBack={() => setView('PROJECT_DASHBOARD')} onEdit={() => {}} readOnly={true} />
        }
        
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
        
        const isReadOnlyView = !canUserEditProject(projectForReport.id);

        return (
          <ReportView
            report={selectedReport}
            project={projectForReport}
            onBack={() => setView('PROJECT_DASHBOARD')}
            onEdit={handleEditReport}
            readOnly={isReadOnlyView}
          />
        );
      case 'MANAGEMENT_DASHBOARD':
        return <Dashboard projects={projects} reports={reports} onSelectProject={handleSelectProject} onNavigateToSites={navigateToSitesList} onNavigateToPendingActions={handleNavigateToPendingActions} />;
      case 'PENDING_ACTIONS':
        return <PendingActions projects={projects} reports={reports} onNavigateToReportItem={handleEditReportCategory} onBack={() => setView('MANAGEMENT_DASHBOARD')}/>;
      case 'ADMIN_PANEL':
        if (userProfile?.role !== 'admin') return <SitesList />;
        return <AdminPanel projects={projects} onProjectCreated={refreshData} />;
      case 'SITES_LIST':
      default:
        return <SitesList />;
    }
  };
  
  const BottomNav: React.FC = () => {
    if (!userProfile) return null;

    const navItems: { view: View; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; roles: string[] }[] = [
      { view: 'SITES_LIST', label: 'Obras', icon: BuildingOfficeIcon, roles: ['admin', 'executive', 'manager', 'assistant'] },
      { view: 'MANAGEMENT_DASHBOARD', label: 'Gerencial', icon: ChartPieIcon, roles: ['admin', 'executive', 'manager', 'assistant'] }, // Liberado para todos verem o global
      { view: 'ADMIN_PANEL', label: 'Admin', icon: WrenchScrewdriverIcon, roles: ['admin'] },
    ];
    
    const availableNavItems = navItems.filter(item => {
        return item.roles.includes(userProfile.role);
    });

    if (availableNavItems.length <= 1) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-around items-center z-50 h-16 border-t border-gray-200">
          {availableNavItems.map(item => {
            const isActive = view === item.view || (item.view === 'SITES_LIST' && ['PROJECT_DASHBOARD', 'REPORT_FORM', 'REPORT_VIEW'].includes(view));
            return (
              <button key={item.label} onClick={() => setView(item.view)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}>
                <item.icon className="h-6 w-6 mb-1"/>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
    );
  }

  if (loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Carregando...</p>
      </div>
  );
  
  if (!session || !userProfile) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toast message={toastMessage} onClear={() => setToastMessage('')} />
      <Header />
      <main className="p-4 md:p-8 pb-24 max-w-7xl mx-auto">
        {renderContent()}
      </main>
      <BottomNav/>
      
      {/* MODAL DE ALTERAÇÃO DE SENHA */}
      {isChangePasswordOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                          <KeyIcon className="h-5 w-5 mr-2 text-blue-600"/>
                          Alterar Minha Senha
                      </h3>
                      <button onClick={() => setIsChangePasswordOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <XMarkIcon className="h-6 w-6"/>
                      </button>
                  </div>
                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                          <input 
                              type="password" 
                              value={newPassword} 
                              onChange={e => setNewPassword(e.target.value)}
                              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Mínimo 6 caracteres"
                              required 
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                          <input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)}
                              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Repita a nova senha"
                              required 
                          />
                      </div>
                      <div className="pt-2 flex justify-end space-x-3">
                          <button 
                              type="button" 
                              onClick={() => setIsChangePasswordOpen(false)} 
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit" 
                              disabled={isChangingPassword} 
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold disabled:opacity-50"
                          >
                              {isChangingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
