import React from 'react';
import { PlusIcon } from '../components/Icons';

interface HomePageProps {
  onNewChat: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNewChat }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-4">
          Bem-vindo(a) ao <span className="text-cyan-400">VisIA</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Seu tutor de IA inclusivo e ético, pronto para te ajudar a aprender de forma acessível.
        </p>
        <button
          onClick={onNewChat}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
        >
          <PlusIcon className="w-6 h-6 mr-3" />
          Iniciar Nova Conversa
        </button>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Ensino Personalizado</h3>
            <p className="text-gray-400 text-sm">Faça perguntas, peça resumos e receba explicações adaptadas ao seu ritmo de aprendizado.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Totalmente Acessível</h3>
            <p className="text-gray-400 text-sm">Interaja através de texto ou voz, com suporte completo a leitores de tela e descrições de imagem.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
