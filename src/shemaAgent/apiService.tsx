// apiService.ts - Zoptymalizowany serwis API
import { LAYERS_CONFIG } from "./LAYERS";
import { SchemaState, Message, LayerType } from "./types";

export const sendToGemini = async (
  message: string,
  currentLayer: LayerType,
  schema: SchemaState,
  messages: Message[]
): Promise<string> => {
  const layerConfig = LAYERS_CONFIG[currentLayer as keyof typeof LAYERS_CONFIG];
  
  if (!layerConfig) {
    throw new Error(`Nieznana warstwa: ${currentLayer}`);
  }
  
  // Generuj listę dostępnych tagów bez konkretnych przykładów
  const availableTags = layerConfig.tags.map(tag => {
    const paramsList = tag.params.map(param => `${param}="..."`).join(' ');
    return `<${tag.name} ${paramsList}> - ${tag.description}`;
  }).join('\n');
  
  const layerPrompt = `ODPOWIADAJ PO POLSKU. Pracujesz w warstwie: ${layerConfig.name} - ${layerConfig.description}

DOSTĘPNE TAGI w tej warstwie:
${availableTags}

ZASADY:
- Używaj tagów XML do strukturyzowania odpowiedzi
- Parametry tagów dostosuj do treści wiadomości użytkownika
- Możesz używać tylko tagów z tej warstwy
- Daj naturalną odpowiedź wraz z odpowiednimi tagami
- Nie kopiuj przykładów, ale twórz własne wartości parametrów

PRZYKŁAD formatu (dostosuj parametry do potrzeb):
${layerConfig.tags[0].example}`;

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
      )}\n\nWIADOMOŚĆ UŻYTKOWNIKA: ${message}`,
      context,
    }),
  });

  if (!response.ok) throw new Error("API Error");
  const { response: aiResponse } = await response.json();
  return aiResponse;
};