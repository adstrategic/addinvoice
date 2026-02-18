export declare const InvoiceStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly VIEWED: "VIEWED";
    readonly PAID: "PAID";
    readonly OVERDUE: "OVERDUE";
};
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
export declare const TaxMode: {
    readonly BY_PRODUCT: "BY_PRODUCT";
    readonly BY_TOTAL: "BY_TOTAL";
    readonly NONE: "NONE";
};
export type TaxMode = (typeof TaxMode)[keyof typeof TaxMode];
export declare const QuantityUnit: {
    readonly DAYS: "DAYS";
    readonly HOURS: "HOURS";
    readonly UNITS: "UNITS";
};
export type QuantityUnit = (typeof QuantityUnit)[keyof typeof QuantityUnit];
export declare const DiscountType: {
    readonly PERCENTAGE: "PERCENTAGE";
    readonly FIXED: "FIXED";
    readonly NONE: "NONE";
};
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
export declare const PaymentMethodType: {
    readonly PAYPAL: "PAYPAL";
    readonly VENMO: "VENMO";
    readonly ZELLE: "ZELLE";
};
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];
export declare const EstimateStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly EXPIRED: "EXPIRED";
};
export type EstimateStatus = (typeof EstimateStatus)[keyof typeof EstimateStatus];
export declare const SubscriptionPlan: {
    readonly CORE: "CORE";
    readonly AI_PRO: "AI_PRO";
    readonly LIFETIME: "LIFETIME";
};
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
export declare const SubscriptionStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly CANCELED: "CANCELED";
    readonly PAST_DUE: "PAST_DUE";
    readonly UNPAID: "UNPAID";
    readonly INCOMPLETE: "INCOMPLETE";
    readonly INCOMPLETE_EXPIRED: "INCOMPLETE_EXPIRED";
    readonly TRIALING: "TRIALING";
};
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
//# sourceMappingURL=enums.d.ts.map