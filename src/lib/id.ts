import { customAlphabet } from 'nanoid';

const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateId = customAlphabet(alphanumeric, 10);

/** Generate a stable deck id: alphanumeric only, same length as uploaded image filenames. */
export function generateDeckId(): string {
  return generateId();
}
