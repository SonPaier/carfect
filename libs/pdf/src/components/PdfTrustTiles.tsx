import React from 'react';
import { View, Text, Svg, Path, Circle, Polygon, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';
import type { PdfTrustTile } from '../types';

// Lucide-style SVG icon paths (24x24 viewBox) — color applied dynamically
function getIconPaths(color: string): Record<string, React.ReactNode> {
  return {
    star: (
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} fill="none" strokeWidth={1.5} />
    ),
    shield: (
      <>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 12l2 2 4-4" stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    sparkles: (
      <>
        <Path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" stroke={color} fill="none" strokeWidth={1.5} strokeLinejoin="round" />
        <Path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" stroke={color} fill="none" strokeWidth={1.2} strokeLinejoin="round" />
      </>
    ),
    award: (
      <>
        <Circle cx="12" cy="8" r="6" stroke={color} fill="none" strokeWidth={1.5} />
        <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    heart: (
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    ),
    car: (
      <>
        <Path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2" stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="7.5" cy="17" r="1.5" stroke={color} fill="none" strokeWidth={1.5} />
        <Circle cx="16.5" cy="17" r="1.5" stroke={color} fill="none" strokeWidth={1.5} />
      </>
    ),
  };
}

function TrustIcon({ name, color }: { name: string; color: string }) {
  const icons = getIconPaths(color);
  const paths = icons[name];
  if (!paths) return null;
  return (
    <Svg viewBox="0 0 24 24" style={styles.icon}>
      {paths}
    </Svg>
  );
}

interface PdfTrustTilesProps {
  tiles: PdfTrustTile[];
  accentColor: string;
}

export function PdfTrustTiles({ tiles, accentColor }: PdfTrustTilesProps) {
  if (!tiles || tiles.length === 0) return null;

  // Split into rows of 3
  const rows: PdfTrustTile[][] = [];
  for (let i = 0; i < tiles.length; i += 3) {
    rows.push(tiles.slice(i, i + 3));
  }

  return (
    <View style={[baseStyles.section, styles.container]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((tile, colIndex) => (
            <View key={colIndex} style={styles.tile}>
              <View style={styles.tileHeader}>
                <TrustIcon name={tile.icon} color={accentColor} />
                <Text style={styles.tileTitle}>{tile.title}</Text>
              </View>
              <Text style={styles.tileDescription}>{tile.description}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  tile: {
    flex: 1,
    padding: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 3,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  icon: {
    width: 12,
    height: 12,
  },
  tileTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#111111',
    flex: 1,
  },
  tileDescription: {
    fontSize: 6.5,
    color: '#666666',
    lineHeight: 1.3,
  },
});
