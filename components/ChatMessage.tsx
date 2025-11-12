import React from 'react';
import type { Message } from '../types';
import { LogoIcon, UserIcon, WarningIcon, SpeakerIcon, StopIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  isSpeaking: boolean;
  onToggleSpeech: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isSpeaking, onToggleSpeech }) => {
  const isUser = message.sender === 'user';

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser
    ? 'bg-cyan-600/80 rounded-2xl rounded-tr-none'
    : message.isError 
    ? 'bg-red-800/80 rounded-2xl rounded-tl-none'
    : 'bg-gray-800 rounded-2xl rounded-tl-none';
  const icon = isUser ? (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
      <UserIcon className="w-6 h-6 text-gray-300" />
    </div>
  ) : (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
      {message.isError ? <WarningIcon className="w-6 h-6 text-red-400" /> : <LogoIcon className="w-6 h-6 text-cyan-400" />}
    </div>
  );

  // Simple markdown-like formatting for bold and lists
  const formatText = (text: string) => {
    const lines = text.split('\n').map((line, index) => {
      // Bold text: **text**
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // List items: * item
      if (line.trim().startsWith('* ')) {
        return `<li class="ml-4 list-disc">${line.substring(2)}</li>`;
      }
      return line;
    });

    // Join list items into a <ul>
    let html = '';
    let inList = false;
    lines.forEach(line => {
      if (line.startsWith('<li')) {
        if (!inList) {
          html += '<ul class="space-y-1 my-2">';
          inList = true;
        }
        html += line;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p>${line}</p>`;
      }
    });
    if (inList) {
        html += '</ul>';
    }

    return html.replace(/<p><\/p>/g, '<br />'); // Preserve line breaks
  };

  const renderFilePreview = () => {
    if (!message.file) return null;

    if (message.file.type.startsWith('image/')) {
        return (
            <div className="mb-2">
                <img 
                    src={message.file.url} 
                    alt={message.file.name} 
                    className="max-w-xs max-h-48 rounded-lg object-cover"
                />
            </div>
        );
    }
    
    return (
        <div className="mb-2 p-2 bg-black/20 rounded-lg text-sm">
            <p className="font-medium truncate">{message.file.name}</p>
        </div>
    );
  };

  return (
    <div className={`flex items-start gap-4 ${containerClasses}`}>
      {!isUser && icon}
      <div className="flex flex-col">
        {isUser && message.file && renderFilePreview()}
        <div
            className={`relative group px-4 py-3 max-w-2xl text-white ${bubbleClasses}`}
        >
            {message.text && (
                <div 
                    className="prose prose-invert prose-sm max-w-none pb-2"
                    dangerouslySetInnerHTML={{ __html: formatText(message.text) }}
                ></div>
            )}
            {!isUser && message.text && !message.isError && (
            <button
                onClick={() => onToggleSpeech(message)}
                aria-label={isSpeaking ? 'Parar leitura' : 'Ouvir mensagem'}
                className="absolute bottom-2 right-2 p-1.5 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                {isSpeaking ? (
                <StopIcon className="w-4 h-4 fill-current" />
                ) : (
                <SpeakerIcon className="w-4 h-4" />
                )}
            </button>
            )}
        </div>
      </div>
      {isUser && icon}
    </div>
  );
};

export default ChatMessage;
