// config/pricing.ts

export interface PricingTier {
  id: string;
  label: string;
  maxAttendees: number;
  priceMXN: number;
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  MICRO: {
    id: "MICRO",
    label: "Micro (Talleres / Cursos)",
    maxAttendees: 100,
    priceMXN: 199, // Puedes cambiarlo a 0 si decides hacer un Tier gratis de gancho
  },
  MEDIUM: {
    id: "MEDIUM",
    label: "Medium (Conferencias / Corporativos)",
    maxAttendees: 500,
    priceMXN: 899,
  },
  LARGE: {
    id: "LARGE",
    label: "Large (Congresos / Expos)",
    maxAttendees: 1500,
    priceMXN: 2199,
  },
};

// Factor por el que se multiplica el costo base por cada DÍA EXTRA
// Ej: Si el evento dura 3 días, se cobran 2 días extra. Costo = Base + (Base * MULTIPLIER * 2)
export const MULTI_DAY_MULTIPLIER = 0.40; // 40% de costo adicional por día extra