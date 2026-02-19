import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Plan type to Stripe Product ID mapping
// We'll fetch the default price from each product
export const PLAN_PRODUCT_IDS = {
  CORE: process.env.STRIPE_PRODUCT_ID_CORE!,
  AI_PRO: process.env.STRIPE_PRODUCT_ID_AI_PRO!,
  LIFETIME: process.env.STRIPE_PRODUCT_ID_LIFETIME!,
} as const;

// Validate that all product IDs are set
Object.entries(PLAN_PRODUCT_IDS).forEach(([plan, productId]) => {
  if (!productId) {
    throw new Error(
      `STRIPE_PRODUCT_ID_${plan} is not set in environment variables`,
    );
  }
});

/**
 * Get the default price ID for a product
 * Uses the default price if set, otherwise the first active price
 */
export async function getProductPriceId(productId: string): Promise<string> {
  const product = await stripe.products.retrieve(productId, {
    expand: ["default_price"],
  });

  // If product has a default price, use it
  if (product.default_price) {
    // If it's already expanded (object), use it directly
    if (typeof product.default_price !== "string") {
      return product.default_price.id;
    }
    // If it's just an ID (string), return it
    return product.default_price;
  }

  // Otherwise, fetch all prices and use the first active one
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 1,
  });

  if (prices.data.length === 0) {
    throw new Error(`No active prices found for product ${productId}`);
  }

  return prices.data[0].id;
}

export type BillingInterval = "month" | "year";

/**
 * Get the price ID for a product with the given recurring interval
 */
export async function getProductPriceByInterval(
  productId: string,
  interval: BillingInterval,
): Promise<string> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: "recurring",
  });

  const match = prices.data.find((p) => p.recurring?.interval === interval);
  if (!match) {
    throw new Error(
      `No active ${interval}ly price found for product ${productId}`,
    );
  }
  return match.id;
}
