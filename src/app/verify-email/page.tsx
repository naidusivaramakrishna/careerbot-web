import { redirect } from 'next/navigation';

/**
 * Landing for the old link-style verification emails (/verify-email?token=...).
 * careerbot-api now verifies by 6-digit code only, so those tokens can no
 * longer be redeemed, but emails already sent still carry the link. Send the
 * user to sign-in: an unverified account is taken to the code step from there
 * (sign-in 403 EMAIL_NOT_VERIFIED -> OTP input with "Resend" available), and a
 * verified one simply signs in. The token is dropped rather than forwarded.
 * Temporary (307) so the route can be retired without cached redirects.
 * Must stay in middleware publicRoutes.
 */
export default function LegacyVerifyEmailPage() {
  redirect('/?showLogin=true');
}
