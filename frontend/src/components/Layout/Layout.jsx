import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.jsx';
import Footer from '../Footer/Footer.jsx';
import FloatingLogin from '../FloatingLogin/FloatingLogin.jsx';
import './Layout.css';

/**
 * Layout principal de la aplicación
 * Incluye navbar, contenido principal y footer
 */
const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <FloatingLogin />
    </div>
  );
};

export default Layout;
