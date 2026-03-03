import {
  createWorkCategorySchema,
  listWorkCategoriesSchema,
} from "@addinvoice/schemas";
import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createWorkCategory,
  listWorkCategories,
} from "./work-categories.controller.js";

/**
 * Work categories routes (standalone, reusable across modules)
 */
export const workCategoriesRoutes: Router = Router();

workCategoriesRoutes.get(
  "/",
  processRequest({ query: listWorkCategoriesSchema }),
  asyncHandler(listWorkCategories),
);

workCategoriesRoutes.post(
  "/",
  processRequest({ body: createWorkCategorySchema }),
  asyncHandler(createWorkCategory),
);
