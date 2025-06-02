# Minimalna Multi-Vendor Aplikacja - Prompt

## Zadanie (minimalne)
Stwórz minimalną aplikację React + TypeScript + Vite, która przez chat z LLM może generować kompletne aplikacje CRUD dla różnych vendorów/klientów z wykorzystaniem tagów.

## Stack techniczny (minimal)
- **React + TypeScript + Vite**
- **Tailwind CSS** (dla szybkiego UI)
- **Refine** (`@refinedev/core` + `@refinedev/supabase`) - auto-generuje CRUD
- **Supabase** - baza danych z prefiksowanymi tabelami
- **React Router v6** - prosty routing

## Struktura projektu (5-6 plików)
```
src/
├── App.tsx                 # Router + main layout
├── Chat.tsx               # Chat UI + tag parser  
├── AppGenerator.tsx       # Generator CRUD na podstawie schema
├── VendorTemplate.tsx     # Szablon UI dla vendora
├── supabaseClient.ts      # Supabase config + table creation
└── types.ts              # TypeScript definitions
```

## Baza danych (Supabase)
**Jedna tabela master:**
- `vendors(id, slug, name, schema JSONB, created_at)`

**Dynamiczne tabele per vendor:**
- `{vendorSlug}_products`, `{vendorSlug}_orders` etc. (tworzone przez LLM)
- Bez RLS - proste prefiksowanie tabel

## LLM Chat Tags
```xml
<create_vendor_app name="KlientXYZ" slug="klient-xyz" schema="products:name:string,price:number,description:text;orders:date:date,total:number,status:select:pending,completed,cancelled">
```

**Gdzie:**
- `schema` = `table:field:type,field:type;nexttable:field:type`
- `types`: string, number, text, date, boolean, select:option1,option2

## Funkcjonalność minimalna

### 1. Chat Component (~100 linii)
- Input + send button (Tailwind)
- Parser tagów `<create_vendor_app>`
- Wywołanie AppGenerator

### 2. AppGenerator (~150 linii)
- Parse schema → create Supabase tables
- Generate Refine resources dynamically
- Create vendor entry w bazie

### 3. VendorTemplate (~100 linii)
- Refine `<List>`, `<Create>`, `<Edit>` components
- Tailwind styling (clean, modern)
- Sidebar z menu (auto-generated z schema)

### 4. Supabase Client (~50 linii)
- Connection + table creation functions
- Simple queries (no RLS)

### 5. Types (~30 linii)
- Schema interface
- Vendor interface
- Field types

## Routing
```
/ → Chat (generator)
/:vendorSlug → Vendor App
/:vendorSlug/:resource → CRUD views
```

## UI Design (Tailwind)
- **Chat**: Prosta konwersacja (jak ChatGPT)
- **Vendor App**: Clean dashboard z sidebar
- **CRUD**: Refine components + Tailwind classes

## Proces użycia
1. **Chat**: "Potrzebuję aplikację dla sklepu z produktami i zamówieniami"
2. **LLM**: Generuje `<create_vendor_app>` tag
3. **System**: Tworzy tabele + komponenty React
4. **Rezultat**: `http://localhost:5173/sklep-xyz` → gotowa aplikacja
5. **Klient**: Może testować CRUD od razu

## Wymagania techniczne
- **Minimalne zależności** - tylko Vite, React, Refine, Supabase, Tailwind
- **Zero boilerplate** - Refine załatwia formularze/tabele
- **Auto-deployment** - każdy vendor dostaje working URL
- **~400-600 linii kodu** total

## Efekt końcowy
- Generator aplikacji przez chat
- Każdy vendor = oddzielna aplikacja pod `/:vendorSlug`
- Pełny CRUD z ładnym UI (Tailwind)
- Gotowe do testowania przez klienta w minuty
- Skalowalne (prefiksowane tabele, shared codebase)

## System Message dla LLM
```
Jesteś generatorem aplikacji biznesowych. Gdy użytkownik opisuje potrzeby, analizujesz je i generujesz tag:

<create_vendor_app name="NazwaKlienta" slug="nazwa-klienta" schema="tabela:pole:typ,pole:typ;tabela2:pole:typ">

Przykład:
Użytkownik: "Potrzebuję aplikację do zarządzania produktami i zamówieniami"
Odpowiedź: 
PLAN:
1. Tworzę aplikację z tabelami: products, orders
2. Products: name, price, description, stock
3. Orders: customer_name, total, status, date

<create_vendor_app name="E-commerce" slug="ecommerce" schema="products:name:string,price:number,description:text,stock:number;orders:customer_name:string,total:number,status:select:pending,shipped,delivered,date:date">
```

## Przewagi tego podejścia
✅ **Minimalny kod** (~500 linii vs 2000+)  
✅ **Refine automatyzuje** 80% boilerplate  
✅ **Tailwind** = szybkie, ładne UI  
✅ **Proste deployment** - jeden kod, multiple instances  
✅ **Szybki prototyping** - aplikacja w minuty  
✅ **Skalowalne** - prefix tables, shared components