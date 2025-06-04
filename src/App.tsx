// ===== src/App.tsx - ZMODYFIKOWANY =====
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TagBuilder from "./shemaAgent/TagBuilder";
import VendorApp from './vendorApp/VendorApp';
import PanelApp from './appsPanel/panel';



function App() {
  return (
    <Router>
      <Routes>
        {/* Generator (Twój istniejący TagBuilder) */}
        <Route path="/" element={<PanelApp/>} />
        <Route path="/generator" element={<TagBuilder />} />
        
        {/* Vendor Apps - dynamiczne routing */}
        <Route path="/:vendorSlug" element={<VendorApp />} />
        <Route path="/:vendorSlug/:tableName" element={<VendorApp />} />
      </Routes>
    </Router>
  );
}

export default App;