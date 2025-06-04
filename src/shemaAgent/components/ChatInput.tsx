// ChatInput.tsx - Uproszczony bez ikon
import React from "react";
import { LAYERS_CONFIG } from "../LAYERS";
import { LayerType } from "../types";

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
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const layerConfig = LAYERS_CONFIG[currentLayer];

  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={layerConfig.placeholder}
          className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={onSubmit}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "..." : "Wyślij"}
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {layerConfig.description}
      </div>
    </div>
  );
};

export default ChatInput;