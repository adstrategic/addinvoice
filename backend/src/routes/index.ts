import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { verifyWorkspaceAccess } from "../core/auth";
import { requireBusiness } from "../core/business-required";
import { requireSubscription } from "../core/subscription-guard";
import { clientsRoutes } from "../features/clients/clients.routes";
import { invoicesRoutes } from "../features/invoices/invoices.routes";
import { businessesRoutes } from "../features/businesses/businesses.routes";
import { catalogRoutes } from "../features/catalog/catalog.routes";
import { dashboardRoutes } from "../features/dashboard/dashboard.routes";
import { subscriptionsRoutes } from "../features/subscriptions/subscriptions.routes";
import { livekitRouter } from "./livekit.routes";

export const apiRouter = Router();

// Apply authentication to all routes using Clerk's requireAuth
// This ensures all routes are protected and have userId available
// Note: Webhook routes are registered in server.ts and bypass this router
apiRouter.use(requireAuth());
apiRouter.use(verifyWorkspaceAccess);

// Subscription routes - NO subscription guard (users need to subscribe)
apiRouter.use("/subscription", subscriptionsRoutes);

// Apply subscription guard to all routes EXCEPT subscription routes
// This allows read-only access without subscription
apiRouter.use((req, res, next) => {
  if (req.path.startsWith("/subscription")) {
    return next();
  }
  return requireSubscription(req, res, next);
});

// Apply business requirement to all routes EXCEPT businesses and subscription routes
// This allows users to create their first business and access the setup flow
apiRouter.use((req, res, next) => {
  // Skip business check for /businesses and /subscription routes
  if (
    req.path.startsWith("/businesses") ||
    req.path.startsWith("/subscription")
  ) {
    return next();
  }

  // For all other routes, require at least one business to exist
  return requireBusiness(req, res, next);
});

// Feature routes
apiRouter.use("/clients", clientsRoutes);
apiRouter.use("/invoices", invoicesRoutes);
apiRouter.use("/businesses", businessesRoutes);
apiRouter.use("/catalog", catalogRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/livekit", livekitRouter);
// TODO: Add other feature routes
// apiRouter.use("/estimates", estimatesRoutes);

// Placeholder route
apiRouter.get("/", (req, res) => {
  res.json({ message: "API v1 is running" });
});
