import { useState } from "react";
import { LAYER_PROMPTS } from "./LAYERS";

const TagBuilder = () => {
  const [currentLayer, setCurrentLayer] = useState("concept");
  const [schema, setSchema] = useState({
    concept: null,
    database: null,
    ui: null,
    refine: null,
  });
  const [messages, setMessages] = useState([
    { id: 1, text: "Napisz jaki system chcesz stworzyć", type: "ai", tags: [] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const parseTags = (text) => {
    const tagRegex = /<(\w+)([^>]*)>/g;
    const tags = [];
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      const [, tagName, paramsStr] = match;
      const params = {};
      const paramRegex = /(\w+)="([^"]*)"/g;
      let paramMatch;

      while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
        params[paramMatch[1]] = paramMatch[2];
      }

      tags.push({ tag: tagName, params });
    }

    return tags;
  };

  const processTag = (layer, tag, params, currentData) => {
    const key = `${layer}_${tag}`;

    switch (key) {
      case "concept_create_app":
        return {
          name: params.name,
          description: params.description,
          category: params.category,
        };

      case "database_create_table":
        const fields = params.fields.split(",").map((f) => {
          const [name, type] = f.split(":");
          return { name: name.trim(), type: type?.trim() || "string" };
        });
        return {
          ...currentData,
          tables: [
            ...(currentData?.tables || []),
            { name: params.name, fields },
          ],
        };

      case "database_create_relation":
        return {
          ...currentData,
          relations: [
            ...(currentData?.relations || []),
            { from: params.from, to: params.to, type: params.type },
          ],
        };

      case "ui_create_page":
        return {
          ...currentData,
          pages: [
            ...(currentData?.pages || []),
            { title: params.title, type: params.type, table: params.table },
          ],
        };

      case "ui_set_theme":
        return {
          ...currentData,
          theme: { primary: params.primary, layout: params.layout },
        };

      case "refine_create_list":
        return {
          ...currentData,
          listViews: [
            ...(currentData?.listViews || []),
            {
              table: params.table,
              columns: params.columns.split(","),
              filters: params.filters?.split(",") || [],
            },
          ],
        };

      case "refine_create_form":
        return {
          ...currentData,
          formViews: [
            ...(currentData?.formViews || []),
            { table: params.table, fields: params.fields.split(",") },
          ],
        };

      case "refine_add_widget":
        return {
          ...currentData,
          widgets: [
            ...(currentData?.widgets || []),
            { type: params.type, title: params.title, data: params.data },
          ],
        };

      default:
        return currentData;
    }
  };

  const sendToGemini = async (message) => {
    const context = {
      app: schema,
      activeLayer: currentLayer,
      history: messages.slice(-3),
    };

    const response = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${
          LAYER_PROMPTS[currentLayer]
        }\n\nKONTEKST APLIKACJI: ${JSON.stringify(
          context.app
        )}\n\nWIADOMOŚĆ: ${message}`,
        context,
      }),
    });

    if (!response.ok) throw new Error("API Error");
    const { response: aiResponse } = await response.json();
    return aiResponse;
  };

  const handleSubmit = async () => {
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
      const aiResponse = await sendToGemini(input);
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

      // Przetwórz tagi
      let updatedData = schema[currentLayer];
      tags.forEach(({ tag, params }) => {
        updatedData = processTag(currentLayer, tag, params, updatedData);
      });

      setSchema((prev) => ({ ...prev, [currentLayer]: updatedData }));
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `❌ Błąd: ${error.message}`,
          type: "ai",
          tags: [],
        },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const layers = [
    { id: "concept", name: "Koncepcja", color: "blue" },
    { id: "database", name: "Baza", color: "green" },
    { id: "ui", name: "UI", color: "purple" },
    { id: "refine", name: "Komponenty", color: "orange" },
  ];

  return (
    <div className="h-screen bg-gray-50 p-4">
      <div className="h-full flex gap-6 ">
        {/* Chat Panel */}
        <div className="bg-white rounded-lg shadow-sm border flex-1 flex  flex-col  ">
          <div className="p-4 border-b">
            <div className="flex space-x-1 mb-4">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setCurrentLayer(layer.id)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentLayer === layer.id
                      ? "bg-blue-500 text-white"
                      : schema[layer.id]
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {layer.name} {schema[layer.id] && "✓"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-4 flex-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-xs lg:max-w-md">
                  <div
                    className={`p-3 rounded-lg ${
                      msg.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-green-500 text-white px-2 py-1 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={`${
                  layers.find((l) => l.id === currentLayer)?.name
                }: Napisz wiadomość...`}
                className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Wyślij
              </button>
            </div>
          </div>
        </div>

        <div>
          {/* Schema Panel */}
          <div className="bg-white rounded-lg shadow-sm border flex-1">
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                📊 Schema - {layers.find((l) => l.id === currentLayer)?.name}
              </h3>
            </div>
            <div className="p-4">
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96 font-mono">
                {schema[currentLayer]
                  ? JSON.stringify(schema[currentLayer], null, 2)
                  : "{ }"}
              </pre>
            </div>
          </div>

          {/* Full Schema */}
          {Object.values(schema).some(Boolean) && (
            <div className="bg-white rounded-lg shadow-sm border mt-6">
              <div className="p-4 border-b">
                <h3 className="font-semibold">🗂️ Pełna Schema</h3>
              </div>
              <div className="p-4">
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-64 font-mono">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagBuilder;
