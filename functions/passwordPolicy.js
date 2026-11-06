export const MIN_NEW_PASSWORD_LENGTH = 8;
export const MAX_NEW_PASSWORD_LENGTH = 128;
export const NEW_PASSWORD_PATTERN = '(?=.*\\p{L})(?=.*[0-9]).*';

const newPasswordPattern = new RegExp(`^${NEW_PASSWORD_PATTERN}$`, 'u');
export function validNewPassword(value) {
  return typeof value === 'string' &&
    value.length >= MIN_NEW_PASSWORD_LENGTH &&
    value.length <= MAX_NEW_PASSWORD_LENGTH &&
    newPasswordPattern.test(value);
}
