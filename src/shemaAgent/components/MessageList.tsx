// src/shemaAgent/components/MessageList.tsx - ZAKTUALIZOWANY z edycją tagów
import React, { useEffect, useRef } from "react";
import { Message, LayerType, ParsedTag } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { LoadingSpinner, MessageDisplay } from "@/themes/default";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onLayerChange?: (layer: LayerType) => void;
  onTagEdit?: (messageId: number, tag: ParsedTag, updatedTag: ParsedTag) => void;
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
  onTagEdit,
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

  const handleTagClick = (_tagName: string, nextLayer?: string) => {
    if (nextLayer && onLayerChange) {
      onLayerChange(nextLayer as LayerType);
    }
  };

  const handleTagEditClick = (messageId: number) => (tagName: string, params: Record<string, string>) => {
    if (onTagEdit) {
      const originalTag: ParsedTag = { tag: tagName, params };
      // Można tu dodać logikę do znajdowania oryginalnego tagu w wiadomości
      // Na razie przekazujemy ten sam tag jako oryginalny i zaktualizowany
      onTagEdit(messageId, originalTag, originalTag);
    }
  };

  return (
    <div ref={containerRef} className="overflow-y-auto p-4 space-y-4 flex-1">
      {messages.map((msg, index) => (
        <div
          key={`message-${msg.id}-${index}`}
          className={`flex ${
            msg.type === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="max-w-xs lg:max-w-md">
            <MessageDisplay
              text={msg.text}
              type={msg.type}
              onTagClick={handleTagClick}
              getNextLayerForTag={getNextLayerForTag}
              onTagEdit={handleTagEditClick(msg.id)}
            />
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 p-3 rounded-lg">
            <LoadingSpinner />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;