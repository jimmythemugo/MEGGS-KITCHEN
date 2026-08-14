// Curated, categorized fallback images for MEGGS KITCHEN.
// Used whenever a kitchenware product, category, or banner doesn't have its own photo yet.

const COOKWARE_PLACEHOLDER = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';
const APPLIANCES_PLACEHOLDER = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
const CUTLERY_PLACEHOLDER = 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80';
const COMMERCIAL_PLACEHOLDER = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80';
const BAKEWARE_PLACEHOLDER = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
const TABLEWARE_PLACEHOLDER = 'https://images.unsplash.com/photo-1615865417236-d67f589c4466?auto=format&fit=crop&w=800&q=80';
const BARWARE_PLACEHOLDER = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80';
const REFRIGERATION_PLACEHOLDER = 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=800&q=80';

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  cookware: COOKWARE_PLACEHOLDER,
  'pots-and-pans': COOKWARE_PLACEHOLDER,
  appliances: APPLIANCES_PLACEHOLDER,
  'kitchen-appliances': APPLIANCES_PLACEHOLDER,
  cutlery: CUTLERY_PLACEHOLDER,
  knives: CUTLERY_PLACEHOLDER,
  commercial: COMMERCIAL_PLACEHOLDER,
  'commercial-equipment': COMMERCIAL_PLACEHOLDER,
  bakeware: BAKEWARE_PLACEHOLDER,
  tableware: TABLEWARE_PLACEHOLDER,
  barware: BARWARE_PLACEHOLDER,
  refrigeration: REFRIGERATION_PLACEHOLDER,
};

const DEFAULT_PRODUCT_PLACEHOLDER = COOKWARE_PLACEHOLDER;
const DEFAULT_SERVICE_PLACEHOLDER = COMMERCIAL_PLACEHOLDER;
const DEFAULT_PROJECT_PLACEHOLDER = APPLIANCES_PLACEHOLDER;

function slugKey(value?: string | null): string {
  return (value || '').toLowerCase().trim();
}

/** Fallback image for a kitchenware product, based on its category slug/name if known. */
export function getProductPlaceholder(categorySlugOrName?: string | null): string {
  const key = slugKey(categorySlugOrName);
  for (const [k, url] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    if (key.includes(k)) return url;
  }
  return DEFAULT_PRODUCT_PLACEHOLDER;
}

/** Fallback image for a service, based on its name/slug if known. */
export function getServicePlaceholder(nameOrSlug?: string | null): string {
  const key = slugKey(nameOrSlug);
  for (const [k, url] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    if (key.includes(k)) return url;
  }
  return DEFAULT_SERVICE_PLACEHOLDER;
}

/** Fallback image for a portfolio/project entry. */
export function getProjectPlaceholder(): string {
  return DEFAULT_PROJECT_PLACEHOLDER;
}

/** Generic resolver: returns the given url if present/non-empty, otherwise a placeholder. */
export function withFallback(url: string | null | undefined, fallback: string): string {
  return url && url.trim().length > 0 ? url : fallback;
}

