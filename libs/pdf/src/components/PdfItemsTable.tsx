import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';
import type { PdfScope } from '../types';

const styles = StyleSheet.create({
  scopeHeaderAccent: {
    borderBottomWidth: 1.5,
    paddingBottom: 6,
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 20,
  },
  itemName: {
    fontSize: 11,
    color: '#111111',
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 8,
    color: '#555555',
    marginTop: 4,
    lineHeight: 1.5,
  },
  optionalBadge: {
    fontSize: 8,
    color: '#333333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  itemPrice: {
    fontSize: 12,
    color: '#111111',
    fontWeight: 'bold',
  },
  itemVat: {
    fontSize: 7,
    color: '#888888',
    marginTop: 1,
  },
  itemDiscount: {
    fontSize: 7,
    color: '#999999',
    marginTop: 1,
  },
});

interface PdfItemsTableProps {
  scope: PdfScope;
  hideUnitPrices: boolean;
  scopeIndex: number;
  accentColor: string;
}

export function PdfItemsTable({
  scope,
  hideUnitPrices,
  scopeIndex,
  accentColor,
}: PdfItemsTableProps) {
  return (
    <View
      wrap={true}
      minPresenceAhead={60}
      style={[baseStyles.section, scopeIndex > 0 ? { marginTop: 4 } : {}]}
    >
      <View
        style={[
          baseStyles.scopeHeader,
          styles.scopeHeaderAccent,
          { borderBottomColor: accentColor },
        ]}
      >
        <View style={baseStyles.scopeHeaderText}>
          <Text style={baseStyles.scopeName}>{scope.name}</Text>
          {scope.description ? (
            <Text style={baseStyles.scopeDescription}>{scope.description}</Text>
          ) : null}
        </View>
        {scope.photoUrl ? (
          <Image src={scope.photoUrl} style={baseStyles.scopePhoto} cache={true} />
        ) : null}
      </View>

      {scope.items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
            {item.isOptional && <Text style={styles.optionalBadge}>Opcja</Text>}
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemPrice}>
              {item.total === 0 ? 'Gratis!' : `${item.total.toFixed(2)} zł`}
            </Text>
            {item.total > 0 && <Text style={styles.itemVat}>+ 23% VAT</Text>}
            {!hideUnitPrices && item.discountPercent > 0 && (
              <Text style={styles.itemDiscount}>rabat {item.discountPercent}%</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
