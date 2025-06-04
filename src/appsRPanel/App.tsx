import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { validate } from './validator';

const API_URL = "https://vvkjfzjikfuqdpmomdbx.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2a2pmemppa2Z1cWRwbW9tZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTE2NTcsImV4cCI6MjA2NDQ2NzY1N30.sVejmzInkxXnGxjm5rowJKuwTuVrcJ40Ix3Dk1W3ogE";

// Supabase client
const supabase = createClient('https://vvkjfzjikfuqdpmomdbx.supabase.co', API_KEY);

const headers = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

interface VendorSchema {
  tables: any[];
}

interface Vendor {
  id: string;
  slug: string;
  name: string;
  description: string;
  schema: VendorSchema;
  created_at: string;
}

type ViewType = 'list' | 'add' | 'edit';

export default function SimpleVendorPanel() {
  const [session, setSession] = useState(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [view, setView] = useState<ViewType>('list');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadVendors();
    }
  }, [session]);

  const showMessage = (msg: string): void => {
    setMessage(msg);
  };

  const clearMessage = (): void => {
    setMessage('');
  };

  const loadVendors = async (): Promise<void> => {
    if (!session) return;
    
    try {
      const res = await fetch(`${API_URL}/vendors?select=*&order=created_at.desc`, { 
        headers: {
          ...headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch {
      showMessage('Error loading vendors');
    }
  };

  const saveVendor = async (): Promise<void> => {
    if (!session) return;
    
    try {
      const vendor = JSON.parse(jsonInput);
      
      // WALIDACJA
      const validation = validate(vendor);
      
      if (!validation.success) {
        showMessage(`Validation errors:\n${validation.errors?.join('\n')}`);
        return;
      }
      
      const isEdit = view === 'edit';
      const url = isEdit ? `${API_URL}/vendors?id=eq.${editingVendor?.id}` : `${API_URL}/vendors`;
      
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 
          ...headers, 
          'Prefer': 'return=representation',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...validation.data,
          created_by: session.user.id
        })
      });
      
      if (res.ok) {
        showMessage(`Vendor ${isEdit ? 'updated' : 'created'}`);
        setView('list');
        setJsonInput('');
        setEditingVendor(null);
        loadVendors();
      } else {
        const errorData = await res.json();
        showMessage(`Error saving vendor: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        showMessage('Invalid JSON format');
      } else {
        showMessage('Error processing vendor data');
      }
    }
  };

  const deleteVendor = async (id: string): Promise<void> => {
    if (!session || !confirm('Delete this vendor?')) return;
    
    try {
      const res = await fetch(`${API_URL}/vendors?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (res.ok) {
        showMessage('Vendor deleted successfully');
        loadVendors();
      } else {
        showMessage('Error deleting vendor');
      }
    } catch {
      showMessage('Error deleting vendor');
    }
  };

  const startEdit = (vendor: Vendor): void => {
    setEditingVendor(vendor);
    setJsonInput(JSON.stringify(vendor, null, 2));
    setView('edit');
  };

  const startAdd = (): void => {
    setJsonInput(JSON.stringify({
      slug: "example-app",
      name: "Example App",
      description: "Application description",
      schema: { tables: [] }
    }, null, 2));
    setView('add');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Show login screen if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-semibold mb-6 text-center">Vendor Management</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold">Vendor Management</h1>
              <p className="text-sm text-gray-500">Welcome, {session.user.email}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={startAdd}
                className="bg-gray-900 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800"
              >
                Add Vendor
              </button>
              <button 
                onClick={signOut}
                className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-3 bg-white border rounded-md text-sm flex justify-between items-center">
              <span>{message}</span>
              <button onClick={clearMessage} className="ml-4 text-gray-500 hover:text-gray-700">×</button>
            </div>
          )}

          <div className="space-y-4">
            {vendors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No vendors found</p>
                <button onClick={startAdd} className="bg-gray-900 text-white px-4 py-2 text-sm rounded-md">
                  Create your first vendor
                </button>
              </div>
            ) : (
              vendors.map((vendor) => (
                <div key={vendor.id} className="bg-white border rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      <p className="text-gray-600 text-sm">/{vendor.slug}</p>
                      <p className="text-gray-500 text-sm mt-1">{vendor.description}</p>
                      <div className="mt-3 text-xs text-gray-500">
                        {vendor.schema?.tables?.length || 0} tables • {new Date(vendor.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(vendor)}
                        className="border px-3 py-1 text-xs rounded-md hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteVendor(vendor.id)}
                        className="text-red-600 border border-red-300 px-3 py-1 text-xs rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => setView('list')}
            className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50 mr-4"
          >
            Back
          </button>
          <h1 className="text-2xl font-semibold">
            {view === 'add' ? 'Add Vendor' : 'Edit Vendor'}
          </h1>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-white border rounded-md text-sm flex justify-between items-center">
            <pre className="whitespace-pre-wrap text-sm">{message}</pre>
            <button onClick={clearMessage} className="ml-4 text-gray-500 hover:text-gray-700">×</button>
          </div>
        )}

        <div className="bg-white border rounded-lg p-6">
          <label className="block text-sm font-medium mb-2">JSON Configuration</label>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-96 font-mono text-sm border rounded-md p-4"
            placeholder="Paste your vendor JSON configuration..."
          />
          
          <div className="mt-6 flex gap-3">
            <button
              onClick={saveVendor}
              className="bg-gray-900 text-white px-6 py-2 text-sm rounded-md hover:bg-gray-800"
            >
              {view === 'add' ? 'Create' : 'Update'}
            </button>
            
            <button
              onClick={() => setView('list')}
              className="border px-6 py-2 text-sm rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}