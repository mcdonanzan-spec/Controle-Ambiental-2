
import React, { useEffect, useState } from 'react';
import { Project, UserProfile } from '../types';
import { createProject, updateProject, deleteProject, getAllProfiles, updateUserProfile, deleteUserCompletely, createUserAccount } from '../services/api';
import { BuildingOfficeIcon, UserCircleIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, DocumentCheckIcon, ExclamationTriangleIcon } from './icons';

interface AdminPanelProps {
    projects: Project[];
    onProjectCreated: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, onProjectCreated }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
    
    // State para Nova/Edição de Obra
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectLoc, setProjectLoc] = useState('');

    // State para Novo/Edição de Usuário
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [userPass, setUserPass] = useState('');
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('assistant');
    const [userProjects, setUserProjects] = useState<string[]>([]);
    const [showUserModal, setShowUserModal] = useState(false);
    
    // State para Modal de Sucesso (Credenciais)
    const [createdCredentials, setCreatedCredentials] = useState<{name: string, email: string, pass: string} | null>(null);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        const data = await getAllProfiles();
        setProfiles(data);
    };

    // --- Lógica de Obras ---

    const handleEditProject = (p: Project) => {
        setEditingProject(p);
        setProjectName(p.name);
        setProjectLoc(p.location);
    };

    const handleCancelEditProject = () => {
        setEditingProject(null);
        setProjectName('');
        setProjectLoc('');
    };

    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName || !projectLoc) {
            alert("Preencha todos os campos");
            return;
        }
        setLoading(true);
        try {
            if (editingProject) {
                await updateProject(editingProject.id, { name: projectName, location: projectLoc });
                alert('Obra atualizada com sucesso!');
            } else {
                await createProject(projectName, projectLoc);
                alert('Obra criada com sucesso!');
            }
            handleCancelEditProject();
            onProjectCreated();
        } catch (error: any) {
            console.error("Erro:", error);
            alert(`Erro ao salvar obra: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir a obra "${name}"?\n\nEssa ação só será permitida se NÃO houver relatórios vinculados.`)) {
            return;
        }
        
        setLoading(true);
        try {
            await deleteProject(id);
            alert('Obra excluída com sucesso.');
            onProjectCreated();
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica de Usuários ---

    const openUserModal = (user?: UserProfile) => {
        if (user) {
            setEditingUser(user);
            setUserName(user.full_name);
            setUserEmail(user.email);
            setUserRole(user.role);
            setUserProjects(user.assigned_project_ids || []);
            setUserPass(''); 
        } else {
            setEditingUser(null);
            setUserName('');
            setUserEmail('');
            setUserRole('assistant');
            setUserProjects([]);
            setUserPass('');
        }
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setEditingUser(null);
    };
    
    const closeCredentialsModal = () => {
        setCreatedCredentials(null);
    }

    const toggleProjectForUser = (projectId: string) => {
        setUserProjects(prev => {
            if (prev.includes(projectId)) return prev.filter(id => id !== projectId);
            return [...prev, projectId];
        });
    };
    
    const copyCredentials = () => {
        if (!createdCredentials) return;
        const text = `
ACESSO CONTROLE AMBIENTAL
-------------------------
Olá, ${createdCredentials.name}!
Seu acesso ao sistema foi criado.

Link: ${window.location.origin}
Email: ${createdCredentials.email}
Senha Provisória: ${createdCredentials.pass}

Por favor, acesse e realize suas inspeções.
        `.trim();
        
        navigator.clipboard.writeText(text);
        alert("Credenciais copiadas! Cole no WhatsApp ou E-mail.");
    }

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName) {
            alert("O nome é obrigatório.");
            return;
        }
        
        setLoading(true);
        try {
            if (editingUser) {
                // Atualizar
                await updateUserProfile(editingUser.id, {
                    full_name: userName,
                    role: userRole,
                    assigned_project_ids: userProjects
                });
                alert(`Usuário ${userName} atualizado com sucesso!`);
                closeUserModal();
            } else {
                // Criar
                if (!userEmail || !userPass) {
                    alert("Email e Senha são obrigatórios para cadastro.");
                    setLoading(false);
                    return;
                }
                if (userPass.length < 6) {
                    alert("A senha deve ter no mínimo 6 caracteres.");
                    setLoading(false);
                    return;
                }

                await createUserAccount({
                    email: userEmail,
                    password: userPass,
                    name: userName,
                    role: userRole,
                    projectIds: userProjects
                });
                // SUCESSO NA CRIAÇÃO: Mostra Modal de Credenciais
                setCreatedCredentials({
                    name: userName,
                    email: userEmail,
                    pass: userPass
                });
                closeUserModal(); // Fecha o form, mas abre o modal de credenciais logo em seguida pelo render
            }
            await loadProfiles();
        } catch (error: any) {
            console.error(error);
            alert(`ATENÇÃO: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user: UserProfile) => {
        if (!window.confirm(`Tem certeza que deseja excluir DEFINITIVAMENTE o usuário ${user.full_name}?\n\nIsso apagará o Login e o Perfil de acesso.`)) return;
        
        setLoading(true);
        try {
            // Agora usamos a função que apaga tudo (Login + Perfil)
            await deleteUserCompletely(user.email);
            alert("Usuário e credenciais removidos com sucesso.");
            await loadProfiles();
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao excluir: ${error.message}`);
        } finally {
            setLoading(false);
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
                <div className="space-y-8">
                    {/* Formulário (Card Superior) */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                            {editingProject ? <PencilIcon className="h-5 w-5 mr-2 text-blue-600"/> : <PlusIcon className="h-5 w-5 mr-2 text-green-600"/>}
                            {editingProject ? 'Editar Obra' : 'Cadastrar Nova Obra'}
                        </h2>
                        <form onSubmit={handleSaveProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome da Obra</label>
                                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value.toUpperCase())} className="mt-1 block w-full p-2 border border-gray-300 rounded-md uppercase" placeholder="EX: RESIDENCIAL FLORES" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Localização</label>
                                <input type="text" value={projectLoc} onChange={e => setProjectLoc(e.target.value.toUpperCase())} className="mt-1 block w-full p-2 border border-gray-300 rounded-md uppercase" placeholder="EX: SÃO PAULO, SP" required />
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" disabled={loading} className={`flex-1 p-2 rounded-md font-medium text-white shadow-sm ${editingProject ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                    {loading ? 'Salvando...' : (editingProject ? 'Atualizar' : 'Criar')}
                                </button>
                                {editingProject && (
                                    <button type="button" onClick={handleCancelEditProject} className="p-2 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300">
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Lista de Obras */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(p => (
                            <div key={p.id} className="p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <BuildingOfficeIcon className="h-6 w-6 text-blue-600"/>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button onClick={() => handleEditProject(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDeleteProject(p.id, p.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ABA USUÁRIOS --- */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                     <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                         <div className="flex items-center text-sm text-blue-800">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-blue-600"/>
                            <span>Dica: Agora você pode excluir usuários completamente (Login + Perfil) clicando na lixeira.</span>
                         </div>
                        <button onClick={() => openUserModal()} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 font-bold">
                            <PlusIcon className="h-5 w-5 mr-2" /> Novo Usuário
                        </button>
                     </div>

                    {/* Tabela de Usuários */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Equipe Cadastrada ({profiles.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acesso</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {user.role === 'admin' && 'Administrador'}
                                                {user.role === 'executive' && 'Diretoria'}
                                                {user.role === 'manager' && 'Engenheiro'}
                                                {user.role === 'assistant' && 'Assistente'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.role === 'admin' || user.role === 'executive' ? (
                                                    <span className="text-xs text-gray-500 italic bg-gray-100 px-2 py-1 rounded">Acesso Global</span>
                                                ) : (
                                                    <span className="text-xs text-gray-600 border px-2 py-1 rounded-full bg-blue-50 border-blue-100">
                                                        {user.assigned_project_ids?.length || 0} Obras Vinculadas
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openUserModal(user)} className="text-blue-600 hover:text-blue-900 mr-3" title="Editar">
                                                    <PencilIcon className="h-5 w-5 inline"/>
                                                </button>
                                                <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900" title="Excluir Definitivamente">
                                                    <TrashIcon className="h-5 w-5 inline"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* MODAL DE CREDENCIAIS CRIADAS (Novo) */}
            {createdCredentials && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 animate-fade-in border-t-4 border-green-500">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <CheckIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Usuário Criado!</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                As credenciais foram geradas. Copie os dados abaixo e envie para o novo usuário.
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-200 mb-6 font-mono text-sm relative group">
                                <div className="space-y-2">
                                    <p><span className="text-gray-400 select-none">Link:</span> <span className="text-blue-600 break-all">{window.location.origin}</span></p>
                                    <p><span className="text-gray-400 select-none">User:</span> <span className="text-gray-800 font-bold">{createdCredentials.email}</span></p>
                                    <p><span className="text-gray-400 select-none">Pass:</span> <span className="text-gray-800 font-bold">{createdCredentials.pass}</span></p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={copyCredentials} 
                                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none shadow-sm"
                                >
                                    <DocumentCheckIcon className="h-5 w-5 mr-2"/>
                                    Copiar Acesso para Área de Transferência
                                </button>
                                <button 
                                    onClick={closeCredentialsModal} 
                                    className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE USUÁRIO (Formulário) */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={closeUserModal} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                    <input type="text" value={userName} onChange={e => setUserName(e.target.value.toUpperCase())} className="mt-1 block w-full p-2 border border-gray-300 rounded-md uppercase" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Perfil (Acesso)</label>
                                    <select value={userRole} onChange={e => setUserRole(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                        <option value="assistant">Assistente (Inspetor)</option>
                                        <option value="manager">Engenheiro (Gerente)</option>
                                        <option value="executive">Diretoria (Visualizador Global)</option>
                                        <option value="admin">Administrador (Master)</option>
                                    </select>
                                </div>
                                
                                {!editingUser && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email (Login)</label>
                                            <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Senha Provisória</label>
                                            <input type="text" value={userPass} onChange={e => setUserPass(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Mínimo 6 caracteres" required />
                                        </div>
                                    </>
                                )}
                                {editingUser && (
                                     <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-yellow-700">
                                        Nota: Para alterar email ou senha, utilize o painel de redefinição de senha ou a autenticação do Supabase. Aqui alteramos apenas o perfil e permissões.
                                     </div>
                                )}
                            </div>

                            {/* SELEÇÃO DE OBRAS - Checkbox List */}
                            {userRole !== 'admin' && userRole !== 'executive' && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vincular Acesso às Obras</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                                        <div className="flex justify-between mb-2 text-xs text-blue-600">
                                            <button type="button" onClick={() => setUserProjects(projects.map(p => p.id))} className="hover:underline">Selecionar Todas</button>
                                            <button type="button" onClick={() => setUserProjects([])} className="hover:underline">Limpar Seleção</button>
                                        </div>
                                        
                                        {projects.length === 0 && <p className="text-gray-500 text-sm">Nenhuma obra cadastrada no sistema.</p>}

                                        <div className="space-y-2">
                                            {projects.map(p => {
                                                const isSelected = userProjects.includes(p.id);
                                                return (
                                                    <label key={p.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                            {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                                                            <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleProjectForUser(p.id)} />
                                                        </div>
                                                        <div>
                                                            <span className={`block text-sm ${isSelected ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{p.name}</span>
                                                            <span className="text-xs text-gray-400">{p.location}</span>
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">O usuário só verá as obras marcadas acima.</p>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end space-x-3 border-t mt-4">
                                <button type="button" onClick={closeUserModal} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-sm disabled:opacity-50">
                                    {loading ? 'Salvando...' : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
