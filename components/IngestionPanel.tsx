import React, { useState } from 'react';
import { DataSource, SourceType } from '../types';
import { Plus, Upload, Mail, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';

interface IngestionPanelProps {
  onAddSource: (source: DataSource) => void;
  sources: DataSource[];
}

const IngestionPanel: React.FC<IngestionPanelProps> = ({ onAddSource, sources }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'connect'>('paste');
  const [inputText, setInputText] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputType, setInputType] = useState<SourceType>(SourceType.MEETING_TRANSCRIPT);

  const handleAdd = () => {
    if (!inputText.trim() || !inputTitle.trim()) return;
    
    const newSource: DataSource = {
      id: Math.random().toString(36).substring(7),
      type: inputType,
      title: inputTitle,
      content: inputText,
      date: new Date().toISOString(),
    };
    
    onAddSource(newSource);
    setInputText('');
    setInputTitle('');
  };

  const getIcon = (type: SourceType) => {
    switch (type) {
      case SourceType.EMAIL: return <Mail className="w-4 h-4" />;
      case SourceType.SLACK_THREAD: return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">Data Sources</h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
          {sources.length} Connected
        </span>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'paste' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Paste Text
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Upload File
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Source Type</label>
              <select 
                value={inputType}
                onChange={(e) => setInputType(e.target.value as SourceType)}
                className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={SourceType.MEETING_TRANSCRIPT}>Meeting Transcript</option>
                <option value={SourceType.EMAIL}>Email Thread</option>
                <option value={SourceType.SLACK_THREAD}>Slack Conversation</option>
                <option value={SourceType.DOCUMENT}>Existing Document</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title / Subject</label>
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="e.g., Kickoff Meeting Notes"
                className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Content</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste the conversation, email body, or transcript here..."
                className="w-full h-40 text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!inputText || !inputTitle}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Source
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">Drag & Drop or Click to Upload</p>
            <p className="text-xs text-slate-400 mt-1">.txt, .md, .pdf (Simulated)</p>
            <input 
              type="file" 
              className="hidden" 
              id="file-upload"
              onChange={(e) => {
                 // Simulated upload handling
                 if (e.target.files?.[0]) {
                   const file = e.target.files[0];
                   const reader = new FileReader();
                   reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      onAddSource({
                        id: Math.random().toString(36).substring(7),
                        type: SourceType.DOCUMENT,
                        title: file.name,
                        content: text,
                        date: new Date().toISOString()
                      });
                      setActiveTab('paste'); // Switch back to view list implicitly via parent logic if needed
                   };
                   reader.readAsText(file);
                 }
              }}
            />
            <label htmlFor="file-upload" className="mt-4 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-sm cursor-pointer hover:bg-slate-50">
              Select File
            </label>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active Sources</h3>
          {sources.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm italic">
              No sources added yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {sources.map(source => (
                <li key={source.id} className="group p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-slate-500">
                      {getIcon(source.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-medium text-slate-800 truncate">{source.title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{source.content.substring(0, 60)}...</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default IngestionPanel;
