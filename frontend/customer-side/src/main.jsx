import React from 'react';
import '../../src/mechanic/styles/mechanic.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import { CustomerProvider } from './context/CustomerProvider.jsx';
import './styles/index.css';
import { LocaleProvider } from './context/LocaleProvider.jsx';
import { ThemeProvider } from './context/ThemeProvider.jsx';
import './styles/theme.css';
import './styles/welcome.css';
import './styles/location-picker.css';
import './styles/brand.css';
import './styles/policies.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider><AppProvider>
      <AuthProvider>
        <CustomerProvider>
          <BrowserRouter>
            <LocaleProvider><App /></LocaleProvider>
          </BrowserRouter>
        </CustomerProvider>
      </AuthProvider>
    </AppProvider></ThemeProvider>
  </React.StrictMode>,
);
