// MessageList.tsx - Z auto-scroll do dołu
import React, { useEffect, useRef } from "react";
import { Message, LayerType } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { ChevronRightCircle } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onLayerChange?: (layer: LayerType) => void;
}

const getNextLayerForTag = (tagName: string): LayerType | null => {
  for (const config of Object.values(LAYERS_CONFIG)) {
    const tag = config.tags.find((t) => t.name === tagName);
    if (tag) return tag.nextLayer as LayerType | null;
  }
  return null;
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  onLayerChange,
}) => {
  // Ref do kontenera z wiadomościami
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Funkcja do przewijania na dół
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  // Auto-scroll po każdej zmianie wiadomości lub loading
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto p-4 space-y-4 flex-1"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.type === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="max-w-xs lg:max-w-md">
            <div
              className={`p-3 rounded-lg ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
            {msg.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {msg.tags.map((tag, i) => {
                  const nextLayer = getNextLayerForTag(tag);
                  if (nextLayer && onLayerChange) {
                    return (
                      <button
                        key={i}
                        onClick={() => onLayerChange(nextLayer)}
                        className="shadow-md bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-sm rounded cursor-pointer transition-colors inline-flex items-center gap-2"
                        title={`Przejdź do warstwy: ${nextLayer}`}
                      >
                        {tag}
                        <ChevronRightCircle size={14} />
                      </button>
                    );
                  }
                  return (
                    <span
                      key={i}
                      className="bg-green-400 text-white px-3 py-2 text-sm rounded"
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* Niewidoczny element na końcu do scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;