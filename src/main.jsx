import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("Main.jsx is running");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("React rendered");
} catch (error) {
  console.error("Error in main.jsx:", error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>App Crashed</h1><pre>${error.toString()}</pre></div>`;
}
