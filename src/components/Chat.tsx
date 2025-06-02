// src/components/Chat.tsx
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
    } catch {
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
  };

  const handleCancelEdit = () => {
    setEditingVendor(null);
    setViewMode('dashboard');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setEditingVendor(null);
  };

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
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chat Panel */}
        <div className="bg-white rounded-lg shadow p-8 flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Generator Aplikacji</h2>
          <div className="flex-1 overflow-y-auto space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-6 rounded-lg whitespace-pre-wrap ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}>
                  <p className="text-base">{message.content}</p>
                  {message.vendorTag && (
                    <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded text-base text-gray-900">
                      <strong>Generuję:</strong> {message.vendorTag.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-6 rounded-lg">
                  <p className="text-base">Myślę... 🤖</p>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Opisz swoją aplikację..."
                className="flex-1 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 text-base"
              >
                Wyślij
              </button>
            </div>
          </form>
        </div>

        {/* Schema Preview Panel */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Schema Preview</h2>
          {messages.find(m => m.vendorTag) ? (
            (() => {
              const lastVendorMessage = [...messages].reverse().find(m => m.vendorTag);
              if (!lastVendorMessage?.vendorTag) {
                return <div className="text-gray-500 text-base">Brak schema do wyświetlenia</div>;
              }
              try {
                const schema = parseSchema(lastVendorMessage.vendorTag.schema);
                return <SchemaVisualizer schema={schema} vendorName={lastVendorMessage.vendorTag.name} />;
              } catch (error) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-800 text-base">Błąd parsowania schema:</p>
                    <pre className="mt-4 text-base text-red-600">{String(error)}</pre>
                  </div>
                );
              }
            })()
          ) : (
            <div className="text-center text-gray-500 text-base py-12">
              <div className="text-5xl mb-4">📊</div>
              <p>Schema aplikacji pojawi się tutaj po wygenerowaniu</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
