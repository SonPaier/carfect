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
  name: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contact: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 1,
  },
});

interface PdfExpertContactProps {
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export function PdfExpertContact({ contactPerson, phone, email }: PdfExpertContactProps) {
  const hasAny = contactPerson || phone || email;
  if (!hasAny) return null;

  return (
    <View wrap={false} style={baseStyles.section}>
      <Text style={styles.label}>Opiekun klienta</Text>
      {contactPerson && <Text style={styles.name}>{contactPerson}</Text>}
      {phone && <Text style={styles.contact}>{phone}</Text>}
      {email && <Text style={styles.contact}>{email}</Text>}
    </View>
  );
}
