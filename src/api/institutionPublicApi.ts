import { httpClient } from '@/lib/http';

/**
 * The one institution endpoint that needs no token.
 *
 * It answers "which college is this address?" so a login page can brand
 * itself. That is ALL it answers -- not whether the college is paid up, not
 * how many students it has, not which features it bought.
 *
 * NO PARAMETERS, AND THAT IS THE DESIGN. The server reads the college slug
 * from the Host header, so this client cannot ask about a college other than
 * the one whose address the browser is on. A `slug` argument here would be a
 * request for a list endpoint, and enumerating every college on the platform
 * would become a loop instead of a DNS lookup each.
 */
export interface CollegeBranding {
  id: string;
  name: string;
}

/**
 * The college this address belongs to, or null for the consumer product.
 *
 * NEVER THROWS FOR "not a college". The server answers 200 with null, because
 * a 404 would make it a faster existence oracle than the DNS it stands behind
 * -- and because a login page that breaks on the main domain is worse than one
 * that simply shows no branding.
 */
export async function getCollegeBranding(): Promise<CollegeBranding | null> {
  try {
    const { data } = await httpClient.get<{ institution: CollegeBranding | null }>(
      '/institution/public/branding',
    );
    return data?.institution ?? null;
  } catch {
    // A branding lookup that fails must not stop somebody signing in. The
    // page falls back to the unbranded product, which is exactly what it
    // would show for the main domain.
    return null;
  }
}
