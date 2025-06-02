import React, { useState, useEffect } from "react";
import { checkConnection } from "../lib/supabase";
import { AlertCircle, RefreshCw } from "lucide-react";

export const ConnectionChecker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState({
    loading: true,
    error: "",
    ready: false,
  });

  useEffect(() => {
    checkConnection()
      .then(({ hasVendorsTable, hasExecFunction }) => {
        if (!hasVendorsTable || !hasExecFunction) {
          throw new Error("Brak wymaganych tabel/funkcji w bazie");
        }
        setStatus({ loading: false, error: "", ready: true });
      })
      .catch((err) =>
        setStatus({ loading: false, error: err.message, ready: false })
      );
  }, []);

  if (status.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-600">Sprawdzanie połączenia...</p>
        </div>
      </div>
    );
  }

  if (!status.ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-3xl w-full">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-semibold text-slate-900">
              Błąd konfiguracji
            </h2>
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{status.error}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Wymagane polecenia SQL:
            </h3>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono leading-relaxed">
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
          </div>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sprawdź ponownie</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
