// src/app-templates/ui/ErrorScreen.tsx
import React from 'react';

interface ErrorScreenProps {
  error: string | null;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="text-6xl text-gray-400 mb-4">🚫</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Aplikacja niedostępna</h2>
      <p className="text-gray-600 mb-6">{error || 'Wystąpił nieoczekiwany błąd'}</p>
      <div className="space-y-3">
        <button
          onClick={() => window.location.reload()}
          className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Odśwież stronę
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="block w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Powrót do strony głównej
        </button>
      </div>
    </div>
  </div>
);