/* @flow */

// Reformat MM/YYYY to YYYY-MM
export function reformatExpiry(expiry: ?string): ?string {
  if (typeof expiry === "string") {
    const [month, year] = expiry.split("/");
    return `${year}-${month}`;
  }
}