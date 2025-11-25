import { describe, it, expect } from 'vitest';
import { ValidationService } from '../../services/ValidationService';

describe('ValidationService', () => {
  describe('validatePasswordStrength', () => {
    it('should reject passwords that are too short', () => {
      const result = ValidationService.validatePasswordStrength('abc123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = ValidationService.validatePasswordStrength('password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = ValidationService.validatePasswordStrength('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = ValidationService.validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = ValidationService.validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept valid passwords', () => {
      const result = ValidationService.validatePasswordStrength('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept complex passwords', () => {
      const result = ValidationService.validatePasswordStrength('MySecureP@ssw0rd!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      const result = ValidationService.sanitizeInput('  test  ');
      expect(result).toBe('test');
    });

    it('should remove HTML tags', () => {
      const result = ValidationService.sanitizeInput('<script>alert("xss")</script>');
      expect(result).toBe('alert("xss")');
    });

    it('should remove JavaScript protocols', () => {
      const result = ValidationService.sanitizeInput('javascript:alert("xss")');
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const result = ValidationService.sanitizeInput('onclick="alert("xss")"');
      expect(result).toBe('"alert("xss")"');
    });

    it('should remove data URIs', () => {
      const result = ValidationService.sanitizeInput('data:text/html,<script>alert("xss")</script>');
      expect(result).toBe(':text/html,<script>alert("xss")</script>');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(ValidationService.validateEmail('test@example.com')).toBe(true);
      expect(ValidationService.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(ValidationService.validateEmail('invalid-email')).toBe(false);
      expect(ValidationService.validateEmail('@example.com')).toBe(false);
      expect(ValidationService.validateEmail('test@')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should accept valid phone numbers', () => {
      expect(ValidationService.validatePhoneNumber('+1234567890')).toBe(true);
      expect(ValidationService.validatePhoneNumber('(123) 456-7890')).toBe(true);
      expect(ValidationService.validatePhoneNumber('123 456 7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(ValidationService.validatePhoneNumber('abc-def-ghi')).toBe(false);
      expect(ValidationService.validatePhoneNumber('1234567890123456')).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize strings in objects', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        age: 30,
        email: 'test@example.com'
      };

      const result = ValidationService.sanitizeObject(input);

      expect(result.name).toBe('alert("xss")');
      expect(result.age).toBe(30);
      expect(result.email).toBe('test@example.com');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          details: {
            notes: '<script>alert("xss")</script>'
          }
        },
        tags: ['<tag1>', '<tag2>']
      };

      const result = ValidationService.sanitizeObject(input);

      expect(result.user.name).toBe('<b>John</b>');
      expect(result.user.details.notes).toBe('alert("xss")');
      expect(result.tags[0]).toBe('<tag1>');
      expect(result.tags[1]).toBe('<tag2>');
    });

    it('should handle arrays', () => {
      const input = [
        'item1<script>',
        'item2<script>',
        'item3'
      ];

      const result = ValidationService.sanitizeObject(input);

      expect(result[0]).toBe('item1');
      expect(result[1]).toBe('item2');
      expect(result[2]).toBe('item3');
    });
  });
});