import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppRouter from './router/index.jsx';

function App() {
  return (
    <AuthProvider>
      <Router 
        basename="/app-citas-clinicas"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}

export default App;
