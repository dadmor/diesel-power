// src/app-templates/ui/LoadingScreen.tsx
import React from 'react';

interface LoadingScreenProps {
  vendorSlug: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ vendorSlug }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Ładowanie aplikacji...</h2>
      <p className="text-gray-600">{vendorSlug}</p>
      <div className="mt-4 text-sm text-gray-500">
        Pobieranie konfiguracji z bazy danych...
      </div>
    </div>
  </div>
);

