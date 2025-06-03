// ===== src/components/Chat.tsx ===== (KOMPLETNY FIX)
import React, { useState } from "react";
import { createVendorApp, parseSchema } from "../lib/generator";
import { updateVendorSchema, createTables } from "../lib/supabase";
import { CreateVendorTag, Vendor } from "../types";
import { SimpleSchemaPreview } from "./SimpleSchemaPreview";
import { Button, Input } from "./shared";
import { Save, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  vendorTag?: CreateVendorTag;
}

interface ChatProps {
  editingVendor?: Vendor;
  onSave?: (vendor: Vendor) => void;
}

export const Chat: React.FC<ChatProps> = ({ editingVendor, onSave }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: editingVendor
        ? `Edytujesz "${editingVendor.name}". Opisz zmiany!`
        : "Opisz aplikację którą chcesz stworzyć!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(
    editingVendor || null
  );

  const parseMessage = (content: string): CreateVendorTag | undefined => {
    const match = content.match(
      /<create_vendor_app\s+name="([^"]+)"\s+slug="([^"]+)"\s+schema="([^"]+)">/
    );
    return match
      ? { name: match[1], slug: match[2], schema: match[3] }
      : undefined;
  };

  const parseEditMessage = (content: string): CreateVendorTag | undefined => {
    const match = content.match(
      /<edit_vendor_app\s+name="([^"]+)"\s+schema="([^"]+)">/
    );
    if (match && currentVendor) {
      return { name: match[1], slug: currentVendor.slug, schema: match[2] };
    }
    return undefined;
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const endpoint = editingVendor ? "/api/chat/edit" : "/api/chat";
      const payload = editingVendor
        ? {
            message: userMessage,
            currentVendor: {
              name: currentVendor?.name,
              schema: currentVendor?.schema,
            },
          }
        : { message: userMessage };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data.response || "Błąd odpowiedzi";
    } catch {
      return 'Backend niedostępny. Przykłady: "sklep online", "CRM", "zarządzanie projektami"';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await generateResponse(userMessage);
      const vendorTag = parseMessage(response) || parseEditMessage(response);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, vendorTag },
      ]);

      if (vendorTag) {
        try {
          if (editingVendor && currentVendor) {
            const schema = parseSchema(vendorTag.schema);
            await updateVendorSchema(currentVendor.id, schema);
            await createTables(currentVendor.slug, schema.tables);

            const updatedVendor = {
              ...currentVendor,
              name: vendorTag.name,
              schema,
            };
            setCurrentVendor(updatedVendor);

            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `✅ Aplikacja "${vendorTag.name}" zaktualizowana!`,
              },
            ]);

            if (onSave) {
              onSave(updatedVendor);
            }
          } else {
            const newVendor = await createVendorApp(vendorTag);
            setCurrentVendor(newVendor);

            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `✅ Aplikacja "${vendorTag.name}" utworzona! Przechodzę do trybu edycji...`,
              },
            ]);

            setTimeout(() => {
              window.location.href = `/edit/${newVendor.id}`;
            }, 1000);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `❌ Błąd: ${error}`,
            },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Wystąpił błąd." },
      ]);
    }
    setIsLoading(false);
  };

  const lastVendorMessage = [...messages].reverse().find((m) => m.vendorTag);
  const displayVendor =
    currentVendor ||
    (lastVendorMessage?.vendorTag
      ? {
          name: lastVendorMessage.vendorTag.name,
          schema: parseSchema(lastVendorMessage.vendorTag.schema),
        }
      : null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Compact Header */}
      <div className=" border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-medium text-slate-900">
            {editingVendor
              ? `Edycja: ${editingVendor.name}`
              : "Generator Aplikacji"}
          </h1>
          {editingVendor && (
            <p className="text-xs text-slate-500">
              Opisz zmiany które chcesz wprowadzić
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {editingVendor && currentVendor && (
            <Button
              size="sm"
              variant="secondary"
              icon={Save}
              onClick={() => onSave?.(currentVendor)}
            >
              Zapisz
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => (window.location.href = "/dashboard")}
          >
            ← Panel
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Schema Preview - FIXED WIDTH I HEIGHT */}
        <div className="w-1/2 bg-slate-50 flex flex-col">
          <div className="flex-1 overflow-hidden px-4 pb-4 mt-4">
            <div className="bg-white rounded-lg border border-slate-200 h-full overflow-y-auto p-4">
              {!displayVendor ? (
                <div className="text-center text-slate-500 py-12">
                  <div className="text-3xl mb-3 opacity-60">📊</div>
                  <p className="text-sm">Schema pojawi się po wygenerowaniu</p>
                </div>
              ) : (
                <SimpleSchemaPreview
                  schema={displayVendor.schema}
                  vendorName={displayVendor.name}
                />
              )}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col ">
          {/* Messages - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </div>

          {/* Input - ALWAYS VISIBLE */}
          <div className=" p-4  flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2 w-full ">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  editingVendor ? "Opisz zmiany..." : "Opisz aplikację..."
                }
                disabled={isLoading}
                className="flex-1 py-2 text-sm w-full "
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="sm"
                icon={Send}
              >
                Wyślij
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div
    className={`flex ${
      message.role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
        message.role === "user"
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <p className="leading-relaxed">{message.content}</p>
      {message.vendorTag && (
        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-slate-700">
          <span className="text-xs font-medium text-emerald-700">
            {message.content.includes("edit_vendor_app")
              ? "Aktualizuję:"
              : "Generuję:"}
          </span>
          <p className="text-xs mt-1">{message.vendorTag.name}</p>
        </div>
      )}
    </div>
  </div>
);

const LoadingBubble = () => (
  <div className="flex justify-start">
    <div className="bg-slate-100 px-3 py-2 rounded-lg">
      <div className="flex items-center space-x-1">
        {[0, 100, 200].map((delay) => (
          <div
            key={delay}
            className={`w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-${delay}`}
          />
        ))}
      </div>
    </div>
  </div>
);
