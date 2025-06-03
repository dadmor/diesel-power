// src/components/Chat.tsx
import React, { useState } from 'react';
import { createVendorApp, parseSchema } from '../lib/generator';
import { CreateVendorTag } from '../types';
import { SimpleSchemaPreview } from './SimpleSchemaPreview';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  vendorTag?: CreateVendorTag;
}

export const Chat: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Generator Aplikacji</h1>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Powrót do listy
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Panel */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-lg whitespace-pre-wrap ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}>
                  <p>{message.content}</p>
                  {message.vendorTag && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-gray-900">
                      <strong>Generuję:</strong> {message.vendorTag.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p>Myślę... 🤖</p>
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Opisz swoją aplikację..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                Wyślij
              </button>
            </div>
          </form>
        </div>

        {/* Schema Preview Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Podgląd Schema</h2>
          {(() => {
            const lastVendorMessage = [...messages].reverse().find(m => m.vendorTag);
            if (!lastVendorMessage?.vendorTag) {
              return (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-5xl mb-4">📊</div>
                  <p>Schema aplikacji pojawi się tutaj po wygenerowaniu</p>
                </div>
              );
            }
            
            try {
              const schema = parseSchema(lastVendorMessage.vendorTag.schema);
              return <SimpleSchemaPreview schema={schema} vendorName={lastVendorMessage.vendorTag.name} />;
            } catch (error) {
              return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">Błąd parsowania schema:</p>
                  <pre className="mt-2 text-sm text-red-600">{String(error)}</pre>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};