
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { Workspace } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  workspaces: Workspace[];
  onAddWorkspace: () => void;
  onRenameWorkspace: (id: string, newName: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  workspaces, 
  onAddWorkspace, 
  onRenameWorkspace,
  onDeleteWorkspace,
  onLogout, 
  isDarkMode 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <ICONS.Dashboard /> },
    { id: 'search', label: 'Search Engine', icon: <ICONS.Search /> },
    { id: 'docs', label: 'Doc Space', icon: <ICONS.DocSpace /> },
    { id: 'tools', label: 'AI Labs', icon: <ICONS.AITools /> },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 border-r transition-colors duration-300 hidden md:flex flex-col z-50 ${
      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-bold text-2xl">R</span>
        </div>
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>ResearchHub</h1>
          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Agentic AI</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="pb-4">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : `hover:bg-opacity-10 hover:bg-indigo-500 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`
              }`}
            >
              {item.icon}
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspaces</p>
            <button 
              onClick={onAddWorkspace}
              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
              title="New Workspace"
            >
              <ICONS.Plus />
            </button>
          </div>

          {workspaces.map((ws) => (
            <div 
              key={ws.id} 
              className="group relative"
            >
              {editingId === ws.id ? (
                <input 
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => { onRenameWorkspace(ws.id, tempName); setEditingId(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onRenameWorkspace(ws.id, tempName); setEditingId(null); } }}
                />
              ) : (
                <button
                  onClick={() => setActiveTab(`ws-${ws.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    activeTab === `ws-${ws.id}`
                      ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                      : `hover:bg-opacity-5 hover:bg-slate-500 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${ws.color || 'bg-blue-400'} shadow-sm shadow-current`} />
                  <span className="text-sm truncate flex-1 text-left">{ws.name}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingId(ws.id); setTempName(ws.name); }}
                      className="p-1 hover:text-indigo-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteWorkspace(ws.id); }}
                      className="p-1 hover:text-red-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-semibold text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
