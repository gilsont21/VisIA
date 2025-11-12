import React, { useState, useEffect } from 'react';
import type { Note } from '../types';
import { PlusIcon, TrashIcon, NoteIcon } from '../components/Icons';

interface NotesViewProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const NotesView: React.FC<NotesViewProps> = ({ notes, setNotes }) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const handleNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Nova Anotação',
      content: '',
      lastModified: Date.now(),
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateNote = (field: 'title' | 'content', value: string) => {
    setNotes(prevNotes => prevNotes.map(note => 
      note.id === activeNoteId 
        ? { ...note, [field]: value, lastModified: Date.now() }
        : note
    ));
  };

  const handleDeleteNote = () => {
    if (window.confirm('Tem certeza de que deseja excluir esta anotação?')) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== activeNoteId));
      setActiveNoteId(null);
    }
  };
  
  // Efeito para selecionar a primeira nota se nenhuma estiver ativa
  useEffect(() => {
    const sorted = [...notes].sort((a, b) => b.lastModified - a.lastModified);
    if (!activeNoteId && sorted.length > 0) {
      setActiveNoteId(sorted[0].id);
    }
    // Se a nota ativa foi deletada, seleciona a próxima
    if (activeNoteId && !notes.find(n => n.id === activeNoteId) && sorted.length > 0) {
        setActiveNoteId(sorted[0].id);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find(note => note.id === activeNoteId);
  const sortedNotes = [...notes].sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className="flex h-full">
      {/* Sidebar de Anotações */}
      <aside className="w-80 flex-shrink-0 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Anotações</h2>
          <button
            onClick={handleNewNote}
            className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
            aria-label="Criar nova anotação"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {sortedNotes.length > 0 ? (
            <ul>
              {sortedNotes.map(note => (
                <li key={note.id}>
                  <button
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full text-left p-4 border-b border-gray-700/50 transition-colors ${
                      activeNoteId === note.id ? 'bg-cyan-600/20' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <h3 className="font-semibold text-white truncate">{note.title || 'Sem Título'}</h3>
                    <p className="text-sm text-gray-400 truncate mt-1">
                      {note.content.substring(0, 50) || 'Nenhum conteúdo adicional'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhuma anotação encontrada. Crie uma para começar!</p>
            </div>
          )}
        </div>
      </aside>

      {/* Editor Principal */}
      <main className="flex-1 flex flex-col p-4 md:p-6">
        {activeNote ? (
          <>
            <div className="flex items-center justify-between mb-4">
                <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateNote('title', e.target.value)}
                    placeholder="Título da Anotação"
                    className="w-full bg-transparent text-3xl font-bold text-white focus:outline-none"
                    aria-label="Título da anotação"
                />
                <button
                    onClick={handleDeleteNote}
                    className="p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-full"
                    aria-label="Excluir anotação"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <textarea
              value={activeNote.content}
              onChange={(e) => handleUpdateNote('content', e.target.value)}
              placeholder="Comece a escrever..."
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed text-gray-300"
              aria-label="Corpo da anotação"
            ></textarea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <NoteIcon className="w-24 h-24 text-gray-600 mb-4" />
            <h1 className="text-2xl font-bold text-white">Selecione uma anotação</h1>
            <p className="max-w-sm text-gray-400 mt-2">
              Escolha uma anotação da lista para editar ou crie uma nova para começar a organizar suas ideias.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesView;