// src/components/DayScheduleGrid.jsx
import React, { useMemo, useState, useEffect } from "react";
import "../styles/DayScheduleGrid.css"; // Usar su propia hoja de estilos
import "../styles/components.css"; // Para estilos de modal base
import { DOCTORES } from "../data/doctores";
import { horariosService } from "../services/horariosService";

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
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState(null);
  const [usingDatabase, setUsingDatabase] = useState(true);

  const hours = horasOverride ?? horasDisponibles;
  const doctors = doctoresOverride ?? DOCTORES;

  // Cargar horarios disponibles de la base de datos
  useEffect(() => {
    if (!selectedDate || !isOpen) return;

    const cargarHorarios = async () => {
      setLoadingHorarios(true);
      setErrorHorarios(null);
      
      // Horarios por defecto como respaldo
      const horasDefault = [
        "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
        "19:00", "20:00", "21:00"
      ];

      try {
        // Verificar conectividad del backend
        const backendDisponible = await horariosService.checkBackendConnection();
        
        if (!backendDisponible) {
          console.log('Backend no disponible, usando horarios por defecto');
          setHorasDisponibles(horasDefault);
          setUsingDatabase(false);
          setLoadingHorarios(false);
          return;
        }

        const diaSemana = selectedDate.getDay();
        const fechaISO = selectedDate.toISOString().split('T')[0];

        // Estrategia 1: Obtener horas disponibles para la fecha específica
        try {
          const horasDisponibles = await horariosService.getHorasDisponibles(fechaISO);
          if (horasDisponibles && horasDisponibles.length > 0) {
            setHorasDisponibles(horasDisponibles);
            setUsingDatabase(true);
            return;
          }
        } catch (error) {
          console.log('No hay horarios específicos para la fecha:', error.message);
        }

        // Estrategia 2: Obtener horarios por día de semana
        try {
          const horariosPorDia = await horariosService.getHorariosPorDia(diaSemana);
          if (horariosPorDia && horariosPorDia.length > 0) {
            const horasUnicas = [...new Set(horariosPorDia.map(h => h.hora))].sort();
            setHorasDisponibles(horasUnicas);
            setUsingDatabase(true);
            return;
          }
        } catch (error) {
          console.log('No hay horarios para el día de semana:', error.message);
        }

        // Estrategia 3: Obtener horarios de doctores individuales
        const doctoresDelDia = doctors.filter(d => d.dias.includes(diaSemana));
        
        if (doctoresDelDia.length === 0) {
          setHorasDisponibles(horasDefault);
          setUsingDatabase(false);
          return;
        }

        const horariosPromises = doctoresDelDia.map(doctor => 
          horariosService.getDoctorHorarios(doctor.id).catch(() => null)
        );
        
        const resultados = await Promise.all(horariosPromises);
        
        const todasLasHoras = new Set();
        resultados.forEach(horarios => {
          if (horarios && Array.isArray(horarios)) {
            horarios.forEach(horario => {
              if (horario.hora) {
                todasLasHoras.add(horario.hora);
              }
            });
          }
        });

        // Si se obtuvieron horarios de la BD, usarlos; sino, usar por defecto
        if (todasLasHoras.size > 0) {
          const horasOrdenadas = Array.from(todasLasHoras).sort();
          setHorasDisponibles(horasOrdenadas);
          setUsingDatabase(true);
        } else {
          setHorasDisponibles(horasDefault);
          setUsingDatabase(false);
        }

      } catch (error) {
        console.error('Error al cargar horarios:', error);
        setErrorHorarios('Error de conexión con el servidor');
        // Usar horarios por defecto en caso de error
        setHorasDisponibles(horasDefault);
        setUsingDatabase(false);
      } finally {
        setLoadingHorarios(false);
      }
    };

    cargarHorarios();
  }, [selectedDate, isOpen, doctors]);

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

  // Mostrar estado de carga
  if (loadingHorarios) {
    return (
      <div className="modal-backdrop">
        <div className="modal schedule-modal">
          <div className="schedule-header">
            <h3 className="schedule-date">📅 {fechaLegible}</h3>
          </div>
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
          <div className="modal-body">
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>Cargando horarios disponibles...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal schedule-modal">
        {/* Header del modal con fecha y leyenda en la misma línea */}
        <div className="schedule-header">
          <div className="schedule-title-section">
            <h3 className="schedule-date">
              📅 {fechaLegible}
            </h3>
            {!usingDatabase && (
              <div className="schedule-offline-indicator" title="Mostrando horarios por defecto - Sin conexión a base de datos">
                🔄 Modo sin conexión
              </div>
            )}
          </div>
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
