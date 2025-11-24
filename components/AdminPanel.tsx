
import React, { useEffect, useState } from 'react';
import { Project, UserProfile } from '../types';
import { createProject, getAllProfiles, updateUserProfile, createUserAccount } from '../services/api';
import { BuildingOfficeIcon, UserCircleIcon, PlusIcon, CheckCircleIcon } from './icons';

interface AdminPanelProps {
    projects: Project[];
    onProjectCreated: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, onProjectCreated }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
    
    // State para Nova Obra
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectLoc, setNewProjectLoc] = useState('');

    // State para Novo Usuário
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPass, setNewUserPass] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState('assistant');
    const [newUserProjects, setNewUserProjects] = useState<string[]>([]);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        const data = await getAllProfiles();
        setProfiles(data);
    };

    // --- Lógica de Projetos ---
    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName || !newProjectLoc) {
            alert("Preencha todos os campos");
            return;
        }
        setLoading(true);
        try {
            const res = await createProject(newProjectName, newProjectLoc);
            if (res) {
                setNewProjectName('');
                setNewProjectLoc('');
                alert('Obra criada com sucesso!');
                onProjectCreated();
            }
        } catch (error: any) {
            console.error("Erro detalhado:", error);
            alert(`Erro ao criar obra: ${error.message || 'Verifique o console.'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica de Usuários ---
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPass || !newUserName) {
            alert("Preencha nome, email e senha.");
            return;
        }
        
        setLoading(true);
        try {
            await createUserAccount({
                email: newUserEmail,
                password: newUserPass,
                name: newUserName,
                role: newUserRole,
                projectIds: newUserProjects
            });
            
            alert(`Usuário ${newUserName} criado com sucesso!`);
            // Limpa formulário
            setNewUserEmail('');
            setNewUserPass('');
            setNewUserName('');
            setNewUserRole('assistant');
            setNewUserProjects([]);
            
            // Recarrega lista
            await loadProfiles();
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao criar usuário: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await updateUserProfile(userId, { role: newRole });
            await loadProfiles();
        } catch (error) {
            alert("Erro ao atualizar perfil.");
        }
    };

    const toggleProjectForNewUser = (projectId: string) => {
        if (newUserProjects.includes(projectId)) {
            setNewUserProjects(newUserProjects.filter(id => id !== projectId));
        } else {
            setNewUserProjects([...newUserProjects, projectId]);
        }
    }

    const handleToggleProjectAccess = async (user: UserProfile, projectId: string) => {
        const currentIds = user.assigned_project_ids || [];
        let newIds: string[];
        if (currentIds.includes(projectId)) {
            newIds = currentIds.filter(id => id !== projectId);
        } else {
            newIds = [...currentIds, projectId];
        }
        try {
            await updateUserProfile(user.id, { assigned_project_ids: newIds });
            await loadProfiles();
        } catch (error) {
            alert("Erro ao atualizar permissões.");
        }
    };

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'admin': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Administrador</span>;
            case 'executive': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">Diretoria</span>;
            case 'manager': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">Engenheiro</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">Assistente</span>;
        }
    }

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
            
            <div className="flex space-x-1 border-b border-gray-200">
                <button 
                    className={`pb-2 px-6 font-semibold transition-colors ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Gestão de Usuários
                </button>
                <button 
                    className={`pb-2 px-6 font-semibold transition-colors ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Gestão de Obras
                </button>
            </div>

            {/* --- ABA OBRAS --- */}
            {activeTab === 'projects' && (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800"><PlusIcon className="h-5 w-5 mr-2"/> Cadastrar Nova Obra</h2>
                        <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome da Obra</label>
                                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: Residencial Flores" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Localização</label>
                                <input type="text" value={newProjectLoc} onChange={e => setNewProjectLoc(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: São Paulo, SP" required />
                            </div>
                            <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium">
                                {loading ? 'Criando...' : 'Criar Obra'}
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {projects.map(p => (
                            <div key={p.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600"/>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ABA USUÁRIOS --- */}
            {activeTab === 'users' && (
                <div className="space-y-8">
                    {/* Formulário de Novo Usuário */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                         <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
                             <PlusIcon className="h-5 w-5 mr-2 text-green-600"/> 
                             Adicionar Novo Usuário
                         </h2>
                         <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                    <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Perfil (Acesso)</label>
                                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                        <option value="assistant">Assistente (Inspetor)</option>
                                        <option value="manager">Engenheiro (Gerente)</option>
                                        <option value="executive">Diretoria (Visualizador Global)</option>
                                        <option value="admin">Administrador (Master)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email (Login)</label>
                                    <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Senha Provisória</label>
                                    <input type="text" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Mínimo 6 caracteres" required />
                                </div>
                            </div>
                            
                            {newUserRole !== 'admin' && newUserRole !== 'executive' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vincular Obras (Acesso)</label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
                                        {projects.length === 0 && <span className="text-gray-400 text-sm">Nenhuma obra cadastrada.</span>}
                                        {projects.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => toggleProjectForNewUser(p.id)}
                                                className={`px-3 py-1 text-sm rounded-full border transition-all ${newUserProjects.includes(p.id) ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {newUserProjects.includes(p.id) && <span className="mr-1">✓</span>}
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading} className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 font-bold shadow-sm disabled:opacity-50">
                                    {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                                </button>
                            </div>
                         </form>
                    </div>

                    {/* Lista de Usuários */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-bold text-gray-700">Equipe Cadastrada ({profiles.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acesso às Obras</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {profiles.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <UserCircleIcon className="h-6 w-6 text-gray-500"/>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.full_name || 'Sem nome'}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select 
                                                    value={user.role} 
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-1"
                                                >
                                                    <option value="assistant">Assistente</option>
                                                    <option value="manager">Engenheiro</option>
                                                    <option value="executive">Diretoria</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.role === 'admin' || user.role === 'executive' ? (
                                                    <span className="text-xs text-gray-500 italic bg-gray-100 px-2 py-1 rounded">Visualização Global Automática</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {projects.map(p => {
                                                            const hasAccess = user.assigned_project_ids?.includes(p.id);
                                                            return (
                                                                <button 
                                                                    key={p.id}
                                                                    onClick={() => handleToggleProjectAccess(user, p.id)}
                                                                    className={`px-2 py-1 text-xs rounded border transition-colors ${hasAccess ? 'bg-green-100 text-green-800 border-green-300 font-semibold' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                                                                >
                                                                    {p.name}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
