# Modèles d'emails de Supabase Auth

À coller dans Supabase → Authentication → Emails → Templates (onglet « Source »).

| Fichier | Modèle Supabase | Objet conseillé |
|---|---|---|
| `confirmation.html` | Confirm signup | Confirme ton adresse email |
| `recovery.html` | Reset password | Réinitialise ton mot de passe |

- Les liens passent par `/auth/confirm` avec `token_hash` : ils marchent dans n'importe quel navigateur.
- Le logo est servi par le site (`public/email-logo.png`, via `{{ .SiteURL }}`) : il doit être en ligne.
- Mise en page en tableaux et styles en ligne, pour Gmail, Outlook et Apple Mail.
