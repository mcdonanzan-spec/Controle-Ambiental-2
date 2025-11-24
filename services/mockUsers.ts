
import { User } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Diretoria',
    role: 'Diretoria',
    projectIds: ['proj-1', 'proj-2', 'proj-3'], // Acesso a todos os projetos
  },
  {
    id: 'user-2',
    name: 'Engenheiro - Novara',
    role: 'Engenheiro',
    projectIds: ['proj-1'], // Acesso apenas ao projeto 1
  },
  {
    id: 'user-3',
    name: 'Engenheiro - Vista do Vale',
    role: 'Engenheiro',
    projectIds: ['proj-2'], // Acesso apenas ao projeto 2
  },
];
