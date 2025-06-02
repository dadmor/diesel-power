// ===== src/components/Chat.tsx - POPRAWIONY =====
import React, { useState } from 'react';
import { createVendorApp } from '../lib/generator';
import { CreateVendorTag } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  vendorTag?: CreateVendorTag; // zmieniono z CreateVendorTag | null na CreateVendorTag | undefined
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Opisz aplikację którą chcesz stworzyć!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseMessage = (content: string): CreateVendorTag | undefined => { // zmieniono null na undefined
    const match = content.match(/<create_vendor_app\s+name="([^"]+)"\s+slug="([^"]+)"\s+schema="([^"]+)">/);
    return match ? { name: match[1], slug: match[2], schema: match[3] } : undefined; // zmieniono null na undefined
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
      
      // Teraz vendorTag jest CreateVendorTag | undefined, więc pasuje do Message interface
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

  return (
    <div className="max-w-4xl mx-auto p-6">
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
    </div>
  );
};