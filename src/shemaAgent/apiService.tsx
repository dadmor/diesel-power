// apiService.ts - Zoptymalizowany serwis API
import { LAYERS_CONFIG } from "./LAYERS";
import { SchemaState, Message, LayerType } from "./types";

export const sendToGemini = async (
  message: string,
  currentLayer: LayerType,
  schema: SchemaState,
  messages: Message[]
): Promise<string> => {
  const layerConfig = LAYERS_CONFIG[currentLayer];
  const tagExamples = layerConfig.tags.map(tag => tag.example).join('\n');
  
  const layerPrompt = `ODPOWIADAJ PO POLSKU. Pracujesz w warstwie: ${layerConfig.name}.

DOSTĘPNE TAGI:
${tagExamples}

Zwróć naturalną odpowiedź z odpowiednimi tagami.`;

  const context = {
    app: schema,
    activeLayer: currentLayer,
    history: messages.slice(-3),
  };

  const response = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `${layerPrompt}\n\nKONTEKST APLIKACJI: ${JSON.stringify(
        context.app
      )}\n\nWIADOMOŚĆ: ${message}`,
      context,
    }),
  });

  if (!response.ok) throw new Error("API Error");
  const { response: aiResponse } = await response.json();
  return aiResponse;
};