// ===== src/components/Chat.tsx ===== (Enhanced Version)
import React, { useState } from 'react';
import { createVendorApp, parseSchema } from '../lib/generator';
import { updateVendorSchema, createTables } from '../lib/supabase';
import { CreateVendorTag, Vendor } from '../types';
import { SimpleSchemaPreview } from './SimpleSchemaPreview';
import { Layout, Button, Input, Card } from './shared';
import { Edit3, Save, Plus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  vendorTag?: CreateVendorTag;
}

interface ChatProps {
  editingVendor?: Vendor; // Optional vendor to edit
  onSave?: (vendor: Vendor) => void; // Callback when editing is complete
}

export const Chat: React.FC<ChatProps> = ({ editingVendor, onSave }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: editingVendor 
        ? `Edytujesz aplikację "${editingVendor.name}". Opisz jakie zmiany chcesz wprowadzić!`
        : 'Opisz aplikację którą chcesz stworzyć!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(editingVendor || null);

  const parseMessage = (content: string): CreateVendorTag | undefined => {
    const match = content.match(/<create_vendor_app\s+name="([^"]+)"\s+slug="([^"]+)"\s+schema="([^"]+)">/);
    return match ? { name: match[1], slug: match[2], schema: match[3] } : undefined;
  };

  const parseEditMessage = (content: string): CreateVendorTag | undefined => {
    const match = content.match(/<edit_vendor_app\s+name="([^"]+)"\s+schema="([^"]+)">/);
    if (match && currentVendor) {
      return { name: match[1], slug: currentVendor.slug, schema: match[2] };
    }
    return undefined;
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const endpoint = editingVendor ? '/api/chat/edit' : '/api/chat';
      const payload = editingVendor 
        ? { 
            message: userMessage, 
            currentVendor: {
              name: currentVendor?.name,
              schema: currentVendor?.schema
            }
          }
        : { message: userMessage };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      const vendorTag = parseMessage(response) || parseEditMessage(response);
      setMessages(prev => [...prev, { role: 'assistant', content: response, vendorTag }]);

      if (vendorTag) {
        try {
          if (editingVendor && currentVendor) {
            // Update existing vendor
            const schema = parseSchema(vendorTag.schema);
            await updateVendorSchema(currentVendor.id, schema);
            await createTables(currentVendor.slug, schema.tables);
            
            const updatedVendor = { ...currentVendor, name: vendorTag.name, schema };
            setCurrentVendor(updatedVendor);
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ Aplikacja "${vendorTag.name}" zaktualizowana!`
            }]);

            if (onSave) {
              onSave(updatedVendor);
            }
          } else {
            // Create new vendor
            const newVendor = await createVendorApp(vendorTag);
            setCurrentVendor(newVendor);
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ Aplikacja "${vendorTag.name}" utworzona! Przechodzę do trybu edycji...`
            }]);

            // Auto-transition to edit mode after 1 second
            setTimeout(() => {
              window.location.href = `/edit/${newVendor.id}`;
            }, 1000);
          }
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
  const displayVendor = currentVendor || (lastVendorMessage?.vendorTag ? {
    name: lastVendorMessage.vendorTag.name,
    schema: parseSchema(lastVendorMessage.vendorTag.schema)
  } : null);

  return (
    <Layout 
      title={editingVendor ? `Edycja: ${editingVendor.name}` : "Generator Aplikacji"}
      subtitle={editingVendor ? "Opisz zmiany które chcesz wprowadzić" : undefined}
      actions={
        <div className="flex space-x-3">
          {editingVendor && currentVendor && (
            <Button 
              variant="secondary" 
              icon={Save}
              onClick={() => onSave?.(currentVendor)}
            >
              Zapisz i wyjdź
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.location.href = '/dashboard'}>
            ← Panel
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Chat Panel */}
        <Card className="lg:col-span-3 p-0">
          <div className="h-[70vh] flex flex-col p-8">
            <div className="flex-1 overflow-y-auto space-y-6 mb-8">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {isLoading && <LoadingBubble />}
            </div>
            
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={editingVendor 
                  ? "Opisz zmiany do wprowadzenia..."
                  : "Opisz swoją aplikację..."
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                Wyślij
              </Button>
            </form>
          </div>
        </Card>

        {/* Schema Preview */}
        <Card className="lg:col-span-2" header={
          <h2 className="text-xl font-light text-slate-900">
            {editingVendor ? 'Aktualna Schema' : 'Podgląd Schema'}
          </h2>
        }>
          {!displayVendor ? (
            <div className="text-center text-slate-500 py-16">
              <div className="text-4xl mb-4 opacity-60">📊</div>
              <p className="text-sm">Schema pojawi się po wygenerowaniu</p>
            </div>
          ) : (
            <SimpleSchemaPreview 
              schema={displayVendor.schema} 
              vendorName={displayVendor.name} 
            />
          )}
        </Card>
      </div>
    </Layout>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[75%] px-6 py-4 rounded-2xl ${
      message.role === 'user' 
        ? 'bg-slate-900 text-white shadow-lg' 
        : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <p className="text-sm leading-relaxed">{message.content}</p>
      {message.vendorTag && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-slate-700">
          <span className="text-xs font-medium text-emerald-700">
            {message.content.includes('edit_vendor_app') ? 'Aktualizuję:' : 'Generuję:'}
          </span>
          <p className="text-sm mt-1">{message.vendorTag.name}</p>
        </div>
      )}
    </div>
  </div>
);

const LoadingBubble = () => (
  <div className="flex justify-start">
    <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm">
      <div className="flex items-center space-x-2">
        {[0, 100, 200].map(delay => (
          <div key={delay} className={`w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-${delay}`} />
        ))}
      </div>
    </div>
  </div>
);