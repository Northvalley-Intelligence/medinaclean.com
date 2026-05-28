export type Locale = "en" | "es";

export const phone = process.env.NEXT_PUBLIC_ROSA_PHONE || "(404) 000-0000";
export const whatsapp = process.env.NEXT_PUBLIC_ROSA_WHATSAPP || "#schedule";
export const instagram = process.env.NEXT_PUBLIC_ROSA_INSTAGRAM || "#contact";

type SiteCopy = {
  nav: Record<string, string>;
  hero: Record<string, string>;
  stats: string[][];
  services: { title: string; body: string; items: string[][] };
  pricing: { title: string; body: string; headers: string[]; note: string };
  referral: { title: string; topline: string; body: string };
  gallery: { title: string; body: string };
  reviews: { title: string; body: string; empty: string; formTitle: string };
  schedule: { title: string; body: string; formTitle: string; submit: string };
  faq: { title: string; items: string[][] };
  privacy: string;
};

export const pricing = [
  { bedrooms: 1, baths: "1", oneTime: "$250", everyThreeWeeks: "$125", everyTwoWeeks: "$100" },
  { bedrooms: 2, baths: "1-2", oneTime: "$325", everyThreeWeeks: "$165", everyTwoWeeks: "$125" },
  { bedrooms: 3, baths: "2", oneTime: "$400", everyThreeWeeks: "$200", everyTwoWeeks: "$150" },
  { bedrooms: 4, baths: "2-3", oneTime: "$500", everyThreeWeeks: "$250", everyTwoWeeks: "$190" },
  { bedrooms: 5, baths: "3+", oneTime: "$625", everyThreeWeeks: "$315", everyTwoWeeks: "$240" }
];

