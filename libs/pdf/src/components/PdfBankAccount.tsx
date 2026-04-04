import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';

const styles = StyleSheet.create({
  label: {
    fontSize: 8,
    color: '#555555',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  accountNumber: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 8,
    color: '#555555',
    marginTop: 2,
  },
});

interface PdfBankAccountProps {
  companyName: string;
  bankAccountNumber?: string;
}

export function PdfBankAccount({ companyName, bankAccountNumber }: PdfBankAccountProps) {
  if (!bankAccountNumber) return null;

  return (
    <View wrap={false} style={baseStyles.section}>
      <Text style={styles.label}>Dane do przelewu</Text>
      <Text style={styles.accountNumber}>{bankAccountNumber}</Text>
      <Text style={styles.companyName}>{companyName}</Text>
    </View>
  );
}
