import React, { useState, useEffect, useRef } from 'react';
import type { Document } from '../types';
import { PlusIcon, TrashIcon, FolderIcon, FileTextIcon } from '../components/Icons';

interface DocumentsViewProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
});

const DocumentsView: React.FC<DocumentsViewProps> = ({ documents, setDocuments }) => {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newDocs: Document[] = [];
    for (const file of Array.from(files)) {
      const content = await fileToBase64(file);
      const newDoc: Document = {
        id: `doc-${Date.now()}-${file.name}`,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        content: content,
      };
      newDocs.push(newDoc);
    }
    
    setDocuments(prevDocs => [...newDocs, ...prevDocs]);
    if (newDocs.length > 0) {
        setActiveDocId(newDocs[0].id);
    }
  };

  const handleDeleteDoc = () => {
    if (window.confirm('Tem certeza de que deseja excluir este documento?')) {
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== activeDocId));
      setActiveDocId(null);
    }
  };
  
  // Efeito para selecionar o primeiro documento se nenhum estiver ativo
  useEffect(() => {
    const sorted = [...documents].sort((a, b) => b.lastModified - a.lastModified);
    if (!activeDocId && sorted.length > 0) {
      setActiveDocId(sorted[0].id);
    }
     // Se o doc ativo foi deletado, seleciona o próximo
     if (activeDocId && !documents.find(d => d.id === activeDocId) && sorted.length > 0) {
        setActiveDocId(sorted[0].id);
    }
  }, [documents, activeDocId]);

  const activeDoc = documents.find(doc => doc.id === activeDocId);
  const sortedDocs = [...documents].sort((a, b) => b.lastModified - a.lastModified);

  const renderDocPreview = () => {
    if (!activeDoc) return null;

    if (activeDoc.type.startsWith('image/')) {
        return <img src={`data:${activeDoc.type};base64,${activeDoc.content}`} alt={activeDoc.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />;
    }

    if (activeDoc.type.startsWith('text/')) {
        try {
            const textContent = atob(activeDoc.content);
            return <pre className="whitespace-pre-wrap text-gray-300 bg-gray-900 p-4 rounded-lg text-sm">{textContent}</pre>;
        } catch(e) {
            console.error("Failed to decode base64 content", e);
            return <p>Não foi possível exibir o conteúdo deste arquivo de texto.</p>
        }
    }

    return (
        <div className="text-center p-6 bg-gray-800 rounded-lg">
            <FileTextIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold">{activeDoc.name}</h3>
            <p className="text-sm text-gray-400">{activeDoc.type}</p>
            <p className="text-sm text-gray-400">{(activeDoc.size / 1024).toFixed(2)} KB</p>
            <p className="text-xs text-gray-500 mt-2">Nenhuma pré-visualização disponível para este tipo de arquivo.</p>
        </div>
    )
  }

  return (
    <div className="flex h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        accept="image/png, image/jpeg, text/plain, text/markdown"
      />
      {/* Sidebar de Documentos */}
      <aside className="w-80 flex-shrink-0 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Documentos</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
            aria-label="Adicionar novo documento"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {sortedDocs.length > 0 ? (
            <ul>
              {sortedDocs.map(doc => (
                <li key={doc.id}>
                  <button
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full text-left p-4 border-b border-gray-700/50 transition-colors flex items-center gap-3 ${
                      activeDocId === doc.id ? 'bg-cyan-600/20' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    {doc.type.startsWith('image/') ? <img src={`data:${doc.type};base64,${doc.content}`} className="w-8 h-8 object-cover rounded flex-shrink-0" /> : <FileTextIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />}
                    <div className="overflow-hidden">
                        <h3 className="font-semibold text-white truncate">{doc.name}</h3>
                        <p className="text-xs text-gray-400 truncate mt-1">
                            {doc.type} - {(doc.size / 1024).toFixed(2)} KB
                        </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhum documento encontrado. Adicione um para começar!</p>
            </div>
          )}
        </div>
      </aside>

      {/* Visualizador Principal */}
      <main className="flex-1 flex flex-col p-4 md:p-6">
        {activeDoc ? (
          <>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
                <div className="overflow-hidden">
                    <h2 className="text-2xl font-bold text-white truncate">{activeDoc.name}</h2>
                    <p className="text-sm text-gray-400">Última modificação: {new Date(activeDoc.lastModified).toLocaleDateString()}</p>
                </div>
                <button
                    onClick={handleDeleteDoc}
                    className="p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-full"
                    aria-label="Excluir documento"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
              {renderDocPreview()}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderIcon className="w-24 h-24 text-gray-600 mb-4" />
            <h1 className="text-2xl font-bold text-white">Selecione um documento</h1>
            <p className="max-w-sm text-gray-400 mt-2">
              Escolha um documento da lista para visualizar ou adicione um novo para seus estudos.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentsView;
