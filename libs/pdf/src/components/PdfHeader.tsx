import React from 'react';
import { View, Text, Image, Link } from '@react-pdf/renderer';
import { baseStyles } from '../styles';

interface PdfHeaderProps {
  /** Bold instance name shown next to the logo. */
  companyName?: string;
  /** Subtitle under the company name — "Oferta nr X" for offers. */
  offerNumber?: string;
  /** Optional override for the subtitle (e.g. instruction PDF passes title). */
  subtitle?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyWebsite?: string;
  logoBuffer?: Buffer | null;
  accentColor: string;
}

const styles = {
  leftBlock: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  textBlock: {
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: '#111111',
  },
  subtitle: {
    fontSize: 8,
    color: '#555555',
    marginTop: 1,
  },
  rightBlock: {
    flexDirection: 'column' as const,
    alignItems: 'flex-end' as const,
    fontSize: 8,
    color: '#444444',
  },
  rightLine: {
    marginBottom: 1,
  },
};

export function PdfHeader({
  companyName,
  offerNumber,
  subtitle,
  companyPhone,
  companyEmail,
  companyAddress,
  companyWebsite,
  logoBuffer,
  accentColor,
}: PdfHeaderProps) {
  const subtitleLabel = subtitle ?? (offerNumber ? `Oferta nr ${offerNumber}` : null);
  const websiteHref =
    companyWebsite && /^https?:\/\//i.test(companyWebsite) ? companyWebsite : null;

  return (
    <>
      <View fixed style={baseStyles.header}>
        <View style={styles.leftBlock}>
          {logoBuffer ? (
            <Image src={{ data: logoBuffer, format: 'png' }} style={baseStyles.headerLogo} />
          ) : null}
          {(companyName || subtitleLabel) && (
            <View style={styles.textBlock}>
              {companyName ? <Text style={styles.companyName}>{companyName}</Text> : null}
              {subtitleLabel ? <Text style={styles.subtitle}>{subtitleLabel}</Text> : null}
            </View>
          )}
        </View>
        <View style={styles.rightBlock}>
          {companyPhone ? (
            <Text style={styles.rightLine}>
              <Link src={`tel:${companyPhone}`}>{companyPhone}</Link>
            </Text>
          ) : null}
          {companyEmail ? (
            <Text style={styles.rightLine}>
              <Link src={`mailto:${companyEmail}`}>{companyEmail}</Link>
            </Text>
          ) : null}
          {companyAddress ? <Text style={styles.rightLine}>{companyAddress}</Text> : null}
          {websiteHref ? (
            <Text style={styles.rightLine}>
              <Link src={websiteHref}>{companyWebsite}</Link>
            </Text>
          ) : null}
        </View>
      </View>
      <View fixed style={[baseStyles.headerSeparator, { backgroundColor: accentColor }]} />
    </>
  );
}
