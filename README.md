````markdown
# Multi-Vendor App Generator

Generuj aplikacje CRUD przez chat z AI.

## Szybki start

### 1. Setup Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com)  
2. W SQL Editor wklej i uruchom poniższe polecenia:
```sql
 -- =============================================================================
-- multitenant.sql - Kompletne rozwiązanie multi-tenant dla Supabase
-- =============================================================================
-- Ten plik zawiera wszystko co potrzebne do uruchomienia systemu multi-tenant:
-- 1) Tabelę vendors z politykami RLS
-- 2) Funkcję exec_vendor_sql do bezpiecznego wykonywania SQL
-- 3) Funkcje pomocnicze
-- =============================================================================

-- Usuń stare triggery PRZED usunięciem funkcji
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;

-- Teraz można bezpiecznie usunąć funkcje
DROP FUNCTION IF EXISTS get_vendor_tables(text);
DROP FUNCTION IF EXISTS set_vendor_context(text);
DROP FUNCTION IF EXISTS exec_sql(text);
DROP FUNCTION IF EXISTS exec_vendor_sql(text, text);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Tabela przechowująca definicje vendorów/tenantów
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Polityki RLS dla tabeli vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Usuń starą politykę jeśli istnieje
DROP POLICY IF EXISTS "vendors_policy" ON vendors;

CREATE POLICY "vendors_policy" ON vendors
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Funkcja do automatycznego ustawiania updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Trigger dla tabeli vendors
CREATE TRIGGER update_vendors_updated_at 
  BEFORE UPDATE ON vendors 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Główna funkcja wykonująca SQL z weryfikacją vendor_slug
CREATE OR REPLACE FUNCTION exec_vendor_sql(vendor_slug text, sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Sprawdzenia podstawowe
  IF vendor_slug IS NULL OR vendor_slug = '' THEN
    RAISE EXCEPTION 'vendor_slug nie może być pusty';
  END IF;

  IF sql IS NULL OR sql = '' THEN
    RAISE EXCEPTION 'SQL nie może być pusty';
  END IF;

  -- Sprawdź czy vendor istnieje
  IF NOT EXISTS (SELECT 1 FROM vendors WHERE slug = vendor_slug) THEN
    RAISE EXCEPTION 'Vendor o slug % nie istnieje', vendor_slug;
  END IF;

  -- Weryfikacja bezpieczeństwa: SQL musi zawierać prefix vendora
  IF position(vendor_slug || '_' IN sql) = 0 THEN
    RAISE EXCEPTION 'SQL musi zawierać tabele z prefixem vendora %', vendor_slug;
  END IF;

  -- Wykonaj SQL
  EXECUTE sql;
END;
$function$;

-- Funkcja pomocnicza do sprawdzania tabel vendora
CREATE OR REPLACE FUNCTION get_vendor_tables(vendor_slug text)
RETURNS TABLE(table_name text) 
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name LIKE vendor_slug || '_%'
    AND t.table_type = 'BASE TABLE';
END;
$function$;

-- Funkcje zachowane dla kompatybilności wstecznej
CREATE OR REPLACE FUNCTION set_vendor_context(vendor_slug text)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE NOTICE 'set_vendor_context: funkcja zachowana dla kompatybilności, vendor: %', vendor_slug;
END;
$function$;

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'Funkcja przestarzała. Użyj exec_vendor_sql(vendor_slug, sql) zamiast exec_sql(sql)';
END;
$function$;

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION exec_vendor_sql(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_tables(text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_vendor_context(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
````

> **TODO (bezpieczeństwo prefixów):**
> Obecnie każdy `slug` (prefix) jest jawnie dostępny w tabeli `vendors` – wystarczy wykonać `SELECT slug FROM vendors`, aby poznać wszystkie istniejące prefixy i potencjalnie użyć ich do wstrzyknięcia złośliwego SQL-u. W przyszłości należy dodać RLS lub ograniczyć widoczność kolumny `slug`, by uniemożliwić atakującemu łatwe uzyskanie prefixów.

### 2. Zmienne środowiskowe

#### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

#### Backend (`.env`)

```env
GEMINI_API_KEY=twoj-google-ai-key
```

### 3. Uruchomienie

```bash
# Backend
node server.js

# Frontend
npm run dev
```

---

## Użycie

Wpisz w chat:

* `"Sklep online"`
* `"System CRM"`
* `"Aplikacja fakturowania"`

AI wygeneruje kompletną aplikację CRUD.

## Typy pól

* `string`, `text`, `number`, `date`, `boolean`
* `select:opcja1,opcja2,opcja3`

## Stack

React + TypeScript + Supabase + Google AI

---

## Przykładowy schemat aplikacji (APP EXAMPLE SCHEMA)

```jsonc
{
  "id": "1",
  "name": "Aplikacja Budowy Domów",
  "slug": "house-building",
  "created_at": "2024-01-15T10:00:00Z",
  "schema": {
    "name": "Aplikacja Budowy Domów",
    "slug": "house-building",
    "tables": [
      {
        "name": "projects",
        "fields": [
          { "name": "title",     "type": "string" },
          { "name": "address",   "type": "string" },
          { "name": "status",    "type": "string" },
          { "name": "client_id", "type": "number" }
        ]
      },
      {
        "name": "clients",
        "fields": [
          { "name": "name",  "type": "string" },
          { "name": "email", "type": "string" },
          { "name": "phone", "type": "string" }
        ]
      }
    ],
    "relations": [
      { "from": "clients", "to": "projects", "type": "one-to-many" }
    ],
    "roles": []
  }
}
```

---

## TODO

* **Walidacja prefixów (slug):**

  * Aktualnie prefixy (slugi) można łatwo odczytać z tabeli `vendors`, co umożliwia ataki SQL-injection polegające na tworzeniu (lub usuwaniu) tabel z prefixem innego tenanta.
  * Należy dodać:

    * Ograniczenie RLS tak, aby każdy użytkownik widział tylko swój wpis w `vendors`.
    * Walidację formatów slugów (np. tylko małe litery, cyfry, myślniki) po stronie bazy i/lub aplikacji, by uniemożliwić wstrzyknięcie dodatkowych poleceń SQL.
    * Przemyśleć mechanizm przechowywania i ukrycia prefixów w celu minimalizacji ryzyka.

* **Rozbudowa ról i uprawnień:**

  * Dodanie autoryzacji na poziomie ról (np. admin, support, user) w bazie.
  * Zarządzanie dostępem do CRUD w zależności od roli.

* **Logowanie i monitorowanie SQL:**

  * Rejestrowanie wykonywanych zapytań SQL w tabeli audytu.
  * Alertowanie o podejrzanej aktywności (np. tworzenie/usuwanie tabel niestandardowych poza listą zdefiniowanych w `schema`).

---

