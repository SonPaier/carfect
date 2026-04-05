import { StyleSheet } from '@react-pdf/renderer';

/** Configuration object for PDF rendering — future: stored per-instance in DB */
export interface PdfConfig {
  accentColor: string; // branding accent (separator line, section headers)
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  logoUrl?: string | null;
  showTrustTiles: boolean;
  showBankAccount: boolean;
  showExpertContact: boolean;
}

export const defaultPdfConfig: PdfConfig = {
  accentColor: '#2563eb',
  companyName: '',
  showTrustTiles: true,
  showBankAccount: true,
  showExpertContact: true,
};

export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    paddingTop: 70,
    paddingBottom: 50,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#111111',
  },

  // Fixed header — ~40pt height
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    fontSize: 8,
  },
  headerLogo: {
    maxWidth: 80,
    maxHeight: 40,
    objectFit: 'contain',
  },
  headerOfferNumber: {
    fontSize: 8,
    color: '#555555',
    textAlign: 'right',
  },
  headerSeparator: {
    position: 'absolute',
    top: 63,
    left: 40,
    right: 40,
    height: 1,
  },
  headerSeparatorLine: {
    height: 1,
  },

  // Fixed footer — ~25pt height
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 7,
    color: '#888888',
  },
  footerCompanyInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  footerPageNumber: {
    textAlign: 'right',
  },

  // Content sections
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111111',
  },

  // Customer & vehicle
  customerRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 10,
  },
  customerLabel: {
    color: '#666666',
    width: 80,
  },
  customerValue: {
    flex: 1,
    color: '#111111',
  },

  // Table rows for line items
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
    fontSize: 10,
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    fontWeight: 'bold',
    fontSize: 8,
    color: '#666666',
    alignItems: 'center',
  },
  tableColName: {
    flex: 4,
  },
  tableColQty: {
    flex: 1,
    textAlign: 'right',
  },
  tableColUnitPrice: {
    flex: 2,
    textAlign: 'right',
  },
  tableColDiscount: {
    flex: 1,
    textAlign: 'right',
  },
  tableColTotal: {
    flex: 2,
    textAlign: 'right',
    fontWeight: 'bold',
  },

  // Scope header
  scopeHeader: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
    alignItems: 'flex-start',
  },
  scopeHeaderText: {
    flex: 1,
  },
  scopeName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#111111',
  },
  scopeDescription: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.4,
  },
  scopePhoto: {
    width: 100,
    height: 70,
    objectFit: 'cover',
    borderRadius: 3,
  },
  optionalBadge: {
    fontSize: 7,
    color: '#888888',
    fontWeight: 'normal',
  },

  // Summary block
  summaryBlock: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
    gap: 16,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#555555',
    width: 120,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 10,
    color: '#111111',
    width: 80,
    textAlign: 'right',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111',
    width: 120,
    textAlign: 'right',
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111',
    width: 80,
    textAlign: 'right',
  },

  // Terms block
  termsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111111',
  },
  termsSubtitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#555555',
    marginTop: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 8,
    color: '#444444',
    lineHeight: 1.5,
  },

  // Trust tiles
  trustTilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  trustTile: {
    flex: 1,
    minWidth: 100,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  trustTileTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 2,
  },
  trustTileDescription: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.4,
  },

  // Bank account
  bankSection: {
    marginBottom: 8,
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 9,
  },
  bankLabel: {
    color: '#666666',
    width: 110,
  },
  bankValue: {
    flex: 1,
    color: '#111111',
    fontFamily: 'Courier',
  },

  // Expert contact
  contactSection: {
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 9,
  },
  contactLabel: {
    color: '#666666',
    width: 60,
  },
  contactValue: {
    flex: 1,
    color: '#111111',
  },
});
