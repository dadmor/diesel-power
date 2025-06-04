// src/schemas/projectSchemas.ts
export const PROJECT_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["name", "schema", "status"],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { 
        type: "string", 
        minLength: 1, 
        maxLength: 100,
        pattern: "^[a-zA-Z0-9\\s\\-_]+$"
      },
      description: { 
        type: "string", 
        maxLength: 500 
      },
      category: { 
        type: "string",
        enum: ["ecommerce", "crm", "cms", "dashboard", "tool", "other"]
      },
      schema: {
        type: "object",
        properties: {
          concept: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              features: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          database: {
            type: "object",
            properties: {
              tables: {
                type: "array",
                items: {
                  type: "object",
                  required: ["name", "fields"],
                  properties: {
                    name: { 
                      type: "string",
                      pattern: "^[a-z][a-z0-9_]*$"
                    },
                    fields: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["name", "type"],
                        properties: {
                          name: { 
                            type: "string",
                            pattern: "^[a-z][a-z0-9_]*$"
                          },
                          type: {
                            type: "string",
                            enum: ["string", "text", "number", "integer", "boolean", "date", "datetime", "email", "select", "json"]
                          },
                          required: { type: "boolean", default: false },
                          unique: { type: "boolean", default: false },
                          options: {
                            type: "array",
                            items: { type: "string" }
                          },
                          validation: {
                            type: "object",
                            properties: {
                              min: { type: "number" },
                              max: { type: "number" },
                              pattern: { type: "string" },
                              minLength: { type: "integer" },
                              maxLength: { type: "integer" }
                            }
                          }
                        }
                      }
                    },
                    indexes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fields: { 
                            type: "array",
                            items: { type: "string" }
                          },
                          unique: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              },
              relations: {
                type: "array",
                items: {
                  type: "object",
                  required: ["from", "to", "type"],
                  properties: {
                    from: { type: "string" },
                    to: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["one-to-one", "one-to-many", "many-to-many"]
                    },
                    foreignKey: { type: "string" },
                    onDelete: {
                      type: "string",
                      enum: ["CASCADE", "SET NULL", "RESTRICT"]
                    }
                  }
                }
              }
            }
          },
          ui: {
            type: "object",
            properties: {
              theme: {
                type: "object",
                properties: {
                  primary: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                  secondary: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                  layout: {
                    type: "string",
                    enum: ["sidebar", "topbar", "minimal"]
                  }
                }
              },
              pages: {
                type: "array",
                items: {
                  type: "object",
                  required: ["title", "type"],
                  properties: {
                    title: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["list", "form", "dashboard", "custom"]
                    },
                    table: { type: "string" },
                    permissions: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["read", "create", "update", "delete"]
                      }
                    }
                  }
                }
              },
              navigation: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        path: { type: "string" },
                        icon: { type: "string" },
                        children: {
                          type: "array",
                          items: { $ref: "#" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          refine: {
            type: "object",
            properties: {
              listViews: {
                type: "array",
                items: {
                  type: "object",
                  required: ["table"],
                  properties: {
                    table: { type: "string" },
                    columns: {
                      type: "array",
                      items: { type: "string" }
                    },
                    filters: {
                      type: "array",
                      items: { type: "string" }
                    },
                    sorting: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        order: {
                          type: "string",
                          enum: ["asc", "desc"]
                        }
                      }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        pageSize: { type: "integer", minimum: 1, maximum: 100 }
                      }
                    }
                  }
                }
              },
              formViews: {
                type: "array",
                items: {
                  type: "object",
                  required: ["table"],
                  properties: {
                    table: { type: "string" },
                    fields: {
                      type: "array",
                      items: { type: "string" }
                    },
                    layout: {
                      type: "string",
                      enum: ["single-column", "two-column", "tabs", "accordion"]
                    },
                    validation: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                        properties: {
                          required: { type: "boolean" },
                          rules: {
                            type: "array",
                            items: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              },
              widgets: {
                type: "array",
                items: {
                  type: "object",
                  required: ["type", "title"],
                  properties: {
                    type: {
                      type: "string",
                      enum: ["chart", "stat", "table", "calendar", "map"]
                    },
                    title: { type: "string" },
                    data: { type: "string" },
                    config: {
                      type: "object",
                      properties: {
                        chartType: {
                          type: "string",
                          enum: ["line", "bar", "pie", "area"]
                        },
                        xAxis: { type: "string" },
                        yAxis: { type: "string" },
                        groupBy: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      status: {
        type: "string",
        enum: ["draft", "complete", "deployed", "archived"]
      },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" }
    }
  };
  
  export const SESSION_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["project_id", "layer", "messages"],
    properties: {
      id: { type: "string", format: "uuid" },
      project_id: { type: "string", format: "uuid" },
      layer: {
        type: "string",
        enum: ["concept", "database", "ui", "refine"]
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
              enum: ["user", "ai"]
            },
            tags: {
              type: "array",
              items: { type: "string" }
            },
            timestamp: { type: "integer" },
            metadata: {
              type: "object",
              properties: {
                tokens: { type: "integer" },
                model: { type: "string" },
                processing_time: { type: "number" }
              }
            }
          }
        }
      },
      created_at: { type: "string", format: "date-time" }
    }
  };
  