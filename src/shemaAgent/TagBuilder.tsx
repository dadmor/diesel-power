// src/shemaAgent/TagBuilder.tsx - ZAKTUALIZOWANY z theme
import React, { useState, useEffect } from "react";
import { Message, LayerType, SchemaState } from "./types";
import { parseTags, processTag } from "./schemaProcessor";
import { sendToGemini } from "./apiService";
import { ChatInput, LayerTabs, MessageList, SchemaDisplay } from "./components";
import { LAYERS_CONFIG, DEFAULT_SCHEMA_STATE } from "./LAYERS";
import { ChatContainer, ChatHeader } from "@/themes/default";


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

// Funkcja do wczytania danych PRZED renderem
const getInitialData = () => {
  try {
    const saved = localStorage.getItem('schema_session');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        currentLayer: data.currentLayer || "concept",
        schema: data.schema || DEFAULT_SCHEMA_STATE,
        messages: data.messages || [{ id: 1, text: getDefaultMessage("concept"), type: "ai", tags: [] }]
      };
    }
  } catch (error) {
    console.error('Błąd wczytywania localStorage:', error);
  }
  
  return {
    currentLayer: "concept" as LayerType,
    schema: DEFAULT_SCHEMA_STATE,
    messages: [{ id: 1, text: getDefaultMessage("concept"), type: "ai", tags: [] }]
  };
};

const TagBuilder: React.FC = () => {
  const initialData = getInitialData();
  
  const [currentLayer, setCurrentLayer] = useState<LayerType>(initialData.currentLayer);
  const [schema, setSchema] = useState<SchemaState>(initialData.schema);
  const [messages, setMessages] = useState<Message[]>(initialData.messages);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Zapisuj do localStorage
  useEffect(() => {
    localStorage.setItem('schema_session', JSON.stringify({
      currentLayer,
      schema,
      messages
    }));
  }, [currentLayer, schema, messages]);

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
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: aiResponse,
          type: "ai",
          tags: tags.map((t) => t.tag),
        },
      ]);

      let updatedData = schema[currentLayer];
      tags.forEach(({ tag, params }) => {
        updatedData = processTag(currentLayer, tag, params, updatedData);
      });

      setSchema((prev: any) => ({ ...prev, [currentLayer]: updatedData }));

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

  // Handler dla wczytania projektu z bazy
  const handleProjectLoad = (projectSchema: SchemaState) => {
    setSchema(projectSchema);
    setCurrentLayer("concept");
    
    // Dodaj wiadomość o wczytaniu
    setMessages([{
      id: Date.now(),
      text: "Projekt został wczytany z bazy danych. Możesz kontynuować edycję.",
      type: "ai",
      tags: []
    }]);
  };

  // Handler dla resetu
  const handleReset = () => {
    localStorage.removeItem('schema_session');
    setSchema(DEFAULT_SCHEMA_STATE);
    setCurrentLayer("concept");
    setMessages([{
      id: 1,
      text: getDefaultMessage("concept"),
      type: "ai",
      tags: []
    }]);
  };

  return (
    <div className="h-screen bg-gray-50 p-4">
      <div className="h-full flex gap-6">
        <SchemaDisplay
          schema={schema}
          currentLayer={currentLayer}
          layers={LAYERS}
        />
        
        <ChatContainer>
          <ChatHeader>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-500">Auto-save</span>
              </div>
            </div>
            
            <LayerTabs
              layers={LAYERS}
              currentLayer={currentLayer}
              setCurrentLayer={handleLayerChange}
              schema={schema}
            />
          </ChatHeader>

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
        </ChatContainer>
      </div>
    </div>
  );
};

export default TagBuilder;