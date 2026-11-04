const env = import.meta.env;

export const config = {
  hubUrl: env.VITE_HUB_URL || '',
  hubAnonKey: env.VITE_HUB_ANON_KEY || '',
  portalUrl: env.VITE_PORTAL_URL || '',
  portalAnonKey: env.VITE_PORTAL_ANON_KEY || '',
  unlistedFormUrl: env.VITE_UNLISTED_FORM_URL || '',
  showStreetAddress: env.VITE_SHOW_STREET_ADDRESS === 'true',
};

export const boardConfigured = Boolean(config.hubUrl && config.hubAnonKey);
export const portalConfigured = Boolean(config.portalUrl && config.portalAnonKey);
