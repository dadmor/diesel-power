// src/lib/utils.ts - Wspólne utility functions

/**
 * Sanitizes slug for use in database table names
 * Replaces hyphens with underscores and ensures SQL-safe naming
 */
export const sanitizeSlugForDb = (slug: string): string => {
    return slug
      .replace(/-/g, '_')           // hyphens to underscores
      .replace(/[^a-z0-9_]/gi, '_') // remove any other special chars
      .toLowerCase();               // ensure lowercase
  };
  
  /**
   * Creates table name with vendor prefix
   */
  export const createTableName = (vendorSlug: string, tableName: string): string => {
    const sanitizedSlug = sanitizeSlugForDb(vendorSlug);
    const sanitizedTable = sanitizeSlugForDb(tableName);
    return `${sanitizedSlug}_${sanitizedTable}`;
  };
  
  /**
   * Validates if string is safe for SQL table/column names
   */
  export const isValidSqlIdentifier = (name: string): boolean => {
    return /^[a-z][a-z0-9_]*$/i.test(name);
  };