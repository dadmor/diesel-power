// TagBuilder.tsx - Uproszczony główny komponent
import React, { useState } from "react";
import { Message, LayerType } from "./types";
import { parseTags, processTag } from "./schemaProcessor";
import { sendToGemini } from "./apiService";
import { ChatInput, LayerTabs, MessageList, SchemaDisplay } from "./components";
import { LAYERS_CONFIG, DEFAULT_SCHEMA_STATE } from "./LAYERS";

// Funkcje pomocnicze przeniesione z LAYERS.ts
const LAYERS = Object.entries(LAYERS_CONFIG).map(([id, config]) => ({
  id: id as LayerType,
  name: config.name,
  description: config.description
}));

const getDefaultMessage = (layerType: LayerType): string => {
  const messages = {
    concept: "Napisz jaki system chcesz stworzyć",
    database: "Na podstawie koncepcji, jakie tabele i relacje potrzebujesz?",
    ui: "Jakie strony i interfejs chcesz dla swojej aplikacji?",
    refine: "Jakie komponenty i widżety chcesz w aplikacji?"
  };
  return messages[layerType];
};

const TagBuilder: React.FC = () => {
  const [currentLayer, setCurrentLayer] = useState<LayerType>("concept");
  const [schema, setSchema] = useState(DEFAULT_SCHEMA_STATE);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: getDefaultMessage("concept"), 
      type: "ai", 
      tags: [] 
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLayerChange = (newLayer: LayerType) => {
    setCurrentLayer(newLayer);
    
    const hasLayerMessages = messages.some(msg => 
      msg.text.includes(getDefaultMessage(newLayer))
    );
    
    if (!hasLayerMessages) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: getDefaultMessage(newLayer),
          type: "ai",
          tags: []
        }
      ]);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!input.trim() || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: input,
        type: "user",
        tags: [],
      },
    ]);

    setLoading(true);

    try {
      const aiResponse = await sendToGemini(input, currentLayer, schema, messages);
      const tags = parseTags(aiResponse);
      const cleanResponse = aiResponse.replace(/<[^>]*>/g, "");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: cleanResponse,
          type: "ai",
          tags: tags.map((t) => t.tag),
        },
      ]);

      let updatedData = schema[currentLayer];
      tags.forEach(({ tag, params }) => {
        updatedData = processTag(currentLayer, tag, params, updatedData);
      });

      setSchema((prev) => ({ ...prev, [currentLayer]: updatedData }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `❌ Błąd: ${errorMessage}`,
          type: "ai",
          tags: [],
        },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="h-screen bg-gray-50 p-4">
      <div className="h-full flex gap-6">
        <SchemaDisplay
          schema={schema}
          currentLayer={currentLayer}
          layers={LAYERS}
        />
        
        <div className="bg-white rounded-lg shadow-sm border flex-1 flex flex-col">
          <div className="px-4 py-3 border-b flex justify-between">
            <div className="flex items-center gap-1 py-5">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <div className="w-4 h-4 bg-green-500 rounded"></div>
            </div>
            <LayerTabs
              layers={LAYERS}
              currentLayer={currentLayer}
              setCurrentLayer={handleLayerChange}
              schema={schema}
            />
          </div>

          <MessageList 
            messages={messages} 
            loading={loading}
            onLayerChange={handleLayerChange}
          />

          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            currentLayer={currentLayer}
          />
        </div>
      </div>
    </div>
  );
};

export default TagBuilder;