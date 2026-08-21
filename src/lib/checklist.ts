import type { Locale } from "@/lib/content";

// GEN — "What's included" checklist content (more-cleaning-keywords stream, handoff 01).
// Task facts only, written fresh in Medina Clean's voice. NO prices anywhere: Rosa gives a
// free personalized quote (see /#pricing); this page never states or implies a rate.

export type ChecklistRoomGroup = {
  room: string;
  note?: string;
  tasks: string[];
};

export type ChecklistTier = {
  id: "standard" | "detailed" | "move";
  name: string;
  intro: string;
  roomGroups?: ChecklistRoomGroup[];
  flatTasks?: string[];
};

export type ChecklistCopy = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  tiersTitle: string;
  tiers: ChecklistTier[];
  expectations: {
    title: string;
    body: string;
    doTitle: string;
    doItems: string[];
    dontTitle: string;
    dontItems: string[];
  };
  addOns: {
    title: string;
    body: string;
    items: string[];
  };
  cta: {
    title: string;
    body: string;
    scheduleLabel: string;
    pricingLabel: string;
  };
  servicesLinkLabel: string;
};

export const checklistCopy: Record<Locale, ChecklistCopy> = {
  en: {
    slug: "whats-included",
    title: "What's Included in a Medina Clean Cleaning",
    description:
      "See exactly what's included in a Medina Clean standard clean, detailed clean, and move-in/move-out clean, room by room, plus add-ons. No prices listed — Rosa gives every home a free personalized quote.",
    eyebrow: "Cleaning checklist",
    h1: "What's included in each Medina Clean cleaning",
    intro:
      "Every home is different, but this is the baseline checklist Rosa Medina works from for a standard clean, a detailed/deep clean, and a move-in or move-out clean. Rosa reviews your specific space and confirms the final scope and price before booking.",
    tiersTitle: "Cleaning tiers",
    tiers: [
      {
        id: "standard",
        name: "Standard clean",
        intro: "The baseline visit for recurring and first-time appointments.",
        roomGroups: [
          {
            room: "Kitchen",
            tasks: [
              "Wipe counters, appliances, and sink",
              "Wipe down cabinet fronts",
              "Clean the outside of the oven and refrigerator",
              "Clean the microwave inside and out",
              "Clean the stovetop, grates, and knobs",
              "Sweep and mop the floor"
            ]
          },
          {
            room: "Bathrooms",
            tasks: [
              "Wipe counters and sink",
              "Clean mirrors",
              "Wipe down cabinets and drawers",
              "Clean the toilet, shower, and tub",
              "Spot-clean windows",
              "Sweep and mop the floor"
            ]
          },
          {
            room: "Living areas",
            tasks: [
              "Dust window sills",
              "Dust furniture",
              "Dust bookshelves, knick-knacks, and picture frames",
              "Vacuum upholstered furniture",
              "Vacuum floors",
              "Mop hard floors"
            ]
          },
          {
            room: "Bedrooms",
            tasks: [
              "Make beds",
              "Dust window sills",
              "Dust furniture",
              "Dust bookshelves, knick-knacks, and picture frames",
              "Vacuum carpets and upholstery",
              "Mop hard floors"
            ]
          },
          {
            room: "As-needed highs and lows",
            tasks: [
              "Dust light fixtures",
              "Dust ceiling fans",
              "Dust blinds",
              "Dust baseboards (when reachable)",
              "Dust doors"
            ]
          }
        ]
      },
      {
        id: "detailed",
        name: "Detailed / deep clean",
        intro: "Everything in the standard clean, plus extra time on buildup and reset details.",
        roomGroups: [
          {
            room: "Kitchen",
            note: "Standard clean, plus:",
            tasks: [
              "Clear grease build-up",
              "Clean the vent hood",
              "Wipe the top of the refrigerator",
              "Wipe the tops of reachable cabinets"
            ]
          },
          {
            room: "Bathrooms",
            note: "Standard clean, plus:",
            tasks: ["Clear hard-water spots, lime scale, and soap scum", "Treat mold and mildew"]
          },
          {
            room: "Living areas",
            note: "Standard clean, plus:",
            tasks: [
              "Reset clutter — put items back after cleaning",
              "Clean under and behind reachable furniture"
            ]
          },
          {
            room: "Bedrooms",
            note: "Standard clean, plus:",
            tasks: [
              "Reset clutter — put items back after cleaning",
              "Clean under and behind reachable furniture"
            ]
          },
          {
            room: "As-needed highs and lows",
            note: "Standard clean, plus:",
            tasks: [
              "Dust reachable vents",
              "Wet-wipe reachable light fixtures",
              "Wet-wipe blinds and window sills",
              "Clear cobwebs from corners",
              "Wet-wipe doors and baseboards (when reachable)",
              "Wet-wipe light switches and outlets"
            ]
          }
        ]
      },
      {
        id: "move",
        name: "Move-in / move-out clean",
        intro: "Everything in the detailed clean, plus the extra reach an empty or moving home needs.",
        flatTasks: [
          "Clean inside cabinets, cupboards, and closets",
          "Wipe the tops of cabinets",
          "Clean inside the refrigerator",
          "Clean inside the oven",
          "Spot-clean walls in the kitchen and bathrooms",
          "Vacuum carpet edges"
        ]
      }
    ],
    expectations: {
      title: "What we do and what we don't",
      body: "So there are no surprises on cleaning day, here's what Rosa's team does and doesn't do.",
      doTitle: "We do",
      doItems: [
        "Move light furniture and rugs to clean underneath",
        "Remove small items and put them back after cleaning",
        "Clean under and behind furniture when it's reachable",
        "Handle every item with care and caution"
      ],
      dontTitle: "We don't",
      dontItems: [
        "Move heavy furniture",
        "Clean spaces that are too cluttered to reach safely without prep beforehand",
        "Reach above a 3-step ladder",
        "Remove items from high shelves or display cases"
      ]
    },
    addOns: {
      title: "Add-ons",
      body: "Ask Rosa to add any of these to your cleaning — she'll confirm scope and price with your quote.",
      items: ["Laundry", "Dishes", "Linen changes (per bed)", "Interior oven cleaning", "Interior refrigerator cleaning"]
    },
    cta: {
      title: "Ready to book your cleaning?",
      body: "Request an appointment and Rosa will confirm the tier, add-ons, and a free personalized quote for your space.",
      scheduleLabel: "Request an appointment",
      pricingLabel: "See free-quote details"
    },
    servicesLinkLabel: "See the full cleaning checklist"
  },
  es: {
    slug: "que-incluye",
    title: "Qué Incluye una Limpieza de Medina Clean",
    description:
      "Vea exactamente qué incluye una limpieza estándar, una limpieza detallada y una limpieza de mudanza de Medina Clean, cuarto por cuarto, además de los extras. Sin precios — Rosa da una cotización gratis y personalizada para cada hogar.",
    eyebrow: "Lista de limpieza",
    h1: "Qué incluye cada limpieza de Medina Clean",
    intro:
      "Cada hogar es diferente, pero esta es la lista base que Rosa Medina usa para una limpieza estándar, una limpieza detallada/profunda y una limpieza de mudanza. Rosa revisa su espacio específico y confirma el alcance final y el precio antes de reservar.",
    tiersTitle: "Niveles de limpieza",
    tiers: [
      {
        id: "standard",
        name: "Limpieza estándar",
        intro: "La visita base para citas recurrentes y primeras limpiezas.",
        roomGroups: [
          {
            room: "Cocina",
            tasks: [
              "Limpiar las cubiertas, aparatos y el fregadero",
              "Limpiar el frente de los gabinetes",
              "Limpiar el exterior del horno y el refrigerador",
              "Limpiar el microondas por dentro y por fuera",
              "Limpiar la estufa, las parrillas y las perillas",
              "Barrer y trapear el piso"
            ]
          },
          {
            room: "Baños",
            tasks: [
              "Limpiar las cubiertas y el lavamanos",
              "Limpiar los espejos",
              "Limpiar los gabinetes y cajones",
              "Limpiar el inodoro, la regadera y la tina",
              "Limpiar las ventanas por encima",
              "Barrer y trapear el piso"
            ]
          },
          {
            room: "Áreas comunes",
            tasks: [
              "Quitar el polvo de los marcos de ventanas",
              "Quitar el polvo de los muebles",
              "Quitar el polvo de libreros, adornos y portarretratos",
              "Aspirar los muebles tapizados",
              "Aspirar los pisos",
              "Trapear los pisos duros"
            ]
          },
          {
            room: "Recámaras",
            tasks: [
              "Tender las camas",
              "Quitar el polvo de los marcos de ventanas",
              "Quitar el polvo de los muebles",
              "Quitar el polvo de libreros, adornos y portarretratos",
              "Aspirar alfombras y tapicería",
              "Trapear los pisos duros"
            ]
          },
          {
            room: "Detalles altos y bajos (según se necesite)",
            tasks: [
              "Quitar el polvo de las lámparas",
              "Quitar el polvo de los ventiladores de techo",
              "Quitar el polvo de las persianas",
              "Quitar el polvo de los zócalos (donde se pueda alcanzar)",
              "Quitar el polvo de las puertas"
            ]
          }
        ]
      },
      {
        id: "detailed",
        name: "Limpieza detallada / profunda",
        intro: "Todo lo de la limpieza estándar, más tiempo extra en la acumulación y el orden.",
        roomGroups: [
          {
            room: "Cocina",
            note: "Igual que la limpieza estándar, más:",
            tasks: [
              "Quitar la grasa acumulada",
              "Limpiar la campana extractora",
              "Limpiar la parte de arriba del refrigerador",
              "Limpiar la parte de arriba de los gabinetes alcanzables"
            ]
          },
          {
            room: "Baños",
            note: "Igual que la limpieza estándar, más:",
            tasks: ["Quitar manchas de agua dura, sarro y jabón acumulado", "Tratar el moho y el hongo"]
          },
          {
            room: "Áreas comunes",
            note: "Igual que la limpieza estándar, más:",
            tasks: ["Ordenar y acomodar objetos después de limpiar", "Limpiar debajo y detrás de muebles alcanzables"]
          },
          {
            room: "Recámaras",
            note: "Igual que la limpieza estándar, más:",
            tasks: ["Ordenar y acomodar objetos después de limpiar", "Limpiar debajo y detrás de muebles alcanzables"]
          },
          {
            room: "Detalles altos y bajos",
            note: "Igual que la limpieza estándar, más:",
            tasks: [
              "Quitar el polvo de las rejillas de ventilación alcanzables",
              "Limpiar con un paño húmedo las lámparas alcanzables",
              "Limpiar con un paño húmedo las persianas y los marcos de ventanas",
              "Quitar telarañas de las esquinas",
              "Limpiar con un paño húmedo las puertas y zócalos (donde se pueda alcanzar)",
              "Limpiar con un paño húmedo los interruptores y contactos"
            ]
          }
        ]
      },
      {
        id: "move",
        name: "Limpieza de mudanza (entrada o salida)",
        intro: "Todo lo de la limpieza detallada, más el alcance extra que necesita un hogar vacío o en mudanza.",
        flatTasks: [
          "Limpiar dentro de gabinetes, alacenas y clósets",
          "Limpiar la parte de arriba de los gabinetes",
          "Limpiar dentro del refrigerador",
          "Limpiar dentro del horno",
          "Limpiar manchas en las paredes de la cocina y los baños",
          "Aspirar las orillas de la alfombra"
        ]
      }
    ],
    expectations: {
      title: "Qué sí hacemos y qué no hacemos",
      body: "Para que no haya sorpresas el día de la limpieza, esto es lo que el equipo de Rosa sí hace y no hace.",
      doTitle: "Sí hacemos",
      doItems: [
        "Mover muebles ligeros y tapetes para limpiar debajo",
        "Quitar objetos pequeños y regresarlos después de limpiar",
        "Limpiar debajo y detrás de muebles cuando se pueda alcanzar",
        "Tratar cada objeto con cuidado y precaución"
      ],
      dontTitle: "No hacemos",
      dontItems: [
        "Mover muebles pesados",
        "Limpiar espacios demasiado desordenados sin preparación previa",
        "Alcanzar más alto que una escalera de 3 escalones",
        "Quitar objetos de repisas altas o vitrinas"
      ]
    },
    addOns: {
      title: "Extras",
      body: "Pídale a Rosa agregar cualquiera de estos a su limpieza — ella confirma el alcance y el precio en su cotización.",
      items: [
        "Lavandería",
        "Lavar platos",
        "Cambio de sábanas (por cama)",
        "Limpieza interior del horno",
        "Limpieza interior del refrigerador"
      ]
    },
    cta: {
      title: "¿Listo para reservar su limpieza?",
      body: "Pida una cita y Rosa confirmará el nivel, los extras y una cotización gratis y personalizada para su espacio.",
      scheduleLabel: "Pedir una cita",
      pricingLabel: "Ver cómo funciona la cotización gratis"
    },
    servicesLinkLabel: "Ver la lista completa de limpieza"
  }
};

export function getChecklistPage(locale: Locale) {
  return checklistCopy[locale];
}

export function getChecklistAlternateHref(locale: Locale) {
  const otherLocale: Locale = locale === "en" ? "es" : "en";
  return `/${otherLocale}/${checklistCopy[otherLocale].slug}`;
}
