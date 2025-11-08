import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TournamentsProvider } from './contexts/TournamentsContext';
import { HashRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* FIX: Use HashRouter instead of BrowserRouter for compatibility with static hosting */}
    <HashRouter>
      <TournamentsProvider>
        <App />
      </TournamentsProvider>
    </HashRouter>
  </React.StrictMode>
);