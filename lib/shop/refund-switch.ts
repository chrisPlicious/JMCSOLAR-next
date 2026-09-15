/**
 * OPERATIONAL kill switch — provider-initiated storefront ORDER refunds only.
 *
 * Owner: engineering. This is NOT a release flag; it is permanent infrastructure
 * and should be excluded from any stale-flag sweep.
 *
 * Currently OFF because the live payment method is QRPh, which PayMongo cannot
 * refund. Flip to `true` + deploy once a refundable method (card / GCash / Maya)
 * is active on the account.
 *
 * Scope — what this does and does NOT gate:
 *   - GATES `refundOrderAction` (admin → PayMongo /refunds). That call cannot
 *     succeed under QRPh, so it is blocked at the server action.
 *   - Does NOT gate the orders webhook refund branch. PayMongo never emits a
 *     refund event for an unrefundable method, and if a refund IS ever issued
 *     by hand from the PayMongo dashboard, that branch is the only thing that
 *     restores stock and reconciles the order. Gating it would strand real money
 *     movement with no record in the app.
 *   - Does NOT gate `recordManualRefundAction`. Settling a QRPh refund out of
 *     band (bank transfer / cash) is exactly what admins must still be able to
 *     record while this switch is off.
 *   - Does NOT affect booking refunds (`app/admin/bookings/actions.ts`) — that
 *     is a separate audited flow.
 *
 * The `: boolean` annotation is load-bearing. Without it TypeScript infers the
 * literal type and narrows the unused branch to `never`, so flipping the value
 * turns the opposite branch into a typecheck error.
 */
export const ORDER_REFUNDS_ENABLED: boolean = false;

/** Shown to the admin when a provider refund is attempted while the switch is off. */
export const ORDER_REFUNDS_DISABLED_MESSAGE =
  'Automatic refunds are disabled — the active payment method (QRPh) cannot be refunded through PayMongo. Settle the refund manually, then record it on this order.';

/**
 * Single read point for the switch. Call sites import THIS, never the raw const,
 * so grepping one symbol gives the full blast radius.
 */
export function orderRefundsEnabled(): boolean {
  return ORDER_REFUNDS_ENABLED;
}
