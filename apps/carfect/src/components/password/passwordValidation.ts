import { isCommonPassword } from './commonPasswords';

export interface PasswordRequirement {
  key: string;
  met: boolean;
}

export interface PasswordValidationResult {
  requirements: PasswordRequirement[];
  isValid: boolean;
  errors: string[];
}

// Sequential keyboard patterns to block
const KEYBOARD_SEQUENCES = [
  'qwerty', 'qwertz', 'asdfgh', 'zxcvbn', 'qweasd', '1qaz2wsx',
  'qazwsx', 'zaq1xsw2',
];

// Numeric sequences
const NUMERIC_SEQUENCES = [
  '123456', '234567', '345678', '456789', '567890',
  '098765', '987654', '876543', '765432', '654321',
  '112233', '121212', '131313', '232323',
];

// Alphabetic sequences
const ALPHA_SEQUENCES = ['abcdef', 'abcabc'];

const ALL_SEQUENCES = [...KEYBOARD_SEQUENCES, ...NUMERIC_SEQUENCES, ...ALPHA_SEQUENCES];

function hasSequence(password: string): boolean {
  const lower = password.toLowerCase();
  return ALL_SEQUENCES.some(seq => lower.includes(seq));
}

function hasRepeatingChars(password: string, maxRepeat = 3): boolean {
  const regex = new RegExp(`(.)\\1{${maxRepeat - 1},}`);
  return regex.test(password);
}

/**
 * Validate password against all requirements.
 * @param password - The password to validate
 * @param username - Optional username to check password doesn't contain it
 */
export function validatePassword(
  password: string,
  username?: string,
): PasswordValidationResult {
  const requirements: PasswordRequirement[] = [
    { key: 'minLength', met: password.length >= 8 },
    { key: 'hasUppercase', met: /[A-Z]/.test(password) },
    { key: 'hasLowercase', met: /[a-z]/.test(password) },
    { key: 'hasNumber', met: /\d/.test(password) },
    { key: 'hasSpecial', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
    { key: 'noSequence', met: !hasSequence(password) },
    { key: 'noRepeating', met: !hasRepeatingChars(password) },
    { key: 'notCommon', met: password.length === 0 || !isCommonPassword(password) },
  ];

  // Check if password contains username (case-insensitive)
  if (username && username.length >= 3 && password.length > 0) {
    const containsUsername = password.toLowerCase().includes(username.toLowerCase());
    requirements.push({ key: 'noUsername', met: !containsUsername });
  }

  const errors = requirements.filter(r => !r.met).map(r => r.key);
  const isValid = password.length > 0 && requirements.every(r => r.met);

  return { requirements, isValid, errors };
}

/**
 * Check if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}
