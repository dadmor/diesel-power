// src/shemaAgent/LAYERS.ts
// ------------------------
// Pełna konfiguracja tagów (LAYERS_CONFIG). To właśnie AI odczytuje te dane,
// aby wiedzieć, jakie tagi może wygenerować, jakie parametry przyjąć i jak je
// przetworzyć. Komentarze wyjaśniają, co każda sekcja robi.

import { LayerType, Layer, SchemaState, TagConfig } from './types';

export const LAYERS_CONFIG: Record<LayerType, {
  name: string;
  description: string;
  placeholder: string;
  defaultMessage: string;
  tags: TagConfig[];
}> = {
  // ---------------------------------------------------------------------------
  // WARSTWA "system": definiuje podstawowe informacje o systemie
  // ---------------------------------------------------------------------------
  system: {
    name: "System",
    description: "Opis systemu i jego funkcji",
    placeholder: "Opisz jaki system chcesz stworzyć...",
    defaultMessage: "Napisz jaki system chcesz stworzyć i jakie ma mieć funkcje",
    tags: [
      {
        name: 'define_system',
        description: 'Definiuje główne pola: name, description, type.',
        params: ['name', 'description', 'type'],
        example: '<define_system name="System CRM" description="Zarządzanie klientami" type="web">',
        nextLayer: 'database'
        // Po przetworzeniu: data.system = { name, description, type }
      },
      {
        name: 'add_feature',
        description: 'Dodaje pojedynczą funkcję do tablicy "features".',
        params: ['name'],
        example: '<add_feature name="Zarządzanie kontaktami">',
        nextLayer: 'database',
        outputArray: 'features'
        // Po przetworzeniu: data.system.features = [ ..., "Zarządzanie kontaktami" ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // WARSTWA "database": definiuje tabele i relacje w bazie danych
  // ---------------------------------------------------------------------------
  database: {
    name: "Baza",
    description: "Tabele i relacje w bazie danych",
    placeholder: "Opisz jakie tabele i pola potrzebujesz...",
    defaultMessage: "Na podstawie opisu systemu, jakie tabele i relacje potrzebujesz?",
    tags: [
      {
        name: 'create_table',
        description: 'Tworzy nową tabelę w bazie danych.',
        params: ['name', 'fields'],
        example: '<create_table name="users" fields="id:number:required:unique,name:string:required,email:string:required:unique">',
        nextLayer: 'ux',
        outputArray: 'tables',
        required: ['name', 'fields'],
        // parsujemy ciąg "pole:typ:flagi,pole2:typ2" na tablicę obiektów
        parseListParams: ['fields']
        // Po przetworzeniu:
        // data.database.tables = [
        //   ...,
        //   {
        //     name: "users",
        //     fields: [
        //       { name: "id", type: "number", required: true, unique: true },
        //       { name: "name", type: "string", required: true, unique: false },
        //       { name: "email", type: "string", required: true, unique: true }
        //     ]
        //   }
        // ]
      },
      {
        name: 'create_relation',
        description: 'Tworzy relację pomiędzy dwiema tabelami.',
        params: ['from', 'to', 'type', 'foreignKey'],
        example: '<create_relation from="users" to="orders" type="one-to-many" foreignKey="user_id">',
        nextLayer: 'ux',
        outputArray: 'relations',
        required: ['from', 'to', 'type']
        // Po przetworzeniu:
        // data.database.relations = [ ..., { from, to, type, foreignKey } ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // WARSTWA "ux": definiuje strony, komponenty i motyw interfejsu
  // ---------------------------------------------------------------------------
  ux: {
    name: "UX",
    description: "Interfejs użytkownika i strony",
    placeholder: "Opisz jakie strony i komponenty chcesz...",
    defaultMessage: "Jakie strony i interfejs chcesz dla swojej aplikacji?",
    tags: [
      {
        name: 'create_page',
        description: 'Tworzy nową stronę w aplikacji.',
        params: ['name', 'type', 'table', 'components'],
        example: '<create_page name="Lista użytkowników" type="list" table="users" components="UserForm,UserTable">',
        nextLayer: null,
        outputArray: 'pages',
        required: ['name', 'type'],
        // parsujemy ciąg "KomponentA,KomponentB" na ["KomponentA","KomponentB"]
        parseListParams: ['components'],
        // AI może wygenerować slug, jeżeli nie został podany:
        computedFields: [
          { name: 'slug', from: 'name', type: 'slugify' }
        ]
        // Po przetworzeniu:
        // data.ux.pages = [
        //   ...,
        //   {
        //     name: "Lista użytkowników",
        //     type: "list",
        //     table: "users",
        //     components: ["UserForm", "UserTable"],
        //     slug: "lista-uzytkownikow"
        //   }
        // ]
      },
      {
        name: 'create_component',
        description: 'Tworzy nowy komponent dla interfejsu.',
        params: ['name', 'type', 'props'],
        example: '<create_component name="UserForm" type="form" props="{\"method\":\"POST\"}">',
        nextLayer: null,
        outputArray: 'components',
        required: ['name', 'type']
        // Po przetworzeniu:
        // data.ux.components = [ ..., { name, type, props } ]
      },
      {
        name: 'set_theme',
        description: 'Ustawia motyw interfejsu (kolor, układ, styl).',
        params: ['primaryColor', 'layout', 'style'],
        example: '<set_theme primaryColor="#3b82f6" layout="sidebar" style="modern">',
        nextLayer: null
        // Po przetworzeniu:
        // data.ux.theme = { primaryColor, layout, style }
      }
    ]
  }
} as const;

// ----------------------------------------------------------------------------
// Na potrzeby interfejsu: lista warstw, którą wyświetlamy w zakładkach.
// ----------------------------------------------------------------------------
export const LAYERS: Layer[] = Object.entries(LAYERS_CONFIG).map(([id, config]) => ({
  id: id as LayerType,
  name: config.name,
  description: config.description
}));

// ----------------------------------------------------------------------------
// Domyślny stan schematu (przed jakąkolwiek interakcją AI).
// ----------------------------------------------------------------------------
export const DEFAULT_SCHEMA_STATE: SchemaState = {
  system: null,
  database: null,
  ux: null,
};
