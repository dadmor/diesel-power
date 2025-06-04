// schemaProcessor.ts
import {
    ParsedTag,
    LayerType,
    AppSchema,
    DatabaseSchema,
    UISchema,
    RefineSchema,
  } from "./types";
  
  export const parseTags = (text: string): ParsedTag[] => {
    const tagRegex = /<(\w+)([^>]*)>/g;
    const tags: ParsedTag[] = [];
    let match;
  
    while ((match = tagRegex.exec(text)) !== null) {
      const [, tagName, paramsStr] = match;
      const params: Record<string, string> = {};
      const paramRegex = /(\w+)="([^"]*)"/g;
      let paramMatch;
  
      while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
        params[paramMatch[1]] = paramMatch[2];
      }
  
      tags.push({ tag: tagName, params });
    }
  
    return tags;
  };
  
  export const processTag = (
    layer: LayerType,
    tag: string,
    params: Record<string, string>,
    currentData: AppSchema | DatabaseSchema | UISchema | RefineSchema | null
  ): AppSchema | DatabaseSchema | UISchema | RefineSchema | null => {
    const key = `${layer}_${tag}`;
  
    switch (key) {
      case "concept_create_app":
        return {
          name: params.name,
          description: params.description,
          category: params.category,
        } as AppSchema;
  
      case "database_create_table":
        const fields = params.fields.split(",").map((f) => {
          const [name, type] = f.split(":");
          return { name: name.trim(), type: type?.trim() || "string" };
        });
  
        const dbData = (currentData as DatabaseSchema) || {};
        return {
          ...dbData,
          tables: [...(dbData.tables || []), { name: params.name, fields }],
        } as DatabaseSchema;
  
      case "database_create_relation":
        const dbRelData = (currentData as DatabaseSchema) || {};
        return {
          ...dbRelData,
          relations: [
            ...(dbRelData.relations || []),
            { from: params.from, to: params.to, type: params.type },
          ],
        } as DatabaseSchema;
  
      case "ui_create_page":
        const uiPageData = (currentData as UISchema) || {};
        return {
          ...uiPageData,
          pages: [
            ...(uiPageData.pages || []),
            { title: params.title, type: params.type, table: params.table },
          ],
        } as UISchema;
  
      case "ui_set_theme":
        const uiThemeData = (currentData as UISchema) || {};
        return {
          ...uiThemeData,
          theme: { primary: params.primary, layout: params.layout },
        } as UISchema;
  
      case "refine_create_list":
        const refineListData = (currentData as RefineSchema) || {};
        return {
          ...refineListData,
          listViews: [
            ...(refineListData.listViews || []),
            {
              table: params.table,
              columns: params.columns.split(","),
              filters: params.filters?.split(",") || [],
            },
          ],
        } as RefineSchema;
  
      case "refine_create_form":
        const refineFormData = (currentData as RefineSchema) || {};
        return {
          ...refineFormData,
          formViews: [
            ...(refineFormData.formViews || []),
            { table: params.table, fields: params.fields.split(",") },
          ],
        } as RefineSchema;
  
      case "refine_add_widget":
        const refineWidgetData = (currentData as RefineSchema) || {};
        return {
          ...refineWidgetData,
          widgets: [
            ...(refineWidgetData.widgets || []),
            { type: params.type, title: params.title, data: params.data },
          ],
        } as RefineSchema;
  
      default:
        return currentData;
    }
  };
  