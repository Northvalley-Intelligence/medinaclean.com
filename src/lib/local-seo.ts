import type { Locale } from "@/lib/content";

export type LocalServicePage = {
  kind: "service" | "city";
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  h1: string;
  intro: string;
  serviceName: string;
  serviceTypes: string[];
  neighborhoods: string[];
  sections: Array<{ heading: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

const serviceSlugAlternates: Record<string, string> = {
  "deep-cleaning-woodstock-ga": "limpieza-profunda-woodstock-ga",
  "house-cleaning-woodstock-ga": "limpieza-de-casas-woodstock-ga",
  "apartment-cleaning-woodstock-ga": "limpieza-de-apartamentos-woodstock-ga",
  "recurring-cleaning-woodstock-ga": "limpieza-recurrente-woodstock-ga",
  "limpieza-profunda-woodstock-ga": "deep-cleaning-woodstock-ga",
  "limpieza-de-casas-woodstock-ga": "house-cleaning-woodstock-ga",
  "limpieza-de-apartamentos-woodstock-ga": "apartment-cleaning-woodstock-ga",
  "limpieza-recurrente-woodstock-ga": "recurring-cleaning-woodstock-ga"
};

export const localServicePages: LocalServicePage[] = [
  {
    kind: "service",
    locale: "en",
    slug: "deep-cleaning-woodstock-ga",
    title: "Deep Cleaning near Woodstock, GA",
    description:
      "Deep cleaning for houses, apartments, condos, and move-in refreshes near Woodstock, GA, 30188, and nearby communities.",
    h1: "Deep cleaning near Woodstock, GA",
    intro:
      "Medina Clean provides detailed deep cleaning for homes near Woodstock, GA when a standard recurring visit is not enough.",
    serviceName: "Deep cleaning",
    serviceTypes: ["Deep cleaning", "Move-in cleaning", "First-time cleaning", "Post-construction cleanup"],
    neighborhoods: ["Woodstock", "30188", "Cherokee County", "nearby Cobb County homes"],
    sections: [
      {
        heading: "When deep cleaning makes sense",
        body:
          "Deep cleaning is a better fit for first visits, move-in refreshes, heavy dust, detailed bathroom and kitchen work, baseboards, blinds, fans, and buildup that needs extra time."
      },
      {
        heading: "Local service area",
        body:
          "Rosa mainly serves homes and small businesses near Woodstock, GA and ZIP 30188. Nearby addresses are reviewed case by case before the appointment is confirmed."
      }
    ],
    faqs: [
      {
        question: "Can I request recurring cleaning after the first deep clean?",
        answer: "Yes. Many clients start with a deeper first cleaning and then move to every-two-week or every-three-week service."
      },
      {
        question: "Does Rosa confirm the final price first?",
        answer: "Yes. Website prices are starting estimates; Rosa reviews the home condition and confirms the final price before accepting."
      }
    ]
  },
  {
    kind: "service",
    locale: "en",
    slug: "house-cleaning-woodstock-ga",
    title: "House Cleaning near Woodstock, GA",
    description:
      "House cleaning, recurring cleaning, and first-time cleaning for families and homeowners near Woodstock, GA and ZIP 30188.",
    h1: "House cleaning near Woodstock, GA",
    intro:
      "Medina Clean helps busy homeowners keep kitchens, bathrooms, bedrooms, and living spaces clean with direct communication from Rosa Medina.",
    serviceName: "House cleaning",
    serviceTypes: ["House cleaning", "Recurring cleaning", "First-time cleaning", "Deep cleaning"],
    neighborhoods: ["Woodstock", "30188", "Towne Lake area", "nearby Cherokee County homes"],
    sections: [
      {
        heading: "Room-by-room home cleaning",
        body:
          "Typical house cleaning can include kitchens, bathrooms, bedrooms, living areas, floors, dusting, and the details Rosa confirms with each client."
      },
      {
        heading: "Recurring schedules",
        body:
          "Every-two-week and every-three-week cleaning are available after the first service, with pricing based on bedrooms, bathrooms, condition, and add-ons."
      }
    ],
    faqs: [
      {
        question: "Does Medina Clean serve my ZIP code?",
        answer: "The site checks ZIP codes within about 20 miles of 30188, then Rosa confirms the exact address manually."
      },
      {
        question: "Can I text or call Rosa?",
        answer: "Yes. The site supports phone and WhatsApp contact when Rosa's public contact number is configured."
      }
    ]
  },
  {
    kind: "service",
    locale: "en",
    slug: "apartment-cleaning-woodstock-ga",
    title: "Apartment Cleaning near Woodstock, GA",
    description:
      "Apartment and condo cleaning near Woodstock, GA for first-time, recurring, and move-in cleaning requests.",
    h1: "Apartment cleaning near Woodstock, GA",
    intro:
      "Medina Clean handles apartment and condo cleaning for renters, owners, and compact homes near Woodstock, GA.",
    serviceName: "Apartment cleaning",
    serviceTypes: ["Apartment cleaning", "Condo cleaning", "Move-in cleaning", "Recurring cleaning"],
    neighborhoods: ["Woodstock", "30188", "Cherokee County apartments", "nearby condo communities"],
    sections: [
      {
        heading: "Compact spaces still need detail",
        body:
          "Apartment cleaning can include kitchens, bathrooms, floors, dusting, appliance add-ons, and move-in refreshes depending on the condition."
      },
      {
        heading: "Good fit for renters and condo owners",
        body:
          "Rosa reviews parking, building access, pets, and special instructions before confirming the appointment."
      }
    ],
    faqs: [
      {
        question: "Can Rosa clean a move-in apartment?",
        answer: "Yes. Move-in and first-time apartment cleanings are reviewed based on size, condition, and timing."
      },
      {
        question: "Are oven and refrigerator cleaning included?",
        answer: "They are optional add-ons and can be included when requested."
      }
    ]
  },
  {
    kind: "service",
    locale: "en",
    slug: "recurring-cleaning-woodstock-ga",
    title: "Recurring Cleaning near Woodstock, GA",
    description:
      "Every-two-week and every-three-week recurring cleaning for homes near Woodstock, GA and ZIP 30188.",
    h1: "Recurring cleaning near Woodstock, GA",
    intro:
      "Medina Clean offers recurring home cleaning after the first visit, helping local clients keep a steady schedule with Rosa.",
    serviceName: "Recurring cleaning",
    serviceTypes: ["Recurring cleaning", "House cleaning", "Apartment cleaning", "Condo cleaning"],
    neighborhoods: ["Woodstock", "30188", "Cherokee County", "nearby Woodstock-area homes"],
    sections: [
      {
        heading: "Simple recurring options",
        body:
          "The starting guide supports every-two-week and every-three-week cleaning. Rosa confirms the final schedule after reviewing the home and calendar."
      },
      {
        heading: "First cleaning sets the baseline",
        body:
          "A first cleaning may cost more when the home needs extra time. After that, recurring pricing can settle into a predictable rhythm."
      }
    ],
    faqs: [
      {
        question: "Which recurring option is best?",
        answer: "Every two weeks is best for busier homes. Every three weeks can work for lighter upkeep."
      },
      {
        question: "Can recurring clients ask for extra add-ons?",
        answer: "Yes. Oven, refrigerator, windows, or heavier detail work can be reviewed as add-ons."
      }
    ]
  },
  {
    kind: "service",
    locale: "es",
    slug: "limpieza-profunda-woodstock-ga",
    title: "Limpieza profunda cerca de Woodstock, GA",
    description:
      "Limpieza profunda para casas, apartamentos, condominios y primeras limpiezas cerca de Woodstock, GA y 30188.",
    h1: "Limpieza profunda cerca de Woodstock, GA",
    intro:
      "Medina Clean ofrece limpieza profunda cuando una limpieza normal no es suficiente para la condición de la casa.",
    serviceName: "Limpieza profunda",
    serviceTypes: ["Limpieza profunda", "Primera limpieza", "Limpieza de mudanza", "Limpieza después de construcción"],
    neighborhoods: ["Woodstock", "30188", "Cherokee County", "casas cercanas en Cobb County"],
    sections: [
      {
        heading: "Cuándo pedir limpieza profunda",
        body:
          "Es buena para primeras visitas, polvo fuerte, baños y cocinas con más detalle, zócalos, persianas, abanicos y acumulación."
      },
      {
        heading: "Área local",
        body:
          "Rosa atiende principalmente cerca de Woodstock, GA y ZIP 30188. Las direcciones cercanas se revisan caso por caso."
      }
    ],
    faqs: [
      {
        question: "¿Puedo seguir con limpieza recurrente después?",
        answer: "Sí. Muchos clientes empiezan con una limpieza profunda y después siguen cada dos o tres semanas."
      },
      {
        question: "¿Rosa confirma el precio final?",
        answer: "Sí. Los precios del sitio son estimados iniciales; Rosa confirma antes de aceptar."
      }
    ]
  },
  {
    kind: "service",
    locale: "es",
    slug: "limpieza-de-casas-woodstock-ga",
    title: "Limpieza de casas cerca de Woodstock, GA",
    description:
      "Limpieza de casas, limpieza recurrente y primera limpieza para familias cerca de Woodstock, GA y ZIP 30188.",
    h1: "Limpieza de casas cerca de Woodstock, GA",
    intro:
      "Medina Clean ayuda a mantener limpias cocinas, baños, habitaciones y áreas principales con comunicación directa con Rosa Medina.",
    serviceName: "Limpieza de casas",
    serviceTypes: ["Limpieza de casas", "Limpieza recurrente", "Primera limpieza", "Limpieza profunda"],
    neighborhoods: ["Woodstock", "30188", "área de Towne Lake", "casas cercanas en Cherokee County"],
    sections: [
      {
        heading: "Limpieza cuarto por cuarto",
        body:
          "La limpieza puede incluir cocina, baños, habitaciones, pisos, polvo y detalles que Rosa confirma con cada cliente."
      },
      {
        heading: "Horarios recurrentes",
        body:
          "Hay servicio cada dos semanas o cada tres semanas después de la primera limpieza, según la casa y el calendario."
      }
    ],
    faqs: [
      {
        question: "¿Medina Clean atiende mi ZIP?",
        answer: "El sitio revisa ZIPs dentro de aproximadamente 20 millas de 30188; Rosa confirma la dirección exacta."
      },
      {
        question: "¿Puedo llamar o escribir a Rosa?",
        answer: "Sí. El sitio muestra teléfono y WhatsApp cuando el número público de Rosa está configurado."
      }
    ]
  },
  {
    kind: "service",
    locale: "es",
    slug: "limpieza-de-apartamentos-woodstock-ga",
    title: "Limpieza de apartamentos cerca de Woodstock, GA",
    description:
      "Limpieza de apartamentos y condominios cerca de Woodstock, GA para primeras limpiezas, mudanzas y servicio recurrente.",
    h1: "Limpieza de apartamentos cerca de Woodstock, GA",
    intro:
      "Medina Clean limpia apartamentos y condominios para inquilinos y dueños cerca de Woodstock, GA.",
    serviceName: "Limpieza de apartamentos",
    serviceTypes: ["Limpieza de apartamentos", "Limpieza de condominios", "Limpieza de mudanza", "Limpieza recurrente"],
    neighborhoods: ["Woodstock", "30188", "apartamentos en Cherokee County", "condominios cercanos"],
    sections: [
      {
        heading: "Espacios compactos con detalle",
        body:
          "La limpieza puede incluir cocina, baño, pisos, polvo, extras de electrodomésticos y limpieza de mudanza según la condición."
      },
      {
        heading: "Para renta o condominio",
        body:
          "Rosa revisa acceso al edificio, estacionamiento, mascotas e instrucciones especiales antes de confirmar."
      }
    ],
    faqs: [
      {
        question: "¿Rosa limpia apartamentos antes de mudarse?",
        answer: "Sí. Las limpiezas de mudanza se revisan según tamaño, condición y horario."
      },
      {
        question: "¿Horno y refrigerador están incluidos?",
        answer: "Son extras opcionales y se pueden agregar cuando el cliente lo pide."
      }
    ]
  },
  {
    kind: "service",
    locale: "es",
    slug: "limpieza-recurrente-woodstock-ga",
    title: "Limpieza recurrente cerca de Woodstock, GA",
    description:
      "Limpieza recurrente cada dos o tres semanas para casas cerca de Woodstock, GA y ZIP 30188.",
    h1: "Limpieza recurrente cerca de Woodstock, GA",
    intro:
      "Medina Clean ofrece limpieza recurrente después de la primera visita para mantener un horario claro con Rosa.",
    serviceName: "Limpieza recurrente",
    serviceTypes: ["Limpieza recurrente", "Limpieza de casas", "Limpieza de apartamentos", "Limpieza de condominios"],
    neighborhoods: ["Woodstock", "30188", "Cherokee County", "casas cercanas a Woodstock"],
    sections: [
      {
        heading: "Opciones sencillas",
        body:
          "Hay opciones cada dos semanas y cada tres semanas. Rosa confirma el horario final después de revisar la casa y calendario."
      },
      {
        heading: "La primera limpieza marca la base",
        body:
          "La primera limpieza puede costar más si necesita más tiempo. Después, el precio recurrente puede ser más predecible."
      }
    ],
    faqs: [
      {
        question: "¿Qué frecuencia conviene más?",
        answer: "Cada dos semanas conviene para casas con más uso. Cada tres semanas puede funcionar para mantenimiento ligero."
      },
      {
        question: "¿Se pueden agregar extras?",
        answer: "Sí. Horno, refrigerador, ventanas u otros detalles se pueden revisar como extras."
      }
    ]
  },
  {
    kind: "city",
    locale: "en",
    slug: "cleaning-services-marietta-ga",
    title: "Cleaning Services in Marietta, GA",
    description:
      "House cleaning, apartment cleaning, deep cleaning, and recurring cleaning for Marietta, GA ZIP codes near Rosa's service area.",
    h1: "Cleaning services in Marietta, GA",
    intro:
      "Medina Clean serves several Marietta and East Cobb ZIP codes near Rosa's current route, including 30066, 30062, 30068, 30064, and 30067.",
    serviceName: "Marietta cleaning services",
    serviceTypes: ["House cleaning", "Apartment cleaning", "Condo cleaning", "Deep cleaning", "Recurring cleaning"],
    neighborhoods: ["Marietta", "East Cobb", "30066", "30062", "30068", "30064", "30067"],
    sections: [
      {
        heading: "Marietta is inside the current validation area",
        body:
          "The site checks several Marietta ZIP codes within about 20 miles of 30188. Rosa still confirms the exact address, travel time, and schedule before accepting."
      },
      {
        heading: "Cleaning options for Marietta homes",
        body:
          "Clients can request first-time deep cleaning, recurring cleaning every two or three weeks, apartment cleaning, condo cleaning, and small business cleaning reviewed case by case."
      }
    ],
    faqs: [
      {
        question: "Does Rosa clean in Marietta?",
        answer:
          "Yes, Marietta ZIP codes in the current validation list are eligible for review. Rosa confirms the exact address before booking."
      },
      {
        question: "Is East Cobb included?",
        answer: "Several East Cobb and Marietta ZIP codes are in the validation list, including 30062, 30066, 30067, and 30068."
      }
    ]
  },
  {
    kind: "city",
    locale: "en",
    slug: "cleaning-services-kennesaw-ga",
    title: "Cleaning Services in Kennesaw, GA",
    description:
      "House cleaning, deep cleaning, apartment cleaning, and recurring cleaning near Kennesaw, GA and nearby ZIP codes.",
    h1: "Cleaning services in Kennesaw, GA",
    intro:
      "Medina Clean serves Kennesaw-area homes near Rosa's current route, including ZIP codes 30144 and 30152.",
    serviceName: "Kennesaw cleaning services",
    serviceTypes: ["House cleaning", "Apartment cleaning", "Condo cleaning", "Deep cleaning", "Recurring cleaning"],
    neighborhoods: ["Kennesaw", "30144", "30152", "nearby Cobb County homes"],
    sections: [
      {
        heading: "Kennesaw homes near Rosa's route",
        body:
          "Kennesaw ZIPs in the validation list are within the current service radius from 30188. Rosa confirms calendar availability before booking."
      },
      {
        heading: "Recurring and first-time cleaning",
        body:
          "Request a first-time deep cleaning or ask about recurring every-two-week and every-three-week service after the first visit."
      }
    ],
    faqs: [
      {
        question: "Which Kennesaw ZIP codes are checked?",
        answer: "The current free validation list includes 30144 and 30152."
      },
      {
        question: "Can Rosa clean apartments in Kennesaw?",
        answer: "Yes, apartment and condo requests can be reviewed with the exact address and access details."
      }
    ]
  },
  {
    kind: "city",
    locale: "en",
    slug: "cleaning-services-acworth-ga",
    title: "Cleaning Services in Acworth, GA",
    description:
      "Deep cleaning, recurring cleaning, house cleaning, and apartment cleaning near Acworth, GA and nearby ZIP codes.",
    h1: "Cleaning services in Acworth, GA",
    intro:
      "Medina Clean serves Acworth-area clients near Rosa's current route, including ZIP codes 30101 and 30102.",
    serviceName: "Acworth cleaning services",
    serviceTypes: ["House cleaning", "Apartment cleaning", "Deep cleaning", "Recurring cleaning", "Move-in cleaning"],
    neighborhoods: ["Acworth", "30101", "30102", "nearby Cobb and Cherokee County homes"],
    sections: [
      {
        heading: "Acworth ZIPs in the service check",
        body:
          "The site checks Acworth ZIPs near the 30188 service center. Rosa manually confirms whether the exact address fits the schedule."
      },
      {
        heading: "Flexible cleaning requests",
        body:
          "Acworth clients can request deep cleaning, first-time cleaning, recurring service, apartment cleaning, and selected add-ons."
      }
    ],
    faqs: [
      {
        question: "Does Medina Clean serve Acworth?",
        answer: "The current validation list includes 30101 and 30102 for manual review and scheduling."
      },
      {
        question: "Can I request a one-time deep clean?",
        answer: "Yes. One-time and first-time deep cleaning requests are reviewed by condition and timing."
      }
    ]
  },
  {
    kind: "city",
    locale: "en",
    slug: "cleaning-services-canton-ga",
    title: "Cleaning Services in Canton, GA",
    description:
      "House cleaning, deep cleaning, recurring cleaning, and apartment cleaning near Canton, GA and nearby ZIP codes.",
    h1: "Cleaning services in Canton, GA",
    intro:
      "Medina Clean serves Canton-area ZIP codes near Rosa's current route, including 30114 and 30115.",
    serviceName: "Canton cleaning services",
    serviceTypes: ["House cleaning", "Deep cleaning", "Recurring cleaning", "Apartment cleaning", "Small business cleaning"],
    neighborhoods: ["Canton", "30114", "30115", "nearby Cherokee County homes"],
    sections: [
      {
        heading: "Canton service requests",
        body:
          "Canton ZIPs in the validation list are close enough for review, but Rosa confirms the exact address and calendar fit before accepting."
      },
      {
        heading: "Home and small business cleaning",
        body:
          "Requests can include homes, apartments, condos, small offices, first-time deep cleaning, recurring cleaning, and add-ons."
      }
    ],
    faqs: [
      {
        question: "Which Canton ZIP codes are included?",
        answer: "The current validation list includes 30114 and 30115."
      },
      {
        question: "Does Rosa confirm travel before booking?",
        answer: "Yes. The website check is a starting point, and Rosa confirms the exact address manually."
      }
    ]
  },
  {
    kind: "city",
    locale: "en",
    slug: "cleaning-services-roswell-ga",
    title: "Cleaning Services near Roswell, GA",
    description:
      "Deep cleaning, recurring cleaning, house cleaning, and apartment cleaning for Roswell-area ZIPs near Rosa's route.",
    h1: "Cleaning services near Roswell, GA",
    intro:
      "Medina Clean can review Roswell-area requests near the current service route, including ZIP code 30075.",
    serviceName: "Roswell-area cleaning services",
    serviceTypes: ["House cleaning", "Apartment cleaning", "Condo cleaning", "Deep cleaning", "Recurring cleaning"],
    neighborhoods: ["Roswell", "30075", "nearby North Fulton homes"],
    sections: [
      {
        heading: "Roswell-area requests are reviewed",
        body:
          "ZIP 30075 is in the current validation list. Rosa confirms the exact address, travel time, and calendar availability before accepting."
      },
      {
        heading: "Cleaning options",
        body:
          "Rosa can review first-time cleaning, recurring service, apartment cleaning, condo cleaning, and deep cleaning requests."
      }
    ],
    faqs: [
      {
        question: "Does Medina Clean serve all of Roswell?",
        answer: "Not automatically. The site validates 30075, and Rosa reviews exact addresses case by case."
      },
      {
        question: "Can I still ask if my ZIP is not listed?",
        answer: "Yes. Unknown ZIPs are marked for manual review instead of automatic confirmation."
      }
    ]
  },
  {
    kind: "city",
    locale: "es",
    slug: "servicios-de-limpieza-marietta-ga",
    title: "Servicios de limpieza en Marietta, GA",
    description:
      "Limpieza de casas, apartamentos, limpieza profunda y servicio recurrente para ZIPs de Marietta cerca del área de Rosa.",
    h1: "Servicios de limpieza en Marietta, GA",
    intro:
      "Medina Clean atiende varios ZIPs de Marietta y East Cobb cerca de la ruta actual de Rosa, incluyendo 30066, 30062, 30068, 30064 y 30067.",
    serviceName: "Limpieza en Marietta",
    serviceTypes: ["Limpieza de casas", "Limpieza de apartamentos", "Limpieza de condominios", "Limpieza profunda", "Limpieza recurrente"],
    neighborhoods: ["Marietta", "East Cobb", "30066", "30062", "30068", "30064", "30067"],
    sections: [
      {
        heading: "Marietta está dentro del área actual",
        body:
          "El sitio revisa varios ZIPs de Marietta dentro de aproximadamente 20 millas de 30188. Rosa confirma la dirección exacta, viaje y horario."
      },
      {
        heading: "Opciones de limpieza para Marietta",
        body:
          "Puede pedir limpieza profunda, limpieza recurrente cada dos o tres semanas, apartamentos, condominios y pequeños negocios caso por caso."
      }
    ],
    faqs: [
      {
        question: "¿Rosa limpia en Marietta?",
        answer: "Sí, los ZIPs de Marietta en la lista actual se pueden revisar. Rosa confirma la dirección exacta antes de reservar."
      },
      {
        question: "¿East Cobb está incluido?",
        answer: "Varios ZIPs de East Cobb y Marietta están en la lista, incluyendo 30062, 30066, 30067 y 30068."
      }
    ]
  },
  {
    kind: "city",
    locale: "es",
    slug: "servicios-de-limpieza-kennesaw-ga",
    title: "Servicios de limpieza en Kennesaw, GA",
    description:
      "Limpieza de casas, limpieza profunda, apartamentos y servicio recurrente cerca de Kennesaw, GA.",
    h1: "Servicios de limpieza en Kennesaw, GA",
    intro:
      "Medina Clean atiende casas cerca de Kennesaw en la ruta actual de Rosa, incluyendo ZIPs 30144 y 30152.",
    serviceName: "Limpieza en Kennesaw",
    serviceTypes: ["Limpieza de casas", "Limpieza de apartamentos", "Limpieza de condominios", "Limpieza profunda", "Limpieza recurrente"],
    neighborhoods: ["Kennesaw", "30144", "30152", "casas cercanas en Cobb County"],
    sections: [
      {
        heading: "Kennesaw cerca de la ruta de Rosa",
        body:
          "Los ZIPs de Kennesaw en la lista están dentro del radio actual desde 30188. Rosa confirma disponibilidad antes de reservar."
      },
      {
        heading: "Primera limpieza y servicio recurrente",
        body:
          "Puede pedir una primera limpieza profunda o preguntar por servicio cada dos o tres semanas después de la primera visita."
      }
    ],
    faqs: [
      {
        question: "¿Qué ZIPs de Kennesaw se revisan?",
        answer: "La lista actual incluye 30144 y 30152."
      },
      {
        question: "¿Rosa limpia apartamentos en Kennesaw?",
        answer: "Sí, se pueden revisar apartamentos y condominios con dirección exacta y detalles de acceso."
      }
    ]
  },
  {
    kind: "city",
    locale: "es",
    slug: "servicios-de-limpieza-acworth-ga",
    title: "Servicios de limpieza en Acworth, GA",
    description:
      "Limpieza profunda, recurrente, casas y apartamentos cerca de Acworth, GA.",
    h1: "Servicios de limpieza en Acworth, GA",
    intro:
      "Medina Clean atiende clientes cerca de Acworth en la ruta actual de Rosa, incluyendo ZIPs 30101 y 30102.",
    serviceName: "Limpieza en Acworth",
    serviceTypes: ["Limpieza de casas", "Limpieza de apartamentos", "Limpieza profunda", "Limpieza recurrente", "Limpieza de mudanza"],
    neighborhoods: ["Acworth", "30101", "30102", "casas cercanas en Cobb y Cherokee County"],
    sections: [
      {
        heading: "ZIPs de Acworth en la revisión",
        body:
          "El sitio revisa ZIPs de Acworth cerca del centro 30188. Rosa confirma si la dirección exacta funciona con su horario."
      },
      {
        heading: "Solicitudes flexibles",
        body:
          "Clientes de Acworth pueden pedir limpieza profunda, primera limpieza, servicio recurrente, apartamentos y extras seleccionados."
      }
    ],
    faqs: [
      {
        question: "¿Medina Clean atiende Acworth?",
        answer: "La lista actual incluye 30101 y 30102 para revisión manual y programación."
      },
      {
        question: "¿Puedo pedir limpieza profunda de una vez?",
        answer: "Sí. Las limpiezas profundas de una vez se revisan según condición y horario."
      }
    ]
  },
  {
    kind: "city",
    locale: "es",
    slug: "servicios-de-limpieza-canton-ga",
    title: "Servicios de limpieza en Canton, GA",
    description:
      "Limpieza de casas, limpieza profunda, recurrente y apartamentos cerca de Canton, GA.",
    h1: "Servicios de limpieza en Canton, GA",
    intro:
      "Medina Clean atiende ZIPs cerca de Canton en la ruta actual de Rosa, incluyendo 30114 y 30115.",
    serviceName: "Limpieza en Canton",
    serviceTypes: ["Limpieza de casas", "Limpieza profunda", "Limpieza recurrente", "Limpieza de apartamentos", "Limpieza de pequeños negocios"],
    neighborhoods: ["Canton", "30114", "30115", "casas cercanas en Cherokee County"],
    sections: [
      {
        heading: "Solicitudes en Canton",
        body:
          "Los ZIPs de Canton en la lista están lo suficientemente cerca para revisar, pero Rosa confirma la dirección exacta y calendario."
      },
      {
        heading: "Casas y pequeños negocios",
        body:
          "Puede pedir limpieza de casas, apartamentos, condominios, oficinas pequeñas, primera limpieza, recurrente y extras."
      }
    ],
    faqs: [
      {
        question: "¿Qué ZIPs de Canton están incluidos?",
        answer: "La lista actual incluye 30114 y 30115."
      },
      {
        question: "¿Rosa confirma el viaje antes?",
        answer: "Sí. La revisión del sitio es inicial y Rosa confirma la dirección exacta manualmente."
      }
    ]
  },
  {
    kind: "city",
    locale: "es",
    slug: "servicios-de-limpieza-roswell-ga",
    title: "Servicios de limpieza cerca de Roswell, GA",
    description:
      "Limpieza profunda, recurrente, casas y apartamentos para áreas de Roswell cerca de la ruta de Rosa.",
    h1: "Servicios de limpieza cerca de Roswell, GA",
    intro:
      "Medina Clean puede revisar solicitudes cerca de Roswell dentro de la ruta actual, incluyendo ZIP 30075.",
    serviceName: "Limpieza cerca de Roswell",
    serviceTypes: ["Limpieza de casas", "Limpieza de apartamentos", "Limpieza de condominios", "Limpieza profunda", "Limpieza recurrente"],
    neighborhoods: ["Roswell", "30075", "casas cercanas en North Fulton"],
    sections: [
      {
        heading: "Solicitudes cerca de Roswell",
        body:
          "ZIP 30075 está en la lista actual. Rosa confirma dirección exacta, viaje y disponibilidad antes de aceptar."
      },
      {
        heading: "Opciones de limpieza",
        body:
          "Rosa puede revisar primera limpieza, servicio recurrente, apartamentos, condominios y limpieza profunda."
      }
    ],
    faqs: [
      {
        question: "¿Medina Clean atiende todo Roswell?",
        answer: "No automáticamente. El sitio valida 30075 y Rosa revisa direcciones exactas caso por caso."
      },
      {
        question: "¿Puedo preguntar si mi ZIP no aparece?",
        answer: "Sí. Los ZIPs desconocidos se mandan a revisión manual en vez de confirmación automática."
      }
    ]
  }
];

export function getLocalServicePage(locale: Locale, slug: string) {
  return localServicePages.find((page) => page.locale === locale && page.slug === slug) || null;
}

export function getLocalServiceAlternate(page: LocalServicePage) {
  const alternateLocale: Locale = page.locale === "en" ? "es" : "en";
  const alternateSlug =
    page.kind === "city" ? getCityAlternateSlug(page.slug, page.locale) : serviceSlugAlternates[page.slug];

  return alternateSlug ? getLocalServicePage(alternateLocale, alternateSlug) : null;
}

export function buildLocalServiceJsonLd(page: LocalServicePage, phoneNumber = "") {
  const data = {
    "@context": "https://schema.org",
    "@type": "CleaningService",
    name: `${page.serviceName} - Medina Clean`,
    url: `https://medinaclean.com/${page.locale}/${page.slug}`,
    description: page.description,
    provider: {
      "@type": "LocalBusiness",
      name: "Medina Clean",
      url: "https://medinaclean.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Woodstock",
        addressRegion: "GA",
        postalCode: "30188",
        addressCountry: "US"
      }
    },
    serviceType: page.serviceTypes,
    areaServed: page.neighborhoods,
    availableLanguage: page.locale === "en" ? ["English", "Spanish"] : ["Spanish", "English"],
    mainEntity: page.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return phoneNumber ? { ...data, telephone: phoneNumber } : data;
}

function getCityAlternateSlug(slug: string, locale: Locale) {
  if (locale === "en" && slug.startsWith("cleaning-services-")) {
    return `servicios-de-limpieza-${slug.slice("cleaning-services-".length)}`;
  }

  if (locale === "es" && slug.startsWith("servicios-de-limpieza-")) {
    return `cleaning-services-${slug.slice("servicios-de-limpieza-".length)}`;
  }

  return null;
}
