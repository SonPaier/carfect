import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';
import type { PdfCustomerData, PdfVehicleData } from '../types';

const styles = StyleSheet.create({
  divider: {
    height: 0.5,
    backgroundColor: '#e5e5e5',
    marginVertical: 6,
  },
});

interface PdfCustomerSectionProps {
  customer: PdfCustomerData;
  vehicle: PdfVehicleData;
}

export function PdfCustomerSection({ customer, vehicle }: PdfCustomerSectionProps) {
  const vehicleName = customer.name ?? '—';
  const vehicleLabel =
    vehicle.brandModel ?? ([vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '—');

  return (
    <View wrap={false} style={baseStyles.section}>
      <Text style={baseStyles.sectionTitle}>Dane klienta i pojazdu</Text>
      <View style={baseStyles.customerRow}>
        <Text style={baseStyles.customerLabel}>Imię i nazwisko</Text>
        <Text style={baseStyles.customerValue}>{vehicleName}</Text>
      </View>
      {customer.phone && (
        <View style={baseStyles.customerRow}>
          <Text style={baseStyles.customerLabel}>Telefon</Text>
          <Text style={baseStyles.customerValue}>{customer.phone}</Text>
        </View>
      )}
      {customer.company && (
        <View style={baseStyles.customerRow}>
          <Text style={baseStyles.customerLabel}>Firma</Text>
          <Text style={baseStyles.customerValue}>{customer.company}</Text>
        </View>
      )}
      {customer.nip && (
        <View style={baseStyles.customerRow}>
          <Text style={baseStyles.customerLabel}>NIP</Text>
          <Text style={baseStyles.customerValue}>{customer.nip}</Text>
        </View>
      )}
      <View style={styles.divider} />
      <View style={baseStyles.customerRow}>
        <Text style={baseStyles.customerLabel}>Pojazd</Text>
        <Text style={baseStyles.customerValue}>{vehicleLabel}</Text>
      </View>
      {vehicle.plate && (
        <View style={baseStyles.customerRow}>
          <Text style={baseStyles.customerLabel}>Rejestracja</Text>
          <Text style={baseStyles.customerValue}>{vehicle.plate}</Text>
        </View>
      )}
    </View>
  );
}
