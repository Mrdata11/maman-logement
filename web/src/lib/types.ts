export interface Listing {
  id: string;
  source: string;
  source_url: string;
  title: string;
  description: string;
  location: string | null;
  province: string | null;
  price: string | null;
  price_amount: number | null;
  listing_type: string | null;
  contact: string | null;
  images: string[];
  date_published: string | null;
  date_scraped: string;
}

export interface CriteriaScores {
  community_size_and_maturity: number;
  values_alignment: number;
  common_projects: number;
  large_hall_biodanza: number;
  rental_price: number;
  unit_type: number;
  parking: number;
  spiritual_alignment: number;
  charter_openness: number;
  community_meals: number;
  location_brussels: number;
  near_hospital: number;
}

export interface Evaluation {
  listing_id: string;
  overall_score: number;
  match_summary: string;
  criteria_scores: CriteriaScores;
  highlights: string[];
  concerns: string[];
  date_evaluated: string;
}

export type ListingStatus = "new" | "archived" | "in_discussion" | "favorite";

export interface ListingWithEval {
  listing: Listing;
  evaluation: Evaluation | null;
  status: ListingStatus;
  notes: string;
}

export const CRITERIA_LABELS: Record<keyof CriteriaScores, string> = {
  community_size_and_maturity: "Taille & maturit\u00e9 de la communaut\u00e9",
  values_alignment: "Valeurs (respect, bienveillance, solidarit\u00e9)",
  common_projects: "Projets communs (potager, \u00e9picerie...)",
  large_hall_biodanza: "Grande salle biodanza (180-250m\u00b2)",
  rental_price: "Loyer (500-750\u20ac charges comprises)",
  unit_type: "Type de logement (studio/1 chambre)",
  parking: "Parking voiture + moto",
  spiritual_alignment: "Esprit biodanseur / spirituel",
  charter_openness: "Charte & ouverture au monde",
  community_meals: "Repas & activit\u00e9s communautaires",
  location_brussels: "Proximit\u00e9 Bruxelles (30-45 min)",
  near_hospital: "Proximit\u00e9 h\u00f4pital soins palliatifs",
};
