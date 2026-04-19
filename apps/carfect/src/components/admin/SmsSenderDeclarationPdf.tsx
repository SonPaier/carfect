import React from 'react';
import { useTranslation } from 'react-i18next';
import { Document, Page, Text, View, Font, pdf, StyleSheet } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

Font.registerHyphenationCallback((word: string) => [word]);

export interface DeclarationData {
  billingName: string;
  billingStreet: string;
  billingPostalCode: string;
  billingCity: string;
  billingNip: string;
  senderName: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 11,
    paddingTop: 60,
    paddingBottom: 60,
    paddingLeft: 72,
    paddingRight: 72,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
  },
  cityDate: {
    textAlign: 'right',
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  block: {
    marginBottom: 20,
  },
  line: {
    marginBottom: 4,
  },
  declarationTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  declarationSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  senderName: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  signatureBlock: {
    marginTop: 48,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    width: 240,
    marginTop: 48,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
  },
});

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

interface DeclarationDocumentProps {
  data: DeclarationData;
}

const DeclarationDocument: React.FC<DeclarationDocumentProps> = ({ data }) => {
  const today = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cityDate}>
          <Text>
            {data.billingCity} dn. {today}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{t('smsDeclaration.ownerData')}</Text>
          <Text style={styles.line}>{data.billingName}</Text>
          <Text style={styles.line}>{data.billingStreet}</Text>
          <Text style={styles.line}>
            {data.billingPostalCode} {data.billingCity}
          </Text>
          <Text style={styles.line}>NIP: {data.billingNip}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.declarationTitle}>{t('smsDeclaration.declaration')}</Text>
          <Text style={styles.declarationSubtitle}>
            {t('smsDeclaration.consentText')}
          </Text>

          <Text style={styles.line}>
            {t('smsDeclaration.actingOnBehalf', { company: data.billingName })}
          </Text>
          <Text style={styles.line}>
            {t('smsDeclaration.consentStatement')}
          </Text>

          <Text style={styles.senderName}>{data.senderName}</Text>

          <Text style={styles.line}>{t('smsDeclaration.byCompany')}</Text>
          <Text style={styles.line}>
            {t('smsDeclaration.purpose')}
          </Text>
        </View>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            {t('smsDeclaration.stampAndSignature')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateDeclarationPdf(data: DeclarationData): Promise<void> {
  const blob = await pdf(<DeclarationDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Oswiadczenie-nadpis-SMS-${data.senderName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
