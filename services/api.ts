
import { supabase } from './supabaseClient';
import { Project, Report, UserProfile, InspectionItemResult, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';

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
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, location }]) // ID é gerado automaticamente se a tabela estiver configurada corretamente, ou add um UUID aqui
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao criar obra:', error);
    return null;
  }
  return data;
}

// --- Reports ---
export const getReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase.from('reports').select('*');
  if (error) {
    console.error('Erro ao buscar relatórios:', error);
    return [];
  }
  
  // Mapear do formato do banco (snake_case e jsonb) para o formato da aplicação
  return (data || []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    date: row.created_at, // ou um campo 'date' específico se tiver
    inspector: row.content.inspector,
    status: row.content.status,
    results: row.content.results,
    signatures: row.content.signatures,
    score: row.content.score,
    evaluation: row.content.evaluation,
    categoryScores: row.content.categoryScores
  }));
};

// Função auxiliar de cálculo (mesma lógica do mock)
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
  const { score, evaluation, categoryScores } = calculateScores(reportData.results);
  const fullContent = { ...reportData, score, evaluation, categoryScores };
  
  // Preparar objeto para salvar no banco
  // Se já tem ID, atualizamos. Se não, criamos.
  
  if (reportData.id) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        content: fullContent,
        // project_id: reportData.projectId // Geralmente não muda
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
        project_id: reportData.projectId,
        content: fullContent
      }])
      .select()
      .single();

      if (error) throw error;
      return { ...fullContent, id: data.id };
  }
};

export const getNewReportTemplate = (projectId: string): Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> => {
  const allItems = CHECKLIST_DEFINITIONS.flatMap(cat => cat.subCategories.flatMap(sub => sub.items));
  
  const results: InspectionItemResult[] = allItems.map(item => ({
    itemId: item.id,
    status: null,
    photos: [],
    comment: '',
    actionPlan: {
      actions: '',
      responsible: '',
      deadline: '',
      resources: { fin: false, mo: false, adm: false }
    }
  }));

  return {
    projectId,
    date: new Date().toISOString().split('T')[0],
    inspector: '', 
    status: 'Draft',
    results,
    signatures: {
      inspector: '',
      manager: '',
    }
  };
};

// --- Storage (Fotos) ---
export const uploadPhoto = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

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
