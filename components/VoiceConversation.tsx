import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { PhoneOffIcon, LogoIcon } from './Icons';

// FIX: Add type definitions for SpeechRecognition API which is not standard yet
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// FIX: Augment the global Window interface to include SpeechRecognition APIs.
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

interface VoiceConversationProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
}

type Status = 'idle' | 'listening' | 'processing' | 'speaking';
type TranscriptItem = {
    id: string;
    speaker: 'user' | 'ai';
    text: string;
}

const VoiceConversation: React.FC<VoiceConversationProps> = ({ isOpen, onClose, chat }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const userSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecognition = useCallback(() => {
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
            setStatus('listening');
        } catch (e) {
            // Avoids error if recognition is already started
            console.warn("Speech recognition already started.", e);
        }
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setStatus('processing');
    const userMessageId = `user-${Date.now()}`;
    setTranscript(prev => [...prev, { id: userMessageId, speaker: 'user', text }]);
    
    try {
        const stream = await chat.sendMessageStream({ message: [{ text }] });
        setStatus('speaking');
        
        let fullResponse = '';
        const aiMessageId = `ai-${Date.now()}`;
        setTranscript(prev => [...prev, { id: aiMessageId, speaker: 'ai', text: '' }]);

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                setTranscript(prev =>
                    prev.map(item => item.id === aiMessageId ? { ...item, text: fullResponse } : item)
                );
            }
        }
        
        // Speak the final response
        const utterance = new SpeechSynthesisUtterance(fullResponse);
        utterance.lang = 'pt-BR';
        utterance.onend = () => {
            startRecognition(); // Go back to listening after AI finishes speaking
        };
        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            setError('Desculpe, tive um problema ao tentar falar.');
            startRecognition();
        };
        window.speechSynthesis.speak(utterance);
        
    } catch (e) {
        console.error('Error sending message to AI:', e);
        setError('Ocorreu um erro ao me comunicar com a IA.');
        setStatus('listening');
    }
  }, [chat, startRecognition]);

  // Initialize and clean up SpeechRecognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Seu navegador não suporta a conversação por voz.');
      setStatus('idle');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      console.log('Voice recognition started.');
      setStatus('listening');
    };

    recognition.onresult = (event) => {
        if (userSpeechTimeoutRef.current) {
            clearTimeout(userSpeechTimeoutRef.current);
        }

        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // When user stops talking for a moment, consider it final
        userSpeechTimeoutRef.current = setTimeout(() => {
            stopRecognition();
            const speechResult = (finalTranscript || interimTranscript).trim();
            if (speechResult) {
                handleSendMessage(speechResult);
            } else {
                startRecognition(); // if nothing was said, just listen again
            }
        }, 1500); // 1.5 second pause
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('A permissão para usar o microfone foi negada.');
      } else {
        setError('Ocorreu um erro com o reconhecimento de voz.');
      }
      setStatus('idle');
    };
    
    recognition.onend = () => {
      console.log('Voice recognition ended.');
    };

    recognitionRef.current = recognition;

    // Start conversation when modal opens
    setTranscript([]);
    const welcomeUtterance = new SpeechSynthesisUtterance("Olá! Estou ouvindo. Como posso ajudar?");
    welcomeUtterance.lang = 'pt-BR';
    welcomeUtterance.onend = () => {
        startRecognition();
    };
    window.speechSynthesis.speak(welcomeUtterance);
    
    return () => {
      stopRecognition();
      window.speechSynthesis.cancel();
      recognitionRef.current = null;
      if (userSpeechTimeoutRef.current) {
        clearTimeout(userSpeechTimeoutRef.current);
      }
    };
  }, [isOpen, handleSendMessage, startRecognition, stopRecognition]);
  
  const handleClose = () => {
    stopRecognition();
    window.speechSynthesis.cancel();
    onClose();
  };

  const statusInfo = {
    idle: { text: "Iniciando...", color: 'bg-gray-500' },
    listening: { text: "Ouvindo...", color: 'bg-cyan-500' },
    processing: { text: "Processando...", color: 'bg-yellow-500' },
    speaking: { text: "Falando...", color: 'bg-green-500' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-4xl h-full flex flex-col">
            {/* Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-lg">
                {transcript.map(item => (
                    <div key={item.id} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <p className={`p-3 rounded-lg max-w-xl ${item.speaker === 'user' ? 'bg-cyan-700' : 'bg-gray-700'}`}>
                            {item.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* Status and Control Area */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center py-8">
                <div 
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300 ${statusInfo[status].color}`}
                    aria-label={statusInfo[status].text}
                >
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                    <LogoIcon className="w-12 h-12 text-white" />
                </div>
                <p className="mt-4 text-white text-xl font-medium">{error || statusInfo[status].text}</p>
                
                <button
                    onClick={handleClose}
                    aria-label="Encerrar conversa por voz"
                    className="mt-12 flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                >
                    <PhoneOffIcon className="w-6 h-6" />
                    <span>Encerrar Conversa</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default VoiceConversation;
