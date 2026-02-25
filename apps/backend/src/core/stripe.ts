import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Plan type to Stripe Product ID mapping (validated at load; all values are string at runtime)
const _planProductIds = {
  AI_PRO: process.env.STRIPE_PRODUCT_ID_AI_PRO,
  CORE: process.env.STRIPE_PRODUCT_ID_CORE,
  LIFETIME: process.env.STRIPE_PRODUCT_ID_LIFETIME,
};

Object.entries(_planProductIds).forEach(([plan, productId]) => {
  if (!productId) {
    throw new Error(
      `STRIPE_PRODUCT_ID_${plan} is not set in environment variables`,
    );
  }
});

export const PLAN_PRODUCT_IDS: {
  AI_PRO: string;
  CORE: string;
  LIFETIME: string;
} = _planProductIds as { AI_PRO: string; CORE: string; LIFETIME: string };
