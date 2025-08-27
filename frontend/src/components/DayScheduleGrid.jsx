// src/components/DayScheduleGrid.jsx
import React, { useMemo } from "react";
import "../styles/DayScheduleGrid.css"; // Usar su propia hoja de estilos
import "../styles/components.css"; // Para estilos de modal base
import { DOCTORES } from "../data/doctores";
import { HORAS_DIA } from "../data/horarios"; // o inline

/**
 * Componente modal para mostrar disponibilidad de horarios.
 * - Columna izquierda: horas (1h). Verde = disponible (>=1 doctor), Rojo = no disponible, Gris = sin doctores.
 * - Columna derecha: tarjetas de doctores con sus rangos (start–end) para ese día.
 *
 * Props:
 * @param {Date} selectedDate - día elegido desde el calendario
 * @param {(payload:{hour:string})=>void} onPick - se llama al hacer click en una hora disponible
 * @param {()=>void} onClose - función para cerrar el modal
 * @param {boolean} isOpen - controla si el modal está abierto
 * @param {string[]} [horasOverride] - opcional para reemplazar HORAS_DIA
 * @param {object[]} [doctoresOverride] - opcional para reemplazar DOCTORES
 */
export default function DayScheduleGrid({
  selectedDate,
  onPick,
  onClose,
  isOpen,
  horasOverride,
  doctoresOverride
}) {
  const hours = horasOverride ?? HORAS_DIA;
  const doctors = doctoresOverride ?? DOCTORES;

  const dow = useMemo(() => selectedDate ? selectedDate.getDay() : null, [selectedDate]);

  // Helpers simples HH:mm → minutos y overlap de bloque de 1h
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const blockRange = (hour) => {
    const startMin = toMinutes(hour);
    const endMin = startMin + 60; // bloque de 1 hora
    return [startMin, endMin];
  };
  const overlaps = (rangeA, rangeB) => {
    const [a1, a2] = rangeA;
    const [b1, b2] = rangeB;
    return a1 < b2 && b1 < a2; // solapamiento abierto
  };

  // Filtrar doctores que atienden ese día
  const doctorsToday = useMemo(() => {
    if (dow == null) return [];
    return doctors.filter(d => d.dias.includes(dow));
  }, [doctors, dow]);

  // Mapa de disponibilidad por hora (>=1 doctor disponible → true)
  const availabilityByHour = useMemo(() => {
    const map = {};
    for (const h of hours) {
      const hrRange = blockRange(h);
      const available = doctorsToday.some(doc =>
        (doc.turnos ?? []).some(t => overlaps(hrRange, [toMinutes(t.start), toMinutes(t.end)]))
      );
      map[h] = available;
    }
    return map;
  }, [hours, doctorsToday]);

  // Tarjetas de doctores del día (mostrar sus rangos tal cual)
  const doctorCards = useMemo(() => {
    return doctorsToday.map(doc => ({
      id: doc.id,
      nombre: doc.nombre,
      especialidad: doc.especialidad,
      turnos: (doc.turnos ?? []).map(t => `${t.start} – ${t.end}`)
    }));
  }, [doctorsToday]);

  if (!isOpen || !selectedDate) {
    return null;
  }

  const fechaLegible = selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="modal-backdrop">
      <div className="modal schedule-modal">
        {/* Header del modal con fecha y leyenda en la misma línea */}
        <div className="schedule-header">
          <h3 className="schedule-date">
            📅 {fechaLegible}
          </h3>
          <div className="schedule-legend">
            <div className="legend-item">
              <div className="legend-color legend-available"></div>
              <span>Disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-unavailable"></div>
              <span>No disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-no-doctors"></div>
              <span>Sin doctores</span>
            </div>
          </div>
        </div>

        {/* Botón de cerrar */}
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ×
        </button>

        {/* Body del modal */}
        <div className="modal-body">
          <div className="schedule-layout">
            {/* Columna izquierda: Horas */}
            <div className="schedule-hours">
              <div className="hours-grid">
                {hours.map(h => {
                  const available = availabilityByHour[h];
                  const hasDoctors = doctorsToday.length > 0;
                  
                  let className = "schedule-hour";
                  if (!hasDoctors) {
                    className += " schedule-hour--no-doctors";
                  } else if (available) {
                    className += " schedule-hour--available";
                  } else {
                    className += " schedule-hour--unavailable";
                  }

                  return (
                    <button
                      key={h}
                      className={className}
                      onClick={() => available && onPick?.({ hour: h })}
                      disabled={!available || !hasDoctors}
                      title={
                        !hasDoctors 
                          ? "Sin doctores asignados" 
                          : available 
                            ? "Horario disponible - Click para agendar" 
                            : "Horario no disponible"
                      }
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columna derecha: Doctores (tarjetas) */}
            <div className="schedule-doctors">
              {doctorCards.length === 0 ? (
                <div className="no-doctors-message">
                  <div className="no-doctors-icon">👨‍⚕️</div>
                  <p>No hay doctores asignados para este día.</p>
                  <p className="text-secondary">Selecciona otro día del calendario.</p>
                </div>
              ) : (
                <>
                  <h4 className="doctors-title">Doctores disponibles ({doctorCards.length})</h4>
                  <div className="doctors-grid">
                    {doctorCards.map(doc => (
                      <div key={doc.id} className="doctor-card">
                        <div className="doctor-card-header">
                          <div className="doctor-name">{doc.nombre}</div>
                          <div className="doctor-specialty">{doc.especialidad}</div>
                        </div>
                        <div className="doctor-card-body">
                          <div className="doctor-schedule-label">Horarios:</div>
                          <div className="doctor-schedule-chips">
                            {doc.turnos.map((tr, i) => (
                              <span key={i} className="schedule-chip">{tr}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
