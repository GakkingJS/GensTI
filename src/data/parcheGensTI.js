export const parcheInfo = {
  name: "Asesorías del Parche GensTI",
  community: "GensTI",
  program: "Ingeniería de Sistemas",
  university: "Universidad Cooperativa de Colombia",
  campus: "Ibagué",
  location: "Sala cómputo 3",
  validity:
    "La información recibida no especifica fechas de inicio, finalización ni vigencia semestral.",
};

export const subjectGroups = [
  {
    id: "programacion",
    label: "Programación",
    symbol: "</>",
    description:
      "Un espacio para trabajar conceptos, resolver dudas y fortalecer tus bases de programación.",
    subjects: [
      "Estructuras de datos",
      "Programación orientada a objetos",
    ],
  },
  {
    id: "matematicas",
    label: "Matemáticas y física",
    symbol: "∑",
    description:
      "Un espacio para abordar ejercicios y dudas de matemáticas, física y métodos numéricos.",
    subjects: [
      "Cálculo diferencial",
      "Cálculo integral",
      "Física mecánica",
      "Álgebra lineal",
      "Lógica matemática",
      "Análisis numérico",
    ],
  },
];

export const advisingSessions = [
  {
    id: "martes-programacion",
    day: "Martes",
    dayOrder: 2,
    time: "9:00 a. m.",
    time24: "09:00",
    groupId: "programacion",
    location: "Sala cómputo 3",
    leaders: ["Walter Alturo", "Johan Reyes"],
  },
  {
    id: "martes-matematicas",
    day: "Martes",
    dayOrder: 2,
    time: "4:00 p. m.",
    time24: "16:00",
    groupId: "matematicas",
    location: "Sala cómputo 3",
    leaders: [
      "Juan P. Gómez Zapata",
      "Daniel E. Aristizábal",
    ],
  },
  {
    id: "viernes-matematicas",
    day: "Viernes",
    dayOrder: 5,
    time: "9:00 a. m.",
    time24: "09:00",
    groupId: "matematicas",
    location: "Sala cómputo 3",
    leaders: ["Daniel E. Aristizábal"],
  },
  {
    id: "viernes-programacion",
    day: "Viernes",
    dayOrder: 5,
    time: "4:00 p. m.",
    time24: "16:00",
    groupId: "programacion",
    location: "Sala cómputo 3",
    leaders: ["Walter Alturo", "Johan Reyes"],
  },
];