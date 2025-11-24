import { Project, Report, InspectionItemResult, InspectionStatus, ChecklistCategory } from '../types';
import { MOCK_PROJECTS, CHECKLIST_DEFINITIONS } from '../constants';

const PROJECTS_KEY = 'env_inspection_projects';
const REPORTS_KEY = 'env_inspection_reports';

const initializeData = () => {
  if (!localStorage.getItem(PROJECTS_KEY)) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(MOCK_PROJECTS));
  }
  if (!localStorage.getItem(REPORTS_KEY)) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify([]));
  }
};

initializeData();

export const getProjects = (): Project[] => {
  const projects = localStorage.getItem(PROJECTS_KEY);
  return projects ? JSON.parse(projects) : [];
};

export const getReports = (): Report[] => {
  const reports = localStorage.getItem(REPORTS_KEY);
  return reports ? JSON.parse(reports) : [];
};

const calculateScores = (results: InspectionItemResult[]) => {
    const categoryScores: { [categoryId: string]: number } = {};
    let totalScore = 0;
    let scoredCategories = 0;

    CHECKLIST_DEFINITIONS.forEach(category => {
        const categoryItemIds = category.subCategories.flatMap(sc => sc.items.map(i => i.id));
        const categoryResults = results.filter(r => categoryItemIds.includes(r.itemId));
        
        // Items not marked as 'NA' are considered applicable. Unanswered items (status: null) are included and treated as non-compliant.
        const applicableResults = categoryResults.filter(r => r.status !== InspectionStatus.NA);
        const compliantResults = applicableResults.filter(r => r.status === InspectionStatus.C);

        // If a category has no applicable items (e.g., all are 'NA'), it's 100% compliant.
        if (applicableResults.length === 0) {
            categoryScores[category.id] = 100;
        } else {
            // Score is the ratio of compliant items to all applicable items.
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


export const saveReport = (reportData: Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & { id?: string }): Report => {
  const reports = getReports();
  const { score, evaluation, categoryScores } = calculateScores(reportData.results);
  
  let newReport: Report;
  const fullReportData = { ...reportData, score, evaluation, categoryScores };

  if (reportData.id) {
    // Update existing report
    const index = reports.findIndex(r => r.id === reportData.id);
    if (index !== -1) {
      newReport = { ...reports[index], ...fullReportData };
      reports[index] = newReport;
    } else {
      // If not found, create new one
      const id = `report-${new Date().getTime()}`;
      newReport = { ...fullReportData, id };
      reports.push(newReport);
    }
  } else {
    // Create new report
    const id = `report-${new Date().getTime()}`;
    newReport = { ...fullReportData, id };
    reports.push(newReport);
  }

  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport;
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
    inspector: 'Gediel da Silva', // Mock user
    status: 'Draft',
    results,
    signatures: {
      inspector: '',
      manager: 'Albert Alvino', // Mock user
    }
  };
};