// Used by the hosted production build, not by the development preview.
// Deliberately accept an environment object so this policy can be tested
// without reading or disclosing credentials.
function productionConfig(env) {
  const rawDomain = env.REPLIT_INTERNAL_APP_DOMAIN || env.EXPO_PUBLIC_DOMAIN;
  if (!rawDomain) {
    throw new Error('A published backend domain is required. Development preview domains cannot be used for a production build.');
  }
  let url;
  try {
    url = new URL(rawDomain.includes('://') ? rawDomain : `https://${rawDomain}`);
  } catch {
    throw new Error('The production backend domain is invalid.');
  }
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' || url.username || url.password || url.port ||
    url.pathname !== '/' || url.search || url.hash ||
    !host.includes('.') || host.endsWith('.replit.dev') ||
    host.endsWith('.localhost') || host.endsWith('.local') ||
    host.endsWith('.test') || host.endsWith('.invalid') ||
    host === 'localhost' || /^[\d.]+$/.test(host) || host.includes(':')
  ) {
    throw new Error('Production requires a public HTTPS backend domain, not a development preview or local address.');
  }
  if (!env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
    throw new Error('Production requires the live Clerk publishable key. Development authentication keys cannot be bundled into a release.');
  }
  return { domain: url.host };
}

module.exports = { productionConfig };
