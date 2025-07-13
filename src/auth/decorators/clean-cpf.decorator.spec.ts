import { plainToClass } from 'class-transformer';
import { CleanCpf } from './clean-cpf.decorator';

describe('CleanCpf Decorator', () => {
  class TestDto {
    @CleanCpf()
    cpf: string;
  }

  it('should remove dots, hyphens, and spaces from CPF', () => {
    // Test various CPF formats
    const testCases = [
      { input: '123.456.789-09', expected: '12345678909' },
      { input: '123 456 789 09', expected: '12345678909' },
      { input: '123-456-789-09', expected: '12345678909' },
      { input: '123.456.789 09', expected: '12345678909' },
      { input: '12345678909', expected: '12345678909' }, // Already clean
      { input: '', expected: '' }, // Empty string
    ];

    testCases.forEach(({ input, expected }) => {
      const plain = { cpf: input };
      const transformed = plainToClass(TestDto, plain);
      expect(transformed.cpf).toBe(expected);
    });
  });

  it('should handle non-string values', () => {
    const testCases = [
      { input: null, expected: null },
      { input: undefined, expected: undefined },
    ];

    testCases.forEach(({ input, expected }) => {
      const plain = { cpf: input };
      const transformed = plainToClass(TestDto, plain);
      expect(transformed.cpf).toBe(expected);
    });
  });
});
