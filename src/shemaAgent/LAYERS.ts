// LAYERS.ts - Konfiguracja dla generycznego processora
import { LayerType, Layer, SchemaState } from './types';

export const LAYERS_CONFIG = {
  system: {
    name: "System",
    description: "Opis systemu i jego funkcji",
    placeholder: "Opisz jaki system chcesz stworzyć...",
    defaultMessage: "Napisz jaki system chcesz stworzyć i jakie ma mieć funkcje",
    tags: [
      {
        name: 'define_system',
        description: 'Definiuje podstawy systemu',
        params: ['name', 'description', 'type'],
        example: '<define_system name="System CRM" description="Zarządzanie klientami" type="web">',
        nextLayer: 'database' as LayerType as LayerType 
      },
      {
        name: 'add_feature',
        description: 'Dodaje funkcję systemu',
        params: ['name'],
        example: '<add_feature name="Zarządzanie kontaktami">',
        nextLayer: 'database'
      }
    ]
  },
  
  database: {
    name: "Baza",
    description: "Tabele i relacje w bazie danych",
    placeholder: "Opisz jakie tabele i pola potrzebujesz...",
    defaultMessage: "Na podstawie opisu systemu, jakie tabele i relacje potrzebujesz?",
    tags: [
      {
        name: 'create_table',
        description: 'Tworzy tabelę',
        params: ['name', 'fields'],
        example: '<create_table name="users" fields="id:number:required:unique,name:string:required,email:string:required:unique">',
        nextLayer: 'ux' as LayerType as LayerType
      },
      {
        name: 'create_relation',
        description: 'Tworzy relację między tabelami',
        params: ['from', 'to', 'type', 'foreignKey'],
        example: '<create_relation from="users" to="orders" type="one-to-many" foreignKey="user_id">',
        nextLayer: 'ux'
      }
    ]
  },
  
  ux: {
    name: "UX",
    description: "Interfejs użytkownika i strony",
    placeholder: "Opisz jakie strony i komponenty chcesz...",
    defaultMessage: "Jakie strony i interfejs chcesz dla swojej aplikacji?",
    tags: [
      {
        name: 'create_page',
        description: 'Tworzy stronę',
        params: ['name', 'type', 'table'],
        example: '<create_page name="Lista użytkowników" type="list" table="users">',
        nextLayer: null
      },
      {
        name: 'create_component',
        description: 'Tworzy komponent',
        params: ['name', 'type'],
        example: '<create_component name="UserForm" type="form">',
        nextLayer: null
      },
      {
        name: 'set_theme',
        description: 'Ustawia motyw',
        params: ['primaryColor', 'layout', 'style'],
        example: '<set_theme primaryColor="#3b82f6" layout="sidebar" style="modern">',
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
  system: null,
  database: null,
  ux: null,
};