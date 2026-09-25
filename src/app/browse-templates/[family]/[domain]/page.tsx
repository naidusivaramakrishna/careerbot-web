import { redirect } from 'next/navigation';

/**
 * The per-family/domain template detail page was removed when /browse-templates
 * became a static overview page. These URLs were public (middleware
 * publicRoutes) and linked from the old browser, so send bookmarked or indexed
 * links to the overview instead of a 404. Temporary (307) so the route can be
 * brought back without browsers having cached a permanent redirect.
 */
export default function LegacyTemplateDetailPage() {
  redirect('/browse-templates');
}
