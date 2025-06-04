// src/shemaAgent/TagBuilder.tsx - AKTUALIZACJA z localStorage

import React, { useState, useEffect } from "react";
import { Message, LayerType } from "./types";
import { parseTags, processTag } from "./schemaProcessor";
import { sendToGemini } from "./apiService";
import { ChatInput, LayerTabs, MessageList, SchemaDisplay } from "./components";
import { LAYERS_CONFIG, DEFAULT_SCHEMA_STATE } from "./LAYERS";

// Funkcje localStorage
const STORAGE_KEY = 'schema_builder_session';

const saveToStorage = (data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Błąd zapisu do localStorage:', error);
  }
};

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Błąd odczytu z localStorage:', error);
    return null;
  }
};

const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

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
  const [sessionId, setSessionId] = useState<string>("");

  // WCZYTANIE z localStorage przy starcie
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setCurrentLayer(savedData.currentLayer || "concept");
      setSchema(savedData.schema || DEFAULT_SCHEMA_STATE);
      setMessages(savedData.messages || [{ 
        id: 1, 
        text: getDefaultMessage("concept"), 
        type: "ai", 
        tags: [] 
      }]);
      setSessionId(savedData.sessionId || generateSessionId());
      console.log('📁 Wczytano sesję z localStorage');
    } else {
      setSessionId(generateSessionId());
    }
  }, []);

  // AUTOMATYCZNY ZAPIS do localStorage przy każdej zmianie
  useEffect(() => {
    if (sessionId) {
      const sessionData = {
        sessionId,
        currentLayer,
        schema,
        messages,
        lastSaved: new Date().toISOString()
      };
      saveToStorage(sessionData);
      console.log('💾 Zapisano sesję do localStorage');
    }
  }, [currentLayer, schema, messages, sessionId]);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

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

  // NOWA SESJA
  const handleNewSession = () => {
    if (confirm('Czy chcesz rozpocząć nową sesję? Bieżąca zostanie utracona.')) {
      clearStorage();
      setCurrentLayer("concept");
      setSchema(DEFAULT_SCHEMA_STATE);
      setMessages([{ 
        id: 1, 
        text: getDefaultMessage("concept"), 
        type: "ai", 
        tags: [] 
      }]);
      setSessionId(generateSessionId());
      console.log('🆕 Rozpoczęto nową sesję');
    }
  };

  // EKSPORT DANYCH
  const handleExport = () => {
    const exportData = {
      sessionId,
      currentLayer,
      schema,
      messages,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema_session_${sessionId}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('📤 Wyeksportowano sesję');
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
          {/* HEADER z kontrolkami sesji */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  Sesja: {sessionId.slice(-8)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleNewSession}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  🆕 Nowa
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  📤 Eksport
                </button>
              </div>
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