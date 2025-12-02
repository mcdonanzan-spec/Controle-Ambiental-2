
import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Project, Report, UserProfile, InspectionItemResult, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';

// Função auxiliar para gerar UUID compatível
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Projects ---
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error('Erro ao buscar obras:', error);
    return [];
  }
  return data || [];
};

export const createProject = async (name: string, location: string): Promise<Project | null> => {
  const id = generateUUID();
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{ id, name, location }]) 
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao criar obra:', error);
    throw error;
  }
  return data;
}

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    const { error } = await supabase.from('projects').update(updates).eq('id', id);
    if (error) throw error;
}

export const deleteProject = async (id: string): Promise<void> => {
    // 1. Verificação de Integridade: Checar se existem relatórios para esta obra
    const { count, error: checkError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

    if (checkError) throw checkError;

    if (count && count > 0) {
        throw new Error(`Não é possível excluir esta obra pois existem ${count} relatórios vinculados a ela. Para manter o histórico, a exclusão é bloqueada.`);
    }

    // 2. Se não houver relatórios, prosseguir com a exclusão
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
}

// --- Reports ---
export const getReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase.from('reports').select('*');
  if (error) {
    console.error('Erro ao buscar relatórios:', error);
    return [];
  }
  
  return (data || []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    date: row.created_at,
    inspectionDate: row.content.inspectionDate || row.created_at, // Fallback para compatibilidade
    closedDate: row.content.closedDate,
    inspector: row.content.inspector,
    status: row.content.status,
    results: row.content.results,
    signatures: row.content.signatures,
    score: row.content.score,
    evaluation: row.content.evaluation,
    categoryScores: row.content.categoryScores
  }));
};

const calculateScores = (results: InspectionItemResult[]) => {
    const categoryScores: { [categoryId: string]: number } = {};
    let totalScore = 0;
    let scoredCategories = 0;

    CHECKLIST_DEFINITIONS.forEach(category => {
        const categoryItemIds = category.subCategories.flatMap(sc => sc.items.map(i => i.id));
        const categoryResults = results.filter(r => categoryItemIds.includes(r.itemId));
        
        const applicableResults = categoryResults.filter(r => r.status !== InspectionStatus.NA);
        const compliantResults = applicableResults.filter(r => r.status === InspectionStatus.C);

        if (applicableResults.length === 0) {
            categoryScores[category.id] = 100;
        } else {
            const score = (compliantResults.length / applicableResults.length) * 100;
            categoryScores[category.id] = Math.round(score);
        }
        totalScore += categoryScores[category.id];
        scoredCategories++;
    });
    
    const overallScore = scoredCategories > 0 ? Math.round(totalScore / scoredCategories) : 100;

    let evaluation = 'RUIM';
    if (overallScore >= 90) evaluation = 'ÓTIMO';
    else if (overallScore >= 70) evaluation = 'BOM';
    else if (overallScore >= 50) evaluation = 'REGULAR';
    
    return { score: overallScore, evaluation, categoryScores };
}

export const saveReport = async (reportData: Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & { id?: string }): Promise<Report | null> => {
  // Gera um ID se não existir
  if (!reportData.id) {
     reportData.id = generateUUID();
  }

  const { score, evaluation, categoryScores } = calculateScores(reportData.results);
  
  // Se estiver concluindo agora, grava a data de fechamento
  if (reportData.status === 'Completed' && !reportData.closedDate) {
      reportData.closedDate = new Date().toISOString();
  }

  const fullContent = { ...reportData, score, evaluation, categoryScores };
  
  // Verifica se o relatório já existe no banco
  const { data: existing } = await supabase.from('reports').select('id').eq('id', reportData.id).single();

  if (existing) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        content: fullContent,
        // Opcional: Atualizar created_at se quisermos que reflita a última edição, mas geralmente created_at é imutável no SQL
      })
      .eq('id', reportData.id)
      .select()
      .single();

      if (error) throw error;
      return { ...fullContent, id: data.id };
  } else {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        id: reportData.id,
        project_id: reportData.projectId,
        content: fullContent
      }])
      .select()
      .single();

      if (error) throw error;
      return { ...fullContent, id: data.id };
  }
};

