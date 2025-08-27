import React, { useState, useMemo } from 'react';
import { useModal } from '../context/ModalContext';

const CalendarMonth = () => {
  const now = new Date();
  // Normalizamos "hoy" a inicio del día para evitar problemas de hora/minuto
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Usar el contexto global de modales
  const { openScheduleModal, selectedDate } = useModal();

  // Función para convertir día JS (0=Dom) a lunes=0
  const jsDayToMon0 = (jsDay) => (jsDay === 0 ? 6 : jsDay - 1);

  // Función para capitalizar primera letra
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Formatear mes y año
  const formatMonthYear = (year, month) => {
    const date = new Date(year, month, 1);
    const formatted = new Intl.DateTimeFormat('es-PE', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
    return capitalize(formatted);
  };

  // Navegación
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Verificar si es hoy
  const isToday = (year, month, day) => {
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };

  // Verificar si dos fechas son iguales
  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Calcular días del calendario
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const firstIndex = jsDayToMon0(firstOfMonth.getDay()); // 0..6 (lunes..domingo)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    const leadingDays = firstIndex;
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
    const trailingDays = totalCells - (leadingDays + daysInMonth);

    const days = [];

    // Días del mes anterior (leading)
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = leadingDays - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({
        day,
        year: prevYear,
        month: prevMonth,
        isCurrentMonth: false,
        isToday: isToday(prevYear, prevMonth, day),
        date: new Date(prevYear, prevMonth, day)
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        year: viewYear,
        month: viewMonth,
        isCurrentMonth: true,
        isToday: isToday(viewYear, viewMonth, day),
        date: new Date(viewYear, viewMonth, day)
      });
    }

    // Días del mes siguiente (trailing)
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    
    for (let day = 1; day <= trailingDays; day++) {
      days.push({
        day,
        year: nextYear,
        month: nextMonth,
        isCurrentMonth: false,
        isToday: isToday(nextYear, nextMonth, day),
        date: new Date(nextYear, nextMonth, day)
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Días de la semana
  const weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  const handleDayClick = (dayData) => {
    // Solo permitir seleccionar días futuros del mes actual
    const dayAt00 = new Date(dayData.date.getFullYear(), dayData.date.getMonth(), dayData.date.getDate());
    const isPastDate = dayAt00 < today;

    if (dayData.isCurrentMonth && !isPastDate) {
      // Abrir modal de horarios usando el contexto global
      openScheduleModal(dayData.date);
    } else if (!dayData.isCurrentMonth) {
      return;
    } else {
      console.log('No se pueden agendar citas en fechas pasadas');
    }
  };

  const handleKeyDown = (e, dayData) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(dayData);
    }
  };

  return (
    <div className="calendar">
      {/* Header con navegación */}
      <div className="calendar__header">
        <button
          onClick={goToPreviousMonth}
          className="calendar__navbtn"
          aria-label="Mes anterior"
          title="Mes anterior"
        >
          ‹
        </button>
        
        <h2 className="calendar__month">
          {formatMonthYear(viewYear, viewMonth)}
        </h2>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={goToToday}
            className="calendar__navbtn"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            title="Ir a hoy"
          >
            Hoy
          </button>
          
          <button
            onClick={goToNextMonth}
            className="calendar__navbtn"
            aria-label="Mes siguiente"
            title="Mes siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="calendar__weekdays">
        {weekdays.map((day, index) => (
          <div key={index} className="calendar__weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="calendar__grid">
        {calendarDays.map((dayData, index) => {
          const { day, isCurrentMonth, isToday: isDayToday, date } = dayData;
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isPastDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()) < today;
          const isSelectable = isCurrentMonth && !isPastDate;
          
          const cellClasses = [
            'calendar__cell',
            !isCurrentMonth && 'calendar__cell--outside',
            isDayToday && 'calendar__cell--today',
            isSelected && 'calendar__cell--selected',
            isPastDate && isCurrentMonth && 'calendar__cell--past'
          ].filter(Boolean).join(' ');

          return (
            <div
              key={`${dayData.year}-${dayData.month}-${day}-${index}`}
              className={cellClasses}
              onClick={() => handleDayClick(dayData)}
              onKeyDown={(e) => handleKeyDown(e, dayData)}
              tabIndex={isSelectable ? 0 : -1}
              role="button"
              aria-label={`${day} de ${formatMonthYear(dayData.year, dayData.month)}${isSelectable ? ' - Disponible para citas' : ''}`}
              title={`${date.toLocaleDateString('es-PE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}${isSelectable ? ' - Clic para seleccionar el día' : ''}`}
              style={{ cursor: isSelectable ? 'pointer' : 'default' }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonth;

