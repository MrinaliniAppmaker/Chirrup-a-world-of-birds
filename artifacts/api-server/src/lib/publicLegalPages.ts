// Public-facing contact details supplied by the developer for this app.
// Do not copy these into agent memory.
const DEVELOPER = "Mrinalini Khetan";
const SUPPORT_EMAIL = "neetisha@gmail.com";
const UPDATED = "26 November 2026";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

type Section = { title: string; paragraphs: string[] };

const privacy: Section[] = [
  {
    title: "Who operates Chirrup",
    paragraphs: [
      `Chirrup is a bird-creation app operated by ${DEVELOPER} from India. For privacy questions, access or correction requests, or account and data deletion, contact ${SUPPORT_EMAIL}.`,
      "This policy describes the current app. It is not a promise that the app is ready for a children's or Google Play production release.",
    ],
  },
  {
    title: "Information used by the app",
    paragraphs: [
      "Accounts use an email address, a user identifier, a display name, authentication/session information, and an optional profile photograph. If you choose Google sign-in, the authentication service receives the information authorised in that sign-in flow.",
      "The app processes bird traits and extra features you enter, generated bird pictures and descriptions, names you give saved birds, interaction settings and selected bird pictures, and saved-library records. Do not enter private or sensitive information in generation prompts or bird names.",
      "The app and its service providers also process technical request, security and error information needed to operate and protect the service. The app keeps account-specific library caches on the device and uses authentication storage to maintain your session.",
      "If you report generated content, the app sends the selected output text, your chosen reason, optional details and, if you leave it enabled, a resized picture snapshot. These are stored privately for developer review. You do not need to sign in or provide an email to report content. Do not include personal information in a report.",
    ],
  },
  {
    title: "Why information is processed",
    paragraphs: [
      "Information is used to sign you in, display your profile, generate birds and interactions, save and recover your library, fulfil sharing requests, investigate failures and misuse, and respond to support and privacy requests.",
      "Generation and storage require an internet connection. A generated bird is saved to your account library only when you choose to save it; the app may retain a temporary creation draft on your device so the sign-in detour or screen-error recovery does not lose it.",
    ],
  },
  {
    title: "Service providers",
    paragraphs: [
      "Replit provides application hosting, managed AI access, the database and App Storage infrastructure. It receives the requests and stored data required to provide those services.",
      "Clerk provides account authentication, sign-in email delivery, session management and profile storage, including a profile photo if you upload one.",
      "Google Gemini, accessed through Replit's AI service, receives bird-generation prompts and the reference images needed to generate pictures. OpenAI, accessed through Replit's AI service, receives the prompts and bird information needed for text generation and trait validation. Interactions can send the selected bird portraits as image references.",
      "If you use Google sign-in, Google processes that sign-in. If you email support or choose to share by email, your email provider and the recipient's provider process the message; the support mailbox uses Gmail. Provider processing and retention are subject to the applicable service agreements and privacy policies. This draft does not promise zero retention or exclusion from model training where those terms have not been confirmed.",
      "The current app does not implement advertising or paid plans. Additional services or data uses require this policy to be reviewed and updated.",
    ],
  },
  {
    title: "Bird sharing",
    paragraphs: [
      "Sharing creates a link to the saved birds you selected. Anyone holding a valid link can preview or import those birds. Share links currently expire after seven days; removing the source bird also makes its single-bird link unavailable.",
      "A recipient imports an independent copy. Removing your bird or account does not remove copies someone else has already imported. Do not put personal information into bird names or descriptions you intend to share.",
      "A separately submitted content report is a review record, not a saved-library bird. Removing a bird does not automatically remove an anonymous report about its output. Contact support about report-related privacy concerns, giving the report reference but never a sign-in code.",
      "The app opens an email composition or sharing action for you to review. It does not automatically send an email on your behalf.",
    ],
  },
  {
    title: "Device access and security",
    paragraphs: [
      "Choosing a profile photo uses the system image picker. Android is configured not to request location, camera, microphone, overlay, or broad photo-library/storage permissions for this purpose. iOS may request photo access. You choose whether to upload the selected crop using Save.",
      "The app uses HTTPS for remote service requests, authenticated access for account journals, and expiring authorised links for saved portraits. No service can guarantee absolute security. Do not forward authentication codes or private session credentials.",
    ],
  },
  {
    title: "Storage, retention and your choices",
    paragraphs: [
      "Saved birds and account information remain until you remove them or an account-deletion request is completed. Logging out or uninstalling the app does not by itself delete server-side account data. Signing out hides that account's cached library rather than deleting the account.",
      "You can edit your profile, remove saved birds in the app, and ask for access, correction, or deletion by contacting the address above. We may need to verify that a request comes from the account holder before taking action.",
      "A completed account-deletion request covers the account, profile information and photo, owned saved-library records and portraits, and active sharing links. Copies already imported by other users are independent. Email correspondence, provider backups, and records retained for applicable legal or security requirements may remain subject to those requirements and the providers' retention arrangements. An exact backup-erasure period has not yet been confirmed for this release.",
    ],
  },
  {
    title: "Children and launch restrictions",
    paragraphs: [
      "The intended audience includes children and older users. Child-access controls, appropriate parental or guardian consent, SDK eligibility and AI-provider terms still require review and implementation before a child-directed or mixed-audience production launch.",
      "This draft does not authorise collecting children's personal data, and it does not claim that parental-consent or age-assurance systems already exist. If you believe a child has supplied information that should be removed, contact support so the account and request can be verified.",
      "The app is operated from India. Applicable Indian data-protection requirements, their commencement dates, and the rules of other countries where the app is offered must be reviewed by a qualified adviser before release. A Google Play age category is not a substitute for that review.",
    ],
  },
  {
    title: "Policy updates",
    paragraphs: [
      "Changes will be reflected on this page with an updated date. Material changes to collection, sharing or consent requirements must be communicated appropriately before the new processing begins.",
    ],
  },
];

