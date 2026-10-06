import { createHash } from "node:crypto";

export function canonicalBrandName(brand: string): string {
  let name = brand.trim().replaceAll(/\s+/g, " ");
  if (/^amazon\.(ae|ca|co\.jp|co\.uk|com(?:\.au)?|de|es|fr|in|it|nl|sa|sg)$/i.test(name)) return "Amazon";
  // Country/currency suffixes describe a variant, not a separate brand.
  name = name.replace(/(?:\s+|\s*\|\s*)(?:US|USA|UK|GB|CA|AU|DE|FR|NL|ES|IT|JP|KR|SG|AE|UAE|SA|IN|ID|USD|GBP|CAD|AUD|EUR|JPY|KRW|SGD|AED|SAR|INR|IDR)\s*$/i, "");
  return name.trim();
}

export function catalogGroupId(brand: string, categoryId: string): string {
  const canonical = canonicalBrandName(brand).toLowerCase();
  return `pzg_${createHash("sha256")
    .update(`bitrefill\0gift_card\0${categoryId}\0${canonical}`)
    .digest("hex").slice(0, 32)}`;
}

export function containsProviderName(value: string): boolean {
  return /\b(?:changenow|change[\s-]*now|bitrefill)\b/i.test(value);
}

export function customerFacingText(value: string): string {
  return value
    .replace(/\b(?:changenow|change[\s-]*now)\b/gi, "the payment service")
    .replace(/\bbitrefill\b/gi, "the fulfillment provider");
}

export function customerDescription(description: string): string {
  return customerFacingText(description);
}
