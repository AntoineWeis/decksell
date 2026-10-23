import "server-only";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { siteUrl } from "./site-url.ts";

// Emails du site (hors emails de connexion, envoyés par Supabase Auth), via l'API Resend.
// Sans RESEND_API_KEY ni EMAIL_FROM, rien n'est envoyé : le site fonctionne quand même.

type Email = { to: string; subject: string; text: string; html: string };

export async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn("Email non envoyé : RESEND_API_KEY ou EMAIL_FROM manquant.");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
    });
    if (!res.ok) {
      console.error("Email non envoyé", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email non envoyé", e);
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Prévient un membre qu'il a un nouveau message. Le texte du message n'est pas recopié :
 * seulement l'expéditeur, l'annonce et un lien vers la conversation.
 */
export async function notifyNewMessage(n: {
  recipientId: string;
  senderName: string;
  listingTitle: string;
  conversationId: string;
}): Promise<void> {
  // L'adresse du destinataire n'est lisible qu'avec la clé secrète, et ne sort jamais du serveur.
  const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(n.recipientId);
  const to = data?.user?.email;
  if (error || !to) {
    console.error("Notification : destinataire introuvable", error?.message);
    return;
  }
  const url = `${siteUrl()}/espace/messages/${n.conversationId}`;
  const profileUrl = `${siteUrl()}/espace/profil`;
  const subject = `Nouveau message de ${n.senderName} à propos de « ${n.listingTitle} »`;
  const text = [
    `${n.senderName} t'a écrit à propos de « ${n.listingTitle} » sur decksell.`,
    "",
    `Lire et répondre : ${url}`,
    "",
    "Tu ne recevras pas d'autre email pour cette conversation avant de l'avoir ouverte.",
    `Pour ne plus recevoir ces emails : ${profileUrl}`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111827">
<p><strong>${escapeHtml(n.senderName)}</strong> t'a écrit à propos de « ${escapeHtml(n.listingTitle)} » sur decksell.</p>
<p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Lire et répondre</a></p>
<p style="color:#586378;font-size:13px">Tu ne recevras pas d'autre email pour cette conversation avant de l'avoir ouverte.<br>
<a href="${profileUrl}" style="color:#586378">Ne plus recevoir ces emails</a></p>
</div>`;
  await sendEmail({ to, subject, text, html });
}
