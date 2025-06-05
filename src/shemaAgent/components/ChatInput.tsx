// src/shemaAgent/components/ChatInput.tsx
import React from "react";
import { LAYERS_CONFIG } from "../LAYERS";
import { LayerType } from "../types";
import { ChatInput as ThemedChatInput } from "@/themes/default"; // <-- DODAJ TO!

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  currentLayer: LayerType;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  loading,
  currentLayer,
}) => {
  const layerConfig = LAYERS_CONFIG[currentLayer];

  if (!layerConfig) {
    console.error('Brak konfiguracji dla warstwy:', currentLayer);
    return null;
  }

  return (
    <ThemedChatInput  // <-- ZMIEŃ NA ThemedChatInput
      value={input}
      onChange={setInput}
      onSubmit={onSubmit}
      placeholder={layerConfig.placeholder}
      description={layerConfig.description}
      loading={loading}
    />
  );
};

export default ChatInput;