export type Locale = "en" | "es";

export const phone = process.env.NEXT_PUBLIC_ROSA_PHONE || "";
export const whatsapp = process.env.NEXT_PUBLIC_ROSA_WHATSAPP || "#schedule";
export const instagram = process.env.NEXT_PUBLIC_ROSA_INSTAGRAM || "#contact";

type SiteCopy = {
  nav: Record<string, string>;
  hero: Record<string, string>;
  stats: string[][];
  services: { title: string; body: string; items: string[][] };
  pricing: { title: string; body: string; headers: string[]; note: string };
  chat: { title: string; body: string };
  referral: { title: string; topline: string; body: string };
  gallery: { title: string; body: string; videos: string[]; action: string };
  reviews: { title: string; body: string; empty: string; formTitle: string };
  schedule: { title: string; body: string; formTitle: string; submit: string };
  faq: { title: string; items: string[][] };
  privacy: string;
};

export const projectVideos = [
  {
    id: "DQs4E0SqXc8",
    watchUrl: "https://youtube.com/shorts/DQs4E0SqXc8",
    embedUrl: "https://www.youtube-nocookie.com/embed/DQs4E0SqXc8"
  },
  {
    id: "k5D5DABbeyw",
    watchUrl: "https://youtube.com/shorts/k5D5DABbeyw",
    embedUrl: "https://www.youtube-nocookie.com/embed/k5D5DABbeyw"
  },
  {
    id: "gRXCFWNCid4",
    watchUrl: "https://youtube.com/shorts/gRXCFWNCid4",
    embedUrl: "https://www.youtube-nocookie.com/embed/gRXCFWNCid4"
  }
];

export const pricing = [
  {
    item: "Every 2 weeks",
    calculation: "$30 per bedroom + bathroom",
    standard: "Example: 3 bedrooms + 2 baths = $150",
    veryDirty: "First cleaning is double",
    notes: "Best recurring value"
  },
  {
    item: "Every 3 weeks",
    calculation: "$40 per bedroom + bathroom",
    standard: "Example: 3 bedrooms + 2 baths = $200",
    veryDirty: "First cleaning is double",
    notes: "For lighter recurring needs"
  },
  {
    item: "First-time / one-time",
    calculation: "Double the matching recurring estimate",
    standard: "Example: every-3-week base $200 -> $400",
    veryDirty: "Rosa confirms after seeing the property",
    notes: "Rough starting estimate"
  },
  {
    item: "Oven and refrigerator cleaning",
    calculation: "Optional add-on",
    standard: "$50",
    veryDirty: "$80 if very dirty",
    notes: "Added when requested"
  },
  {
    item: "Post-construction cleanup",
    calculation: "Onsite inspection required",
    standard: "Estimated after Rosa sees the property",
    veryDirty: "Dust, debris, paint, and buildup vary by project",
    notes: "Reviewed case by case"
  }
];

