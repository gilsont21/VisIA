import React from 'react';
import { HistoryIcon } from '../components/Icons';

const HistoryView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <HistoryIcon className="w-24 h-24 text-gray-600 mb-4" />
      <h1 className="text-3xl font-bold text-white mb-2">Histórico de Conversas</h1>
      <p className="max-w-md text-gray-400">
        Aqui você poderá revisitar suas conversas anteriores com o VisIA. A funcionalidade será implementada em breve.
      </p>
    </div>
  );
};

export default HistoryView;
