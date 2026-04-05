import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { baseStyles } from './styles';
import type { PdfConfig } from './styles';
import type { PdfOfferData, PdfInstanceData } from './types';
import { PdfHeader } from './components/PdfHeader';
import { PdfFooter } from './components/PdfFooter';
import { PdfCustomerSection } from './components/PdfCustomerSection';
import { PdfTrustTiles } from './components/PdfTrustTiles';
import { PdfItemsTable } from './components/PdfItemsTable';
import { PdfSummary } from './components/PdfSummary';
import { PdfTerms } from './components/PdfTerms';
import { PdfBankAccount } from './components/PdfBankAccount';
import { PdfExpertContact } from './components/PdfExpertContact';

export interface OfferPdfDocumentProps {
  offer: PdfOfferData;
  instance: PdfInstanceData;
  config: PdfConfig;
  logoBuffer?: Buffer | null;
}

export function OfferPdfDocument({ offer, instance, config, logoBuffer }: OfferPdfDocumentProps) {
  const trustTiles = instance.trustTiles && instance.trustTiles.length > 0
    ? instance.trustTiles
    : null;

  return (
    <Document title={`Oferta ${offer.offerNumber}`} language="pl">
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader
          offerNumber={offer.offerNumber}
          logoBuffer={logoBuffer}
          accentColor={config.accentColor}
        />

        {offer.customerData && offer.vehicleData && (
          <PdfCustomerSection
            customer={offer.customerData}
            vehicle={offer.vehicleData}
          />
        )}

        {config.showTrustTiles && trustTiles && (
          <PdfTrustTiles tiles={trustTiles} />
        )}

        {offer.scopes.map((scope, index) => (
          <PdfItemsTable
            key={scope.key}
            scope={scope}
            hideUnitPrices={offer.hideUnitPrices}
            scopeIndex={index}
            accentColor={config.accentColor}
          />
        ))}

        <PdfSummary
          totalNet={offer.totalNet}
          totalGross={offer.totalGross}
          vatRate={offer.vatRate}
        />

        <PdfTerms
          validUntil={offer.validUntil}
          paymentTerms={offer.paymentTerms}
          warranty={offer.warranty}
          serviceInfo={offer.serviceInfo}
          notes={offer.notes}
        />

        {config.showBankAccount && (
          <PdfBankAccount
            companyName={instance.bankCompanyName ?? config.companyName}
            bankAccountNumber={instance.bankAccountNumber}
          />
        )}

        {config.showExpertContact && (
          <PdfExpertContact
            contactPerson={instance.contactPerson}
            phone={instance.phone ?? config.companyPhone}
            email={instance.email ?? config.companyEmail}
          />
        )}

        <PdfFooter
          companyName={config.companyName}
          companyPhone={config.companyPhone}
          companyEmail={config.companyEmail}
        />
      </Page>
    </Document>
  );
}
