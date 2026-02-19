
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import PaperCard from './components/PaperCard';
import { Paper, Workspace, ChatMessage, Notification, User } from './types';
import { ICONS } from './constants';
import { searchPapersAI, chatWithWorkspace, summarizeDocument, executeLabTool, chatWithBrainy } from './services/geminiService';

const MOCK_USER: User = {
  id: 'u1',
  name: 'Dr. Sarah Miller',
  email: 's.miller@researchhub.ai',
  avatar: 'https://picsum.photos/seed/researcher99/200/200',
  role: 'Senior Scientist'
};

const INITIAL_PAPERS = [
  { id: 'p1', title: 'Attention Is All You Need', authors: ['Vaswani', 'Shazeer', 'Parmar'], year: 2017, abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...', citations: 125000, url: '', tags: ['transformer', 'nlp'], addedAt: new Date('2024-01-01').toISOString() },
  { id: 'p2', title: 'ImageNet Classification with Deep CNNs', authors: ['Krizhevsky', 'Sutskever', 'Hinton'], year: 2012, abstract: 'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images...', citations: 110000, url: '', tags: ['cv', 'cnn'], addedAt: new Date('2024-01-05').toISOString() },
];

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState<boolean>(() => localStorage.getItem('rh_auth') === 'true');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('rh_theme') !== 'light'); 
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [papers, setPapers] = useState<Paper[]>(() => {
    const saved = localStorage.getItem('rh_papers');
    return saved ? JSON.parse(saved) : INITIAL_PAPERS;
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('rh_workspaces');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Neural Networks', description: 'Deep learning and architecture research', paperIds: ['p1', 'p2'], createdAt: '2023-10-01', color: 'bg-indigo-500' },
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<Paper>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
  const [labToolResult, setLabToolResult] = useState<string | null>(null);
  const [isLabLoading, setIsLabLoading] = useState(false);
  
  // Brainy Chatbot State
  const [isBrainyOpen, setIsBrainyOpen] = useState(false);
  const [brainyInput, setBrainyInput] = useState('');
  const [brainyMessages, setBrainyMessages] = useState<ChatMessage[]>([]);
  const [isBrainyTyping, setIsBrainyTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const brainyEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Workspace Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => { localStorage.setItem('rh_papers', JSON.stringify(papers)); }, [papers]);
  useEffect(() => { localStorage.setItem('rh_workspaces', JSON.stringify(workspaces)); }, [workspaces]);
  useEffect(() => { 
    localStorage.setItem('rh_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => { brainyEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [brainyMessages, isBrainyOpen]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuth(true);
    localStorage.setItem('rh_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuth(false);
    localStorage.removeItem('rh_auth');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchPapersAI(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const importPaper = (p: Partial<Paper>) => {
    const exists = papers.find(existing => existing.title === p.title);
    if (exists) return;

    const newPaper: Paper = {
      ...p,
      id: `p-${Math.random().toString(36).substr(2, 5)}`,
      addedAt: new Date().toISOString(),
      citations: p.citations || 0,
      tags: p.tags || [],
    } as Paper;
    setPapers(prev => [newPaper, ...prev]);
  };

  const handleFileIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsIngesting(true);
    const fileName = file.name.replace('.pdf', '');
    const title = fileName.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    const summaryData = await summarizeDocument(title);

    const newPaper: Paper = {
      id: `p-${Math.random().toString(36).substr(2, 5)}`,
      title,
      authors: ['Uploaded Asset'],
      year: new Date().getFullYear(),
      abstract: summaryData?.executiveSummary || "Document ingested and indexed for workspace analysis.",
      journal: "Personal Repository",
      citations: 0,
      url: "",
      tags: ["uploaded", "private"],
      addedAt: new Date().toISOString(),
      analysis: summaryData
    } as any;

    setPapers(prev => [newPaper, ...prev]);
    setIsIngesting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setActiveAnalysis({ paper: newPaper, summary: summaryData || { keyFindings: ["No structured summary generated."] } });
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleRunLabTool = async (toolTitle: string) => {
    setIsLabLoading(true);
    setLabToolResult(null);
    const result = await executeLabTool(toolTitle, papers);
    setLabToolResult(result);
    setIsLabLoading(false);
  };

  const handleBrainyChat = async () => {
    if (!brainyInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: brainyInput, timestamp: new Date().toLocaleTimeString() };
    setBrainyMessages(prev => [...prev, userMsg]);
    setBrainyInput('');
    setIsBrainyTyping(true);

    const response = await chatWithBrainy(brainyInput, papers, brainyMessages.map(m => ({ role: m.role, content: m.content })));
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date().toLocaleTimeString() };
    setBrainyMessages(prev => [...prev, botMsg]);
    setIsBrainyTyping(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsBotTyping(true);

    let contextPapers: Paper[] = papers;
    if (activeTab.startsWith('ws-')) {
      const wsId = activeTab.split('-')[1];
      const ws = workspaces.find(w => w.id === wsId);
      contextPapers = papers.filter(p => ws?.paperIds.includes(p.id));
    }

    const response = await chatWithWorkspace(chatInput, contextPapers, chatMessages.map(m => ({role: m.role, content: m.content})));
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, botMsg]);
    setIsBotTyping(false);
  };

  const pageVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    enter: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] } 
    },
    exit: { 
      opacity: 0, 
      y: -15, 
      transition: { duration: 0.3, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] } 
    }
  };

  if (!isAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 overflow-hidden ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="absolute top-8 right-8 z-50">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:scale-110 active:scale-90 shadow-xl">
             {isDarkMode ? '☀️' : '🌙'}
           </button>
        </div>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`relative w-full max-w-lg p-12 rounded-[3.5rem] border shadow-2xl ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-3xl`}>
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <span className="text-white font-black text-5xl">R</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-3">ResearchHub AI</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Professional Research Ecosystem</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required className="w-full px-6 py-5 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold" placeholder="sarah.m@mit.edu" />
            <input type="password" required className="w-full px-6 py-5 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold" placeholder="••••••••" />
            <button className="w-full py-6 bg-indigo-600 text-white font-black rounded-[1.5rem] transition-all active:scale-[0.98] shadow-2xl">Authorize & Enter</button>
          </form>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch(true) {
      case activeTab === 'dashboard':
        return (
          <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Archived Papers" value={papers.length} trend="+4 new" icon={<ICONS.DocSpace />} color="indigo" isDarkMode={isDarkMode} />
              <StatCard label="Live Spaces" value={workspaces.length} trend="Active" icon={<ICONS.Workspace />} color="purple" isDarkMode={isDarkMode} />
              <StatCard label="Agent Cycles" value="1.2k" trend="High Vol" icon={<ICONS.Bot />} color="emerald" isDarkMode={isDarkMode} />
              <StatCard label="System Integrity" value="99.9%" trend="Optimal" icon={<ICONS.AITools />} color="blue" isDarkMode={isDarkMode} />
            </div>
            <section>
              <h2 className={`text-4xl font-black tracking-tight mb-10 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Acquisitions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {papers.slice(0, 3).map((p, i) => <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}><PaperCard paper={p} isImported={true} /></motion.div>)}
              </div>
            </section>
          </motion.div>
        );

      case activeTab === 'search':
        return (
          <motion.div key="search" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-10">
            <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-white'} p-16 rounded-[4rem] border-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} text-center shadow-2xl`}>
              <h2 className="text-5xl font-black mb-10 tracking-tighter">Academic Discovery Node</h2>
              <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative group">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Inquire across the global research web..." className={`w-full pl-10 pr-52 py-8 rounded-[2.5rem] border-2 outline-none transition-all text-2xl font-bold ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                <button type="submit" disabled={isSearching} className="absolute right-4 top-4 bottom-4 bg-indigo-600 text-white px-12 rounded-[1.8rem] font-black hover:bg-indigo-700 shadow-2xl">{isSearching ? '...' : 'Query'}</button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {searchResults.map((p, idx) => <PaperCard key={idx} paper={p as Paper} onImport={importPaper} isImported={papers.some(ex => ex.title === p.title)} />)}
            </div>
          </motion.div>
        );

      case activeTab === 'docs':
        return (
          <motion.div key="docs" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-5xl font-black tracking-tighter mb-4">Doc Space</h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">Repository Management & Ingestion</p>
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleFileIngest} accept=".pdf" className="hidden" />
                <button onClick={triggerFileUpload} disabled={isIngesting} className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl font-black text-indigo-500 hover:border-indigo-500 transition-all flex items-center gap-3 shadow-xl">
                   {isIngesting ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <ICONS.Upload />}
                   {isIngesting ? 'Ingesting...' : 'Secure Ingest (PDF)'}
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b dark:border-slate-800">
                     <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500">Asset</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500">Analysis Status</th>
                     <th className="px-8 py-6"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {papers.map(p => (
                     <tr key={p.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                       <td className="px-8 py-6 font-bold text-slate-700 dark:text-slate-200">{p.title}</td>
                       <td className="px-8 py-6">
                          <button onClick={() => setActiveAnalysis({ paper: p, summary: (p as any).analysis || { keyFindings: ["Standard metadata extracted."] } })} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 text-[10px] font-black uppercase rounded-lg border border-indigo-200 dark:border-indigo-800">View AI Report</button>
                       </td>
                       <td className="px-8 py-6 text-right"><button onClick={() => setActiveTab(`ws-1`)} className="p-2 text-slate-400 hover:text-indigo-500"><ICONS.Bot /></button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </motion.div>
        );

      case activeTab === 'tools':
        return (
          <motion.div key="tools" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-12">
            <h2 className="text-5xl font-black tracking-tighter mb-4">AI Labs</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mb-10">Powered by Gemini 3 Pro Agent Engine</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               <ToolModule title="Semantic Weaver" desc="Discover hidden conceptual links." icon={<ICONS.Workspace />} onClick={() => handleRunLabTool("Semantic Weaver")} />
               <ToolModule title="Conflict Resolver" desc="Audit contradictory findings." icon={<ICONS.Search />} onClick={() => handleRunLabTool("Conflict Resolver")} />
               <ToolModule title="Synthesis Engine" desc="Synthesize multiple papers into one." icon={<ICONS.Bot />} onClick={() => handleRunLabTool("Synthesis Engine")} />
               <ToolModule title="Citation Forecaster" desc="Predict future citation growth." icon={<ICONS.Dashboard />} onClick={() => handleRunLabTool("Citation Forecaster")} />
            </div>
          </motion.div>
        );

      case activeTab.startsWith('ws-'):
        const wsId = activeTab.split('-')[1];
        const ws = workspaces.find(w => w.id === wsId);
        const wsPapers = papers.filter(p => ws?.paperIds.includes(p.id));
        return (
          <div key={`ws-${wsId}`} className="flex flex-col xl:flex-row gap-10 h-[calc(100vh-160px)]">
            <div className="flex-1 overflow-y-auto pr-6">
              <h2 className="text-6xl font-black tracking-tighter mb-10">{ws?.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {wsPapers.map(p => <PaperCard key={p.id} paper={p} isImported={true} />)}
              </div>
            </div>
            <div className={`w-full xl:w-[36rem] flex flex-col rounded-[4rem] border-2 h-full overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="p-10 border-b-2 flex items-center gap-4"><ICONS.Bot /><h3 className="font-black text-2xl">Agent Console</h3></div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-3xl ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>{m.content}</div>
                  </div>
                ))}
                {isBotTyping && <div className="text-indigo-500 font-black animate-pulse">Analyzing context...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-8 border-t-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Ask about workspace assets..." className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold" />
              </div>
            </div>
          </div>
        );

      default:
        return <div>System Node Active</div>;
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-700 ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} workspaces={workspaces} onAddWorkspace={() => {}} onRenameWorkspace={() => {}} onDeleteWorkspace={() => {}} onLogout={handleLogout} isDarkMode={isDarkMode} />
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <TopNav user={MOCK_USER} notifications={[]} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />
        <div className="p-12 flex-1 w-full overflow-hidden">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
      </main>

      {/* BRAINY CHATBOT WIDGET */}
      <div className="fixed bottom-8 right-8 z-[200]">
        <AnimatePresence>
          {isBrainyOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }} animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }} className={`w-96 h-[32rem] mb-6 rounded-[2.5rem] border-2 shadow-2xl flex flex-col overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ICONS.Bot /></div><span className="font-black">Brainy AI</span></div>
                 <button onClick={() => setIsBrainyOpen(false)} className="opacity-70 hover:opacity-100">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {brainyMessages.length === 0 && <div className="text-center py-20 opacity-30 font-black uppercase text-[10px] tracking-widest">Start a conversation with Brainy</div>}
                {brainyMessages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 dark:text-white'}`}>{m.content}</div>
                  </div>
                ))}
                {isBrainyTyping && <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 animate-pulse">Brainy is responding...</div>}
                <div ref={brainyEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <input type="text" value={brainyInput} onChange={e => setBrainyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBrainyChat()} placeholder="Ask Brainy for research help..." className="w-full px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none font-medium" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsBrainyOpen(!isBrainyOpen)} className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all ring-4 ring-indigo-500/20"><ICONS.Bot /></button>
      </div>

      {/* ANALYSIS MODAL */}
      <AnimatePresence>
        {activeAnalysis && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setActiveAnalysis(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 rounded-[4rem] border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-2xl'}`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-12">
                <h2 className="text-4xl font-black tracking-tighter">{activeAnalysis.paper.title}</h2>
                <button onClick={() => setActiveAnalysis(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-6">Key Findings</h3>
                  <ul className="space-y-4">
                    {activeAnalysis.summary.keyFindings?.map((f: string, i: number) => <li key={i} className="text-sm opacity-80 font-medium leading-relaxed">• {f}</li>)}
                  </ul>
                </section>
                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-6">Synthesis Report</h3>
                  <p className="text-sm opacity-80 leading-relaxed font-medium">{activeAnalysis.summary.executiveSummary || "Paper indexed successfully."}</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LAB TOOL RESULT MODAL */}
      <AnimatePresence>
        {(isLabLoading || labToolResult) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-8" onClick={() => !isLabLoading && setLabToolResult(null)}>
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} className={`w-full max-w-3xl p-12 rounded-[4rem] border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-2xl'}`} onClick={e => e.stopPropagation()}>
              {isLabLoading ? (
                <div className="text-center py-20"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-10" /><h2 className="text-2xl font-black uppercase tracking-widest">Agent Executing Analysis...</h2></div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto font-medium leading-loose whitespace-pre-wrap">{labToolResult}</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolModule: React.FC<{title: string, desc: string, icon: React.ReactNode, onClick?: () => void}> = ({title, desc, icon, onClick}) => (
  <motion.div whileHover={{ y: -8, scale: 1.02 }} onClick={onClick} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 rounded-[3rem] shadow-xl cursor-pointer group">
     <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all">{icon}</div>
     <h3 className="text-2xl font-black mb-2 tracking-tighter group-hover:text-indigo-500 transition-colors">{title}</h3>
     <p className="text-slate-500 dark:text-slate-400 font-bold text-xs opacity-70">{desc}</p>
  </motion.div>
);

const StatCard: React.FC<{label: string, value: string | number, trend: string, icon: React.ReactNode, color: string, isDarkMode: boolean}> = ({label, value, trend, icon, isDarkMode}) => (
  <div className={`p-10 rounded-[3rem] border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-8"><div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div><span className="text-[10px] font-black uppercase opacity-40">{trend}</span></div>
    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-3">{label}</p>
    <p className="text-5xl font-black tracking-tighter">{value}</p>
  </div>
);

export default App;
