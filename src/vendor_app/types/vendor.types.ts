// src/vendor_app/types/vendor.types.ts
export interface Vendor {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
  schema: Record<string, any>   // <-- zamiast settings
}
