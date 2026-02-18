import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model WorkspacePaymentMethod
 *
 */
export type WorkspacePaymentMethodModel = runtime.Types.Result.DefaultSelection<Prisma.$WorkspacePaymentMethodPayload>;
export type AggregateWorkspacePaymentMethod = {
    _count: WorkspacePaymentMethodCountAggregateOutputType | null;
    _avg: WorkspacePaymentMethodAvgAggregateOutputType | null;
    _sum: WorkspacePaymentMethodSumAggregateOutputType | null;
    _min: WorkspacePaymentMethodMinAggregateOutputType | null;
    _max: WorkspacePaymentMethodMaxAggregateOutputType | null;
};
export type WorkspacePaymentMethodAvgAggregateOutputType = {
    id: number | null;
    workspaceId: number | null;
};
export type WorkspacePaymentMethodSumAggregateOutputType = {
    id: number | null;
    workspaceId: number | null;
};
export type WorkspacePaymentMethodMinAggregateOutputType = {
    id: number | null;
    workspaceId: number | null;
    type: $Enums.PaymentMethodType | null;
    handle: string | null;
    isEnabled: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type WorkspacePaymentMethodMaxAggregateOutputType = {
    id: number | null;
    workspaceId: number | null;
    type: $Enums.PaymentMethodType | null;
    handle: string | null;
    isEnabled: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type WorkspacePaymentMethodCountAggregateOutputType = {
    id: number;
    workspaceId: number;
    type: number;
    handle: number;
    isEnabled: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type WorkspacePaymentMethodAvgAggregateInputType = {
    id?: true;
    workspaceId?: true;
};
export type WorkspacePaymentMethodSumAggregateInputType = {
    id?: true;
    workspaceId?: true;
};
export type WorkspacePaymentMethodMinAggregateInputType = {
    id?: true;
    workspaceId?: true;
    type?: true;
    handle?: true;
    isEnabled?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type WorkspacePaymentMethodMaxAggregateInputType = {
    id?: true;
    workspaceId?: true;
    type?: true;
    handle?: true;
    isEnabled?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type WorkspacePaymentMethodCountAggregateInputType = {
    id?: true;
    workspaceId?: true;
    type?: true;
    handle?: true;
    isEnabled?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type WorkspacePaymentMethodAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which WorkspacePaymentMethod to aggregate.
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkspacePaymentMethods to fetch.
     */
    orderBy?: Prisma.WorkspacePaymentMethodOrderByWithRelationInput | Prisma.WorkspacePaymentMethodOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkspacePaymentMethods from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkspacePaymentMethods.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned WorkspacePaymentMethods
    **/
    _count?: true | WorkspacePaymentMethodCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: WorkspacePaymentMethodAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: WorkspacePaymentMethodSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: WorkspacePaymentMethodMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: WorkspacePaymentMethodMaxAggregateInputType;
};
export type GetWorkspacePaymentMethodAggregateType<T extends WorkspacePaymentMethodAggregateArgs> = {
    [P in keyof T & keyof AggregateWorkspacePaymentMethod]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWorkspacePaymentMethod[P]> : Prisma.GetScalarType<T[P], AggregateWorkspacePaymentMethod[P]>;
};
export type WorkspacePaymentMethodGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    orderBy?: Prisma.WorkspacePaymentMethodOrderByWithAggregationInput | Prisma.WorkspacePaymentMethodOrderByWithAggregationInput[];
    by: Prisma.WorkspacePaymentMethodScalarFieldEnum[] | Prisma.WorkspacePaymentMethodScalarFieldEnum;
    having?: Prisma.WorkspacePaymentMethodScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WorkspacePaymentMethodCountAggregateInputType | true;
    _avg?: WorkspacePaymentMethodAvgAggregateInputType;
    _sum?: WorkspacePaymentMethodSumAggregateInputType;
    _min?: WorkspacePaymentMethodMinAggregateInputType;
    _max?: WorkspacePaymentMethodMaxAggregateInputType;
};
export type WorkspacePaymentMethodGroupByOutputType = {
    id: number;
    workspaceId: number;
    type: $Enums.PaymentMethodType;
    handle: string | null;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: WorkspacePaymentMethodCountAggregateOutputType | null;
    _avg: WorkspacePaymentMethodAvgAggregateOutputType | null;
    _sum: WorkspacePaymentMethodSumAggregateOutputType | null;
    _min: WorkspacePaymentMethodMinAggregateOutputType | null;
    _max: WorkspacePaymentMethodMaxAggregateOutputType | null;
};
type GetWorkspacePaymentMethodGroupByPayload<T extends WorkspacePaymentMethodGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WorkspacePaymentMethodGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WorkspacePaymentMethodGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WorkspacePaymentMethodGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WorkspacePaymentMethodGroupByOutputType[P]>;
}>>;
export type WorkspacePaymentMethodWhereInput = {
    AND?: Prisma.WorkspacePaymentMethodWhereInput | Prisma.WorkspacePaymentMethodWhereInput[];
    OR?: Prisma.WorkspacePaymentMethodWhereInput[];
    NOT?: Prisma.WorkspacePaymentMethodWhereInput | Prisma.WorkspacePaymentMethodWhereInput[];
    id?: Prisma.IntFilter<"WorkspacePaymentMethod"> | number;
    workspaceId?: Prisma.IntFilter<"WorkspacePaymentMethod"> | number;
    type?: Prisma.EnumPaymentMethodTypeFilter<"WorkspacePaymentMethod"> | $Enums.PaymentMethodType;
    handle?: Prisma.StringNullableFilter<"WorkspacePaymentMethod"> | string | null;
    isEnabled?: Prisma.BoolFilter<"WorkspacePaymentMethod"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"WorkspacePaymentMethod"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WorkspacePaymentMethod"> | Date | string;
    workspace?: Prisma.XOR<Prisma.WorkspaceScalarRelationFilter, Prisma.WorkspaceWhereInput>;
    invoices?: Prisma.InvoiceListRelationFilter;
};
export type WorkspacePaymentMethodOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    handle?: Prisma.SortOrderInput | Prisma.SortOrder;
    isEnabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    workspace?: Prisma.WorkspaceOrderByWithRelationInput;
    invoices?: Prisma.InvoiceOrderByRelationAggregateInput;
};
export type WorkspacePaymentMethodWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    workspaceId_type?: Prisma.WorkspacePaymentMethodWorkspaceIdTypeCompoundUniqueInput;
    AND?: Prisma.WorkspacePaymentMethodWhereInput | Prisma.WorkspacePaymentMethodWhereInput[];
    OR?: Prisma.WorkspacePaymentMethodWhereInput[];
    NOT?: Prisma.WorkspacePaymentMethodWhereInput | Prisma.WorkspacePaymentMethodWhereInput[];
    workspaceId?: Prisma.IntFilter<"WorkspacePaymentMethod"> | number;
    type?: Prisma.EnumPaymentMethodTypeFilter<"WorkspacePaymentMethod"> | $Enums.PaymentMethodType;
    handle?: Prisma.StringNullableFilter<"WorkspacePaymentMethod"> | string | null;
    isEnabled?: Prisma.BoolFilter<"WorkspacePaymentMethod"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"WorkspacePaymentMethod"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WorkspacePaymentMethod"> | Date | string;
    workspace?: Prisma.XOR<Prisma.WorkspaceScalarRelationFilter, Prisma.WorkspaceWhereInput>;
    invoices?: Prisma.InvoiceListRelationFilter;
}, "id" | "workspaceId_type">;
export type WorkspacePaymentMethodOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    handle?: Prisma.SortOrderInput | Prisma.SortOrder;
    isEnabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.WorkspacePaymentMethodCountOrderByAggregateInput;
    _avg?: Prisma.WorkspacePaymentMethodAvgOrderByAggregateInput;
    _max?: Prisma.WorkspacePaymentMethodMaxOrderByAggregateInput;
    _min?: Prisma.WorkspacePaymentMethodMinOrderByAggregateInput;
    _sum?: Prisma.WorkspacePaymentMethodSumOrderByAggregateInput;
};
export type WorkspacePaymentMethodScalarWhereWithAggregatesInput = {
    AND?: Prisma.WorkspacePaymentMethodScalarWhereWithAggregatesInput | Prisma.WorkspacePaymentMethodScalarWhereWithAggregatesInput[];
    OR?: Prisma.WorkspacePaymentMethodScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WorkspacePaymentMethodScalarWhereWithAggregatesInput | Prisma.WorkspacePaymentMethodScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"WorkspacePaymentMethod"> | number;
    workspaceId?: Prisma.IntWithAggregatesFilter<"WorkspacePaymentMethod"> | number;
    type?: Prisma.EnumPaymentMethodTypeWithAggregatesFilter<"WorkspacePaymentMethod"> | $Enums.PaymentMethodType;
    handle?: Prisma.StringNullableWithAggregatesFilter<"WorkspacePaymentMethod"> | string | null;
    isEnabled?: Prisma.BoolWithAggregatesFilter<"WorkspacePaymentMethod"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"WorkspacePaymentMethod"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"WorkspacePaymentMethod"> | Date | string;
};
export type WorkspacePaymentMethodCreateInput = {
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    workspace: Prisma.WorkspaceCreateNestedOneWithoutPaymentMethodsInput;
    invoices?: Prisma.InvoiceCreateNestedManyWithoutSelectedPaymentMethodInput;
};
export type WorkspacePaymentMethodUncheckedCreateInput = {
    id?: number;
    workspaceId: number;
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    invoices?: Prisma.InvoiceUncheckedCreateNestedManyWithoutSelectedPaymentMethodInput;
};
export type WorkspacePaymentMethodUpdateInput = {
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    workspace?: Prisma.WorkspaceUpdateOneRequiredWithoutPaymentMethodsNestedInput;
    invoices?: Prisma.InvoiceUpdateManyWithoutSelectedPaymentMethodNestedInput;
};
export type WorkspacePaymentMethodUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workspaceId?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    invoices?: Prisma.InvoiceUncheckedUpdateManyWithoutSelectedPaymentMethodNestedInput;
};
export type WorkspacePaymentMethodCreateManyInput = {
    id?: number;
    workspaceId: number;
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WorkspacePaymentMethodUpdateManyMutationInput = {
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkspacePaymentMethodUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workspaceId?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkspacePaymentMethodListRelationFilter = {
    every?: Prisma.WorkspacePaymentMethodWhereInput;
    some?: Prisma.WorkspacePaymentMethodWhereInput;
    none?: Prisma.WorkspacePaymentMethodWhereInput;
};
export type WorkspacePaymentMethodOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type WorkspacePaymentMethodWorkspaceIdTypeCompoundUniqueInput = {
    workspaceId: number;
    type: $Enums.PaymentMethodType;
};
export type WorkspacePaymentMethodCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    handle?: Prisma.SortOrder;
    isEnabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WorkspacePaymentMethodAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
};
export type WorkspacePaymentMethodMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    handle?: Prisma.SortOrder;
    isEnabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WorkspacePaymentMethodMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    handle?: Prisma.SortOrder;
    isEnabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WorkspacePaymentMethodSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workspaceId?: Prisma.SortOrder;
};
export type WorkspacePaymentMethodNullableScalarRelationFilter = {
    is?: Prisma.WorkspacePaymentMethodWhereInput | null;
    isNot?: Prisma.WorkspacePaymentMethodWhereInput | null;
};
export type WorkspacePaymentMethodCreateNestedManyWithoutWorkspaceInput = {
    create?: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput> | Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput[] | Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput[];
    connectOrCreate?: Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput[];
    createMany?: Prisma.WorkspacePaymentMethodCreateManyWorkspaceInputEnvelope;
    connect?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
};
export type WorkspacePaymentMethodUncheckedCreateNestedManyWithoutWorkspaceInput = {
    create?: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput> | Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput[] | Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput[];
    connectOrCreate?: Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput[];
    createMany?: Prisma.WorkspacePaymentMethodCreateManyWorkspaceInputEnvelope;
    connect?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
};
export type WorkspacePaymentMethodUpdateManyWithoutWorkspaceNestedInput = {
    create?: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput> | Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput[] | Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput[];
    connectOrCreate?: Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput[];
    upsert?: Prisma.WorkspacePaymentMethodUpsertWithWhereUniqueWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodUpsertWithWhereUniqueWithoutWorkspaceInput[];
    createMany?: Prisma.WorkspacePaymentMethodCreateManyWorkspaceInputEnvelope;
    set?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    disconnect?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    delete?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    connect?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    update?: Prisma.WorkspacePaymentMethodUpdateWithWhereUniqueWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodUpdateWithWhereUniqueWithoutWorkspaceInput[];
    updateMany?: Prisma.WorkspacePaymentMethodUpdateManyWithWhereWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodUpdateManyWithWhereWithoutWorkspaceInput[];
    deleteMany?: Prisma.WorkspacePaymentMethodScalarWhereInput | Prisma.WorkspacePaymentMethodScalarWhereInput[];
};
export type WorkspacePaymentMethodUncheckedUpdateManyWithoutWorkspaceNestedInput = {
    create?: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput> | Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput[] | Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput[];
    connectOrCreate?: Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput[];
    upsert?: Prisma.WorkspacePaymentMethodUpsertWithWhereUniqueWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodUpsertWithWhereUniqueWithoutWorkspaceInput[];
    createMany?: Prisma.WorkspacePaymentMethodCreateManyWorkspaceInputEnvelope;
    set?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    disconnect?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    delete?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    connect?: Prisma.WorkspacePaymentMethodWhereUniqueInput | Prisma.WorkspacePaymentMethodWhereUniqueInput[];
    update?: Prisma.WorkspacePaymentMethodUpdateWithWhereUniqueWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodUpdateWithWhereUniqueWithoutWorkspaceInput[];
    updateMany?: Prisma.WorkspacePaymentMethodUpdateManyWithWhereWithoutWorkspaceInput | Prisma.WorkspacePaymentMethodUpdateManyWithWhereWithoutWorkspaceInput[];
    deleteMany?: Prisma.WorkspacePaymentMethodScalarWhereInput | Prisma.WorkspacePaymentMethodScalarWhereInput[];
};
export type EnumPaymentMethodTypeFieldUpdateOperationsInput = {
    set?: $Enums.PaymentMethodType;
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type WorkspacePaymentMethodCreateNestedOneWithoutInvoicesInput = {
    create?: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutInvoicesInput>;
    connectOrCreate?: Prisma.WorkspacePaymentMethodCreateOrConnectWithoutInvoicesInput;
    connect?: Prisma.WorkspacePaymentMethodWhereUniqueInput;
};
export type WorkspacePaymentMethodUpdateOneWithoutInvoicesNestedInput = {
    create?: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutInvoicesInput>;
    connectOrCreate?: Prisma.WorkspacePaymentMethodCreateOrConnectWithoutInvoicesInput;
    upsert?: Prisma.WorkspacePaymentMethodUpsertWithoutInvoicesInput;
    disconnect?: Prisma.WorkspacePaymentMethodWhereInput | boolean;
    delete?: Prisma.WorkspacePaymentMethodWhereInput | boolean;
    connect?: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateToOneWithWhereWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUpdateWithoutInvoicesInput>, Prisma.WorkspacePaymentMethodUncheckedUpdateWithoutInvoicesInput>;
};
export type WorkspacePaymentMethodCreateWithoutWorkspaceInput = {
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    invoices?: Prisma.InvoiceCreateNestedManyWithoutSelectedPaymentMethodInput;
};
export type WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput = {
    id?: number;
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    invoices?: Prisma.InvoiceUncheckedCreateNestedManyWithoutSelectedPaymentMethodInput;
};
export type WorkspacePaymentMethodCreateOrConnectWithoutWorkspaceInput = {
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput>;
};
export type WorkspacePaymentMethodCreateManyWorkspaceInputEnvelope = {
    data: Prisma.WorkspacePaymentMethodCreateManyWorkspaceInput | Prisma.WorkspacePaymentMethodCreateManyWorkspaceInput[];
    skipDuplicates?: boolean;
};
export type WorkspacePaymentMethodUpsertWithWhereUniqueWithoutWorkspaceInput = {
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    update: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedUpdateWithoutWorkspaceInput>;
    create: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutWorkspaceInput>;
};
export type WorkspacePaymentMethodUpdateWithWhereUniqueWithoutWorkspaceInput = {
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateWithoutWorkspaceInput, Prisma.WorkspacePaymentMethodUncheckedUpdateWithoutWorkspaceInput>;
};
export type WorkspacePaymentMethodUpdateManyWithWhereWithoutWorkspaceInput = {
    where: Prisma.WorkspacePaymentMethodScalarWhereInput;
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateManyMutationInput, Prisma.WorkspacePaymentMethodUncheckedUpdateManyWithoutWorkspaceInput>;
};
export type WorkspacePaymentMethodScalarWhereInput = {
    AND?: Prisma.WorkspacePaymentMethodScalarWhereInput | Prisma.WorkspacePaymentMethodScalarWhereInput[];
    OR?: Prisma.WorkspacePaymentMethodScalarWhereInput[];
    NOT?: Prisma.WorkspacePaymentMethodScalarWhereInput | Prisma.WorkspacePaymentMethodScalarWhereInput[];
    id?: Prisma.IntFilter<"WorkspacePaymentMethod"> | number;
    workspaceId?: Prisma.IntFilter<"WorkspacePaymentMethod"> | number;
    type?: Prisma.EnumPaymentMethodTypeFilter<"WorkspacePaymentMethod"> | $Enums.PaymentMethodType;
    handle?: Prisma.StringNullableFilter<"WorkspacePaymentMethod"> | string | null;
    isEnabled?: Prisma.BoolFilter<"WorkspacePaymentMethod"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"WorkspacePaymentMethod"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"WorkspacePaymentMethod"> | Date | string;
};
export type WorkspacePaymentMethodCreateWithoutInvoicesInput = {
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    workspace: Prisma.WorkspaceCreateNestedOneWithoutPaymentMethodsInput;
};
export type WorkspacePaymentMethodUncheckedCreateWithoutInvoicesInput = {
    id?: number;
    workspaceId: number;
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WorkspacePaymentMethodCreateOrConnectWithoutInvoicesInput = {
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutInvoicesInput>;
};
export type WorkspacePaymentMethodUpsertWithoutInvoicesInput = {
    update: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUncheckedUpdateWithoutInvoicesInput>;
    create: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUncheckedCreateWithoutInvoicesInput>;
    where?: Prisma.WorkspacePaymentMethodWhereInput;
};
export type WorkspacePaymentMethodUpdateToOneWithWhereWithoutInvoicesInput = {
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateWithoutInvoicesInput, Prisma.WorkspacePaymentMethodUncheckedUpdateWithoutInvoicesInput>;
};
export type WorkspacePaymentMethodUpdateWithoutInvoicesInput = {
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    workspace?: Prisma.WorkspaceUpdateOneRequiredWithoutPaymentMethodsNestedInput;
};
export type WorkspacePaymentMethodUncheckedUpdateWithoutInvoicesInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workspaceId?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkspacePaymentMethodCreateManyWorkspaceInput = {
    id?: number;
    type: $Enums.PaymentMethodType;
    handle?: string | null;
    isEnabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type WorkspacePaymentMethodUpdateWithoutWorkspaceInput = {
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    invoices?: Prisma.InvoiceUpdateManyWithoutSelectedPaymentMethodNestedInput;
};
export type WorkspacePaymentMethodUncheckedUpdateWithoutWorkspaceInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    invoices?: Prisma.InvoiceUncheckedUpdateManyWithoutSelectedPaymentMethodNestedInput;
};
export type WorkspacePaymentMethodUncheckedUpdateManyWithoutWorkspaceInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumPaymentMethodTypeFieldUpdateOperationsInput | $Enums.PaymentMethodType;
    handle?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isEnabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type WorkspacePaymentMethodCountOutputType
 */
export type WorkspacePaymentMethodCountOutputType = {
    invoices: number;
};
export type WorkspacePaymentMethodCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    invoices?: boolean | WorkspacePaymentMethodCountOutputTypeCountInvoicesArgs;
};
/**
 * WorkspacePaymentMethodCountOutputType without action
 */
export type WorkspacePaymentMethodCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethodCountOutputType
     */
    select?: Prisma.WorkspacePaymentMethodCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * WorkspacePaymentMethodCountOutputType without action
 */
export type WorkspacePaymentMethodCountOutputTypeCountInvoicesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InvoiceWhereInput;
};
export type WorkspacePaymentMethodSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workspaceId?: boolean;
    type?: boolean;
    handle?: boolean;
    isEnabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    workspace?: boolean | Prisma.WorkspaceDefaultArgs<ExtArgs>;
    invoices?: boolean | Prisma.WorkspacePaymentMethod$invoicesArgs<ExtArgs>;
    _count?: boolean | Prisma.WorkspacePaymentMethodCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workspacePaymentMethod"]>;
export type WorkspacePaymentMethodSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workspaceId?: boolean;
    type?: boolean;
    handle?: boolean;
    isEnabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    workspace?: boolean | Prisma.WorkspaceDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workspacePaymentMethod"]>;
export type WorkspacePaymentMethodSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workspaceId?: boolean;
    type?: boolean;
    handle?: boolean;
    isEnabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    workspace?: boolean | Prisma.WorkspaceDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workspacePaymentMethod"]>;
export type WorkspacePaymentMethodSelectScalar = {
    id?: boolean;
    workspaceId?: boolean;
    type?: boolean;
    handle?: boolean;
    isEnabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type WorkspacePaymentMethodOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "workspaceId" | "type" | "handle" | "isEnabled" | "createdAt" | "updatedAt", ExtArgs["result"]["workspacePaymentMethod"]>;
export type WorkspacePaymentMethodInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workspace?: boolean | Prisma.WorkspaceDefaultArgs<ExtArgs>;
    invoices?: boolean | Prisma.WorkspacePaymentMethod$invoicesArgs<ExtArgs>;
    _count?: boolean | Prisma.WorkspacePaymentMethodCountOutputTypeDefaultArgs<ExtArgs>;
};
export type WorkspacePaymentMethodIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workspace?: boolean | Prisma.WorkspaceDefaultArgs<ExtArgs>;
};
export type WorkspacePaymentMethodIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workspace?: boolean | Prisma.WorkspaceDefaultArgs<ExtArgs>;
};
export type $WorkspacePaymentMethodPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WorkspacePaymentMethod";
    objects: {
        workspace: Prisma.$WorkspacePayload<ExtArgs>;
        invoices: Prisma.$InvoicePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        workspaceId: number;
        type: $Enums.PaymentMethodType;
        handle: string | null;
        isEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["workspacePaymentMethod"]>;
    composites: {};
};
export type WorkspacePaymentMethodGetPayload<S extends boolean | null | undefined | WorkspacePaymentMethodDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload, S>;
export type WorkspacePaymentMethodCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WorkspacePaymentMethodFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WorkspacePaymentMethodCountAggregateInputType | true;
};
export interface WorkspacePaymentMethodDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WorkspacePaymentMethod'];
        meta: {
            name: 'WorkspacePaymentMethod';
        };
    };
    /**
     * Find zero or one WorkspacePaymentMethod that matches the filter.
     * @param {WorkspacePaymentMethodFindUniqueArgs} args - Arguments to find a WorkspacePaymentMethod
     * @example
     * // Get one WorkspacePaymentMethod
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkspacePaymentMethodFindUniqueArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one WorkspacePaymentMethod that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkspacePaymentMethodFindUniqueOrThrowArgs} args - Arguments to find a WorkspacePaymentMethod
     * @example
     * // Get one WorkspacePaymentMethod
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkspacePaymentMethodFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first WorkspacePaymentMethod that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodFindFirstArgs} args - Arguments to find a WorkspacePaymentMethod
     * @example
     * // Get one WorkspacePaymentMethod
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkspacePaymentMethodFindFirstArgs>(args?: Prisma.SelectSubset<T, WorkspacePaymentMethodFindFirstArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first WorkspacePaymentMethod that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodFindFirstOrThrowArgs} args - Arguments to find a WorkspacePaymentMethod
     * @example
     * // Get one WorkspacePaymentMethod
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkspacePaymentMethodFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WorkspacePaymentMethodFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more WorkspacePaymentMethods that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkspacePaymentMethods
     * const workspacePaymentMethods = await prisma.workspacePaymentMethod.findMany()
     *
     * // Get first 10 WorkspacePaymentMethods
     * const workspacePaymentMethods = await prisma.workspacePaymentMethod.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const workspacePaymentMethodWithIdOnly = await prisma.workspacePaymentMethod.findMany({ select: { id: true } })
     *
     */
    findMany<T extends WorkspacePaymentMethodFindManyArgs>(args?: Prisma.SelectSubset<T, WorkspacePaymentMethodFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a WorkspacePaymentMethod.
     * @param {WorkspacePaymentMethodCreateArgs} args - Arguments to create a WorkspacePaymentMethod.
     * @example
     * // Create one WorkspacePaymentMethod
     * const WorkspacePaymentMethod = await prisma.workspacePaymentMethod.create({
     *   data: {
     *     // ... data to create a WorkspacePaymentMethod
     *   }
     * })
     *
     */
    create<T extends WorkspacePaymentMethodCreateArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodCreateArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many WorkspacePaymentMethods.
     * @param {WorkspacePaymentMethodCreateManyArgs} args - Arguments to create many WorkspacePaymentMethods.
     * @example
     * // Create many WorkspacePaymentMethods
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends WorkspacePaymentMethodCreateManyArgs>(args?: Prisma.SelectSubset<T, WorkspacePaymentMethodCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many WorkspacePaymentMethods and returns the data saved in the database.
     * @param {WorkspacePaymentMethodCreateManyAndReturnArgs} args - Arguments to create many WorkspacePaymentMethods.
     * @example
     * // Create many WorkspacePaymentMethods
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many WorkspacePaymentMethods and only return the `id`
     * const workspacePaymentMethodWithIdOnly = await prisma.workspacePaymentMethod.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends WorkspacePaymentMethodCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WorkspacePaymentMethodCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a WorkspacePaymentMethod.
     * @param {WorkspacePaymentMethodDeleteArgs} args - Arguments to delete one WorkspacePaymentMethod.
     * @example
     * // Delete one WorkspacePaymentMethod
     * const WorkspacePaymentMethod = await prisma.workspacePaymentMethod.delete({
     *   where: {
     *     // ... filter to delete one WorkspacePaymentMethod
     *   }
     * })
     *
     */
    delete<T extends WorkspacePaymentMethodDeleteArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodDeleteArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one WorkspacePaymentMethod.
     * @param {WorkspacePaymentMethodUpdateArgs} args - Arguments to update one WorkspacePaymentMethod.
     * @example
     * // Update one WorkspacePaymentMethod
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends WorkspacePaymentMethodUpdateArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodUpdateArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more WorkspacePaymentMethods.
     * @param {WorkspacePaymentMethodDeleteManyArgs} args - Arguments to filter WorkspacePaymentMethods to delete.
     * @example
     * // Delete a few WorkspacePaymentMethods
     * const { count } = await prisma.workspacePaymentMethod.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends WorkspacePaymentMethodDeleteManyArgs>(args?: Prisma.SelectSubset<T, WorkspacePaymentMethodDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more WorkspacePaymentMethods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkspacePaymentMethods
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends WorkspacePaymentMethodUpdateManyArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more WorkspacePaymentMethods and returns the data updated in the database.
     * @param {WorkspacePaymentMethodUpdateManyAndReturnArgs} args - Arguments to update many WorkspacePaymentMethods.
     * @example
     * // Update many WorkspacePaymentMethods
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more WorkspacePaymentMethods and only return the `id`
     * const workspacePaymentMethodWithIdOnly = await prisma.workspacePaymentMethod.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends WorkspacePaymentMethodUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one WorkspacePaymentMethod.
     * @param {WorkspacePaymentMethodUpsertArgs} args - Arguments to update or create a WorkspacePaymentMethod.
     * @example
     * // Update or create a WorkspacePaymentMethod
     * const workspacePaymentMethod = await prisma.workspacePaymentMethod.upsert({
     *   create: {
     *     // ... data to create a WorkspacePaymentMethod
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkspacePaymentMethod we want to update
     *   }
     * })
     */
    upsert<T extends WorkspacePaymentMethodUpsertArgs>(args: Prisma.SelectSubset<T, WorkspacePaymentMethodUpsertArgs<ExtArgs>>): Prisma.Prisma__WorkspacePaymentMethodClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePaymentMethodPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of WorkspacePaymentMethods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodCountArgs} args - Arguments to filter WorkspacePaymentMethods to count.
     * @example
     * // Count the number of WorkspacePaymentMethods
     * const count = await prisma.workspacePaymentMethod.count({
     *   where: {
     *     // ... the filter for the WorkspacePaymentMethods we want to count
     *   }
     * })
    **/
    count<T extends WorkspacePaymentMethodCountArgs>(args?: Prisma.Subset<T, WorkspacePaymentMethodCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WorkspacePaymentMethodCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a WorkspacePaymentMethod.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkspacePaymentMethodAggregateArgs>(args: Prisma.Subset<T, WorkspacePaymentMethodAggregateArgs>): Prisma.PrismaPromise<GetWorkspacePaymentMethodAggregateType<T>>;
    /**
     * Group by WorkspacePaymentMethod.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkspacePaymentMethodGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends WorkspacePaymentMethodGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WorkspacePaymentMethodGroupByArgs['orderBy'];
    } : {
        orderBy?: WorkspacePaymentMethodGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WorkspacePaymentMethodGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkspacePaymentMethodGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the WorkspacePaymentMethod model
     */
    readonly fields: WorkspacePaymentMethodFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for WorkspacePaymentMethod.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__WorkspacePaymentMethodClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    workspace<T extends Prisma.WorkspaceDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkspaceDefaultArgs<ExtArgs>>): Prisma.Prisma__WorkspaceClient<runtime.Types.Result.GetResult<Prisma.$WorkspacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    invoices<T extends Prisma.WorkspacePaymentMethod$invoicesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkspacePaymentMethod$invoicesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the WorkspacePaymentMethod model
 */
export interface WorkspacePaymentMethodFieldRefs {
    readonly id: Prisma.FieldRef<"WorkspacePaymentMethod", 'Int'>;
    readonly workspaceId: Prisma.FieldRef<"WorkspacePaymentMethod", 'Int'>;
    readonly type: Prisma.FieldRef<"WorkspacePaymentMethod", 'PaymentMethodType'>;
    readonly handle: Prisma.FieldRef<"WorkspacePaymentMethod", 'String'>;
    readonly isEnabled: Prisma.FieldRef<"WorkspacePaymentMethod", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"WorkspacePaymentMethod", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"WorkspacePaymentMethod", 'DateTime'>;
}
/**
 * WorkspacePaymentMethod findUnique
 */
export type WorkspacePaymentMethodFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * Filter, which WorkspacePaymentMethod to fetch.
     */
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
};
/**
 * WorkspacePaymentMethod findUniqueOrThrow
 */
export type WorkspacePaymentMethodFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * Filter, which WorkspacePaymentMethod to fetch.
     */
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
};
/**
 * WorkspacePaymentMethod findFirst
 */
export type WorkspacePaymentMethodFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * Filter, which WorkspacePaymentMethod to fetch.
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkspacePaymentMethods to fetch.
     */
    orderBy?: Prisma.WorkspacePaymentMethodOrderByWithRelationInput | Prisma.WorkspacePaymentMethodOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for WorkspacePaymentMethods.
     */
    cursor?: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkspacePaymentMethods from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkspacePaymentMethods.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of WorkspacePaymentMethods.
     */
    distinct?: Prisma.WorkspacePaymentMethodScalarFieldEnum | Prisma.WorkspacePaymentMethodScalarFieldEnum[];
};
/**
 * WorkspacePaymentMethod findFirstOrThrow
 */
export type WorkspacePaymentMethodFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * Filter, which WorkspacePaymentMethod to fetch.
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkspacePaymentMethods to fetch.
     */
    orderBy?: Prisma.WorkspacePaymentMethodOrderByWithRelationInput | Prisma.WorkspacePaymentMethodOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for WorkspacePaymentMethods.
     */
    cursor?: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkspacePaymentMethods from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkspacePaymentMethods.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of WorkspacePaymentMethods.
     */
    distinct?: Prisma.WorkspacePaymentMethodScalarFieldEnum | Prisma.WorkspacePaymentMethodScalarFieldEnum[];
};
/**
 * WorkspacePaymentMethod findMany
 */
export type WorkspacePaymentMethodFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * Filter, which WorkspacePaymentMethods to fetch.
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkspacePaymentMethods to fetch.
     */
    orderBy?: Prisma.WorkspacePaymentMethodOrderByWithRelationInput | Prisma.WorkspacePaymentMethodOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing WorkspacePaymentMethods.
     */
    cursor?: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkspacePaymentMethods from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkspacePaymentMethods.
     */
    skip?: number;
    distinct?: Prisma.WorkspacePaymentMethodScalarFieldEnum | Prisma.WorkspacePaymentMethodScalarFieldEnum[];
};
/**
 * WorkspacePaymentMethod create
 */
export type WorkspacePaymentMethodCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * The data needed to create a WorkspacePaymentMethod.
     */
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateInput, Prisma.WorkspacePaymentMethodUncheckedCreateInput>;
};
/**
 * WorkspacePaymentMethod createMany
 */
export type WorkspacePaymentMethodCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkspacePaymentMethods.
     */
    data: Prisma.WorkspacePaymentMethodCreateManyInput | Prisma.WorkspacePaymentMethodCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * WorkspacePaymentMethod createManyAndReturn
 */
export type WorkspacePaymentMethodCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * The data used to create many WorkspacePaymentMethods.
     */
    data: Prisma.WorkspacePaymentMethodCreateManyInput | Prisma.WorkspacePaymentMethodCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * WorkspacePaymentMethod update
 */
export type WorkspacePaymentMethodUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * The data needed to update a WorkspacePaymentMethod.
     */
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateInput, Prisma.WorkspacePaymentMethodUncheckedUpdateInput>;
    /**
     * Choose, which WorkspacePaymentMethod to update.
     */
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
};
/**
 * WorkspacePaymentMethod updateMany
 */
export type WorkspacePaymentMethodUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkspacePaymentMethods.
     */
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateManyMutationInput, Prisma.WorkspacePaymentMethodUncheckedUpdateManyInput>;
    /**
     * Filter which WorkspacePaymentMethods to update
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * Limit how many WorkspacePaymentMethods to update.
     */
    limit?: number;
};
/**
 * WorkspacePaymentMethod updateManyAndReturn
 */
export type WorkspacePaymentMethodUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * The data used to update WorkspacePaymentMethods.
     */
    data: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateManyMutationInput, Prisma.WorkspacePaymentMethodUncheckedUpdateManyInput>;
    /**
     * Filter which WorkspacePaymentMethods to update
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * Limit how many WorkspacePaymentMethods to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * WorkspacePaymentMethod upsert
 */
export type WorkspacePaymentMethodUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * The filter to search for the WorkspacePaymentMethod to update in case it exists.
     */
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
    /**
     * In case the WorkspacePaymentMethod found by the `where` argument doesn't exist, create a new WorkspacePaymentMethod with this data.
     */
    create: Prisma.XOR<Prisma.WorkspacePaymentMethodCreateInput, Prisma.WorkspacePaymentMethodUncheckedCreateInput>;
    /**
     * In case the WorkspacePaymentMethod was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.WorkspacePaymentMethodUpdateInput, Prisma.WorkspacePaymentMethodUncheckedUpdateInput>;
};
/**
 * WorkspacePaymentMethod delete
 */
export type WorkspacePaymentMethodDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
    /**
     * Filter which WorkspacePaymentMethod to delete.
     */
    where: Prisma.WorkspacePaymentMethodWhereUniqueInput;
};
/**
 * WorkspacePaymentMethod deleteMany
 */
export type WorkspacePaymentMethodDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which WorkspacePaymentMethods to delete
     */
    where?: Prisma.WorkspacePaymentMethodWhereInput;
    /**
     * Limit how many WorkspacePaymentMethods to delete.
     */
    limit?: number;
};
/**
 * WorkspacePaymentMethod.invoices
 */
export type WorkspacePaymentMethod$invoicesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: Prisma.InvoiceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Invoice
     */
    omit?: Prisma.InvoiceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.InvoiceInclude<ExtArgs> | null;
    where?: Prisma.InvoiceWhereInput;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput | Prisma.InvoiceOrderByWithRelationInput[];
    cursor?: Prisma.InvoiceWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.InvoiceScalarFieldEnum | Prisma.InvoiceScalarFieldEnum[];
};
/**
 * WorkspacePaymentMethod without action
 */
export type WorkspacePaymentMethodDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkspacePaymentMethod
     */
    select?: Prisma.WorkspacePaymentMethodSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkspacePaymentMethod
     */
    omit?: Prisma.WorkspacePaymentMethodOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkspacePaymentMethodInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=WorkspacePaymentMethod.d.ts.map