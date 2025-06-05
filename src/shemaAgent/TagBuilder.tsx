// src/shemaAgent/TagBuilder.tsx
import React, { useState, useEffect } from "react";
import { Message, LayerType, SchemaState, ParsedTag } from "./types";
import { parseTags, processTag } from "./schemaProcessor";
import { sendToGemini } from "./apiService";
import { ChatInput, LayerTabs, MessageList, SchemaDisplay } from "./components";
import { TagEditorModal } from "./components/TagEditorModal";
import { LAYERS_CONFIG, LAYERS, DEFAULT_SCHEMA_STATE } from "./LAYERS";
import { ChatContainer, ChatHeader } from "@/themes/default";
import { BookPlus, BookX, BotMessageSquare, Trash, X } from "lucide-react";

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

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentLayer, setCurrentLayer] = useState<LayerType>(
    initialData.currentLayer
  );
  const [schema, setSchema] = useState<SchemaState>(initialData.schema);
  const [messages, setMessages] = useState<Message[]>(initialData.messages);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showSchema, setShowSchema] = useState<boolean>(false);

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingTag, setEditingTag] = useState<ParsedTag | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

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
          id: Date.now() + Math.random(),
          text: defaultMessage,
          type: "ai",
          tags: [],
        },
      ]);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!input.trim() || loading) return;

    const userMessageId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
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

      const aiMessageId = Date.now() + Math.random();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
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
      const errorMessageId = Date.now() + Math.random() + 1000;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
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

  const handleTagEdit = (
    messageId: number,
    originalTag: ParsedTag,
  ) => {
    setEditingMessageId(messageId);
    setEditingTag(originalTag);
    setEditModalOpen(true);
  };

  const handleTagSave = (updatedTag: ParsedTag) => {
    if (editingMessageId && editingTag) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === editingMessageId) {
            const oldTagRegex = new RegExp(`<${editingTag.tag}([^>]*)>`, "g");
            const newTagString = `<${updatedTag.tag} ${Object.entries(
              updatedTag.params
            )
              .map(([key, value]) => `${key}="${value}"`)
              .join(" ")}>`;
            const updatedText = msg.text.replace(oldTagRegex, newTagString);
            return {
              ...msg,
              text: updatedText,
              tags: msg.tags.map((tag) =>
                tag === editingTag.tag ? updatedTag.tag : tag
              ),
            };
          }
          return msg;
        })
      );

      try {
        let updatedData = schema[currentLayer];
        // Tu można dodać logikę usuwania starych danych, jeśli tag się zmienił
        updatedData = processTag(
          currentLayer,
          updatedTag.tag,
          updatedTag.params,
          updatedData
        );
        setSchema((prev: any) => ({ ...prev, [currentLayer]: updatedData }));
      } catch (error) {
        console.error("Błąd aktualizacji schematu:", error);
      }
    }

    setEditingTag(null);
    setEditingMessageId(null);
    setEditModalOpen(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          onClick={() => setIsOpen(true)}
        >
         <BotMessageSquare/>
        </button>
      )}

      {isOpen && (
        <div className="h-screen bg-gray-900/50 p-4 fixed top-0 left-0 w-full z-50">
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
                        className={`p-2 rounded-lg transition-colors ${
                          showSchema
                            ? "bg-gray-500 text-white hover:bg-blue-600"
                            : "bg-blue-500 text-white hover:bg-gray-600"
                        }`}
                      >
                        {showSchema ? (
                          <BookX className="w-4 h-4" />
                        ) : (
                          <BookPlus className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={handleReset}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>

                      {/* Ikonka zamykająca jako trzecia po koszu */}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
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
                    onTagEdit={handleTagEdit}
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

          <TagEditorModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingTag(null);
              setEditingMessageId(null);
            }}
            tag={editingTag}
            layer={currentLayer}
            onSave={handleTagSave}
          />
        </div>
      )}
    </>
  );
};

export default TagBuilder;
