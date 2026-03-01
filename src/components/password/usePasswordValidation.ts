import { useState, useMemo, useCallback } from 'react';
import { validatePassword, passwordsMatch, type PasswordValidationResult } from './passwordValidation';
import { calculatePasswordStrength, type PasswordStrengthResult } from './passwordStrength';

interface UsePasswordValidationOptions {
  username?: string;
}

interface UsePasswordValidationReturn {
  password: string;
  confirmPassword: string;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  validation: PasswordValidationResult;
  strength: PasswordStrengthResult;
  confirmMatch: boolean;
  isFormValid: boolean;
  reset: () => void;
}

export function usePasswordValidation(
  options: UsePasswordValidationOptions = {},
): UsePasswordValidationReturn {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validation = useMemo(
    () => validatePassword(password, options.username),
    [password, options.username],
  );

  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  );

  const confirmMatch = useMemo(
    () => passwordsMatch(password, confirmPassword),
    [password, confirmPassword],
  );

  const isFormValid = validation.isValid && confirmMatch;

  const reset = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
  }, []);

  return {
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    validation,
    strength,
    confirmMatch,
    isFormValid,
    reset,
  };
}
