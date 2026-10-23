// Classes de l'inclinaison 3D (voir components/tilt.tsx). Module à part : une constante exportée
// d'un fichier « use client » n'est pas lisible depuis un composant serveur (CardList).
export const TILT_CLASS =
  "[transform:perspective(800px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-200 ease-out will-change-transform";
