
import React from 'react';
import { Report, Project, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PencilIcon, CameraIcon } from './icons';

interface ReportViewProps {
  report: Report;
  project: Project;
  onBack: () => void;
  onEdit: (report: Report) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, project, onBack, onEdit }) => {
  const getStatusBadge = (status: InspectionStatus | null) => {
    switch (status) {
      case InspectionStatus.C:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Conforme</span>;
      case InspectionStatus.NC:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Não Conforme</span>;
      case InspectionStatus.NA:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">Não Aplicável</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };
  
  const getEvaluationChip = (evaluation: string) => {
    switch (evaluation) {
      case 'ÓTIMO': return 'bg-green-100 text-green-800';
      case 'BOM': return 'bg-blue-100 text-blue-800';
      case 'REGULAR': return 'bg-yellow-100 text-yellow-800';
      case 'RUIM': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-4 border-b pb-4">
        <div>
          <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Project
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Inspection Report</h1>
          <p className="text-gray-600">{project.name} - {new Date(report.date).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Inspector</p>
          <p className="font-semibold text-gray-800">{report.inspector}</p>
          <div className="mt-2">
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${getEvaluationChip(report.evaluation)}`}>
                {report.evaluation} ({report.score}%)
            </span>
          </div>
        </div>
      </div>
      
       {report.status === 'Draft' && (
         <div className="flex justify-end mb-4">
            <button
              onClick={() => onEdit(report)}
              className="flex items-center bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-yellow-600 transition duration-300 text-sm"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Draft
            </button>
         </div>
      )}


      {CHECKLIST_DEFINITIONS.map(category => (
        <div key={category.id} className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 bg-gray-100 p-3 rounded-t-lg">{category.title}</h2>
          {category.subCategories.map(subCat => (
            <div key={subCat.title} className="border border-t-0 rounded-b-lg p-3">
              <h3 className="text-md font-semibold text-gray-600 mb-2">{subCat.title}</h3>
              <ul className="divide-y divide-gray-200">
                {subCat.items.map(item => {
                  const result = report.results.find(r => r.itemId === item.id);
                  if (!result) return null;
                  return (
                    <li key={item.id} className="py-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-800 flex-1 pr-4">{item.text}</p>
                        {getStatusBadge(result.status)}
                      </div>
                      {result.comment && <p className="text-sm text-gray-500 mt-2 pl-4 border-l-2 border-gray-200">"{result.comment}"</p>}
                      {result.photos.length > 0 && (
                        <div className="mt-2 flex items-center flex-wrap gap-2">
                            {result.photos.map(photo => (
                                <img key={photo.id} src={photo.dataUrl} alt="evidence" className="h-24 w-24 object-cover rounded-md border"/>
                            ))}
                        </div>
                      )}
                      {result.status === InspectionStatus.NC && result.actionPlan && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                            <h5 className="font-bold text-red-700">Action Plan</h5>
                            <p><span className="font-semibold">Action:</span> {result.actionPlan.actions}</p>
                            <p><span className="font-semibold">Responsible:</span> {result.actionPlan.responsible}</p>
                            <p><span className="font-semibold">Deadline:</span> {result.actionPlan.deadline}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
      
      <div className="mt-8 pt-4 border-t">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Signatures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Environmental Responsible</p>
            <p className="font-serif text-lg text-gray-800 italic">{report.signatures.inspector || 'Not signed'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Engineering Responsible</p>
            <p className="font-serif text-lg text-gray-800 italic">{report.signatures.manager || 'Not signed'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