export const createReportDraft = async (projectId: string): Promise<Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'>> => {
  const allItems = CHECKLIST_DEFINITIONS.flatMap(cat => cat.subCategories.flatMap(sub => sub.items));
  
  // 1. Buscar o último relatório desta obra para verificar pendências
  let previousReport: Report | null = null;
  const { data: reportsData } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

  if (reportsData && reportsData.length > 0) {
      const r = reportsData[0];
      previousReport = {
          id: r.id,
          projectId: r.project_id,
          date: r.created_at,
          ...r.content
      } as Report;
  }

  const results: InspectionItemResult[] = allItems.map(item => {
    let preFilledComment = '';
    let preFilledActionPlan = {
        actions: '',
        responsible: '',
        deadline: '',
        resources: { fin: false, mo: false, adm: false }
    };
    
    if (previousReport) {
        const prevResult = previousReport.results.find(res => res.itemId === item.id);
        if (prevResult && prevResult.status === InspectionStatus.NC) {
            const cleanComment = prevResult.comment.replace(/⚠️ PENDÊNCIA ANTERIOR.*?: /g, '').trim();
            // Usa a data de inspeção anterior se disponível, senão a data do sistema
            const prevDate = previousReport.inspectionDate || previousReport.date;
            preFilledComment = `⚠️ PENDÊNCIA ANTERIOR (${new Date(prevDate).toLocaleDateString()}): ${cleanComment || 'Sem observações'}`;
            
            if (prevResult.actionPlan) {
                preFilledActionPlan = { ...prevResult.actionPlan };
            }
        }
    }

    return {
        itemId: item.id,
        status: null, 
        photos: [],
        comment: preFilledComment,
        actionPlan: preFilledActionPlan
    };
  });

  return {
    projectId,
    date: new Date().toISOString(), // Data de criação do sistema
    inspectionDate: new Date().toISOString().split('T')[0], // Data da Vistoria (Default Hoje)
    inspector: '', 
    status: 'Draft',
    results,
    signatures: {
      inspector: '',
      manager: '',
    }
  };
};

export const getNewReportTemplate = (projectId: string) => {
    throw new Error("Use createReportDraft instead");
}

// --- Storage (Fotos) ---
export const uploadPhoto = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  
  // Sanitizar nome do arquivo para evitar caracteres especiais
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = `${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('inspection-photos')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Erro upload foto:', uploadError);
    return null;
  }

  const { data } = supabase.storage.from('inspection-photos').getPublicUrl(filePath);
  return data.publicUrl;
};

// --- Users (Admin) ---
export const getAllProfiles = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    return data as UserProfile[];
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
}

// SUPER FUNÇÃO: Deletar usuário totalmente (Login + Perfil)
export const deleteUserCompletely = async (email: string): Promise<void> => {
    // Chama a função RPC (Remote Procedure Call) que criamos no banco
    const { error } = await supabase.rpc('delete_user_by_email', { email_input: email });
    
    if (error) {
        console.error("Erro ao deletar usuário via RPC:", error);
        throw new Error("Falha ao excluir usuário. Verifique se o Script SQL de permissões foi rodado no Supabase.");
    }
}

export const deleteUserProfile = async (userId: string): Promise<void> => {
    // Mantido para compatibilidade, mas o ideal é usar deleteUserCompletely
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
}

export const createUserAccount = async (userData: {email: string, password: string, name: string, role: string, projectIds: string[]}) => {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    // Cliente isolado para criação de Auth
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false, 
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storage: {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
            }
        }
    });

    let userId = '';

    // 1. Tentar criar o usuário no Auth
    const { data, error } = await tempClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
            data: {
                full_name: userData.name
            }
        }
    });

    if (error) {
        // Lógica de "Auto-Cura": Se o usuário já existe no Auth, tentamos apenas recriar o perfil.
        // O erro comum é "User already registered"
        if (error.message.includes('already registered')) {
             console.warn("Usuário já existe no Auth, tentando recuperar/recriar perfil...");
             // Tenta fazer login com a senha fornecida para pegar o ID (já que signUp falhou)
             const { data: loginData, error: loginError } = await tempClient.auth.signInWithPassword({
                 email: userData.email,
                 password: userData.password
             });
             
             if (loginError) {
                 throw new Error("Este e-mail já existe com outra senha. Exclua-o completamente usando a Lixeira antes de recriar.");
             }
             
             if (loginData.user) {
                 userId = loginData.user.id;
             }
        } else {
            throw error;
        }
    } else if (data.user) {
        userId = data.user.id;
    }

    if (!userId) throw new Error("Falha crítica ao obter ID do usuário.");

    // Aguarda propagação
    await new Promise(r => setTimeout(r, 1000));

    // 2. Criar ou Atualizar (Upsert) o perfil
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: userData.email,
            full_name: userData.name,
            role: userData.role,
            assigned_project_ids: userData.projectIds
        }, { onConflict: 'id' });

    if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
        // Mensagem amigável para erro de RLS
        if (profileError.message.includes('row-level security')) {
            throw new Error("ERRO DE PERMISSÃO: Você precisa rodar o SCRIPT SQL de atualização no Supabase para liberar o cadastro.");
        }
        throw new Error(`Falha no Perfil: ${profileError.message}`);
    }

    return { email: userData.email, password: userData.password };
}

// --- Auth ---
export const changeOwnPassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}
