// Coordonnées légales de l'éditeur et des hébergeurs (mentions légales, confidentialité).

export const EDITOR = {
  name: "Antoine Weisgerber",
  status: "EI",
  siren: "920 847 332",
  vat: "FR50920847332",
  address: "11 rue de la République, 76000 Rouen, France",
  email: "contact@decksell.fr",
} as const;

export const HOSTS = [
  { name: "Vercel Inc.", role: "hébergement du site", address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis" },
  {
    name: "Supabase Inc.",
    role: "base de données, comptes et photos",
    address: "970 Toa Payoh North #07-04, Singapour 318992",
  },
] as const;
