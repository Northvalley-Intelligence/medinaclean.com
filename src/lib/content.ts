export type Locale = "en" | "es";

export const phone = process.env.NEXT_PUBLIC_ROSA_PHONE || "+14707814143";
export const phoneDisplay = process.env.NEXT_PUBLIC_ROSA_PHONE_DISPLAY || "(470) 781-4143";

type SiteCopy = {
  nav: Record<string, string>;
  hero: Record<string, string>;
  stats: string[][];
  trust: {
    title: string;
    body: string;
    items: string[][];
    aboutCta: string;
    mapsCta: string;
  };
  services: { title: string; body: string; items: string[][] };
  pricing: { title: string; body: string; headers: string[]; note: string };
  chat: { title: string; body: string };
  referral: { title: string; topline: string; body: string };
  gallery: { title: string; body: string; videos: string[]; action: string };
  reviews: { title: string; body: string; empty: string; formTitle: string };
  schedule: { title: string; body: string; formTitle: string; submit: string };
  faq: { title: string; items: string[][] };
  aboutPage: {
    title: string;
    eyebrow: string;
    intro: string;
    sections: string[][];
    facts: string[][];
    scheduleCta: string;
    mapsCta: string;
    homeCta: string;
  };
  privacy: string;
};

export const projectVideos = [
  {
    id: "DQs4E0SqXc8",
    title: {
      en: "Before cleaning walkthrough",
      es: "Recorrido antes de limpiar"
    },
    watchUrl: "https://youtube.com/shorts/DQs4E0SqXc8",
    embedUrl: "https://www.youtube-nocookie.com/embed/DQs4E0SqXc8"
  },
  {
    id: "k5D5DABbeyw",
    title: {
      en: "After cleaning result",
      es: "Resultado después de limpiar"
    },
    watchUrl: "https://youtube.com/shorts/k5D5DABbeyw",
    embedUrl: "https://www.youtube-nocookie.com/embed/k5D5DABbeyw"
  },
  {
    id: "gRXCFWNCid4",
    title: {
      en: "Quick bathroom cleaning before and after",
      es: "Limpieza rápida de baño antes y después"
    },
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
      about: "About Rosa",
      pricing: "Pricing",
      chat: "Chat estimate",
      reviews: "Reviews",
      schedule: "Request an appointment",
      call: "Phone"
    },
    hero: {
      eyebrow: "Cleaning near Woodstock and Marietta, GA",
      title: "Medina Clean",
      body:
        "House, condo, apartment, small business, and post-construction cleaning near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA with direct communication from Rosa Medina at Medina Clean.",
      primary: "Schedule a cleaning"
    },
    stats: [
      ["20 miles", "Woodstock, Marietta + nearby cities"],
      ["$50 credit", "For qualified new client referrals"],
      ["English + Spanish", "Clear communication for every home"]
    ],
    trust: {
      title: "Why choose Medina Clean?",
      body:
        "Customers choose Medina Clean for owner-led cleaning with direct communication from Rosa Medina, clear starting rates, local service-area review, and real proof from completed jobs.",
      items: [
        [
          "Owner-led and local",
          "Rosa Medina reviews appointment requests, service scope, timing, and final pricing directly before a cleaning is accepted."
        ],
        [
          "Clear booking process",
          "The website explains ZIP limits, starting rates, add-ons, first-cleaning assumptions, and the fact that requests are private until Rosa confirms."
        ],
        [
          "Real project proof",
          "The gallery points to real Medina Clean project videos and approved customer reviews are shown only after Rosa approves them."
        ],
        [
          "Factual trust claims",
          "The website does not claim credentials, insurance, certifications, and awards unless Rosa has confirmed the exact proof. Ask before booking if a document is required."
        ]
      ],
      aboutCta: "About Rosa",
      mapsCta: "Search Medina Clean on Google Maps"
    },
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
        ],
        [
          "How long has Medina Clean been online?",
          "The current public website and booking workflow launched in 2026. Medina Clean does not publish a years-in-business claim until Rosa confirms the founded year."
        ]
      ]
    },
    aboutPage: {
      title: "About Rosa Medina and Medina Clean",
      eyebrow: "Owner-led cleaning near Woodstock, GA",
      intro:
        "Medina Clean is a local cleaning business led by Rosa Medina for homes, apartments, condos, small businesses, and post-construction cleaning near Woodstock, GA and ZIP 30188.",
      sections: [
        [
          "Direct communication with Rosa",
          "Visitors can call, use the guided estimate, or request an appointment from the website. Rosa reviews the ZIP, exact address, property condition, preferred times, and final price before confirming service."
        ],
        [
          "Proof from real work",
          "The public gallery links to real Medina Clean project videos, including before-and-after cleaning results. Reviews appear publicly only after Rosa approves them and the client gives permission."
        ],
        [
          "Transparent trust claims",
          "No license, insurance, certification, or award claim is published unless Rosa has confirmed the exact proof. If a client needs a specific document before booking, they should ask Rosa during scheduling."
        ],
        [
          "Business timeline",
          "The current public website and booking workflow launched in 2026. A years-in-business or founded-year claim is not published until Rosa confirms the accurate date."
        ]
      ],
      facts: [
        ["Business", "Medina Clean"],
        ["Owner contact", "Direct communication with Rosa Medina"],
        ["Service center", "Woodstock, GA 30188"],
        ["Languages", "English and Spanish"],
        ["Services", "House, apartment, condo, deep, recurring, small business, and post-construction cleaning"]
      ],
      scheduleCta: "Request an appointment",
      mapsCta: "Search Medina Clean on Google Maps",
      homeCta: "Medina Clean home"
    },
    privacy:
      "Privacy: appointment requests and pending reviews are private. Approved reviews may be shown publicly only with consent."
  },
  es: {
    nav: {
      services: "Servicios",
      about: "Sobre Rosa",
      pricing: "Precios",
      chat: "Estimado por chat",
      reviews: "Reseñas",
      schedule: "Pedir una cita",
      call: "Teléfono"
    },
    hero: {
      eyebrow: "Limpieza cerca de Woodstock y Marietta, GA",
      title: "Medina Clean",
      body:
        "Limpieza para casas, condominios, apartamentos, pequeños negocios y después de construcción cerca de Woodstock, Marietta, Kennesaw, Acworth, Canton y Roswell, GA con comunicación directa con Rosa Medina de Medina Clean.",
      primary: "Pedir una cita"
    },
    stats: [
      ["20 millas", "Woodstock, Marietta y ciudades cercanas"],
      ["$50 de crédito", "Por referir un cliente nuevo calificado"],
      ["Inglés + Español", "Comunicación clara para cada hogar"]
    ],
    trust: {
      title: "¿Por qué elegir Medina Clean?",
      body:
        "Clientes eligen Medina Clean por limpieza dirigida por la dueña, comunicación directa con Rosa Medina, precios iniciales claros, revisión local del área de servicio y prueba real de trabajos terminados.",
      items: [
        [
          "Dueña local",
          "Rosa Medina revisa solicitudes, alcance del servicio, horarios y precio final directamente antes de aceptar una limpieza."
        ],
        [
          "Proceso claro",
          "El sitio explica límites de ZIP, precios iniciales, extras, condiciones de primera limpieza y que las solicitudes son privadas hasta que Rosa confirma."
        ],
        [
          "Prueba de trabajos reales",
          "La galería muestra videos reales de trabajos de Medina Clean y las reseñas públicas aparecen solo después de la aprobación de Rosa."
        ],
        [
          "Afirmaciones verificadas",
          "Credenciales, seguro, certificaciones y premios no se publican a menos que Rosa confirme la prueba exacta. Pregunte antes de reservar si necesita un documento."
        ]
      ],
      aboutCta: "Sobre Rosa",
      mapsCta: "Buscar Medina Clean en Google Maps"
    },
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
        ],
        [
          "¿Cuánto tiempo lleva Medina Clean en línea?",
          "El sitio público y el flujo de citas actuales se lanzaron en 2026. Medina Clean no publica años en negocio hasta que Rosa confirme el año correcto."
        ]
      ]
    },
    aboutPage: {
      title: "Sobre Rosa Medina y Medina Clean",
      eyebrow: "Limpieza dirigida por la dueña cerca de Woodstock, GA",
      intro:
        "Medina Clean es un negocio local de limpieza dirigido por Rosa Medina para casas, apartamentos, condominios, pequeños negocios y limpieza después de construcción cerca de Woodstock, GA y ZIP 30188.",
      sections: [
        [
          "Comunicación directa con Rosa",
          "Visitantes pueden llamar, usar el estimado guiado o pedir una cita desde el sitio. Rosa revisa el ZIP, dirección exacta, condición de la propiedad, horarios preferidos y precio final antes de confirmar."
        ],
        [
          "Prueba de trabajo real",
          "La galería pública enlaza videos reales de trabajos de Medina Clean, incluyendo resultados de antes y después. Las reseñas aparecen públicamente solo después de que Rosa las aprueba y el cliente da permiso."
        ],
        [
          "Afirmaciones transparentes",
          "No se publica ninguna afirmación de licencia, seguro, certificación o premio a menos que Rosa confirme la prueba exacta. Si un cliente necesita un documento específico antes de reservar, debe preguntarle a Rosa durante la programación."
        ],
        [
          "Línea de tiempo del negocio",
          "El sitio público y el flujo de citas actuales se lanzaron en 2026. No se publica una afirmación de años en negocio o año de fundación hasta que Rosa confirme la fecha correcta."
        ]
      ],
      facts: [
        ["Negocio", "Medina Clean"],
        ["Contacto de la dueña", "Comunicación directa con Rosa Medina"],
        ["Centro de servicio", "Woodstock, GA 30188"],
        ["Idiomas", "Inglés y español"],
        ["Servicios", "Casas, apartamentos, condominios, limpieza profunda, recurrente, pequeños negocios y después de construcción"]
      ],
      scheduleCta: "Pedir una cita",
      mapsCta: "Buscar Medina Clean en Google Maps",
      homeCta: "Inicio de Medina Clean"
    },
    privacy:
      "Privacidad: las solicitudes de cita y reseñas pendientes son privadas. Las reseñas aprobadas se muestran públicamente solo con permiso."
  }
} satisfies Record<Locale, SiteCopy>;
