import { Request, Response, NextFunction } from "express";

/**
 * Wrapper for async route handlers
 * Automatically catches errors and passes them to Express error handler
 * Based on express-async-handler pattern
 *
 * Usage:
 *   clientsRoutes.get('/', asyncHandler(listClients));
 *
 * Instead of:
 *   clientsRoutes.get('/', async (req, res, next) => {
 *     try {
 *       await listClients(req, res);
 *     } catch (error) {
 *       next(error);
 *     }
 *   });
 */
function asyncHandler<
  T extends (req: any, res: Response, next: NextFunction) => Promise<any>
>(fn: T): T {
  return function asyncUtilWrap(
    req: Parameters<T>[0],
    res: Parameters<T>[1],
    next: Parameters<T>[2]
  ) {
    const fnReturn = fn(req, res, next);
    return Promise.resolve(fnReturn).catch(next);
  } as T;
}

export default asyncHandler;