export const copy = {
  en: {
    nav: {
      services: "Services",
      pricing: "Pricing",
      reviews: "Reviews",
      schedule: "Schedule",
      call: "Call Rosa"
    },
    hero: {
      eyebrow: "Cleaning near Woodstock, GA",
      title: "Medina Clean",
      body:
        "Friendly house, condo, apartment, and small business cleaning with careful detail, flexible recurring service, and direct contact with Rosa Medina.",
      primary: "Schedule a cleaning",
      whatsapp: "WhatsApp"
    },
    stats: [
      ["20 miles", "Service area from 30188"],
      ["$50 credit", "For qualified new client referrals"],
      ["English + Spanish", "Clear communication for every home"]
    ],
    services: {
      title: "Cleaning for the spaces people actually live and work in.",
      body:
        "Rosa handles one-time deep cleans, first-time cleans, and recurring cleaning for apartments, condos, houses, and small offices.",
      items: [
        ["Houses", "Reliable room-by-room cleaning for busy families and homeowners."],
        ["Apartments", "Compact, efficient cleaning for apartments and rentals."],
        ["Condos", "Careful cleaning for shared-building homes and move-in refreshes."],
        ["Small businesses", "Office and light commercial cleaning reviewed case by case."]
      ]
    },
    pricing: {
      title: "Simple starting rates",
      body:
        "These projected rates are based on bedrooms, typical bathrooms, and service frequency. Rosa confirms final pricing after reviewing the home.",
      headers: ["Bedrooms", "Typical baths", "First-time / one-time", "Every 3 weeks", "Every 2 weeks"],
      note:
        "Rates assume Rosa brings standard cleaning materials and the client is comfortable with those materials. Special product requests, specialty surfaces, heavy buildup, pet conditions, move-out cleaning, or unusual requirements may create additional charges decided case by case."
    },
    referral: {
      title: "$50 referral credit",
      topline: "Know someone who needs cleaning?",
      body:
        "Refer a new client who books a qualified cleaning and receive a $50 credit toward your next service."
    },
    gallery: {
      title: "Real project photos coming soon",
      body: "Reserved space for Rosa's before-and-after photos, team photos, and finished-room examples."
    },
    reviews: {
      title: "Client reviews",
      body:
        "Reviews appear here only after Rosa approves them. Photo reviews require permission and are saved as low-resolution images.",
      empty: "Approved reviews will appear here after launch.",
      formTitle: "Leave a review"
    },
    schedule: {
      title: "Request an appointment",
      body:
        "Choose three times that could work. This request does not confirm the appointment; Rosa will review the address and contact you.",
      formTitle: "Cleaning request",
      submit: "Send request"
    },
    faq: {
      title: "Questions people ask before booking",
      items: [
        [
          "Does Rosa bring cleaning supplies?",
          "Yes, starting rates assume Rosa brings standard cleaning materials. Special product requests may change the price."
        ],
        [
          "How is the service area checked?",
          "The free version checks ZIP codes within about 20 miles of 30188. Rosa confirms the exact address before accepting."
        ],
        [
          "Can I book recurring cleaning?",
          "Yes. Every-two-week and every-three-week recurring deep cleaning rates are available after the first service."
        ]
      ]
    },
    privacy:
      "Privacy: appointment requests and pending reviews are private. Approved reviews may be shown publicly only with consent."
  },
  es: {
    nav: {
      services: "Servicios",
      pricing: "Precios",
      reviews: "Reseñas",
      schedule: "Cita",
      call: "Llamar a Rosa"
    },
    hero: {
      eyebrow: "Limpieza cerca de Woodstock, GA",
      title: "Medina Clean",
      body:
        "Limpieza para casas, condominios, apartamentos y pequeños negocios con detalle, servicio recurrente flexible y comunicación directa con Rosa Medina.",
      primary: "Pedir una cita",
      whatsapp: "WhatsApp"
    },
    stats: [
      ["20 millas", "Área de servicio desde 30188"],
      ["$50 de crédito", "Por referir un cliente nuevo calificado"],
      ["Inglés + Español", "Comunicación clara para cada hogar"]
    ],
    services: {
      title: "Limpieza para los espacios donde la gente vive y trabaja.",
      body:
        "Rosa ofrece limpiezas profundas de una vez, primeras limpiezas y servicio recurrente para apartamentos, condominios, casas y oficinas pequeñas.",
      items: [
        ["Casas", "Limpieza confiable cuarto por cuarto para familias ocupadas."],
        ["Apartamentos", "Limpieza eficiente para apartamentos y rentas."],
        ["Condominios", "Limpieza cuidadosa para hogares en edificios compartidos."],
        ["Pequeños negocios", "Limpieza de oficina y comercial ligera revisada caso por caso."]
      ]
    },
    pricing: {
      title: "Precios iniciales simples",
      body:
        "Estos precios proyectados se basan en habitaciones, baños típicos y frecuencia del servicio. Rosa confirma el precio final después de revisar la casa.",
      headers: ["Habitaciones", "Baños típicos", "Primera / una vez", "Cada 3 semanas", "Cada 2 semanas"],
      note:
        "Los precios asumen que Rosa trae materiales de limpieza estándar y que el cliente está de acuerdo con esos materiales. Solicitudes especiales de productos, superficies delicadas, acumulación fuerte, mascotas, mudanzas o requisitos especiales pueden tener cargos adicionales decididos caso por caso."
    },
    referral: {
      title: "$50 de crédito por referir",
      topline: "¿Conoce a alguien que necesita limpieza?",
      body:
        "Refiera un cliente nuevo que reserve una limpieza calificada y reciba $50 de crédito para su próximo servicio."
    },
    gallery: {
      title: "Fotos reales próximamente",
      body: "Espacio reservado para fotos de antes y después, fotos de Rosa y ejemplos de cuartos terminados."
    },
    reviews: {
      title: "Reseñas de clientes",
      body:
        "Las reseñas aparecen aquí solo después de la aprobación de Rosa. Las fotos requieren permiso y se guardan en baja resolución.",
      empty: "Las reseñas aprobadas aparecerán aquí después del lanzamiento.",
      formTitle: "Dejar una reseña"
    },
    schedule: {
      title: "Solicitar una cita",
      body:
        "Elija tres horarios posibles. Esta solicitud no confirma la cita; Rosa revisará la dirección y se comunicará con usted.",
      formTitle: "Solicitud de limpieza",
      submit: "Enviar solicitud"
    },
    faq: {
      title: "Preguntas antes de reservar",
      items: [
        [
          "¿Rosa trae productos de limpieza?",
          "Sí, los precios iniciales asumen que Rosa trae materiales estándar. Productos especiales pueden cambiar el precio."
        ],
        [
          "¿Cómo se revisa el área de servicio?",
          "La versión gratis revisa códigos ZIP dentro de aproximadamente 20 millas de 30188. Rosa confirma la dirección exacta antes de aceptar."
        ],
        [
          "¿Puedo reservar limpieza recurrente?",
          "Sí. Hay precios recurrentes cada dos semanas y cada tres semanas después del primer servicio."
        ]
      ]
    },
    privacy:
      "Privacidad: las solicitudes de cita y reseñas pendientes son privadas. Las reseñas aprobadas se muestran públicamente solo con permiso."
  }
} satisfies Record<Locale, SiteCopy>;
