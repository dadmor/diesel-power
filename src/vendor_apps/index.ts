import { Vendor } from "./types/vendor.types";

// Authentication
export { AuthForm } from "./components/auth/AuthForm";
export { AuthProvider, useAuth } from "./contexts/AuthContext";

// Vendor Components
export { VendorForm } from "./components/vendor/VendorForm";
export { VendorList } from "./components/vendor/VendorList";

// Services
export { VendorService } from "./services/VendorService";

// Types
export type {
  ColumnType,
  Column,
  Table,
  Schema,
  Vendor,
} from "./types/vendor.types";

// Utils
export { mapColType, execVendorSQL } from "./utils/database.utils";

// Config
export { supabase } from "./config/supabase";

// Type definitions for external use
export interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface VendorFormProps {
  vendor?: Vendor;
  onSave: (
    vendorData: Omit<Vendor, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  onCancel: () => void;
}