const deletion: Section[] = [
  {
    title: "Request account and associated data deletion",
    paragraphs: [
      "In the app, open Request account deletion from Home or Your profile. Sign in, read the consequences and type DELETE to submit a request. The request is stored for developer review, not immediate deletion. You can cancel it there before processing starts.",
      `You can request deletion without installing or signing in to the app. Send an email to ${SUPPORT_EMAIL} with the subject “Chirrup account deletion”, preferably from the email address associated with your Chirrup account.`,
      "Include the account email address and say that you want the account and its associated data deleted. Never include your password, one-time sign-in code or identity-document scans. A parent or guardian can explain that they are making a request for a child.",
      "The button below opens an email draft. You must send the email yourself. Opening this page, opening the draft, or pressing the button does not delete anything and does not submit a request automatically. If no email app opens, copy the address and send the request using your normal email service.",
    ],
  },
  {
    title: "Verification and handling",
    paragraphs: [
      "The developer reviews the request and may verify account ownership or a parent's or guardian's authority before deletion. Do not send sign-in codes to support to prove ownership. Support will confirm the outcome by email; this page does not imply immediate or automatic deletion.",
      "Deletion of the account and owned library is permanent once completed. You will lose access to its saved birds. Save any copies you want to keep before requesting deletion.",
      "When processing begins, account access and sharing links are blocked. Storage cleanup waits for previously issued upload authorisations to expire and requires a follow-up operator pass. A pseudonymous security record is retained to stop old tokens from recreating the deleted journal. An offline phone's existing files and third-party backups cannot be remotely erased by this operation.",
    ],
  },
  {
    title: "What the request covers",
    paragraphs: [
      "The requested deletion covers the authentication account and profile, profile photo, owned library records and bird portraits, and active sharing links. Independent bird copies already imported into another user's library are not removed from that person's account.",
      "Email correspondence, provider backups, and data required for applicable legal or security purposes may remain under the applicable retention arrangements. No exact backup-erasure period is promised in this pre-release draft.",
      "To request deletion of particular data without deleting your whole account, explain which data in your email. You can also remove individual saved birds directly in the app.",
    ],
  },
];

export function publicLegalPage(kind: "privacy" | "delete-account") {
  const title = kind === "privacy" ? "Privacy policy" : "Delete your Chirrup account";
  const sections = kind === "privacy" ? privacy : deletion;
  const email = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Chirrup account deletion")}&body=${encodeURIComponent("Please delete my Chirrup account and its associated data.\n\nMy account email address:\n")}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${escapeHtml(title)} | Chirrup</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#F5F2EA;color:#1F2A22;font:16px/1.65 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:28px 22px 48px}
a{color:#2A4D3A;text-underline-offset:3px;overflow-wrap:anywhere}header{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center;border-bottom:1px solid #D9DDD1;padding-bottom:18px}
.brand,h1,h2{font-family:Georgia,serif}.brand{font-size:26px;text-decoration:none}h1{font-size:34px;line-height:1.2;margin-top:28px}h2{font-size:22px;line-height:1.4;margin:30px 0 8px}p{margin:10px 0;overflow-wrap:anywhere}.meta{font-size:14px;color:#596654}
.notice{padding:16px;background:#F6EDD6;border:1px solid #D9C99C;border-radius:8px}.button{display:inline-block;padding:12px 18px;border-radius:6px;background:#2A4D3A;color:white;text-decoration:none;min-height:48px;margin:10px 0}
footer{margin-top:36px;padding-top:18px;border-top:1px solid #D9DDD1;display:flex;flex-wrap:wrap;gap:20px}a:focus-visible{outline:3px solid #557F45;outline-offset:4px}
</style></head><body><main>
<header><a class="brand" href="/">Chirrup</a><a href="/">Back to Home</a></header>
<h1>${escapeHtml(title)}</h1><p class="meta">Last updated: ${UPDATED}</p>
<aside class="notice" aria-label="Pre-release document notice"><strong>Pre-release draft.</strong> This document is an informational template, not legal advice. Qualified legal review and the unresolved children's-access and retention checks are required before production release.</aside>
${sections.map(section => `<section><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("")}</section>`).join("")}
${kind === "delete-account" ? `<a class="button" href="${escapeHtml(email)}">Write deletion request email</a><p>Or email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>` : ""}
<footer><a href="/api/legal/privacy">Privacy policy</a><a href="/api/legal/delete-account">Account deletion</a><a href="mailto:${SUPPORT_EMAIL}">Contact support</a><a href="/">Home</a></footer>
</main></body></html>`;
}
