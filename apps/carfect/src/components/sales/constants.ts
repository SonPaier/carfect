export const VAT_RATE = 0.23;
export const CUSTOMER_SEARCH_MIN_LENGTH = 2;

export const formatCurrency = (value: number) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
