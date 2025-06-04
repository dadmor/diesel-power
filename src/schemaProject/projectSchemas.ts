// src/schemas/projectSchemas.ts - UPROSZCZONA WERSJA
export const PROJECT_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["name", "schema", "status"],
  properties: {
    id: { type: "string" },
    name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },
    description: {
      type: "string",
      maxLength: 500,
    },
    category: {
      type: "string",
      // Usunięto enum - może być dowolny string
    },
    schema: {
      type: "object",
      properties: {
        concept: {
          type: ["object", "null"],
        },
        database: {
          type: ["object", "null"],
        },
        ui: {
          type: ["object", "null"],
        },
        refine: {
          type: ["object", "null"],
        },
      },
      additionalProperties: true, // Pozwól na dodatkowe właściwości
    },
    status: {
      type: "string",
      // Usunięto enum - może być dowolny string
    },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  additionalProperties: true, // Pozwól na dodatkowe właściwości
};

export const SESSION_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["project_id", "layer", "messages"],
  properties: {
    id: { type: "string" },
    project_id: { type: "string" },
    layer: {
      type: "string",
      // Usunięto enum
    },
    messages: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "text", "type", "timestamp"],
        properties: {
          id: { type: "integer" },
          text: { type: "string", maxLength: 5000 },
          type: {
            type: "string",
            // Usunięto enum
          },
          tags: {
            type: "array",
            items: { type: "string" },
          },
          timestamp: { type: "integer" },
          metadata: {
            type: "object",
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    created_at: { type: "string" },
  },
  additionalProperties: true,
};
