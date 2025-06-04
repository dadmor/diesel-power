// apiService.ts - Uproszczony serwis API
import { LAYERS_CONFIG } from "./LAYERS";
import { SchemaState, Message, LayerType } from "./types";

const generatePrompt = (layerType: LayerType): string => {
  const config = LAYERS_CONFIG[layerType];
  const tagExamples = config.tags.map(tag => tag.example).join('\n');
  
  return `ODPOWIADAJ PO POLSKU. Pracujesz w warstwie: ${config.name}.

DOSTĘPNE TAGI:
${tagExamples}

Zwróć naturalną odpowiedź z odpowiednimi tagami.`;
};

export const sendToGemini = async (
  message: string,
  currentLayer: LayerType,
  schema: SchemaState,
  messages: Message[]
): Promise<string> => {
  const context = {
    app: schema,
    activeLayer: currentLayer,
    history: messages.slice(-3),
  };

  const layerPrompt = generatePrompt(currentLayer);

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