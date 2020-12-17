import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import routes, { renderRoutes } from './routes';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <header>
        <h1>hy.ly Video Meeting</h1>
      </header>
      <main>
        <Router>
          {renderRoutes(routes)}
        </Router>
      </main>
    </div>
  );
};

export default App;
