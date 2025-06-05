// src/themes/default/components/MessageDisplay.tsx
import React from "react";
import { Check, ChevronRightCircle } from "lucide-react";

interface MessageDisplayProps {
  text: string;
  type: "user" | "ai";
  onTagClick?: (tagName: string, nextLayer?: string) => void;
  getNextLayerForTag?: (tagName: string) => string | null;
  onTagEdit?: (tagName: string, params: Record<string, string>) => void;
}

// Komponent do renderowania treści z inline tagami
export const MessageContent: React.FC<{
  text: string;
  onTagClick?: (tagName: string, nextLayer?: string) => void;
  getNextLayerForTag?: (tagName: string) => string | null;
  onTagEdit?: (tagName: string, params: Record<string, string>) => void;
}> = ({ text, onTagClick, getNextLayerForTag, onTagEdit }) => {
  // Funkcja do parsowania tekstu z tagami i zamiany ich na komponenty
  const parseTextWithTags = (text: string) => {
    // Najpierw usuń wszystkie domykające tagi XML
    const cleanText = text.replace(/<\/\w+>/g, '');
    
    const tagRegex = /<(\w+)([^>]*)>/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = tagRegex.exec(cleanText)) !== null) {
      // Dodaj tekst przed tagiem
      if (match.index > lastIndex) {
        const textBefore = cleanText.slice(lastIndex, match.index);
        if (textBefore) {
          parts.push(
            <span key={`text-${keyCounter++}`}>{textBefore}</span>
          );
        }
      }

      const [fullMatch, tagName, paramsStr] = match;
      const nextLayer = getNextLayerForTag?.(tagName);
      
      // Parse parametrów
      const params: Record<string, string> = {};
      const paramRegex = /(\w+)="([^"]*)"/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
        params[paramMatch[1]] = paramMatch[2];
      }

      // Utwórz graficzny tag
      if (nextLayer && onTagClick) {
        parts.push(
          <div 
            key={`tag-${keyCounter++}`}
            className="w-full justify-between flex overflow-hidden gap-2 bg-green-500 text-white text-sm rounded-md transition-colors mt-3 mb-1 shadow-sm"
          >
            <button
              onClick={() => onTagEdit?.(tagName, params)}
              className="flex items-center gap-2 px-4 py-3 hover:bg-green-400 flex-1 text-left"
              title="Kliknij aby edytować"
            >
              <Check size={16} /> {tagName}
            </button>

            <button
              onClick={() => onTagClick(tagName, nextLayer)}
              className="border-l px-4 py-3 hover:bg-green-600 flex items-center gap-2"
              title={`Przejdź do warstwy: ${nextLayer}`}
            > 
              <ChevronRightCircle size={16} />{nextLayer}
            </button>
          </div>
        );
      } else {
        parts.push(
          <button
            key={`simple-tag-${keyCounter++}`}
            onClick={() => onTagEdit?.(tagName, params)}
            className="inline-flex items-center bg-green-400 text-white px-2 py-1 text-xs rounded-md mx-1 hover:bg-green-500 transition-colors"
            title="Kliknij aby edytować"
          >
            {tagName}
          </button>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Dodaj pozostały tekst po ostatnim tagu
    if (lastIndex < cleanText.length) {
      const remainingText = cleanText.slice(lastIndex);
      if (remainingText) {
        parts.push(
          <span key={`final-text-${keyCounter++}`}>{remainingText}</span>
        );
      }
    }

    // Jeśli nie ma tagów, zwróć oczyszczony tekst
    if (parts.length === 0) {
      return cleanText;
    }

    return parts;
  };

  const content = parseTextWithTags(text);

  return (
    <div className="whitespace-pre-wrap">
      {Array.isArray(content)
        ? content
        : <span>{content}</span>}
    </div>
  );
};

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  text,
  type,
  onTagClick,
  getNextLayerForTag,
  onTagEdit,
}) => {
  return (
    <div
      className={`p-3 rounded-lg ${
        type === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
      }`}
    >
      <MessageContent
        text={text}
        onTagClick={type === "ai" ? onTagClick : undefined}
        getNextLayerForTag={getNextLayerForTag}
        onTagEdit={type === "ai" ? onTagEdit : undefined}
      />
    </div>
  );
};

export default MessageDisplay;