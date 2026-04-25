import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { baseStyles } from '../styles';

interface PdfFooterProps {
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  /**
   * Wording for the carfect.pl signature. Use "Ofertę" for offers,
   * "Dokument" (default) for everything else.
   */
  documentLabel?: 'Ofertę' | 'Dokument';
}

export function PdfFooter({
  companyName,
  companyPhone,
  companyEmail,
  documentLabel = 'Dokument',
}: PdfFooterProps) {
  const parts = [companyName, companyPhone, companyEmail].filter(Boolean);

  return (
    <View fixed style={baseStyles.footer}>
      <View style={{ flex: 1 }}>
        <View style={baseStyles.footerCompanyInfo}>
          {parts.map((part, i) => (
            <Text key={i}>{part}</Text>
          ))}
        </View>
        <Text
          style={{ fontSize: 7, color: '#b0b0b0', marginTop: 2 }}
          render={({ pageNumber, totalPages }) =>
            pageNumber === totalPages
              ? `${documentLabel} przygotowano w systemie do zarządzania studiem detailingu — carfect.pl`
              : ''
          }
        />
      </View>
      <Text
        style={baseStyles.footerPageNumber}
        render={({ pageNumber, totalPages }) => `Strona ${pageNumber} z ${totalPages}`}
      />
    </View>
  );
}
