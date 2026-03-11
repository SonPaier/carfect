export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number; // 0-4
  label: string; // i18n key
  color: string; // tailwind color class
}

/**
 * Calculate password strength score (0-4)
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: 'empty', score: 0, label: 'password.strength.empty', color: '' };
  }

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const charTypes = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (charTypes >= 2) score += 1;
  if (charTypes >= 3) score += 1;
  if (charTypes === 4) score += 1;

  // Unique characters bonus
  const uniqueRatio = new Set(password.toLowerCase()).size / password.length;
  if (uniqueRatio > 0.7) score += 1;

  // Penalties
  if (/^[a-zA-Z]+$/.test(password)) score -= 1; // only letters
  if (/^\d+$/.test(password)) score -= 2; // only digits
  if (/(.)\1{2,}/.test(password)) score -= 1; // repeated chars

  // Normalize to 0-4
  const normalizedScore = Math.max(0, Math.min(4, Math.round(score * 4 / 7)));

  const levels: Record<number, Omit<PasswordStrengthResult, 'score'>> = {
    0: { level: 'weak', label: 'password.strength.weak', color: 'bg-destructive' },
    1: { level: 'weak', label: 'password.strength.weak', color: 'bg-destructive' },
    2: { level: 'fair', label: 'password.strength.fair', color: 'bg-orange-500' },
    3: { level: 'good', label: 'password.strength.good', color: 'bg-yellow-500' },
    4: { level: 'strong', label: 'password.strength.strong', color: 'bg-green-500' },
  };

  const levelInfo = levels[normalizedScore];
  return { ...levelInfo, score: normalizedScore };
}
