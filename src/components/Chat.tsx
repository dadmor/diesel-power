// src/components/Chat.tsx - Zaktualizowany z wieloma trybami
import React, { useState } from 'react';
import { createVendorApp, parseSchema } from '../lib/generator';
import { CreateVendorTag, Vendor } from '../types';
import { SchemaVisualizer } from './SchemaVisualizer';
import { Dashboard } from './Dashboard';
import { SchemaEditor } from './SchemaEditor';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  vendorTag?: CreateVendorTag;
}

type ViewMode = 'dashboard' | 'create' | 'edit';

export const Chat: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Opisz aplikację którą chcesz stworzyć!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseMessage = (content: string): CreateVendorTag | undefined => {
    const match = content.match(/<create_vendor_app\s+name="([^"]+)"\s+slug="([^"]+)"\s+schema="([^"]+)">/);
    return match ? { name: match[1], slug: match[2], schema: match[3] } : undefined;
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      return data.response || 'Błąd odpowiedzi';
    } catch {
      return 'Backend niedostępny. Przykłady: "sklep online", "CRM", "zarządzanie projektami"';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await generateResponse(userMessage);
      const vendorTag = parseMessage(response);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response, vendorTag }]);

      if (vendorTag) {
        try {
          await createVendorApp(vendorTag);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Aplikacja "${vendorTag.name}" utworzona! /${vendorTag.slug}`
          }]);
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Błąd: ${error}`
          }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Wystąpił błąd.' }]);
    }
    setIsLoading(false);
  };

  const handleCreateNew = () => {
    setViewMode('create');
    setMessages([
      { role: 'assistant', content: 'Opisz aplikację którą chcesz stworzyć!' }
    ]);
    setInput('');
  };

  const handleEditApp = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setViewMode('edit');
  };

  const handleSaveEdit = (updatedVendor: Vendor) => {
    setEditingVendor(null);
    setViewMode('dashboard');
    // Można dodać toast notification o sukcesie
  };

  const handleCancelEdit = () => {
    setEditingVendor(null);
    setViewMode('dashboard');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setEditingVendor(null);
  };

  // Render based on view mode
  if (viewMode === 'dashboard') {
    return (
      <Dashboard 
        onCreateNew={handleCreateNew}
        onEditApp={handleEditApp}
      />
    );
  }

  if (viewMode === 'edit' && editingVendor) {
    return (
      <SchemaEditor 
        vendor={editingVendor}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  if (viewMode === 'create') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Back to Dashboard Button */}
        <div className="mb-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span>Powrót do panelu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Panel */}
          <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h1 className="text-xl font-bold">Generator Aplikacji</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}>
                    {message.content}
                    {message.vendorTag && (
                      <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-black">
                        <strong>Generuję:</strong> {message.vendorTag.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">Myślę... 🤖</div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Opisz swoją aplikację..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Wyślij
                </button>
              </div>
            </form>
          </div>

          {/* Schema Visualization Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Schema Preview</h2>
            
            {messages.find(m => m.vendorTag) ? (
              (() => {
                const lastVendorMessage = [...messages].reverse().find(m => m.vendorTag);
                if (!lastVendorMessage?.vendorTag) return <div className="text-gray-500">Brak schema do wyświetlenia</div>;
                
                try {
                  const schema = parseSchema(lastVendorMessage.vendorTag.schema);
                  return <SchemaVisualizer schema={schema} vendorName={lastVendorMessage.vendorTag.name} />;
                } catch (error) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">Błąd parsowania schema:</p>
                      <pre className="text-sm text-red-600 mt-2">{String(error)}</pre>
                    </div>
                  );
                }
              })()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <p>Schema aplikacji pojawi się tutaj po wygenerowaniu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};