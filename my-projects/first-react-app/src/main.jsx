import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import App first
import App from './App.jsx'
// Import CSS last so your custom styles always "win" over library defaults
import './index.css' 
import './App.css'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Check your index.html!");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);