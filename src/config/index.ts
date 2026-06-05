export { COMPANY_CONFIG } from "./company";
export { ROUTES } from "./routes";

export const UI_CONFIG = {
  paymentSuccessRedirectDelay: 3000,
} as const;

export const PAYMENT_MESSAGES = {
  paymentSuccess: "Payment successful. Your subscription is being activated.",
  subscriptionLoadError: "Unable to load your subscription. Please try again.",
  cancellationSuccess: "Subscription cancelled successfully.",
  cancellationError: "Unable to cancel your subscription. Please try again.",
} as const;
