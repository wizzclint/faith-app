/**
 * Public pages the app links out to. Also the website wallet apps check the
 * app against: it publishes /.well-known/assetlinks.json naming this app's
 * package and signing certificate.
 */
export const LEGAL_SITE = "https://legal-site-coral.vercel.app";

export const links = {
  terms: `${LEGAL_SITE}/terms.html`,
  privacy: `${LEGAL_SITE}/privacy.html`,
} as const;
