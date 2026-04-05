import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { baseStyles } from '../styles';

interface PdfTermsProps {
  validUntil?: string;
  paymentTerms?: string;
  warranty?: string;
  serviceInfo?: string;
  notes?: string;
}

export function PdfTerms({
  validUntil,
  paymentTerms,
  warranty,
  serviceInfo,
  notes,
}: PdfTermsProps) {
  const hasAny = validUntil || paymentTerms || warranty || serviceInfo || notes;
  if (!hasAny) return null;

  return (
    <View wrap={false} style={[baseStyles.section, baseStyles.termsSection]}>
      <Text style={baseStyles.termsTitle}>Warunki oferty</Text>
      {validUntil && (
        <>
          <Text style={baseStyles.termsSubtitle}>Ważność oferty</Text>
          <Text style={baseStyles.termsText}>{validUntil}</Text>
        </>
      )}
      {paymentTerms && (
        <>
          <Text style={baseStyles.termsSubtitle}>Warunki płatności</Text>
          <Text style={baseStyles.termsText}>{paymentTerms}</Text>
        </>
      )}
      {warranty && (
        <>
          <Text style={baseStyles.termsSubtitle}>Gwarancja</Text>
          <Text style={baseStyles.termsText}>{warranty}</Text>
        </>
      )}
      {serviceInfo && (
        <>
          <Text style={baseStyles.termsSubtitle}>Serwis</Text>
          <Text style={baseStyles.termsText}>{serviceInfo}</Text>
        </>
      )}
      {notes && (
        <>
          <Text style={baseStyles.termsSubtitle}>Uwagi</Text>
          <Text style={baseStyles.termsText}>{notes}</Text>
        </>
      )}
    </View>
  );
}
