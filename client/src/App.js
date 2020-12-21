import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import routes, { renderRoutes } from './routes';
import AppContextProvider from './contexts/AppContext';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <header>
        <h1>Derek Video Meeting</h1>
      </header>
      <main>
        <AppContextProvider>
          <Router>
            {renderRoutes(routes)}
          </Router>
        </AppContextProvider>
      </main>
    </div>
  );
};

export default App;
