import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { baseStyles } from '../styles';
import type { PdfTrustTile } from '../types';

interface PdfTrustTilesProps {
  tiles: PdfTrustTile[];
}

export function PdfTrustTiles({ tiles }: PdfTrustTilesProps) {
  if (!tiles || tiles.length === 0) return null;

  return (
    <View wrap={false} style={[baseStyles.section, baseStyles.trustTilesRow]}>
      {tiles.map((tile, index) => (
        <View key={index} style={baseStyles.trustTile}>
          <Text style={baseStyles.trustTileTitle}>{tile.title}</Text>
          <Text style={baseStyles.trustTileDescription}>{tile.description}</Text>
        </View>
      ))}
    </View>
  );
}
