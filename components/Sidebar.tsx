import React from 'react';
import { LogoIcon, PlusIcon, HistoryIcon, FolderIcon, NoteIcon } from './Icons';

type View = 'home' | 'chat' | 'history' | 'documents' | 'notes';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onNewChat: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-cyan-600/30 text-cyan-300'
        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onNewChat }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 p-4 flex flex-col border-r border-gray-800">
      <div className="flex items-center mb-8">
        <LogoIcon className="w-8 h-8 mr-3 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white">VisIA</h1>
          <p className="text-xs text-gray-400">Tutor Inclusivo</p>
        </div>
      </div>

      <button
        onClick={onNewChat}
        className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-500 transition-colors mb-6"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        Novo Chat
      </button>

      <nav className="space-y-2">
        <NavItem
          icon={<HistoryIcon className="w-5 h-5" />}
          label="Histórico"
          isActive={activeView === 'history'}
          onClick={() => setActiveView('history')}
        />
        <NavItem
          icon={<FolderIcon className="w-5 h-5" />}
          label="Documentos"
          isActive={activeView === 'documents'}
          onClick={() => setActiveView('documents')}
        />
        <NavItem
          icon={<NoteIcon className="w-5 h-5" />}
          label="Anotações"
          isActive={activeView === 'notes'}
          onClick={() => setActiveView('notes')}
        />
      </nav>

      <div className="mt-auto text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} VisIA Project</p>
      </div>
    </aside>
  );
};

export default Sidebar;
