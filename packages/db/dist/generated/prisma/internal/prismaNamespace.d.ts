import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models";
import { type PrismaClient } from "./class";
export type * from '../models';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
/**
 * Prisma Errors
 */
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
/**
 * Re-export of sql-template-tag
 */
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
/**
 * Decimal.js
 */
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
/**
* Extensions
*/
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
/**
 * Prisma Client JS version: 7.4.0
 * Query Engine version: ab56fe763f921d033a6c195e7ddeb3e255bdbb57
 */
export declare const prismaVersion: PrismaVersion;
/**
 * Utility Types
 */
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: runtime.DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: runtime.JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: runtime.AnyNullClass;
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
/**
 * From T, pick a set of properties whose keys are in the union K
 */
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
/**
 * Subset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
 */
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
/**
 * SelectSubset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
 * Additionally, it validates, if both select and include are present. If the case, it errors.
 */
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
/**
 * Subset + Intersection
 * @desc From `T` pick properties that exist in `U` and intersect `K`
 */
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
/**
 * XOR is needed to have a real mutually exclusive union type
 * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
 */
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
/**
 * Is T a Record?
 */
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
/**
 * If it's T[], return T
 */
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
/**
 * From ts-toolbelt
 */
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
/** Helper Types for "Merge" **/
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
/** End Helper Types for "Merge" **/
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
/**
 * Convert tuple to union
 */
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
/**
 * Like `Pick`, but additionally can also accept an array of keys
 */
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
/**
 * Exclude all keys with underscores
 */
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
export declare const ModelName: {
    readonly Workspace: "Workspace";
    readonly Client: "Client";
    readonly Catalog: "Catalog";
    readonly WorkspacePaymentMethod: "WorkspacePaymentMethod";
    readonly Invoice: "Invoice";
    readonly InvoiceItem: "InvoiceItem";
    readonly Payment: "Payment";
    readonly Estimate: "Estimate";
    readonly EstimateItem: "EstimateItem";
    readonly Business: "Business";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "workspace" | "client" | "catalog" | "workspacePaymentMethod" | "invoice" | "invoiceItem" | "payment" | "estimate" | "estimateItem" | "business";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        Workspace: {
            payload: Prisma.$WorkspacePayload<ExtArgs>;
            fields: Prisma.WorkspaceFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WorkspaceFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WorkspaceFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>;
                };
                findFirst: {
                    args: Prisma.WorkspaceFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WorkspaceFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>;
                };
                findMany: {
                    args: Prisma.WorkspaceFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>[];
                };
                create: {
                    args: Prisma.WorkspaceCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>;
                };
                createMany: {
                    args: Prisma.WorkspaceCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WorkspaceCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>[];
                };
                delete: {
                    args: Prisma.WorkspaceDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>;
                };
                update: {
                    args: Prisma.WorkspaceUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>;
                };
                deleteMany: {
                    args: Prisma.WorkspaceDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WorkspaceUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WorkspaceUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>[];
                };
                upsert: {
                    args: Prisma.WorkspaceUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePayload>;
                };
                aggregate: {
                    args: Prisma.WorkspaceAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWorkspace>;
                };
                groupBy: {
                    args: Prisma.WorkspaceGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkspaceGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WorkspaceCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkspaceCountAggregateOutputType> | number;
                };
            };
        };
        Client: {
            payload: Prisma.$ClientPayload<ExtArgs>;
            fields: Prisma.ClientFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ClientFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ClientFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>;
                };
                findFirst: {
                    args: Prisma.ClientFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ClientFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>;
                };
                findMany: {
                    args: Prisma.ClientFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>[];
                };
                create: {
                    args: Prisma.ClientCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>;
                };
                createMany: {
                    args: Prisma.ClientCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ClientCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>[];
                };
                delete: {
                    args: Prisma.ClientDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>;
                };
                update: {
                    args: Prisma.ClientUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>;
                };
                deleteMany: {
                    args: Prisma.ClientDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ClientUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ClientUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>[];
                };
                upsert: {
                    args: Prisma.ClientUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ClientPayload>;
                };
                aggregate: {
                    args: Prisma.ClientAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateClient>;
                };
                groupBy: {
                    args: Prisma.ClientGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ClientGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ClientCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ClientCountAggregateOutputType> | number;
                };
            };
        };
        Catalog: {
            payload: Prisma.$CatalogPayload<ExtArgs>;
            fields: Prisma.CatalogFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.CatalogFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.CatalogFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>;
                };
                findFirst: {
                    args: Prisma.CatalogFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.CatalogFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>;
                };
                findMany: {
                    args: Prisma.CatalogFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>[];
                };
                create: {
                    args: Prisma.CatalogCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>;
                };
                createMany: {
                    args: Prisma.CatalogCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.CatalogCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>[];
                };
                delete: {
                    args: Prisma.CatalogDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>;
                };
                update: {
                    args: Prisma.CatalogUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>;
                };
                deleteMany: {
                    args: Prisma.CatalogDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.CatalogUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.CatalogUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>[];
                };
                upsert: {
                    args: Prisma.CatalogUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CatalogPayload>;
                };
                aggregate: {
                    args: Prisma.CatalogAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateCatalog>;
                };
                groupBy: {
                    args: Prisma.CatalogGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CatalogGroupByOutputType>[];
                };
                count: {
                    args: Prisma.CatalogCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CatalogCountAggregateOutputType> | number;
                };
            };
        };
        WorkspacePaymentMethod: {
            payload: Prisma.$WorkspacePaymentMethodPayload<ExtArgs>;
            fields: Prisma.WorkspacePaymentMethodFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WorkspacePaymentMethodFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WorkspacePaymentMethodFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>;
                };
                findFirst: {
                    args: Prisma.WorkspacePaymentMethodFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WorkspacePaymentMethodFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>;
                };
                findMany: {
                    args: Prisma.WorkspacePaymentMethodFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>[];
                };
                create: {
                    args: Prisma.WorkspacePaymentMethodCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>;
                };
                createMany: {
                    args: Prisma.WorkspacePaymentMethodCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WorkspacePaymentMethodCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>[];
                };
                delete: {
                    args: Prisma.WorkspacePaymentMethodDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>;
                };
                update: {
                    args: Prisma.WorkspacePaymentMethodUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>;
                };
                deleteMany: {
                    args: Prisma.WorkspacePaymentMethodDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WorkspacePaymentMethodUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WorkspacePaymentMethodUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>[];
                };
                upsert: {
                    args: Prisma.WorkspacePaymentMethodUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkspacePaymentMethodPayload>;
                };
                aggregate: {
                    args: Prisma.WorkspacePaymentMethodAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWorkspacePaymentMethod>;
                };
                groupBy: {
                    args: Prisma.WorkspacePaymentMethodGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkspacePaymentMethodGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WorkspacePaymentMethodCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkspacePaymentMethodCountAggregateOutputType> | number;
                };
            };
        };
        Invoice: {
            payload: Prisma.$InvoicePayload<ExtArgs>;
            fields: Prisma.InvoiceFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.InvoiceFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.InvoiceFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>;
                };
                findFirst: {
                    args: Prisma.InvoiceFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.InvoiceFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>;
                };
                findMany: {
                    args: Prisma.InvoiceFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>[];
                };
                create: {
                    args: Prisma.InvoiceCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>;
                };
                createMany: {
                    args: Prisma.InvoiceCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.InvoiceCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>[];
                };
                delete: {
                    args: Prisma.InvoiceDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>;
                };
                update: {
                    args: Prisma.InvoiceUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>;
                };
                deleteMany: {
                    args: Prisma.InvoiceDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.InvoiceUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.InvoiceUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>[];
                };
                upsert: {
                    args: Prisma.InvoiceUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoicePayload>;
                };
                aggregate: {
                    args: Prisma.InvoiceAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateInvoice>;
                };
                groupBy: {
                    args: Prisma.InvoiceGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.InvoiceGroupByOutputType>[];
                };
                count: {
                    args: Prisma.InvoiceCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.InvoiceCountAggregateOutputType> | number;
                };
            };
        };
        InvoiceItem: {
            payload: Prisma.$InvoiceItemPayload<ExtArgs>;
            fields: Prisma.InvoiceItemFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.InvoiceItemFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.InvoiceItemFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>;
                };
                findFirst: {
                    args: Prisma.InvoiceItemFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.InvoiceItemFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>;
                };
                findMany: {
                    args: Prisma.InvoiceItemFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>[];
                };
                create: {
                    args: Prisma.InvoiceItemCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>;
                };
                createMany: {
                    args: Prisma.InvoiceItemCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.InvoiceItemCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>[];
                };
                delete: {
                    args: Prisma.InvoiceItemDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>;
                };
                update: {
                    args: Prisma.InvoiceItemUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>;
                };
                deleteMany: {
                    args: Prisma.InvoiceItemDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.InvoiceItemUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.InvoiceItemUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>[];
                };
                upsert: {
                    args: Prisma.InvoiceItemUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$InvoiceItemPayload>;
                };
                aggregate: {
                    args: Prisma.InvoiceItemAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateInvoiceItem>;
                };
                groupBy: {
                    args: Prisma.InvoiceItemGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.InvoiceItemGroupByOutputType>[];
                };
                count: {
                    args: Prisma.InvoiceItemCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.InvoiceItemCountAggregateOutputType> | number;
                };
            };
        };
        Payment: {
            payload: Prisma.$PaymentPayload<ExtArgs>;
            fields: Prisma.PaymentFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PaymentFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PaymentFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>;
                };
                findFirst: {
                    args: Prisma.PaymentFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PaymentFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>;
                };
                findMany: {
                    args: Prisma.PaymentFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>[];
                };
                create: {
                    args: Prisma.PaymentCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>;
                };
                createMany: {
                    args: Prisma.PaymentCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PaymentCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>[];
                };
                delete: {
                    args: Prisma.PaymentDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>;
                };
                update: {
                    args: Prisma.PaymentUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>;
                };
                deleteMany: {
                    args: Prisma.PaymentDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PaymentUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PaymentUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>[];
                };
                upsert: {
                    args: Prisma.PaymentUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentPayload>;
                };
                aggregate: {
                    args: Prisma.PaymentAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePayment>;
                };
                groupBy: {
                    args: Prisma.PaymentGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PaymentGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PaymentCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PaymentCountAggregateOutputType> | number;
                };
            };
        };
        Estimate: {
            payload: Prisma.$EstimatePayload<ExtArgs>;
            fields: Prisma.EstimateFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.EstimateFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.EstimateFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>;
                };
                findFirst: {
                    args: Prisma.EstimateFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.EstimateFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>;
                };
                findMany: {
                    args: Prisma.EstimateFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>[];
                };
                create: {
                    args: Prisma.EstimateCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>;
                };
                createMany: {
                    args: Prisma.EstimateCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.EstimateCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>[];
                };
                delete: {
                    args: Prisma.EstimateDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>;
                };
                update: {
                    args: Prisma.EstimateUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>;
                };
                deleteMany: {
                    args: Prisma.EstimateDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.EstimateUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.EstimateUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>[];
                };
                upsert: {
                    args: Prisma.EstimateUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimatePayload>;
                };
                aggregate: {
                    args: Prisma.EstimateAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateEstimate>;
                };
                groupBy: {
                    args: Prisma.EstimateGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EstimateGroupByOutputType>[];
                };
                count: {
                    args: Prisma.EstimateCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EstimateCountAggregateOutputType> | number;
                };
            };
        };
        EstimateItem: {
            payload: Prisma.$EstimateItemPayload<ExtArgs>;
            fields: Prisma.EstimateItemFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.EstimateItemFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.EstimateItemFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>;
                };
                findFirst: {
                    args: Prisma.EstimateItemFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.EstimateItemFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>;
                };
                findMany: {
                    args: Prisma.EstimateItemFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>[];
                };
                create: {
                    args: Prisma.EstimateItemCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>;
                };
                createMany: {
                    args: Prisma.EstimateItemCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.EstimateItemCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>[];
                };
                delete: {
                    args: Prisma.EstimateItemDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>;
                };
                update: {
                    args: Prisma.EstimateItemUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>;
                };
                deleteMany: {
                    args: Prisma.EstimateItemDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.EstimateItemUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.EstimateItemUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>[];
                };
                upsert: {
                    args: Prisma.EstimateItemUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EstimateItemPayload>;
                };
                aggregate: {
                    args: Prisma.EstimateItemAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateEstimateItem>;
                };
                groupBy: {
                    args: Prisma.EstimateItemGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EstimateItemGroupByOutputType>[];
                };
                count: {
                    args: Prisma.EstimateItemCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EstimateItemCountAggregateOutputType> | number;
                };
            };
        };
        Business: {
            payload: Prisma.$BusinessPayload<ExtArgs>;
            fields: Prisma.BusinessFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.BusinessFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.BusinessFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>;
                };
                findFirst: {
                    args: Prisma.BusinessFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.BusinessFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>;
                };
                findMany: {
                    args: Prisma.BusinessFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>[];
                };
                create: {
                    args: Prisma.BusinessCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>;
                };
                createMany: {
                    args: Prisma.BusinessCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.BusinessCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>[];
                };
                delete: {
                    args: Prisma.BusinessDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>;
                };
                update: {
                    args: Prisma.BusinessUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>;
                };
                deleteMany: {
                    args: Prisma.BusinessDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.BusinessUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.BusinessUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>[];
                };
                upsert: {
                    args: Prisma.BusinessUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BusinessPayload>;
                };
                aggregate: {
                    args: Prisma.BusinessAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateBusiness>;
                };
                groupBy: {
                    args: Prisma.BusinessGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.BusinessGroupByOutputType>[];
                };
                count: {
                    args: Prisma.BusinessCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.BusinessCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
/**
 * Enums
 */
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const WorkspaceScalarFieldEnum: {
    readonly id: "id";
    readonly clerkId: "clerkId";
    readonly name: "name";
    readonly companyName: "companyName";
    readonly companyAddress: "companyAddress";
    readonly companyPhone: "companyPhone";
    readonly companyEmail: "companyEmail";
    readonly companyTaxId: "companyTaxId";
    readonly companyLogo: "companyLogo";
    readonly invoiceNumberPrefix: "invoiceNumberPrefix";
    readonly defaultCurrency: "defaultCurrency";
    readonly defaultPaymentTerms: "defaultPaymentTerms";
    readonly defaultTaxRate: "defaultTaxRate";
    readonly invoiceFooterText: "invoiceFooterText";
    readonly invoiceColor: "invoiceColor";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly stripeCustomerId: "stripeCustomerId";
    readonly stripeSubscriptionId: "stripeSubscriptionId";
    readonly subscriptionPlan: "subscriptionPlan";
    readonly subscriptionStatus: "subscriptionStatus";
    readonly subscriptionEndsAt: "subscriptionEndsAt";
    readonly lastStripeSync: "lastStripeSync";
};
export type WorkspaceScalarFieldEnum = (typeof WorkspaceScalarFieldEnum)[keyof typeof WorkspaceScalarFieldEnum];
export declare const ClientScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly name: "name";
    readonly email: "email";
    readonly phone: "phone";
    readonly address: "address";
    readonly nit: "nit";
    readonly businessName: "businessName";
    readonly sequence: "sequence";
    readonly reminderBeforeDueIntervalDays: "reminderBeforeDueIntervalDays";
    readonly reminderAfterDueIntervalDays: "reminderAfterDueIntervalDays";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ClientScalarFieldEnum = (typeof ClientScalarFieldEnum)[keyof typeof ClientScalarFieldEnum];
export declare const CatalogScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly businessId: "businessId";
    readonly name: "name";
    readonly description: "description";
    readonly price: "price";
    readonly quantityUnit: "quantityUnit";
    readonly sequence: "sequence";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type CatalogScalarFieldEnum = (typeof CatalogScalarFieldEnum)[keyof typeof CatalogScalarFieldEnum];
export declare const WorkspacePaymentMethodScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly type: "type";
    readonly handle: "handle";
    readonly isEnabled: "isEnabled";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type WorkspacePaymentMethodScalarFieldEnum = (typeof WorkspacePaymentMethodScalarFieldEnum)[keyof typeof WorkspacePaymentMethodScalarFieldEnum];
export declare const InvoiceScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly clientId: "clientId";
    readonly businessId: "businessId";
    readonly clientEmail: "clientEmail";
    readonly clientPhone: "clientPhone";
    readonly clientAddress: "clientAddress";
    readonly sequence: "sequence";
    readonly invoiceNumber: "invoiceNumber";
    readonly status: "status";
    readonly issueDate: "issueDate";
    readonly dueDate: "dueDate";
    readonly purchaseOrder: "purchaseOrder";
    readonly customHeader: "customHeader";
    readonly currency: "currency";
    readonly subtotal: "subtotal";
    readonly totalTax: "totalTax";
    readonly discount: "discount";
    readonly discountType: "discountType";
    readonly taxMode: "taxMode";
    readonly taxName: "taxName";
    readonly taxPercentage: "taxPercentage";
    readonly total: "total";
    readonly balance: "balance";
    readonly notes: "notes";
    readonly terms: "terms";
    readonly paymentLink: "paymentLink";
    readonly paymentProvider: "paymentProvider";
    readonly sentAt: "sentAt";
    readonly viewedAt: "viewedAt";
    readonly paidAt: "paidAt";
    readonly lastReminderSentAt: "lastReminderSentAt";
    readonly selectedPaymentMethodId: "selectedPaymentMethodId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type InvoiceScalarFieldEnum = (typeof InvoiceScalarFieldEnum)[keyof typeof InvoiceScalarFieldEnum];
export declare const InvoiceItemScalarFieldEnum: {
    readonly id: "id";
    readonly invoiceId: "invoiceId";
    readonly name: "name";
    readonly description: "description";
    readonly quantity: "quantity";
    readonly quantityUnit: "quantityUnit";
    readonly unitPrice: "unitPrice";
    readonly discount: "discount";
    readonly discountType: "discountType";
    readonly tax: "tax";
    readonly vatEnabled: "vatEnabled";
    readonly total: "total";
    readonly catalogId: "catalogId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type InvoiceItemScalarFieldEnum = (typeof InvoiceItemScalarFieldEnum)[keyof typeof InvoiceItemScalarFieldEnum];
export declare const PaymentScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly invoiceId: "invoiceId";
    readonly amount: "amount";
    readonly paymentMethod: "paymentMethod";
    readonly transactionId: "transactionId";
    readonly details: "details";
    readonly paidAt: "paidAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum];
export declare const EstimateScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly businessId: "businessId";
    readonly clientId: "clientId";
    readonly estimateNumber: "estimateNumber";
    readonly status: "status";
    readonly issueDate: "issueDate";
    readonly expirationDate: "expirationDate";
    readonly currency: "currency";
    readonly subtotal: "subtotal";
    readonly totalTax: "totalTax";
    readonly discount: "discount";
    readonly discountType: "discountType";
    readonly total: "total";
    readonly notes: "notes";
    readonly terms: "terms";
    readonly sentAt: "sentAt";
    readonly acceptedAt: "acceptedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type EstimateScalarFieldEnum = (typeof EstimateScalarFieldEnum)[keyof typeof EstimateScalarFieldEnum];
export declare const EstimateItemScalarFieldEnum: {
    readonly id: "id";
    readonly estimateId: "estimateId";
    readonly description: "description";
    readonly quantity: "quantity";
    readonly unitPrice: "unitPrice";
    readonly tax: "tax";
    readonly total: "total";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type EstimateItemScalarFieldEnum = (typeof EstimateItemScalarFieldEnum)[keyof typeof EstimateItemScalarFieldEnum];
export declare const BusinessScalarFieldEnum: {
    readonly id: "id";
    readonly workspaceId: "workspaceId";
    readonly name: "name";
    readonly nit: "nit";
    readonly address: "address";
    readonly email: "email";
    readonly phone: "phone";
    readonly logo: "logo";
    readonly isDefault: "isDefault";
    readonly sequence: "sequence";
    readonly defaultTaxMode: "defaultTaxMode";
    readonly defaultTaxName: "defaultTaxName";
    readonly defaultTaxPercentage: "defaultTaxPercentage";
    readonly defaultNotes: "defaultNotes";
    readonly defaultTerms: "defaultTerms";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type BusinessScalarFieldEnum = (typeof BusinessScalarFieldEnum)[keyof typeof BusinessScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
/**
 * Field references
 */
/**
 * Reference to a field of type 'Int'
 */
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
/**
 * Reference to a field of type 'Int[]'
 */
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
/**
 * Reference to a field of type 'String'
 */
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
/**
 * Reference to a field of type 'String[]'
 */
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
/**
 * Reference to a field of type 'Decimal'
 */
export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>;
/**
 * Reference to a field of type 'Decimal[]'
 */
export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>;
/**
 * Reference to a field of type 'DateTime'
 */
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
/**
 * Reference to a field of type 'DateTime[]'
 */
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
/**
 * Reference to a field of type 'SubscriptionPlan'
 */
export type EnumSubscriptionPlanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionPlan'>;
/**
 * Reference to a field of type 'SubscriptionPlan[]'
 */
export type ListEnumSubscriptionPlanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionPlan[]'>;
/**
 * Reference to a field of type 'SubscriptionStatus'
 */
export type EnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus'>;
/**
 * Reference to a field of type 'SubscriptionStatus[]'
 */
export type ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus[]'>;
/**
 * Reference to a field of type 'QuantityUnit'
 */
export type EnumQuantityUnitFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuantityUnit'>;
/**
 * Reference to a field of type 'QuantityUnit[]'
 */
export type ListEnumQuantityUnitFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuantityUnit[]'>;
/**
 * Reference to a field of type 'PaymentMethodType'
 */
export type EnumPaymentMethodTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentMethodType'>;
/**
 * Reference to a field of type 'PaymentMethodType[]'
 */
export type ListEnumPaymentMethodTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentMethodType[]'>;
/**
 * Reference to a field of type 'Boolean'
 */
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
/**
 * Reference to a field of type 'InvoiceStatus'
 */
export type EnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus'>;
/**
 * Reference to a field of type 'InvoiceStatus[]'
 */
export type ListEnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus[]'>;
/**
 * Reference to a field of type 'DiscountType'
 */
export type EnumDiscountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DiscountType'>;
/**
 * Reference to a field of type 'DiscountType[]'
 */
export type ListEnumDiscountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DiscountType[]'>;
/**
 * Reference to a field of type 'TaxMode'
 */
export type EnumTaxModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TaxMode'>;
/**
 * Reference to a field of type 'TaxMode[]'
 */
export type ListEnumTaxModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TaxMode[]'>;
/**
 * Reference to a field of type 'EstimateStatus'
 */
export type EnumEstimateStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EstimateStatus'>;
/**
 * Reference to a field of type 'EstimateStatus[]'
 */
export type ListEnumEstimateStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EstimateStatus[]'>;
/**
 * Reference to a field of type 'Float'
 */
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
/**
 * Reference to a field of type 'Float[]'
 */
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
/**
 * Batch Payload for updateMany & deleteMany & createMany
 */
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export type PrismaClientOptions = ({
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-pg`.
     */
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
} | {
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl: string;
    adapter?: never;
}) & {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: GlobalOmitConfig;
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[];
};
export type GlobalOmitConfig = {
    workspace?: Prisma.WorkspaceOmit;
    client?: Prisma.ClientOmit;
    catalog?: Prisma.CatalogOmit;
    workspacePaymentMethod?: Prisma.WorkspacePaymentMethodOmit;
    invoice?: Prisma.InvoiceOmit;
    invoiceItem?: Prisma.InvoiceItemOmit;
    payment?: Prisma.PaymentOmit;
    estimate?: Prisma.EstimateOmit;
    estimateItem?: Prisma.EstimateItemOmit;
    business?: Prisma.BusinessOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
/**
 * `PrismaClient` proxy available in interactive transactions.
 */
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
//# sourceMappingURL=prismaNamespace.d.ts.map