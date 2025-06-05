// MessageList.tsx - Z inline tagami w treści wiadomości
import React, { useEffect, useRef } from "react";
import { Message, LayerType } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { Check, ChevronRightCircle } from "lucide-react";

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

// Komponent do renderowania treści z inline tagami
const MessageContent: React.FC<{
  text: string;
  onLayerChange?: (layer: LayerType) => void;
}> = ({ text, onLayerChange }) => {
  // Funkcja do parsowania tekstu z tagami i zamiany ich na komponenty
  const parseTextWithTags = (text: string) => {
    const tagRegex = /<(\w+)([^>]*)>/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = tagRegex.exec(text)) !== null) {
      // Dodaj tekst przed tagiem
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        if (textBefore) {
          parts.push(textBefore);
        }
      }

      const [fullMatch, tagName] = match;
      const nextLayer = getNextLayerForTag(tagName);

      // Utwórz graficzny tag
      if (nextLayer && onLayerChange) {
        parts.push(
          <button
            key={keyCounter++}
            onClick={() => onLayerChange(nextLayer)}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 text-sm rounded-md cursor-pointer transition-colors   mt-3 shadow-sm"
            title={`Przejdź do warstwy: ${nextLayer}`}
          >
            <Check />
            {tagName}
            <ChevronRightCircle size={16} />
          </button>
        );
      } else {
        parts.push(
          <span
            key={keyCounter++}
            className="inline-flex items-center bg-green-400 text-white px-2 py-1 text-xs rounded-md mx-1"
          >
            {tagName}
          </span>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Dodaj pozostały tekst po ostatnim tagu
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    // Jeśli nie ma tagów, zwróć oryginalny tekst
    if (parts.length === 0) {
      return text;
    }

    return parts;
  };

  const content = parseTextWithTags(text);

  return (
    <div className="whitespace-pre-wrap">
      {Array.isArray(content)
        ? content.map((part, index) =>
            typeof part === "string" ? <span key={index}>{part}</span> : part
          )
        : content}
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  onLayerChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div ref={containerRef} className="overflow-y-auto p-4 space-y-4 flex-1">
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
              <MessageContent
                text={msg.text}
                onLayerChange={msg.type === "ai" ? onLayerChange : undefined}
              />
            </div>
            {/* Usuwamy osobną sekcję z tagami, bo teraz są inline */}
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

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
