import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { verifyWorkspaceAccess } from "../core/auth";
import { requireBusiness } from "../core/business-required";
import { clientsRoutes } from "../features/clients/clients.routes";
import { invoicesRoutes } from "../features/invoices/invoices.routes";
import { businessesRoutes } from "../features/businesses/businesses.routes";

export const apiRouter = Router();

// Apply authentication to all routes using Clerk's requireAuth
// This ensures all routes are protected and have userId available
apiRouter.use(requireAuth());
apiRouter.use(verifyWorkspaceAccess);

// Apply business requirement to all routes EXCEPT businesses routes
// This allows users to create their first business and access the setup flow
apiRouter.use((req, res, next) => {
  // Skip business check for /businesses routes
  // This allows users to:
  // - List businesses (GET /businesses)
  // - Create their first business (POST /businesses)
  // - Upload logo, set default, etc.
  if (req.path.startsWith("/businesses")) {
    return next();
  }

  // For all other routes, require at least one business to exist
  return requireBusiness(req, res, next);
});

// Feature routes
apiRouter.use("/clients", clientsRoutes);
apiRouter.use("/invoices", invoicesRoutes);
apiRouter.use("/businesses", businessesRoutes);
// TODO: Add other feature routes
// apiRouter.use("/estimates", estimatesRoutes);

// Placeholder route
apiRouter.get("/", (req, res) => {
  res.json({ message: "API v1 is running" });
});
