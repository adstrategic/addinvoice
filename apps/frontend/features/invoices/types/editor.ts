import type { InvoiceItemCreateInput } from "../schemas/invoice.schema";

export interface InvoiceEditorItem {
  uiKey: string;
  persistedItemId?: number;
  data: InvoiceItemCreateInput;
}
