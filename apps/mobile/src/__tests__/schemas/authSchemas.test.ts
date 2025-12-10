import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  checkPasswordRequirements,
} from '@/schemas/authSchemas';

describe('authSchemas', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('rejects empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('accepts any non-empty password for login', () => {
      // Login schema doesn't enforce password strength
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'a',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('registerSchema', () => {
    const validRegistration = {
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
      acceptTerms: true as const,
    };

    it('validates complete valid registration', () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('rejects password under 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'Te1!',
        confirmPassword: 'Te1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('8 characters');
      }
    });

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'test123!@#',
        confirmPassword: 'test123!@#',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('uppercase');
      }
    });

    it('rejects password without lowercase', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'TEST123!@#',
        confirmPassword: 'TEST123!@#',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('lowercase');
      }
    });

    it('rejects password without digit', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'TestTest!@#',
        confirmPassword: 'TestTest!@#',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('digit');
      }
    });

    it('rejects password without special character', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'TestTest123',
        confirmPassword: 'TestTest123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('special character');
      }
    });

    it('rejects password over 128 characters', () => {
      const longPassword = 'Aa1!' + 'a'.repeat(126);
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('128');
      }
    });

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        confirmPassword: 'DifferentPass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(confirmError?.message).toContain('match');
      }
    });

    it('rejects without accepting terms', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
    });

    it('accepts password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_'];
      specialChars.forEach((char) => {
        const result = registerSchema.safeParse({
          ...validRegistration,
          password: `TestTest1${char}`,
          confirmPassword: `TestTest1${char}`,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('forgotPasswordSchema', () => {
    it('validates correct email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('checkPasswordRequirements', () => {
    it('returns all false for empty password', () => {
      const result = checkPasswordRequirements('');
      expect(result).toEqual({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasDigit: false,
        hasSpecial: false,
      });
    });

    it('returns minLength true for 8+ chars', () => {
      const result = checkPasswordRequirements('abcdefgh');
      expect(result.minLength).toBe(true);
    });

    it('returns minLength false for less than 8 chars', () => {
      const result = checkPasswordRequirements('abcdefg');
      expect(result.minLength).toBe(false);
    });

    it('returns hasUppercase true correctly', () => {
      expect(checkPasswordRequirements('A').hasUppercase).toBe(true);
      expect(checkPasswordRequirements('a').hasUppercase).toBe(false);
    });

    it('returns hasLowercase true correctly', () => {
      expect(checkPasswordRequirements('a').hasLowercase).toBe(true);
      expect(checkPasswordRequirements('A').hasLowercase).toBe(false);
    });

    it('returns hasDigit true correctly', () => {
      expect(checkPasswordRequirements('1').hasDigit).toBe(true);
      expect(checkPasswordRequirements('a').hasDigit).toBe(false);
    });

    it('returns hasSpecial true for various special chars', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '(', ')'];
      specialChars.forEach((char) => {
        expect(checkPasswordRequirements(char).hasSpecial).toBe(true);
      });
    });

    it('returns hasSpecial false for alphanumeric only', () => {
      expect(checkPasswordRequirements('abc123ABC').hasSpecial).toBe(false);
    });

    it('returns all true for valid password', () => {
      const result = checkPasswordRequirements('Test123!@');
      expect(result).toEqual({
        minLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasDigit: true,
        hasSpecial: true,
      });
    });
  });
});
