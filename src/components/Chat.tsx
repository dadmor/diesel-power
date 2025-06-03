// ===== src/components/Chat.tsx =====
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

  const lastVendorMessage = [...messages].reverse().find(m => m.vendorTag);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with golden ratio proportions */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light tracking-tight text-slate-900">Generator Aplikacji</h1>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="text-slate-600 hover:text-slate-900 transition-colors duration-200 text-sm font-medium"
            >
              ← Panel
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Chat Panel - 3 columns (golden ratio) */}
        <div className="lg:col-span-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="h-[70vh] flex flex-col p-8">
            <div className="flex-1 overflow-y-auto space-y-6 mb-8">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-6 py-4 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.vendorTag && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-slate-700">
                        <span className="text-xs font-medium text-emerald-700">Generuję:</span>
                        <p className="text-sm mt-1">{message.vendorTag.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Opisz swoją aplikację..."
                className="flex-1 px-6 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl disabled:opacity-50 transition-all duration-200 text-sm font-medium"
              >
                Wyślij
              </button>
            </form>
          </div>
        </div>

        {/* Schema Preview Panel - 2 columns (golden ratio) */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-8">
            <h2 className="text-xl font-light text-slate-900 mb-6">Podgląd Schema</h2>
            {!lastVendorMessage?.vendorTag ? (
              <div className="text-center text-slate-500 py-16">
                <div className="text-4xl mb-4 opacity-60">📊</div>
                <p className="text-sm">Schema pojawi się po wygenerowaniu</p>
              </div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  try {
                    const schema = parseSchema(lastVendorMessage.vendorTag.schema);
                    return <SimpleSchemaPreview schema={schema} vendorName={lastVendorMessage.vendorTag.name} />;
                  } catch (error) {
                    return (
                      <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4">
                        <p className="text-red-800 text-sm">Błąd parsowania schema</p>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};