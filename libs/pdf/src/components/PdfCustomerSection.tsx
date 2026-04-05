import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';
import type { PdfCustomerData, PdfVehicleData } from '../types';

const PAINT_TYPE_LABELS: Record<string, string> = {
  glossy: 'połysk',
  matte: 'mat',
  satin: 'satyna',
  metallic: 'metalik',
};

const styles = StyleSheet.create({
  columns: {
    flexDirection: 'row',
    gap: 24,
  },
  column: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 10,
  },
  label: {
    color: '#666666',
    width: 75,
  },
  value: {
    flex: 1,
    color: '#111111',
  },
});

interface PdfCustomerSectionProps {
  customer: PdfCustomerData;
  vehicle: PdfVehicleData;
}

export function PdfCustomerSection({ customer, vehicle }: PdfCustomerSectionProps) {
  const vehicleLabel = vehicle.brandModel
    ?? ([vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '—');

  const paintParts = [
    vehicle.paintColor,
    vehicle.paintType ? PAINT_TYPE_LABELS[vehicle.paintType] ?? vehicle.paintType : null,
  ].filter(Boolean);
  const paintLabel = paintParts.length > 0 ? paintParts.join(', ') : null;

  return (
    <View wrap={false} style={baseStyles.section}>
      <Text style={baseStyles.sectionTitle}>Dane klienta i pojazdu</Text>
      <View style={styles.columns}>
        {/* Left column — customer */}
        <View style={styles.column}>
          {customer.name && (
            <View style={styles.row}>
              <Text style={styles.label}>Imię i nazwisko</Text>
              <Text style={styles.value}>{customer.name}</Text>
            </View>
          )}
          {customer.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telefon</Text>
              <Text style={styles.value}>{customer.phone}</Text>
            </View>
          )}
          {customer.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{customer.email}</Text>
            </View>
          )}
          {customer.nip && (
            <View style={styles.row}>
              <Text style={styles.label}>NIP</Text>
              <Text style={styles.value}>{customer.nip}</Text>
            </View>
          )}
        </View>

        {/* Right column — vehicle */}
        <View style={styles.column}>
          <View style={styles.row}>
            <Text style={styles.label}>Pojazd</Text>
            <Text style={styles.value}>{vehicleLabel}</Text>
          </View>
          {paintLabel && (
            <View style={styles.row}>
              <Text style={styles.label}>Kolor lakieru</Text>
              <Text style={styles.value}>{paintLabel}</Text>
            </View>
          )}
          {vehicle.plate && (
            <View style={styles.row}>
              <Text style={styles.label}>Rejestracja</Text>
              <Text style={styles.value}>{vehicle.plate}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
