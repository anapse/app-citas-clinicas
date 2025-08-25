import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

/**
 * Footer de la aplicación
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Información de la clínica */}
          <div className="footer-section">
            <h4 className="footer-title">ClinicApp</h4>
            <p className="footer-description">
              Sistema integral de gestión de citas médicas. 
              Facilitamos el acceso a la atención médica de calidad.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
                </svg>
                <span>+51 999 999 999</span>
              </div>
              <div className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                </svg>
                <span>contacto@clinicapp.com</span>
              </div>
              <div className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                <span>Lima, Perú</span>
              </div>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="footer-section">
            <h4 className="footer-title">Enlaces Rápidos</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/especialidades">Especialidades</Link></li>
              <li><Link to="/doctores">Doctores</Link></li>
              <li><Link to="/citas">Mis Citas</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>

          {/* Servicios */}
          <div className="footer-section">
            <h4 className="footer-title">Servicios</h4>
            <ul className="footer-links">
              <li><Link to="/especialidades/cardiologia">Cardiología</Link></li>
              <li><Link to="/especialidades/neurologia">Neurología</Link></li>
              <li><Link to="/especialidades/pediatria">Pediatría</Link></li>
              <li><Link to="/especialidades/ginecologia">Ginecología</Link></li>
              <li><Link to="/especialidades">Ver todas</Link></li>
            </ul>
          </div>

          {/* Horarios y redes sociales */}
          <div className="footer-section">
            <h4 className="footer-title">Horarios de Atención</h4>
            <div className="schedule">
              <div className="schedule-item">
                <span className="day">Lunes - Viernes</span>
                <span className="time">8:00 AM - 8:00 PM</span>
              </div>
              <div className="schedule-item">
                <span className="day">Sábados</span>
                <span className="time">8:00 AM - 2:00 PM</span>
              </div>
              <div className="schedule-item">
                <span className="day">Domingos</span>
                <span className="time">Emergencias</span>
              </div>
            </div>

            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.564H7.078V12.073H10.125V9.405C10.125 6.348 11.917 4.691 14.658 4.691C15.97 4.691 17.344 4.922 17.344 4.922V7.875H15.83C14.34 7.875 13.875 8.8 13.875 9.75V12.073H17.203L16.671 15.564H13.875V24C19.612 23.094 24 18.1 24 12.073Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23.953 4.57C23.054 4.964 22.09 5.227 21.09 5.343C22.121 4.725 22.907 3.76 23.279 2.625C22.315 3.198 21.25 3.608 20.122 3.832C19.204 2.876 17.898 2.278 16.464 2.278C13.723 2.278 11.5 4.501 11.5 7.243C11.5 7.632 11.546 8.01 11.635 8.372C7.577 8.165 4.014 6.186 1.637 3.161C1.213 3.874 0.974 4.725 0.974 5.633C0.974 7.367 1.856 8.901 3.179 9.784C2.363 9.757 1.604 9.541 0.938 9.183V9.245C0.938 11.655 2.655 13.654 4.916 14.113C4.504 14.227 4.071 14.289 3.624 14.289C3.299 14.289 2.984 14.258 2.677 14.2C3.317 16.163 5.14 17.598 7.314 17.638C5.612 18.987 3.452 19.786 1.103 19.786C0.703 19.786 0.309 19.764 -0.077 19.722C2.123 21.146 4.728 22 7.557 22C16.452 22 21.355 14.369 21.355 7.813C21.355 7.6 21.35 7.388 21.341 7.177C22.314 6.478 23.178 5.592 23.953 4.57Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2.163C15.204 2.163 15.584 2.175 16.85 2.233C20.102 2.381 21.621 3.924 21.769 7.152C21.827 8.417 21.838 8.797 21.838 12.001C21.838 15.206 21.826 15.585 21.769 16.85C21.62 20.075 20.105 21.621 16.85 21.769C15.584 21.827 15.206 21.839 12 21.839C8.796 21.839 8.416 21.827 7.151 21.769C3.891 21.62 2.38 20.07 2.232 16.849C2.174 15.584 2.162 15.205 2.162 12C2.162 8.796 2.175 8.417 2.232 7.151C2.381 3.924 3.896 2.38 7.151 2.232C8.417 2.175 8.796 2.163 12 2.163ZM12 0C8.741 0 8.333 0.014 7.053 0.072C2.695 0.272 0.273 2.69 0.073 7.052C0.014 8.333 0 8.741 0 12C0 15.259 0.014 15.668 0.072 16.948C0.272 21.306 2.69 23.728 7.052 23.928C8.333 23.986 8.741 24 12 24C15.259 24 15.668 23.986 16.948 23.928C21.302 23.728 23.73 21.31 23.927 16.948C23.986 15.668 24 15.259 24 12C24 8.741 23.986 8.333 23.928 7.053C23.732 2.699 21.311 0.273 16.949 0.073C15.668 0.014 15.259 0 12 0ZM12 5.838C8.597 5.838 5.838 8.597 5.838 12C5.838 15.403 8.597 18.162 12 18.162C15.403 18.162 18.162 15.403 18.162 12C18.162 8.597 15.403 5.838 12 5.838ZM12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12C16 14.209 14.209 16 12 16ZM18.406 4.155C18.406 4.955 17.761 5.6 16.961 5.6C16.161 5.6 15.516 4.955 15.516 4.155C15.516 3.355 16.161 2.71 16.961 2.71C17.761 2.71 18.406 3.355 18.406 4.155Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20.447 20.452H16.893V14.883C16.893 13.555 16.866 11.846 15.041 11.846C13.188 11.846 12.905 13.291 12.905 14.785V20.452H9.351V9H12.765V10.561H12.811C13.288 9.661 14.448 8.711 16.181 8.711C19.782 8.711 20.448 11.081 20.448 14.166V20.452H20.447ZM5.337 7.433C4.193 7.433 3.274 6.507 3.274 5.368C3.274 4.23 4.194 3.305 5.337 3.305C6.477 3.305 7.401 4.23 7.401 5.368C7.401 6.507 6.476 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.2 24 24 23.227 24 22.271V1.729C24 0.774 23.2 0 22.222 0H22.225Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} ClinicApp. Todos los derechos reservados.</p>
          </div>
          <div className="footer-legal">
            <Link to="/privacidad">Política de Privacidad</Link>
            <Link to="/terminos">Términos de Uso</Link>
            <Link to="/cookies">Política de Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
