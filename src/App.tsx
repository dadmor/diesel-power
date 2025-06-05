// =============================================================================
// src/App.tsx
// =============================================================================
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createClient, User as SupabaseUser } from '@supabase/supabase-js';

// =============================================================================
// KONFIGURACJA SUPABASE
// =============================================================================
const supabaseUrl = 'https://vvkjfzjikfuqdpmomdbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2a2pmemppa2Z1cWRwbW9tZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTE2NTcsImV4cCI6MjA2NDQ2NzY1N30.sVejmzInkxXnGxjm5rowJKuwTuVrcJ40Ix3Dk1W3ogE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================================================
// DEFINICJE TYPÓW
// =============================================================================
type ColumnType = 'text' | 'integer' | 'boolean' | 'timestamp';

interface Column {
  name: string;
  type: ColumnType;
  required?: boolean;
  enum?: string[];
}

interface Table {
  name: string;
  columns: Column[];
}

interface Schema {
  tables: Table[];
}

export interface Vendor {
  id?: string;
  slug: string;
  name: string;
  schema: Schema;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// =============================================================================
// PROVIDER AUTORYZACJI
// =============================================================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// MAPOWANIE TYPU KOLUMN
// =============================================================================
const mapColType = (t: ColumnType) =>
  t === 'text'
    ? 'TEXT'
    : t === 'integer'
    ? 'INTEGER'
    : t === 'boolean'
    ? 'BOOLEAN'
    : 'TIMESTAMP WITH TIME ZONE';

// =============================================================================
// VENDOR SERVICE (z użyciem exec_vendor_sql)
// =============================================================================
const execVendorSQL = async (slug: string, sql: string) => {
  // Wykonujemy SQL z bezpośrednim przekazaniem vendor_slug
  const { error } = await supabase.rpc('exec_vendor_sql', { 
    vendor_slug: slug, 
    sql: sql 
  });
  if (error) throw new Error(`Błąd wykonywania SQL: ${error.message}`);
};

class VendorService {
  static async getVendors(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createVendor(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>): Promise<Vendor> {
    // 1) Dodajemy wpis w tabeli „vendors"
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendor])
      .select()
      .single();
    if (error) throw error;

    const slug = data.slug;
    
    // 2) Budujemy jedno zapytanie SQL obejmujące wszystkie tabele z prefixem
    const sql = vendor.schema.tables
      .map((table) => {
        const tableName = `${slug}_${table.name}`;
        const columns = table.columns
          .map((col) => {
            let def = `${col.name} ${mapColType(col.type)}`;
            if (col.required) def += ' NOT NULL';
            if (col.enum) def += ` CHECK (${col.name} IN (${col.enum.map((v) => `'${v}'`).join(', ')}))`;
            return def;
          })
          .join(', ');

        return `
CREATE TABLE IF NOT EXISTS ${tableName} (
  id BIGSERIAL PRIMARY KEY,
  ${columns},
  vendor_slug TEXT DEFAULT '${slug}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ${tableName}_vendor_check CHECK (vendor_slug = '${slug}')
);
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "${tableName}_vendor_policy" ON ${tableName}
  FOR ALL USING (vendor_slug = '${slug}');
CREATE INDEX IF NOT EXISTS ${tableName}_vendor_idx ON ${tableName}(vendor_slug);
`;
      })
      .join('\n');

    try {
      // 3) Wykonujemy SQL dla tabel (vendor już istnieje w bazie)
      await execVendorSQL(slug, sql);
      return data;
    } catch (tableError) {
      // rollback: usuwamy vendor, jeśli tworzenie tabel się nie powiodło
      await supabase.from('vendors').delete().eq('id', data.id);
      throw tableError;
    }
  }

  static async updateVendor(
    id: string,
    updates: Partial<Omit<Vendor, 'id'>>,
  ): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteVendor(vendor: Vendor): Promise<void> {
    const slug = vendor.slug;
    // generujemy DROP TABLE dla każdej tabeli vendora
    const sql = vendor.schema.tables
      .map((table) => `DROP TABLE IF EXISTS ${slug}_${table.name} CASCADE;`)
      .join('\n');

    await execVendorSQL(slug, sql);

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendor.id);
    if (error) throw error;
  }
}

// =============================================================================
// KOMPONENTY UI: AuthForm, VendorForm, VendorList, AppContent
// =============================================================================