export const copy = {
  en: {
    nav: {
      services: "Services",
      pricing: "Pricing",
      chat: "Chat estimate",
      reviews: "Reviews",
      schedule: "Schedule",
      call: "Call Rosa"
    },
    hero: {
      eyebrow: "Cleaning near Woodstock, GA",
      title: "Medina Clean",
      body:
        "House, condo, apartment, small business, and post-construction cleaning near Woodstock, GA with direct communication from Rosa Medina at Medina Clean.",
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
        "Rosa handles one-time deep cleans, first-time cleans, recurring cleaning, post-construction cleanup, and service for apartments, condos, houses, and small offices.",
      items: [
        ["Houses", "Reliable room-by-room cleaning for busy families and homeowners."],
        ["Apartments", "Compact, efficient cleaning for apartments and rentals."],
        ["Condos", "Careful cleaning for shared-building homes and move-in refreshes."],
        ["Small businesses", "Office and light commercial cleaning reviewed case by case."],
        ["Post-construction cleanup", "Dust, debris, and project cleanup estimated after Rosa reviews the property onsite."]
      ]
    },
    pricing: {
      title: "Starting rate guide",
      body:
        "Use the guided estimate below to customize bedrooms, bathrooms, frequency, and add-ons for your specific case. These rates explain the starting rules Rosa uses before confirming the final price.",
      headers: ["Service", "Calculation", "Standard estimate", "Heavy condition", "Note"],
      note:
        "Rates assume Rosa brings standard cleaning materials and the client is comfortable with those materials. Special product requests, specialty surfaces, heavy buildup, pet conditions, move-out cleaning, or unusual requirements may create additional charges decided case by case."
    },
    chat: {
      title: "Get a guided estimate",
      body:
        "Ask a quick question, then use the guided form to check the ZIP and send Rosa your contact details."
    },
    referral: {
      title: "$50 referral credit",
      topline: "Know someone who needs cleaning?",
      body:
        "Refer a new client who books a qualified cleaning and receive a $50 credit toward your next service."
    },
    gallery: {
      title: "Before-and-after videos",
      body: "Watch short project videos from Medina Clean jobs, including real before-and-after cleaning results.",
      videos: ["Before cleaning walkthrough", "After cleaning result", "Quick bathroom cleaning before and after"],
      action: "Watch on YouTube"
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
      chat: "Estimado por chat",
      reviews: "Reseñas",
      schedule: "Cita",
      call: "Llamar a Rosa"
    },
    hero: {
      eyebrow: "Limpieza cerca de Woodstock, GA",
      title: "Medina Clean",
      body:
        "Limpieza para casas, condominios, apartamentos, pequeños negocios y después de construcción cerca de Woodstock, GA con comunicación directa con Rosa Medina de Medina Clean.",
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
        "Rosa ofrece limpiezas profundas de una vez, primeras limpiezas, servicio recurrente, limpieza después de construcción y servicio para apartamentos, condominios, casas y oficinas pequeñas.",
      items: [
        ["Casas", "Limpieza confiable cuarto por cuarto para familias ocupadas."],
        ["Apartamentos", "Limpieza eficiente para apartamentos y rentas."],
        ["Condominios", "Limpieza cuidadosa para hogares en edificios compartidos."],
        ["Pequeños negocios", "Limpieza de oficina y comercial ligera revisada caso por caso."],
        ["Limpieza después de construcción", "Polvo, residuos y limpieza de proyecto se estiman después de que Rosa revise la propiedad."]
      ]
    },
    pricing: {
      title: "Guía de precios iniciales",
      body:
        "Use el estimado guiado abajo para personalizar habitaciones, baños, frecuencia y extras para su caso específico. Estos precios explican las reglas iniciales que Rosa usa antes de confirmar el precio final.",
      headers: ["Servicio", "Cálculo", "Estimado normal", "Condición fuerte", "Nota"],
      note:
        "Los precios asumen que Rosa trae materiales de limpieza estándar y que el cliente está de acuerdo con esos materiales. Solicitudes especiales de productos, superficies delicadas, acumulación fuerte, mascotas, mudanzas o requisitos especiales pueden tener cargos adicionales decididos caso por caso."
    },
    chat: {
      title: "Reciba un estimado guiado",
      body:
        "Haga una pregunta rápida y use el formulario guiado para revisar el ZIP y enviar sus datos a Rosa."
    },
    referral: {
      title: "$50 de crédito por referir",
      topline: "¿Conoce a alguien que necesita limpieza?",
      body:
        "Refiera un cliente nuevo que reserve una limpieza calificada y reciba $50 de crédito para su próximo servicio."
    },
    gallery: {
      title: "Videos de antes y después",
      body: "Vea videos cortos de trabajos de Medina Clean, incluyendo resultados reales de limpieza antes y después.",
      videos: ["Recorrido antes de limpiar", "Resultado después de limpiar", "Limpieza rápida de baño antes y después"],
      action: "Ver en YouTube"
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
