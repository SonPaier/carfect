import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { baseStyles } from '../styles';

interface PdfHeaderProps {
  offerNumber: string;
  logoBuffer?: Buffer | null;
  accentColor: string;
}

export function PdfHeader({ offerNumber, logoBuffer, accentColor }: PdfHeaderProps) {
  return (
    <>
      <View fixed style={baseStyles.header}>
        {logoBuffer ? (
          <Image src={{ data: logoBuffer, format: 'png' }} style={baseStyles.headerLogo} />
        ) : (
          <View />
        )}
        <Text style={baseStyles.headerOfferNumber}>Oferta nr {offerNumber}</Text>
      </View>
      <View
        fixed
        style={[baseStyles.headerSeparator, { backgroundColor: accentColor }]}
      />
    </>
  );
}
