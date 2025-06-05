// src/shemaAgent/TagBuilder.tsx - Z ukrywalnymi panelami Schema
import React, { useState, useEffect } from "react";
import { Message, LayerType, SchemaState } from "./types";
import { parseTags, processTag } from "./schemaProcessor";
import { sendToGemini } from "./apiService";
import { ChatInput, LayerTabs, MessageList, SchemaDisplay } from "./components";
import { LAYERS_CONFIG, LAYERS, DEFAULT_SCHEMA_STATE } from "./LAYERS";
import { ChatContainer, ChatHeader } from "@/themes/default";
import { Code, Trash, X } from "lucide-react";

// Funkcja do wczytania danych PRZED renderem
const getInitialData = () => {
  try {
    const saved = localStorage.getItem("schema_session");
    if (saved) {
      const data = JSON.parse(saved);
      return {
        currentLayer: data.currentLayer || "system",
        schema: data.schema || DEFAULT_SCHEMA_STATE,
        messages: data.messages || [
          {
            id: 1,
            text: LAYERS_CONFIG.system.defaultMessage,
            type: "ai",
            tags: [],
          },
        ],
      };
    }
  } catch (error) {
    console.error("Błąd wczytywania localStorage:", error);
  }

  return {
    currentLayer: "system" as LayerType,
    schema: DEFAULT_SCHEMA_STATE,
    messages: [
      {
        id: 1,
        text: LAYERS_CONFIG.system.defaultMessage,
        type: "ai",
        tags: [],
      },
    ],
  };
};

const TagBuilder: React.FC = () => {
  const initialData = getInitialData();

  const [currentLayer, setCurrentLayer] = useState<LayerType>(
    initialData.currentLayer
  );
  const [schema, setSchema] = useState<SchemaState>(initialData.schema);
  const [messages, setMessages] = useState<Message[]>(initialData.messages);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showSchema, setShowSchema] = useState<boolean>(false);

  // Zapisuj do localStorage
  useEffect(() => {
    localStorage.setItem(
      "schema_session",
      JSON.stringify({
        currentLayer,
        schema,
        messages,
      })
    );
  }, [currentLayer, schema, messages]);

  const handleLayerChange = (newLayer: LayerType) => {
    setCurrentLayer(newLayer);

    const defaultMessage = LAYERS_CONFIG[newLayer].defaultMessage;
    const hasLayerMessages = messages.some((msg) =>
      msg.text.includes(defaultMessage)
    );

    if (!hasLayerMessages) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: defaultMessage,
          type: "ai",
          tags: [],
        },
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
      const aiResponse = await sendToGemini(
        input,
        currentLayer,
        schema,
        messages
      );
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
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

  const handleReset = () => {
    localStorage.removeItem("schema_session");
    setSchema(DEFAULT_SCHEMA_STATE);
    setCurrentLayer("system");
    setMessages([
      {
        id: 1,
        text: LAYERS_CONFIG.system.defaultMessage,
        type: "ai",
        tags: [],
      },
    ]);
  };

  return (
    <div className="h-screen bg-gray-900/50 p-4 fixed top-0 left-0 w-full">
      <div className="h-full flex gap-6 justify-end">
        {showSchema && (
          <SchemaDisplay
            schema={schema}
            currentLayer={currentLayer}
            layers={LAYERS}
          />
        )}

        <div className="w-[600px] flex-shrink-0 h-full flex flex-col">
          <ChatContainer className="h-full flex flex-col">
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

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSchema(!showSchema)}
                    className={`p-2  rounded-lg transition-colors ${
                      showSchema
                        ? "bg-gray-500 text-white hover:bg-blue-600"
                        : "bg-blue-500 text-white hover:bg-gray-600"
                    }`}
                  >
                    {showSchema ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Code className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2  bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <LayerTabs
                layers={LAYERS}
                currentLayer={currentLayer}
                setCurrentLayer={handleLayerChange}
                schema={schema}
              />
            </ChatHeader>

            <div className="flex-1 overflow-y-auto min-h-0">
              <MessageList
                messages={messages}
                loading={loading}
                onLayerChange={handleLayerChange}
              />
            </div>

            <div className="flex-shrink-0 mt-4">
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                loading={loading}
                currentLayer={currentLayer}
              />
            </div>
          </ChatContainer>
        </div>
      </div>
    </div>
  );
};

export default TagBuilder;