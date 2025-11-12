import React from 'react';

interface WelcomeMessageProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ suggestions, onSuggestionClick }) => {
  return (
    <div className="text-center p-6 bg-gray-800/50 rounded-lg">
      <h2 className="text-2xl font-bold mb-2 text-white">Bem-vindo(a) ao VisIA!</h2>
      <p className="text-gray-400 mb-6">Seu assistente de estudos acessível. Comece fazendo uma pergunta ou escolha uma das sugestões abaixo.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="p-4 bg-gray-700/70 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors text-sm w-full"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeMessage;
