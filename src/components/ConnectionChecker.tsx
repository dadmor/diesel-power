import React, { useState, useEffect } from 'react';
import { checkConnection } from '../lib/supabase';

export const ConnectionChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState({ loading: true, error: '', ready: false });

  useEffect(() => {
    checkConnection()
      .then(({ hasVendorsTable, hasExecFunction }) => {
        if (!hasVendorsTable || !hasExecFunction) {
          throw new Error('Brak wymaganych tabel/funkcji w bazie');
        }
        setStatus({ loading: false, error: '', ready: true });
      })
      .catch(err => setStatus({ loading: false, error: err.message, ready: false }));
  }, []);

  if (status.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status.ready) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Błąd konfiguracji</h2>
          <p className="mb-4">{status.error}</p>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN EXECUTE sql; RETURN 'OK';
EXCEPTION WHEN OTHERS THEN RETURN SQLERRM; END; $$;`}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Sprawdź ponownie
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};