// LAYERS.ts - Czysty JSON bez metod, gotowy na bazę danych
import { LayerType, Layer, SchemaState } from './types';

// GŁÓWNA KONFIGURACJA - czysty JSON
export const LAYERS_CONFIG = {
  concept: {
    name: "Koncepcja",
    description: "Definiowanie podstawowej koncepcji aplikacji",
    placeholder: "Opisz jaki system chcesz stworzyć...",
    defaultMessage: "Napisz jaki system chcesz stworzyć",
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
    defaultMessage: "Na podstawie koncepcji, jakie tabele i relacje potrzebujesz?",
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
    defaultMessage: "Jakie strony i interfejs chcesz dla swojej aplikacji?",
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
    defaultMessage: "Jakie komponenty i widżety chcesz w aplikacji?",
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

// Automatyczne generowanie struktur z konfiguracji
export const LAYERS: Layer[] = Object.entries(LAYERS_CONFIG).map(([id, config]) => ({
  id: id as LayerType,
  name: config.name,
  description: config.description
}));

// Domyślny stan schematu
export const DEFAULT_SCHEMA_STATE: SchemaState = {
  concept: null,
  database: null,
  ui: null,
  refine: null,
};