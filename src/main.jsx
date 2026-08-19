import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Not: StrictMode bilinçli olarak kullanılmadı.
// react-pageflip, React 18 StrictMode'un çift render davranışıyla
// çakışarak çift sayfa düzeneği oluşturabiliyor.
createRoot(document.getElementById('root')).render(<App />);
