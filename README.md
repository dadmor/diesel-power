# Multi-Vendor App Generator

Minimalna aplikacja React + TypeScript + Vite do generowania kompletnych aplikacji CRUD dla różnych vendorów przez chat z LLM.

## 🚀 Szybki start

1. **Instalacja zależności:**
```bash
npm install
```

2. **Konfiguracja Supabase:**
   - Stwórz projekt w [Supabase](https://supabase.com)
   - Skopiuj `.env.example` do `.env`
   - Wypełnij dane Supabase URL i ANON KEY

3. **Utworzenie tabeli vendors w Supabase:**
```sql
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Funkcja pomocnicza do wykonywania SQL (potrzebna do tworzenia tabel)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void AS $
BEGIN
  EXECUTE sql;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. **Uruchomienie aplikacji:**
```bash
npm run dev
```

## 💬 Jak używać

1. **Otwórz aplikację** w przeglądarce (domyślnie `http://localhost:5173`)

2. **Opisz swoją aplikację** w chacie, np.:
   - "Potrzebuję aplikację do zarządzania produktami i zamówieniami"
   - "Chcę system CRM do klientów i kontaktów"
   - "Potrzebuję aplikację do zarządzania projektami i zadaniami"

3. **LLM wygeneruje tag** z konfiguracją:
```xml
<create_vendor_app name="E-commerce Store" slug="ecommerce-store" schema="products:name:string,price:number,description:text;orders:customer_name:string,total:number,status:select:pending,shipped,delivered">
```

4. **System automatycznie utworzy:**
   - Tabele w bazie danych z prefiksem vendora
   - Kompletną aplikację CRUD
   - Czyste UI z Tailwind CSS

5. **Gotowa aplikacja** będzie dostępna pod `/{vendor-slug}`

## 🏗️ Architektura

### Stack techniczny
- **React + TypeScript + Vite** - szybki development
- **Tailwind CSS** - styling bez pisania CSS
- **Supabase** - baza danych + realtime
- **React Router v6** - routing

### Struktura plików
```
src/
├── App.tsx              # Router + main layout
├── Chat.tsx            # Chat UI + tag parser  
├── AppGenerator.tsx    # Generator CRUD na podstawie schema
├── VendorTemplate.tsx  # Szablon UI dla vendora
├── supabaseClient.ts   # Supabase config + table creation
├── types.ts           # TypeScript definitions
└── main.tsx           # Entry point
```

### Schema format
```
table1:field1:type,field2:type;table2:field1:type,field2:type

Dostępne typy:
- string, number, text, date, boolean
- select:option1,option2,option3
```

## 📋 Przykłady użycia

### E-commerce
```xml
<create_vendor_app name="Sklep Online" slug="sklep-online" schema="products:name:string,price:number,description:text,stock:number;orders:customer_name:string,total:number,status:select:pending,shipped,delivered">
```

### CRM
```xml
<create_vendor_app name="CRM System" slug="crm" schema="clients:name:string,email:string,company:string,status:select:lead,customer;contacts:client_id:number,date:date,notes:text">
```

### Project Management
```xml
<create_vendor_app name="Project Manager" slug="pm" schema="projects:name:string,deadline:date,status:select:active,completed;tasks:project_id:number,title:string,priority:select:low,medium,high">
```

## 🔧 Customizacja

### Dodawanie nowych typów pól
W `AppGenerator.tsx` w funkcji `parseSchema()` można dodać nowe typy:

```typescript
case 'email':
  sqlType = 'TEXT';
  // Dodaj walidację email w komponencie formularza
  break;
```

### Modyfikacja UI
Wszystkie komponenty używają Tailwind CSS. Edytuj klasy w:
- `Chat.tsx` - interfejs chatu
- `VendorTemplate.tsx` - dashboard vendora

### Rozszerzenie funkcjonalności LLM
W `Chat.tsx` w funkcji `generateResponse()` dodaj nowe wzorce:

```typescript
if (lowerMessage.includes('inventory')) {
  return `<create_vendor_app name="Inventory System" slug="inventory" schema="...">`;
}
```

## 🚢 Deployment

### Vercel/Netlify
```bash
npm run build
# Deploy folder 'dist'
```

### Supabase Edge Functions (opcjonalnie)
Można przenieść logikę generowania do Supabase Edge Functions dla lepszej performance.

## 🎯 Roadmap

- [ ] Więcej typów pól (file upload, rich text)
- [ ] Relacje między tabelami (foreign keys)
- [ ] Export/import danych
- [ ] Custom branding per vendor
- [ ] Role-based access control
- [ ] API endpoints per vendor

## 🤝 Contributing

1. Fork repository
2. Stwórz branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📄 License

MIT License - zobacz [LICENSE](LICENSE) file.

---

**Stworzono z ❤️ dla szybkiego prototypowania aplikacji biznesowych**