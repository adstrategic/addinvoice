import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
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
export declare const DbNull: import("@prisma/client/runtime/client").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client/runtime/client").AnyNullClass;
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
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map