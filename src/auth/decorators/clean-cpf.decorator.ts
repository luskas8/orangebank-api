import { Transform } from 'class-transformer';

/**
 * Decorator to clean CPF field by removing special characters
 * Removes dots, hyphens, and spaces from CPF string
 */
export function CleanCpf() {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      // Remove dots, hyphens, and spaces
      return value.replace(/[.\-\s]/g, '');
    }
    return value as string;
  });
}
