
import React, { useEffect, useState } from 'react';
import { Project, UserProfile } from '../types';
import { createProject, getAllProfiles, updateUserProfile } from '../services/api';
import { BuildingOfficeIcon, UserCircleIcon, PlusIcon } from './icons';

interface AdminPanelProps {
    projects: Project[];
    onProjectCreated: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, onProjectCreated }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectLoc, setNewProjectLoc] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        const data = await getAllProfiles();
        setProfiles(data);
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await createProject(newProjectName, newProjectLoc);
        if (res) {
            setNewProjectName('');
            setNewProjectLoc('');
            alert('Obra criada com sucesso!');
            onProjectCreated();
        }
        setLoading(false);
    };

    const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
        await updateUserProfile(userId, { role: newRole });
        loadProfiles();
    };

    const handleToggleProjectAccess = async (user: UserProfile, projectId: string) => {
        const currentIds = user.assigned_project_ids || [];
        let newIds: string[];
        if (currentIds.includes(projectId)) {
            newIds = currentIds.filter(id => id !== projectId);
        } else {
            newIds = [...currentIds, projectId];
        }
        await updateUserProfile(user.id, { assigned_project_ids: newIds });
        loadProfiles();
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Administração</h1>
            
            <div className="flex space-x-4 border-b">
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Usuários
                </button>
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Obras
                </button>
            </div>

            {activeTab === 'projects' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><PlusIcon className="h-5 w-5 mr-2"/> Cadastrar Nova Obra</h2>
                    <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome da Obra</label>
                            <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Localização (Cidade/UF)</label>
                            <input type="text" value={newProjectLoc} onChange={e => setNewProjectLoc(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Criando...' : 'Criar Obra'}
                        </button>
                    </form>

                    <h3 className="text-lg font-bold mt-8 mb-4">Obras Existentes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {projects.map(p => (
                            <div key={p.id} className="p-4 border rounded-lg bg-gray-50 flex items-center space-x-3">
                                <BuildingOfficeIcon className="h-6 w-6 text-gray-400"/>
                                <div>
                                    <p className="font-bold">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acesso a Obras</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {profiles.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <UserCircleIcon className="h-6 w-6 text-gray-500"/>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="assistant">Assistente (Padrão)</option>
                                            <option value="manager">Engenheiro</option>
                                            <option value="viewer">Visualizador</option>
                                            <option value="admin">Diretoria (Admin)</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {projects.map(p => {
                                                const hasAccess = user.assigned_project_ids?.includes(p.id);
                                                return (
                                                    <button 
                                                        key={p.id}
                                                        onClick={() => handleToggleProjectAccess(user, p.id)}
                                                        className={`px-2 py-1 text-xs rounded-full border ${hasAccess ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                                    >
                                                        {p.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
