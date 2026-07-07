const PASSWORD_MIN_LENGTH = 8;

export function getPasswordPolicyErrors(password, ci = '') {
  const errors = [];
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!/[A-Z]/.test(password || '')) {
    errors.push('Al menos una mayúscula');
  }
  if (!/[a-z]/.test(password || '')) {
    errors.push('Al menos una minúscula');
  }
  if (!/[0-9]/.test(password || '')) {
    errors.push('Al menos un número');
  }
  if (ci && password?.trim() === ci.trim()) {
    errors.push('No puede ser igual al CI');
  }
  return errors;
}

export function isPasswordPolicyValid(password, ci = '') {
  return getPasswordPolicyErrors(password, ci).length === 0;
}

export function getPasswordStrength(password, ci = '') {
  const errors = getPasswordPolicyErrors(password, ci);
  if (!password) return { level: 0, label: '', errors };
  if (errors.length === 0) return { level: 4, label: 'Fuerte', errors };
  if (errors.length <= 2) return { level: 2, label: 'Débil', errors };
  return { level: 1, label: 'Muy débil', errors };
}
