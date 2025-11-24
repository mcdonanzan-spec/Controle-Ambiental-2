
export enum InspectionStatus {
  C = 'Conforme',
  NC = 'Não Conforme',
  NA = 'Não Aplicável',
}

export interface Photo {
  id: string;
  dataUrl: string;
}

export interface ActionPlan {
  actions: string;
  responsible: string;
  deadline: string;
  resources: {
    fin: boolean;
    mo: boolean;
    adm: boolean;
  };
}

export interface InspectionItemResult {
  itemId: string;
  status: InspectionStatus | null;
  photos: Photo[];
  comment: string;
  actionPlan?: ActionPlan;
}

export interface Report {
  id: string;
  projectId: string;
  date: string;
  inspector: string;
  status: 'Draft' | 'Completed';
  results: InspectionItemResult[];
  signatures: {
    inspector: string;
    manager: string;
  };
  score: number;
  evaluation: string;
  categoryScores: { [categoryId: string]: number };
}

export interface Project {
  id: string;
  name: string;
  location: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistSubCategory {
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistCategory {
  id: string;
  title: string;
  subCategories: ChecklistSubCategory[];
}

export interface User {
  id: string;
  name: string;
  role: 'Diretoria' | 'Engenheiro';
  projectIds: string[];
}
