// src/data/doctores.js
// dayOfWeek: 0=Dom, 1=Lun, ... 6=Sáb
export const DOCTORES = [
    {
        id: "dr-cairo",
        nombre: "Dr. Cairo",
        especialidad: "Odontología General",
        dias: [1, 2, 3, 4], // Lun-Jue
        turnos: [
            { start: "08:00", end: "12:00" }, // de 8 a 12
            { start: "16:00", end: "19:00" }  // de 16 a 19
        ]
    },
    {
        id: "dra-perez",
        nombre: "Dra. Pérez",
        especialidad: "Endodoncia",
        dias: [2, 4, 6], // Mar, Jue, Sáb
        turnos: [{ start: "09:00", end: "12:00" }]
    },
    {
        id: "dr-ruiz",
        nombre: "Dr. Ruiz",
        especialidad: "Ortodoncia",
        dias: [1, 3, 5], // Lun, Mié, Vie
        turnos: [{ start: "17:00", end: "19:00" }]
    }
];
