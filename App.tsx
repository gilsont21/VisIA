import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './views/HomePage';
import ChatView from './views/ChatView';
import HistoryView from './views/HistoryView';
import DocumentsView from './views/DocumentsView';
import NotesView from './views/NotesView';
import type { Note, Document } from './types';

type View = 'home' | 'chat' | 'history' | 'documents' | 'notes';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [chatId, setChatId] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const savedNotes = window.localStorage.getItem('visia-notes');
      return savedNotes ? JSON.parse(savedNotes) : [];
    } catch (error) {
      console.error("Failed to parse notes from localStorage", error);
      return [];
    }
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const savedDocs = window.localStorage.getItem('visia-documents');
      return savedDocs ? JSON.parse(savedDocs) : [];
    } catch (error) {
      console.error("Failed to parse documents from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('visia-notes', JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save notes to localStorage", error);
    }
  }, [notes]);

  useEffect(() => {
    try {
      window.localStorage.setItem('visia-documents', JSON.stringify(documents));
    } catch (error) {
      console.error("Failed to save documents to localStorage", error);
    }
  }, [documents]);


  const handleNewChat = () => {
    setChatId(`chat-${Date.now()}`);
    setActiveView('chat');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatView key={chatId} notes={notes} documents={documents} />;
      case 'history':
        return <HistoryView />;
      case 'documents':
        return <DocumentsView documents={documents} setDocuments={setDocuments} />;
      case 'notes':
        return <NotesView notes={notes} setNotes={setNotes} />;
      case 'home':
      default:
        return <HomePage onNewChat={handleNewChat} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#111827] text-gray-200">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onNewChat={handleNewChat} 
      />
      <main className="flex-1 overflow-y-auto">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default App;