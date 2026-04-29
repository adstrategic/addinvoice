import { requireAuth } from "@clerk/express";
import { Router } from "express";

import { verifyWorkspaceAccess } from "../core/auth.js";
import { requireBusiness } from "../core/business-required.js";
import { requireSubscription } from "../core/subscription-guard.js";
import { advancesRoutes } from "../features/advances/advances.routes.js";
import { businessesRoutes } from "../features/businesses/businesses.routes.js";
import { catalogRoutes } from "../features/catalog/catalog.routes.js";
import { clientsRoutes } from "../features/clients/clients.routes.js";
import { dashboardRoutes } from "../features/dashboard/dashboard.routes.js";
import { estimatesRoutes } from "../features/estimates/estimates.routes.js";
import { expensesRoutes } from "../features/expenses/expenses.routes.js";
import { invoicesRoutes } from "../features/invoices/invoices.routes.js";
import { merchantsRoutes } from "../features/merchants/merchants.routes.js";
import { paymentsRoutes } from "../features/payments/payments.routes.js";
import { subscriptionsRoutes } from "../features/subscriptions/subscriptions.routes.js";
import { workCategoriesRoutes } from "../features/work-categories/work-categories.routes.js";
import { workspaceRoutes } from "../features/workspace/workspace.routes.js";
import { livekitRouter } from "./livekit.routes.js";

export const apiRouter: Router = Router();

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
    next();
    return;
  }
  return requireSubscription(req, res, next);
});

// Apply business requirement to all routes EXCEPT businesses and subscription routes
// This allows users to create their first business and access the setup flow
apiRouter.use((req, res, next) => {
  // Skip business check for /businesses, /workspace, and /subscription routes
  if (
    req.path.startsWith("/businesses") ||
    req.path.startsWith("/workspace") ||
    req.path.startsWith("/subscription")
  ) {
    next();
    return;
  }

  // For all other routes, require at least one business to exist
  return requireBusiness(req, res, next);
});

// Feature routes
apiRouter.use("/clients", clientsRoutes);
apiRouter.use("/advances", advancesRoutes);
apiRouter.use("/invoices", invoicesRoutes);
apiRouter.use("/estimates", estimatesRoutes);
apiRouter.use("/businesses", businessesRoutes);
apiRouter.use("/catalog", catalogRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/expenses", expensesRoutes);
apiRouter.use("/merchants", merchantsRoutes);
apiRouter.use("/work-categories", workCategoriesRoutes);
apiRouter.use("/payments", paymentsRoutes);
apiRouter.use("/workspace", workspaceRoutes);
apiRouter.use("/livekit", livekitRouter);

// Placeholder route
apiRouter.get("/", (req, res) => {
  res.json({ message: "API v1 is running" });
});
