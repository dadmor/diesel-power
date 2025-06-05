// src/shemaAgent/types.ts
// -----------------------
// Typy używane w całym module. Komentarze wyjaśniają, co robi każda część,
// żeby AI wiedziało, jak interpretować wejście i wyjście.

import Ajv from 'ajv';

// -----------------------------------------------------------------------------
// Interfejs opisujący cały stan schematu (trzy warstwy: system, database, ux).
// -----------------------------------------------------------------------------
export interface SchemaState {
  system: any | null;
  database: any | null;
  ux: any | null;
}

// -----------------------------------------------------------------------------
// Typ klucza warstwy – wykorzystywany np. przy wyborze aktualnej zakładki.
// -----------------------------------------------------------------------------
export type LayerType = keyof SchemaState;

// -----------------------------------------------------------------------------
// Po sparsowaniu z tekstu (XML lub JSON) AI zwraca tablicę takich tagów.
// -----------------------------------------------------------------------------
export interface ParsedTag {
  tag: string;
  params: Record<string, string>;
}

// -----------------------------------------------------------------------------
// Reprezentacja wiadomości (użytkownik / AI) – zawiera tekst, typ (user/ai) oraz
// listę nazw tagów, które się w nim pojawiły (jeśli AI wygenerowało XML–owe taga).
// -----------------------------------------------------------------------------
export interface Message {
  id: number;
  text: string;
  type: 'user' | 'ai';
  tags: string[];
}

// -----------------------------------------------------------------------------
// Warstwa do wyświetlenia w interfejsie (zakładki). Zawiera id (system/database/ux),
// nazwę i opis warstwy.
// -----------------------------------------------------------------------------
export interface Layer {
  id: LayerType;
  name: string;
  description: string;
}

// -----------------------------------------------------------------------------
// Definicja, jak wygląda jeden tag w konfiguracji. Komentarze wyjaśniają AI,
// co każda właściwość znaczy:
//   - name, description, params, example: instrukcja dla AI, jak ma wygenerować tag.
//   - nextLayer: do jakiej warstwy przejść po wstawieniu taga.
//   - outputArray: jeśli tag ma dodać nowy element do tablicy (np. data.tables).
//   - required: lista parametrów, które AI zawsze musi dostarczyć.
//   - parseListParams: parametry będące CSV, które należy zamienić na tablicę.
//   - computedFields: definicja dodatkowych pól “liczonych” (np. slug z name).
// -----------------------------------------------------------------------------
export interface ComputedField {
  // nazwa pola, które powstanie (np. "slug")
  name: string;
  // z którego parametru (klucza) wygenerować wartość (np. "name")
  from: string;
  // typ przekształcenia (na razie tylko 'slugify' jest obsługiwany)
  type: 'slugify';
}

export interface TagConfig {
  // nazwa taga (np. "create_table")
  name: string;
  // opis taga dla AI
  description: string;
  // lista parametrów, które AI może podać (np. ['name', 'fields'])
  params: string[];
  // przykład użycia (dla AI, by wiedziało składnię)
  example: string;
  // kolejna warstwa albo null
  nextLayer?: LayerType | null;

  // ---------------------- metadane dla procesu ----------------------
  // jeśli outputArray="tables", to dodajemy nowy obiekt do data.tables = [ ..., newItem ]
  outputArray?: string;
  // lista parametrów wymaganych – AI ich nie pominie
  required?: string[];
  // parametry, które AI traktuje jako CSV; każdy element CSV zamieniamy na string
  parseListParams?: string[];
  // pola liczone (np. slug z name)
  computedFields?: ComputedField[];
  // -------------------------------------------------------------------
}

// -----------------------------------------------------------------------------

// Konfiguracja warstwy (AI czyta name/description/placeholder/defaultMessage,
// żeby wiedziało, co zapytać użytkownika).
export interface LayerConfig {
  name: string;
  description: string;
  placeholder: string;
  defaultMessage: string;
  tags: TagConfig[];
}

// -----------------------------------------------------------------------------

// Domyślny stan, zanim AI cokolwiek wygeneruje:
export const DEFAULT_SCHEMA_STATE: SchemaState = {
  system: null,
  database: null,
  ux: null,
};

// -----------------------------------------------------------------------------

// Funkcja walidująca fragment danych względem JSON Schema (używana po to, żeby
// sprawdzić, czy wygenerowany obiekt faktycznie pasuje do SCHEMA.json).
export const validateAgainstSchema = (data: any, schema: any): boolean => {
  const ajv = new Ajv();
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      console.error('Błędy walidacji JSON Schema:', validate.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Błąd kompilacji schematu:', error);
    return false;
  }
};
