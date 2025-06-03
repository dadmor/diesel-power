# Multi-Vendor App Generator

Generuj aplikacje CRUD przez chat z AI.

## Szybki start

### 1. Setup Supabase
1. Utwórz projekt na [supabase.com](https://supabase.com)
2. SQL Editor → wklej i uruchom:
```sql
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE _system_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_slug TEXT NOT NULL,
  table_name TEXT NOT NULL,
  columns JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE _system_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON vendors FOR ALL USING (true);
CREATE POLICY "Allow all" ON _system_tables FOR ALL USING (true);
```

### 2. Zmienne środowiskowe

Frontend `.env`:
```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

Backend `.env`:
```env
GEMINI_API_KEY=twoj-google-ai-key
```

### 3. Uruchom
```bash
# Backend
node server.js

# Frontend  
npm run dev
```

## Użycie

Wpisz w chat:
- "Sklep online"
- "System CRM" 
- "Aplikacja fakturowania"

AI wygeneruje kompletną aplikację CRUD.

## Typy pól
- `string`, `text`, `number`, `date`, `boolean`
- `select:opcja1,opcja2,opcja3`

## Stack
React + TypeScript + Supabase + Google AI


## APP EXAMPLE SCHEMA
 {
    id: '1',
    name: 'Aplikacja Budowy Domów',
    slug: 'house-building',
    created_at: '2024-01-15T10:00:00Z',
    schema: {
      name: 'Aplikacja Budowy Domów',
      slug: 'house-building',
      tables: [
        { 
          name: 'projects', 
          fields: [
            { name: 'title', type: 'string' },
            { name: 'address', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'client_id', type: 'number' }
          ] 
        },
        { 
          name: 'clients', 
          fields: [
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'phone', type: 'string' }
          ] 
        }
      ],
      relations: [{ from: 'clients', to: 'projects', type: 'one-to-many' }],
      roles: []
    }
  },