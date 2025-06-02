// Chat.tsx - Updated version with backend integration
import React, { useState } from 'react';
import { parseVendorTag } from './AppGenerator';
import { CreateVendorTag } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  vendorTag?: CreateVendorTag;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Cześć! Opowiedz mi o aplikacji, którą chcesz stworzyć. Na przykład: "Potrzebuję aplikację do zarządzania produktami i zamówieniami w sklepie"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseMessage = (content: string): CreateVendorTag | null => {
    const tagRegex = /<create_vendor_app\s+name="([^"]+)"\s+slug="([^"]+)"\s+schema="([^"]+)">/;
    const match = content.match(tagRegex);
    
    if (match) {
      return {
        name: match[1],
        slug: match[2],
        schema: match[3]
      };
    }
    return null;
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.response;
    } catch (error) {
      console.error('Backend communication error:', error);
      
      // Fallback to local responses if backend is unavailable
      return `Przepraszam, wystąpił problem z połączeniem do serwera. 
      
Sprawdź czy backend działa na http://localhost:3001

Możesz też przetestować ręcznie z przykładowymi aplikacjami:
- "sklep online" 
- "CRM dla klientów"
- "zarządzanie projektami"`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Dodaj wiadomość użytkownika
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Generuj odpowiedź z backend API
      const response = await generateResponse(userMessage);
      const vendorTag = parseMessage(response);

      // Dodaj odpowiedź asystenta
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response,
        vendorTag 
      }]);

      // Jeśli znaleziono tag, przetwórz go
      if (vendorTag) {
        try {
          await parseVendorTag(vendorTag);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Aplikacja "${vendorTag.name}" została utworzona! Możesz ją teraz sprawdzić pod adresem: /${vendorTag.slug}`
          }]);
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Wystąpił błąd podczas tworzenia aplikacji: ${error}`
          }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.'
      }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h1 className="text-xl font-bold">Generator Aplikacji Biznesowych</h1>
          <p className="text-blue-100">Opisz swoją aplikację, a ja ją dla Ciebie stworzę!</p>
          <div className="text-xs text-blue-200 mt-1">
            🤖 Powered by Google Gemini AI
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
                {message.vendorTag && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm">
                    <strong>Generuję aplikację:</strong> {message.vendorTag.name}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                Myślę... 🤖
              </div>
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
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Wyślij
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};