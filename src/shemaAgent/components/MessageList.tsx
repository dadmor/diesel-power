// src/shemaAgent/components/MessageList.tsx - ZAKTUALIZOWANY z theme
import React, { useEffect, useRef } from "react";
import { Message, LayerType } from "../types";
import { LAYERS_CONFIG } from "../LAYERS";
import { LoadingSpinner, MessageDisplay } from "@/themes/default";


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
            <MessageDisplay
              text={msg.text}
              type={msg.type}
              onTagClick={handleTagClick}
              getNextLayerForTag={getNextLayerForTag}
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