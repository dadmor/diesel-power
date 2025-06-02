// src/components/ConnectionChecker.tsx
import React, { useState, useEffect } from "react";
import { checkConnection, createBaseTables } from "../lib/supabase";
import { AlertCircle, RefreshCw } from "lucide-react";

export const ConnectionChecker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState({
    loading: true,
    error: "",
    ready: false,
    setupAttempted: false,
  });

  const attemptSetup = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: "" }));
      await createBaseTables();
      
      // Sprawdź ponownie po setup
      const { hasVendorsTable, hasExecFunction } = await checkConnection();
      if (!hasVendorsTable || !hasExecFunction) {
        throw new Error("Setup nie powiódł się - sprawdź uprawnienia bazy");
      }
      
      setStatus({ loading: false, error: "", ready: true, setupAttempted: true });
    } catch (err: any) {
      setStatus({ 
        loading: false, 
        error: err.message, 
        ready: false, 
        setupAttempted: true 
      });
    }
  };

  useEffect(() => {
    const initCheck = async () => {
      try {
        const { hasVendorsTable, hasExecFunction } = await checkConnection();
        
        if (!hasVendorsTable || !hasExecFunction) {
          // Automatycznie spróbuj utworzyć
          await attemptSetup();
        } else {
          setStatus({ loading: false, error: "", ready: true, setupAttempted: false });
        }
      } catch (err: any) {
        // Jeśli check nie działa, spróbuj setup
        await attemptSetup();
      }
    };

    initCheck();
  }, []);

  if (status.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600"></div>
          <p className="text-base text-slate-600">
            {status.setupAttempted ? "Konfigurowanie bazy..." : "Sprawdzanie połączenia..."}
          </p>
        </div>
      </div>
    );
  }

  if (!status.ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-slate-200 max-w-3xl w-full">
          <div className="flex items-center space-x-6 mb-6">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-3xl font-semibold text-slate-900">
              Błąd konfiguracji
            </h2>
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 text-base">{status.error}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-slate-900 mb-4">
              Wymagane polecenia SQL (wykonaj w Supabase Dashboard):
            </h3>
            <pre className="bg-slate-900 text-green-400 p-6 rounded-lg text-base overflow-x-auto font-mono leading-relaxed">
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN EXECUTE sql; RETURN 'OK';
EXCEPTION WHEN OTHERS THEN RETURN SQLERRM; END; $$;
            </pre>
          </div>

          <div className="flex space-x-6">
            <button
              onClick={attemptSetup}
              className="inline-flex items-center space-x-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>Spróbuj automatycznego setup</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sprawdź ponownie</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
