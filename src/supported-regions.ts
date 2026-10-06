import type { Region } from './api-types/index';

// Defense against stale API caches and old saved preferences. The backend is
// authoritative for whether an allowed country actually has approved products.
const PAYZ_COUNTRIES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  DE: 'Germany', FR: 'France', NL: 'Netherlands', ES: 'Spain', IT: 'Italy',
  JP: 'Japan', KR: 'South Korea', IN: 'India', ID: 'Indonesia', SG: 'Singapore',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia',
};
export const isPayzCountry = (code: string): boolean =>
  Object.prototype.hasOwnProperty.call(PAYZ_COUNTRIES, code);
// Global is a catalog browsing scope, never a fulfillment country.
export const GLOBAL_REGION = 'GLOBAL';
export const isPayzCatalogRegion = (code: string): boolean =>
  code === GLOBAL_REGION || isPayzCountry(code);
export const catalogRegionParams = (code: string): { region?: string } =>
  code === GLOBAL_REGION ? {} : { region: code };
export function payzRegions(regions: Region[]): Region[] {
  const order = Object.keys(PAYZ_COUNTRIES);
  return regions.filter((region) => isPayzCountry(region.code))
    .map((region) => ({ ...region, name: PAYZ_COUNTRIES[region.code] }))
    .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
}
