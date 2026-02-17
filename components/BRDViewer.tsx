import React from 'react';
import { BRDData } from '../types';
import { FileText, AlertTriangle, Download, Copy, RefreshCw } from 'lucide-react';

interface BRDViewerProps {
  data: BRDData | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

const BRDViewer: React.FC<BRDViewerProps> = ({ data, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-800">Synthesizing Requirements...</h3>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Gemini is analyzing your data sources, filtering noise, and structuring your Business Requirements Document.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-700">No Document Generated Yet</h3>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">
          Add data sources on the left and click "Generate BRD" to start building your documentation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.title}</h1>
          <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={onRefresh}
             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Regenerate"
           >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Copy Text">
            <Copy className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 md:px-16 space-y-8 bg-white">
        
        {/* Conflicts Alert */}
        {data.conflicts && data.conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Potential Conflicts Detected</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 ml-1">
              {data.conflicts.map((conflict, i) => (
                <li key={i}>{conflict}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        {data.sections.map((section) => (
          <section key={section.id} className="group">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-2xl font-bold text-slate-800">{section.title}</h2>
            </div>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
              {section.content.split(/(\[Source ID: [^\]]+\])/g).map((part, idx) => {
                if (part.match(/\[Source ID: [^\]]+\]/)) {
                  return <span key={idx} className="text-blue-600 font-medium text-xs align-super ml-1 cursor-pointer hover:underline" title="Go to source">{part.replace('Source ID: ', '')}</span>;
                }
                return part;
              })}
            </div>
          </section>
        ))}

        <div className="h-16"></div> {/* Bottom padding */}
      </div>
    </div>
  );
};

export default BRDViewer;
