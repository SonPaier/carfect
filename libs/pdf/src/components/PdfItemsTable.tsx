import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { baseStyles } from '../styles';
import type { PdfScope } from '../types';

const styles = StyleSheet.create({
  scopeHeaderAccent: {
    borderBottomWidth: 1.5,
    paddingBottom: 6,
    marginBottom: 6,
  },
  lp: { width: 20, fontSize: 8 },
  number: { fontSize: 8 },
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
  const allowWrap = scope.items.length > 8;

  return (
    <View
      wrap={allowWrap}
      minPresenceAhead={allowWrap ? 80 : undefined}
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

      <View style={baseStyles.tableHeader}>
        <Text style={styles.lp}>Lp.</Text>
        <Text style={baseStyles.tableColName}>Nazwa</Text>
        <Text style={baseStyles.tableColQty}>Ilość</Text>
        {!hideUnitPrices && <Text style={baseStyles.tableColUnitPrice}>Cena jedn.</Text>}
        {!hideUnitPrices && <Text style={baseStyles.tableColDiscount}>Rabat</Text>}
        <Text style={baseStyles.tableColTotal}>Wartość</Text>
      </View>

      {scope.items.map((item, index) => (
        <View key={item.id} style={baseStyles.tableRow}>
          <Text style={[styles.lp, styles.number]}>{index + 1}.</Text>
          <View style={baseStyles.tableColName}>
            <Text style={{ fontSize: 9 }}>{item.name}</Text>
            {item.isOptional && <Text style={baseStyles.optionalBadge}>(opcjonalnie)</Text>}
          </View>
          <Text style={baseStyles.tableColQty}>{item.quantity}</Text>
          {!hideUnitPrices && (
            <Text style={baseStyles.tableColUnitPrice}>{item.unitPrice.toFixed(2)} zł</Text>
          )}
          {!hideUnitPrices && (
            <Text style={baseStyles.tableColDiscount}>
              {item.discountPercent ? `${item.discountPercent}%` : '—'}
            </Text>
          )}
          <Text style={baseStyles.tableColTotal}>{item.total.toFixed(2)} zł</Text>
        </View>
      ))}
    </View>
  );
}
