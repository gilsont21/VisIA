import React, { useState, useRef } from 'react';
import { SendIcon, PaperclipIcon, CloseIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text, file);
      setText('');
      removeFile();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div>
        {file && (
            <div className="mb-2 p-2 bg-gray-700/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-10 h-10 rounded object-cover" />
                    ) : (
                        <PaperclipIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-300 truncate">{file.name}</span>
                </div>
                <button onClick={removeFile} aria-label="Remover arquivo" className="p-1 rounded-full hover:bg-gray-600">
                    <CloseIcon className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,text/plain,text/markdown"
                aria-hidden="true"
            />
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Anexar arquivo"
                className="p-3 text-gray-400 hover:text-white disabled:opacity-50 transition-colors focus:ring-2 focus:ring-cyan-500 focus:outline-none rounded-full"
            >
                <PaperclipIcon className="w-6 h-6" />
            </button>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem ou anexe um arquivo..."
                aria-label="Caixa de texto para enviar uma mensagem"
                rows={1}
                className="flex-1 p-3 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 disabled:opacity-50"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || (!text.trim() && !file)}
                aria-label="Enviar mensagem"
                className="p-3 bg-cyan-600 rounded-full text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
                <SendIcon className="w-6 h-6" />
            </button>
        </form>
    </div>
  );
};

export default ChatInput;
