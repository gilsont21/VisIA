import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat, Part } from '@google/genai';
import { VISIA_SYSTEM_PROMPT, INITIAL_SUGGESTIONS } from '../constants';
import { startChatSession } from '../services/geminiService';
import { Message, Note, Document } from '../types';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import WelcomeMessage from '../components/WelcomeMessage';
import VoiceConversation from '../components/VoiceConversation';
import { LogoIcon, LoadingIcon, MicrophoneIcon } from '../components/Icons';

interface ChatViewProps {
  notes: Note[];
  documents: Document[];
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // remove o prefixo "data:mime/type;base64,"
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });


const ChatView: React.FC<ChatViewProps> = ({ notes, documents }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      const chatSession = startChatSession(VISIA_SYSTEM_PROMPT);
      setChat(chatSession);
      setMessages([
        {
          id: 'initial',
          sender: 'ai',
          text: 'Olá! Eu sou o VisIA, sua inteligência artificial de apoio aos estudos. Como posso ajudar você hoje?',
        },
      ]);
    };
    initChat();
  }, []);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleToggleSpeech = useCallback((message: Message) => {
    if (currentlySpeakingId === message.id) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
    } else {
      window.speechSynthesis.cancel(); // Stop any other speech that might be playing

      // Sanitize text for speech by removing markdown
      const plainText = message.text
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/^\s*\*\s/gm, '');     // list items

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setCurrentlySpeakingId(null);
      utterance.onerror = () => {
        console.error('An error occurred during speech synthesis.');
        setCurrentlySpeakingId(null);
      };
      
      window.speechSynthesis.speak(utterance);
      setCurrentlySpeakingId(message.id);
    }
  }, [currentlySpeakingId]);

  const handleSendMessage = useCallback(async (text: string, file?: File | null) => {
    if (!chat || (!text.trim() && !file)) return;
  
    if (currentlySpeakingId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
    }
  
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    if (file) {
      userMessage.file = {
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
      };
    }
  
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
  
    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);
  
    try {
      let contextParts: string[] = [];

      // Contexto das Anotações
      if (notes && notes.length > 0) {
        const notesContent = notes
          .map(note => `### Título da Anotação: ${note.title}\n\n${note.content}`)
          .join('\n\n---\n\n');
        contextParts.push(`--- INÍCIO DO CONTEXTO DAS ANOTAÇÕES DO USUÁRIO ---\n\n${notesContent}\n\n--- FIM DO CONTEXTO ---`);
      }

      // Contexto dos Documentos (apenas texto)
      if (documents && documents.length > 0) {
        const textDocuments = documents.filter(doc => doc.type.startsWith('text/'));
        if (textDocuments.length > 0) {
          const docsContent = textDocuments.map(doc => {
            // Decodificar base64 para texto puro
            const textContent = atob(doc.content);
            return `### Título do Documento: ${doc.name}\n\n${textContent}`;
          }).join('\n\n---\n\n');
          contextParts.push(`--- INÍCIO DO CONTEXTO DOS DOCUMENTOS DO USUÁRIO ---\n\n${docsContent}\n\n--- FIM DO CONTEXTO ---`);
        }
      }

      const contextText = contextParts.join('\n\n');
      let promptText = contextText ? `${contextText}\n\n${text}` : text;

      const parts: Part[] = [];

      if (file) {
        if (file.type.startsWith('image/')) {
            const base64Data = await fileToBase64(file);
            parts.push({ inlineData: { mimeType: file.type, data: base64Data }});
        } else if (file.type.startsWith('text/')) {
            const fileText = await file.text();
            // Adiciona o conteúdo do texto ao prompt principal
            promptText += `\n\n--- Início do conteúdo do arquivo anexado "${file.name}" ---\n${fileText}\n--- Fim do conteúdo do arquivo ---`;
        }
      }

      parts.push({ text: promptText });

      const stream = await chat.sendMessageStream({ message: parts });
      
      let fullResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: fullResponse } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
                isError: true,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [chat, currentlySpeakingId, notes, documents]);

  return (
    <div className="flex flex-col h-screen bg-[#111827]">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 shadow-md bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center">
            {/* O logo e o título podem ser removidos ou simplificados, já que estão na sidebar */}
            <h1 className="text-xl font-bold text-white">Nova Conversa</h1>
        </div>
        <button
          onClick={() => setIsVoiceModeActive(true)}
          aria-label="Iniciar conversa por voz"
          className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
            <MicrophoneIcon className="w-6 h-6" />
        </button>
      </header>

      <main 
        className="flex-1 overflow-y-auto p-4 md:p-6"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 1 ? (
             <WelcomeMessage onSuggestionClick={(text) => handleSendMessage(text)} suggestions={INITIAL_SUGGESTIONS} />
          ) : null}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isSpeaking={currentlySpeakingId === message.id}
              onToggleSpeech={handleToggleSpeech}
            />
          ))}
          {isLoading && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <LogoIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex items-center space-x-2 bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none">
                 <LoadingIcon className="w-5 h-5 animate-spin text-cyan-400" />
                 <span className="text-gray-400" role="status">VisIA está digitando...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
      {isVoiceModeActive && chat && (
        <VoiceConversation
          isOpen={isVoiceModeActive}
          onClose={() => setIsVoiceModeActive(false)}
          chat={chat}
        />
      )}
    </div>
  );
};

export default ChatView;