import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';

const styles = StyleSheet.create({
  divider: {
    height: 0.5,
    backgroundColor: '#333333',
    marginVertical: 4,
    width: '100%',
  },
});

interface PdfSummaryProps {
  totalNet: number;
  totalGross: number;
  vatRate: number;
}

export function PdfSummary({ totalNet, totalGross, vatRate }: PdfSummaryProps) {
  const vatAmount = totalGross - totalNet;

  return (
    <View wrap={false} style={[baseStyles.section, baseStyles.summaryBlock]}>
      <View style={baseStyles.summaryRow}>
        <Text style={baseStyles.summaryLabel}>Razem netto:</Text>
        <Text style={baseStyles.summaryValue}>{totalNet.toFixed(2)} zł</Text>
      </View>
      <View style={baseStyles.summaryRow}>
        <Text style={baseStyles.summaryLabel}>VAT ({vatRate}%):</Text>
        <Text style={baseStyles.summaryValue}>{vatAmount.toFixed(2)} zł</Text>
      </View>
      <View style={styles.divider} />
      <View style={baseStyles.summaryRow}>
        <Text style={baseStyles.summaryTotalLabel}>Razem brutto:</Text>
        <Text style={baseStyles.summaryTotalValue}>{totalGross.toFixed(2)} zł</Text>
      </View>
    </View>
  );
}
