import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import type {
  InvoiceResponse,
  InvoiceItemResponse,
} from "@/features/invoices/types/api";
import type { ClientResponse } from "@/features/clients";
import { BusinessResponse } from "@/features/businesses";

interface CompanyData {
  name: string;
  address: string;
  nit: string;
  email: string;
  phone: string;
  logo: string;
}

interface InvoicePDFTemplateProps {
  invoice: InvoiceResponse;
  client: ClientResponse;
  company: BusinessResponse;
}

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000",
  },
  companyDetails: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  invoiceInfo: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00aaab",
    marginBottom: 8,
  },
  invoiceDetails: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 20,
  },
  billToSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#666",
  },
  billToContent: {
    fontSize: 10,
    color: "#000",
    marginTop: 2,
  },
  billToLabel: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f7f9",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#000",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "right",
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  itemName: {
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "left",
  },
  itemDescription: {
    fontSize: 8,
    color: "#666",
    textAlign: "left",
  },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 5,
    fontSize: 10,
  },
  totalLabel: {
    color: "#666",
  },
  totalValue: {
    fontWeight: "bold",
    color: "#000",
  },
  totalFinal: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  totalFinalValue: {
    color: "#00aaab",
  },
  notesSection: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000",
    fontSize: 10,
  },
  notesTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
  companyLogo: {
    width: 70,
    height: 70,
    objectFit: "contain",
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    flex: 1,
  },
  watermark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  watermarkTextContainer: {
    transform: "rotate(-45deg)",
    transformOrigin: "center center",
    width: 1400,
  },
  watermarkText: {
    fontSize: 100,
    fontWeight: "bold",
    color: "#000",
    opacity: 0.05,
    textAlign: "center",
    letterSpacing: 2,
  },
});

export function InvoicePDFTemplate({
  invoice,
  client,
  company,
}: InvoicePDFTemplateProps) {
  const items = invoice.items || [];

  const calculateItemTotal = (item: InvoiceItemResponse) => {
    const subtotal = item.quantity * item.unitPrice;
    let discountedSubtotal = subtotal;
    if (item.discount > 0) {
      if (item.discountType === "PERCENTAGE") {
        discountedSubtotal = subtotal * (1 - item.discount / 100);
      } else if (item.discountType === "FIXED") {
        discountedSubtotal = subtotal - item.discount;
      }
    }
    const taxAmount = (discountedSubtotal * item.tax) / 100;
    return discountedSubtotal + taxAmount;
  };

  const formatCurrency = (amount: number) => {
    return `${invoice.currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <View style={styles.watermark}>
          <View style={styles.watermarkTextContainer}>
            <Text style={styles.watermarkText}>{company.name}</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyHeader}>
            {company.logo && (
              <Image src={company.logo} style={styles.companyLogo} />
            )}

            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.address && (
                <Text style={styles.companyDetails}>{company.address}</Text>
              )}
              {company.email && company.phone && (
                <Text style={styles.companyDetails}>
                  {company.email} | {company.phone}
                </Text>
              )}
              {company.nit && (
                <Text style={styles.companyDetails}>NIT: {company.nit}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "bold" }}>Invoice #:</Text>{" "}
              {invoice.invoiceNumber}
            </Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "bold" }}>Issue Date:</Text>{" "}
              {formatDate(invoice.issueDate)}
            </Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "bold" }}>Due Date:</Text>{" "}
              {formatDate(invoice.dueDate)}
            </Text>
            {invoice.purchaseOrder && (
              <Text style={styles.invoiceDetails}>
                PO: {invoice.purchaseOrder}
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billToSection}>
          <Text style={styles.sectionTitle}>BILLED TO:</Text>
          <Text style={[styles.billToContent, styles.billToLabel]}>
            NAME: {client.name}
          </Text>
          {client.businessName && (
            <Text style={styles.billToContent}>
              BUSINESS: {client.businessName}
            </Text>
          )}
          {client.address && (
            <Text style={styles.billToContent}>ADDRESS: {client.address}</Text>
          )}
          {client.phone && (
            <Text style={styles.billToContent}>PHONE: {client.phone}</Text>
          )}
          {client.email && (
            <Text style={styles.billToContent}>EMAIL: {client.email}</Text>
          )}
          {client.nit && (
            <Text style={styles.billToContent}>NIT: {client.nit}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View
              style={[styles.tableHeaderCell, { flex: 2, textAlign: "left" }]}
            >
              <Text>DESCRIPTION</Text>
            </View>
            <View style={[styles.tableHeaderCell, { flex: 0.8 }]}>
              <Text>QTY</Text>
            </View>
            <View style={[styles.tableHeaderCell, { flex: 1 }]}>
              <Text>UNIT PRICE</Text>
            </View>
            <View style={[styles.tableHeaderCell, { flex: 1 }]}>
              <Text>TAX</Text>
            </View>
            <View
              style={[
                styles.tableHeaderCell,
                styles.tableCellLast,
                { flex: 1 },
              ]}
            >
              <Text>TOTAL</Text>
            </View>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <Text>
                  {item.quantity} {item.quantityUnit}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{formatCurrency(item.unitPrice)}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{item.tax}%</Text>
              </View>
              <View
                style={[styles.tableCell, styles.tableCellLast, { flex: 1 }]}
              >
                <Text>{formatCurrency(calculateItemTotal(item))}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(invoice.discount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.totalTax)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text style={styles.totalLabel}>Invoice total:</Text>
            <Text style={[styles.totalValue, styles.totalFinalValue]}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notesSection}>
            {invoice.notes && <Text style={styles.notesTitle}>REMARKS:</Text>}
            {invoice.notes && (
              <Text style={{ marginBottom: 8 }}>{invoice.notes}</Text>
            )}
            {invoice.terms && <Text>{invoice.terms}</Text>}
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
