// Libellés partagés entre le navigateur et le serveur pour les annonces.

export const CONDITIONS = {
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  played: "Played",
} as const;
export type Condition = keyof typeof CONDITIONS;

export const STATUSES = {
  active: "En vente",
  reserved: "Réservé",
  sold: "Vendu",
  withdrawn: "Retiré",
} as const;
export type ListingStatus = keyof typeof STATUSES;

export type Listing = {
  id: string;
  title: string;
  decklist: string;
  card_count: number;
  estimated_cents: number;
  estimate_complete: boolean;
  asking_cents: number;
  condition: Condition;
  description: string | null;
  status: ListingStatus;
  sold_cents: number | null;
  sold_at: string | null;
  created_at: string;
};
