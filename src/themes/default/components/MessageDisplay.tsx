// src/themes/default/components/MessageDisplay.tsx
import React from 'react';
import { Check, ChevronRightCircle } from 'lucide-react';

interface MessageDisplayProps {
  text: string;
  type: 'user' | 'ai';
  onTagClick?: (tagName: string, nextLayer?: string) => void;
  getNextLayerForTag?: (tagName: string) => string | null;
}

// Komponent do renderowania treści z inline tagami
export const MessageContent: React.FC<{
  text: string;
  onTagClick?: (tagName: string, nextLayer?: string) => void;
  getNextLayerForTag?: (tagName: string) => string | null;
}> = ({ text, onTagClick, getNextLayerForTag }) => {
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
      const nextLayer = getNextLayerForTag?.(tagName);

      // Utwórz graficzny tag
      if (nextLayer && onTagClick) {
        parts.push(
          <button
            key={keyCounter++}
            onClick={() => onTagClick(tagName, nextLayer)}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 text-sm rounded-md cursor-pointer transition-colors mt-3 shadow-sm"
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

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  text,
  type,
  onTagClick,
  getNextLayerForTag
}) => {
  return (
    <div
      className={`p-3 rounded-lg ${
        type === "user"
          ? "bg-blue-500 text-white"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      <MessageContent
        text={text}
        onTagClick={type === "ai" ? onTagClick : undefined}
        getNextLayerForTag={getNextLayerForTag}
      />
    </div>
  );
};
export default MessageDisplay