const AuthForm: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Sprawdź e-mail w celu weryfikacji!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-md w-full space-y-6 p-8 bg-white rounded shadow">
        <h2 className="text-3xl font-bold text-center">
          {isSignUp ? 'Rejestracja' : 'Logowanie'}
        </h2>
        {error && <div className="text-red-600 text-center">{error}</div>}

        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Hasło</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Proszę czekać...' : isSignUp ? 'Zarejestruj się' : 'Zaloguj się'}
        </button>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:underline"
          >
            {isSignUp ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface VendorFormProps {
  vendor?: Vendor;
  onSave: (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const VendorForm: React.FC<VendorFormProps> = ({ vendor, onSave, onCancel }) => {
  const [slug, setSlug] = useState(vendor?.slug || '');
  const [name, setName] = useState(vendor?.name || '');
  const [schemaJson, setSchemaJson] = useState(
    vendor
      ? JSON.stringify(vendor.schema, null, 2)
      : `{
  "tables": [
    {
      "name": "tickets",
      "columns": [
        {"name": "title", "type": "text", "required": true},
        {"name": "description", "type": "text"},
        {"name": "status", "type": "text", "enum": ["open", "in_progress", "closed"]},
        {"name": "priority", "type": "integer"},
        {"name": "created_by", "type": "text", "required": true}
      ]
    },
    {
      "name": "users",
      "columns": [
        {"name": "email", "type": "text", "required": true},
        {"name": "full_name", "type": "text", "required": true},
        {"name": "role", "type": "text", "enum": ["admin", "user", "support"]},
        {"name": "active", "type": "boolean"}
      ]
    }
  ]
}`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error('Slug może zawierać tylko małe litery, cyfry i myślniki.');
      }
      const schema: Schema = JSON.parse(schemaJson);
      await onSave({ slug, name, schema });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Błędny format JSON w schemacie');
      } else {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {vendor ? 'Edytuj dostawcę' : 'Nowy dostawca'}
        </h3>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="helpdesk-app"
              className="mt-1 w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500">tylko małe litery, cyfry, myślniki</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Nazwa</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Helpdesk System"
              className="mt-1 w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <label className="block text-sm font-medium">Schema (JSON)</label>
        <textarea
          required
          value={schemaJson}
          onChange={(e) => setSchemaJson(e.target.value)}
          rows={16}
          className="mt-1 w-full px-3 py-2 border rounded font-mono text-sm"
        />

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
};

const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [error, setError] = useState('');

  const loadVendors = async () => {
    try {
      const data = await VendorService.getVendors();
      setVendors(data);
    } catch (err) {
      setError('Błąd ładowania: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSave = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editing) {
        await VendorService.updateVendor(editing.id!, vendorData);
      } else {
        await VendorService.createVendor(vendorData);
      }
      setShowForm(false);
      setEditing(null);
      await loadVendors();
    } catch (err) {
      throw new Error('Nie udało się zapisać: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Usunąć "${vendor.name}"? To usunie wszystkie powiązane tabele.`)) return;
    try {
      await VendorService.deleteVendor(vendor);
      await loadVendors();
    } catch (err) {
      alert('Nie udało się usunąć: ' + (err instanceof Error ? err.message : ''));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Ładowanie...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dostawcy</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Dodaj
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded shadow border">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold">{v.name}</h3>
                <p className="text-gray-600">/{v.slug}</p>
              </div>
              <div className="space-x-2 text-sm">
                <button
                  onClick={() => {
                    setEditing(v);
                    setShowForm(true);
                  }}
                  className="text-blue-600"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => handleDelete(v)}
                  className="text-red-600"
                >
                  Usuń
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Tabele:</strong> {v.schema.tables.length}
            </p>
            <div className="mt-2 text-xs">
              {v.schema.tables.map((t, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-2 mb-1">
                  <div className="font-medium">{`${v.slug}_${t.name}`}</div>
                  <div className="text-gray-500">
                    {t.columns.map((c) => c.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Utworzono: {v.created_at ? new Date(v.created_at).toLocaleDateString('pl-PL') : '—'}
            </div>
          </div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          Brak dostawców. Dodaj nowego.
        </div>
      )}

      {showForm && (
        <VendorForm
          vendor={editing || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Ładowanie...
      </div>
    );
  }
  if (!user) {
    return <AuthForm />;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Multi-Tenant System</h1>
            <p className="text-sm text-gray-600">Zarządzanie dostawcami</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={signOut}
              className="text-blue-600 hover:underline"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>
      <VendorList />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;