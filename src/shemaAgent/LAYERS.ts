
// LAYERS.ts - Uproszczone i konfigurowalne
import { LayerType, Layer, SchemaState } from './types';

// POJEDYNCZA KONFIGURACJA - wszystko w jednym miejscu
export const LAYERS_CONFIG = {
  concept: {
    name: "Koncepcja",
    description: "Definiowanie podstawowej koncepcji aplikacji",
    placeholder: "Opisz jaki system chcesz stworzyć...",
    tags: [
      {
        name: 'create_app',
        description: 'Tworzy definicję aplikacji',
        params: ['name', 'description', 'category'],
        example: '<create_app name="System CRM" description="Zarządzanie klientami" category="business">',
        nextLayer: 'database' 
      }
    ]
  },
  
  database: {
    name: "Baza",
    description: "Projektowanie struktury bazy danych",
    placeholder: "Opisz jakie tabele i relacje potrzebujesz...",
    tags: [
      {
        name: 'create_table',
        description: 'Tworzy tabelę w bazie danych',
        params: ['name', 'fields'],
        example: '<create_table name="users" fields="id:number,name:string,email:string">',
        nextLayer: 'ui'
      },
      {
        name: 'create_relation',
        description: 'Tworzy relację między tabelami',
        params: ['from', 'to', 'type'],
        example: '<create_relation from="users" to="orders" type="one-to-many">',
        nextLayer: 'ui'
      }
    ]
  },
  
  ui: {
    name: "UI",
    description: "Projektowanie interfejsu użytkownika", 
    placeholder: "Opisz jakie strony i motyw chcesz...",
    tags: [
      {
        name: 'create_page',
        description: 'Tworzy stronę w interfejsie',
        params: ['title', 'type', 'table'],
        example: '<create_page title="Lista użytkowników" type="list" table="users">',
        nextLayer: 'refine'
      },
      {
        name: 'set_theme',
        description: 'Ustawia motyw interfejsu',
        params: ['primary', 'layout'],
        example: '<set_theme primary="#3b82f6" layout="sidebar">',
        nextLayer: 'refine'
      }
    ]
  },
  
  refine: {
    name: "Komponenty",
    description: "Tworzenie komponentów React Refine",
    placeholder: "Opisz jakie listy, formularze i widżety potrzebujesz...",
    tags: [
      {
        name: 'create_list',
        description: 'Tworzy widok listy',
        params: ['table', 'columns', 'filters'],
        example: '<create_list table="users" columns="name,email" filters="status">',
        nextLayer: null 
      },
      {
        name: 'create_form',
        description: 'Tworzy formularz',
        params: ['table', 'fields'],
        example: '<create_form table="users" fields="name,email,phone">',
        nextLayer: null
      },
      {
        name: 'add_widget',
        description: 'Dodaje widget do dashboardu',
        params: ['type', 'title', 'data'],
        example: '<add_widget type="chart" title="Sprzedaż" data="orders">',
        nextLayer: null
      }
    ]
  }
} as const;

// Generowanie struktur z konfiguracji
export const LAYERS: Layer[] = Object.entries(LAYERS_CONFIG).map(([id, config]) => ({
  id: id as LayerType,
  name: config.name,
  description: config.description
}));

// Pomocnicze funkcje
export const getLayerConfig = (layerType: LayerType) => LAYERS_CONFIG[layerType];
export const getLayerTags = (layerType: LayerType) => LAYERS_CONFIG[layerType].tags;
export const getLayerPlaceholder = (layerType: LayerType) => LAYERS_CONFIG[layerType].placeholder;

// Generowanie promptów z tagów
export const generatePrompt = (layerType: LayerType): string => {
  const config = LAYERS_CONFIG[layerType];
  const tagExamples = config.tags.map(tag => tag.example).join('\n');
  
  return `ODPOWIADAJ PO POLSKU. Pracujesz w warstwie: ${config.name}.

DOSTĘPNE TAGI:
${tagExamples}

Zwróć naturalną odpowiedź z odpowiednimi tagami.`;
};

// Domyślne wiadomości
export const getDefaultMessage = (layerType: LayerType): string => {
  const messages = {
    concept: "Napisz jaki system chcesz stworzyć",
    database: "Na podstawie koncepcji, jakie tabele i relacje potrzebujesz?",
    ui: "Jakie strony i interfejs chcesz dla swojej aplikacji?",
    refine: "Jakie komponenty i widżety chcesz w aplikacji?"
  };
  return messages[layerType];
};

// Domyślny stan
export const DEFAULT_SCHEMA_STATE: SchemaState = {
  concept: null,
  database: null,
  ui: null,
  refine: null,
};

// Funkcja do znajdowania następnej warstwy po użyciu tagu
export const getNextLayerForTag = (tagName: string): LayerType | null => {
  for (const [, config] of Object.entries(LAYERS_CONFIG)) {
    const tag = config.tags.find(t => t.name === tagName);
    if (tag) return tag.nextLayer as LayerType | null;
  }
  return null;
};
