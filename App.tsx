import React, { useState } from 'react';
import { DataSource, BRDData, ChatMessage, Project } from './types';
import IngestionPanel from './components/IngestionPanel';
import BRDViewer from './components/BRDViewer';
import ChatInterface from './components/ChatInterface';
import { geminiService } from './services/geminiService';
import { Layout, FilePlus, Settings, BookOpen, Layers } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [sources, setSources] = useState<DataSource[]>([]);
  const [generatedBRD, setGeneratedBRD] = useState<BRDData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'dashboard'>('editor');

  // Handlers
  const handleAddSource = (source: DataSource) => {
    setSources(prev => [...prev, source]);
  };

  const handleGenerateBRD = async () => {
    if (sources.length === 0) return;
    
    setIsGenerating(true);
    try {
      const brd = await geminiService.generateBRD(sources, "New Project");
      setGeneratedBRD(brd);
      
      // Add initial system message to chat
      setChatMessages([{
        id: 'init',
        role: 'system',
        content: `I've generated the BRD based on ${sources.length} sources. You can review it now. If you need changes, just ask me!`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
      alert("Failed to generate BRD. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatProcessing(true);

    try {
      if (generatedBRD) {
        // Decide if it's an edit request or a Q&A. 
        // For simplicity, we assume if it contains "change", "update", "add", "remove", it's an edit.
        const lowerMsg = message.toLowerCase();
        const isEdit = lowerMsg.includes('change') || lowerMsg.includes('update') || lowerMsg.includes('add') || lowerMsg.includes('remove') || lowerMsg.includes('rewrite');

        if (isEdit) {
           const updatedBRD = await geminiService.refineBRD(generatedBRD, message, sources);
           setGeneratedBRD(updatedBRD);
           const botMsg: ChatMessage = {
             id: (Date.now() + 1).toString(),
             role: 'model',
             content: "I've updated the document as requested.",
             timestamp: Date.now()
           };
           setChatMessages(prev => [...prev, botMsg]);
        } else {
           // Q&A
           const response = await geminiService.chatAboutProject(message, JSON.stringify(generatedBRD));
           const botMsg: ChatMessage = {
             id: (Date.now() + 1).toString(),
             role: 'model',
             content: response,
             timestamp: Date.now()
           };
           setChatMessages(prev => [...prev, botMsg]);
        }
      } else {
         const botMsg: ChatMessage = {
             id: (Date.now() + 1).toString(),
             role: 'model',
             content: "Please generate a BRD first by adding sources and clicking the Generate button.",
             timestamp: Date.now()
           };
           setChatMessages(prev => [...prev, botMsg]);
      }
    } catch (error) {
      console.error(error);
       const botMsg: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         content: "Sorry, I encountered an error processing your request.",
         timestamp: Date.now()
       };
       setChatMessages(prev => [...prev, botMsg]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/50">
            A
          </div>
          <span className="font-semibold text-white hidden md:block tracking-wide">AutoBRD</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
          >
            <Layers className="w-5 h-5" />
            <span className="hidden md:block text-sm font-medium">Dashboard</span>
          </button>
           <button 
            onClick={() => setActiveView('editor')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeView === 'editor' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
          >
            <FilePlus className="w-5 h-5" />
            <span className="hidden md:block text-sm font-medium">Current Project</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-800">
             <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400">
              <BookOpen className="w-5 h-5" />
              <span className="hidden md:block text-sm font-medium">Templates</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400">
              <Settings className="w-5 h-5" />
              <span className="hidden md:block text-sm font-medium">Settings</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">JD</div>
             <div className="hidden md:block overflow-hidden">
               <p className="text-sm font-medium text-white truncate">John Doe</p>
               <p className="text-xs text-slate-500 truncate">Senior BA</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeView === 'dashboard' ? (
           <div className="flex-1 p-8 overflow-y-auto">
             <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div onClick={() => setActiveView('editor')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group">
                 <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                   <FilePlus className="w-6 h-6" />
                 </div>
                 <h3 className="text-lg font-semibold text-slate-800">Create New BRD</h3>
                 <p className="text-slate-500 text-sm mt-2">Start a new project by importing emails, meetings, and documents.</p>
               </div>
               
               {/* Mock Projects */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-60">
                 <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                     <Layers className="w-6 h-6" />
                   </div>
                   <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Completed</span>
                 </div>
                 <h3 className="text-lg font-semibold text-slate-800">CRM Migration</h3>
                 <p className="text-slate-500 text-sm mt-2">Generated 2 days ago • 14 pages</p>
               </div>
             </div>
           </div>
        ) : (
          <div className="flex-1 flex gap-4 p-4 h-full w-full">
            {/* Left Column: Sources & Chat */}
            <div className="w-1/3 min-w-[320px] max-w-md flex flex-col gap-4 h-full">
              <div className="h-1/2 min-h-[300px]">
                <IngestionPanel onAddSource={handleAddSource} sources={sources} />
              </div>
              <div className="flex-1 min-h-[300px]">
                <ChatInterface 
                  messages={chatMessages} 
                  onSendMessage={handleChatMessage} 
                  isProcessing={isChatProcessing}
                />
              </div>
            </div>

            {/* Right Column: Editor/Viewer */}
            <div className="flex-1 h-full relative">
               {!generatedBRD && !isGenerating && sources.length > 0 && (
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                    <button 
                      onClick={handleGenerateBRD}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 text-lg font-semibold transition-all hover:-translate-y-1 flex items-center gap-2"
                    >
                      <Layout className="w-5 h-5" /> Generate BRD
                    </button>
                    <p className="mt-4 text-slate-500 text-sm bg-white/80 px-4 py-2 rounded-lg backdrop-blur-sm">
                      Ready to synthesize {sources.length} sources
                    </p>
                 </div>
               )}
              <BRDViewer 
                data={generatedBRD} 
                isLoading={isGenerating} 
                onRefresh={handleGenerateBRD} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
