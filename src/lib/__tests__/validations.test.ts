import { describe, expect, it } from 'vitest';
import { importRowSchema } from '@/lib/validations/import';
import { loginSchema, registerSchema } from '@/lib/validations/auth';

describe('importRowSchema (CSV/JSON importado)', () => {
  it('aceita linha válida e converte a confiança de texto para número', () => {
    const row = importRowSchema.parse({ imageName: 'a.jpg', status: 'Doente', confidence: '87.5' });
    expect(row.confidence).toBe(87.5);
    expect(row.description).toBe('Importado via CSV/JSON');
  });

  it('rejeita status fora do domínio e confiança fora de 0–100', () => {
    expect(importRowSchema.safeParse({ imageName: 'a', status: 'Morta', confidence: 50 }).success).toBe(false);
    expect(importRowSchema.safeParse({ imageName: 'a', status: 'Doente', confidence: 101 }).success).toBe(false);
    expect(importRowSchema.safeParse({ imageName: 'a', status: 'Doente', confidence: -1 }).success).toBe(false);
  });

  it('rejeita nome de imagem vazio', () => {
    expect(importRowSchema.safeParse({ imageName: '', status: 'Doente', confidence: 50 }).success).toBe(false);
  });
});

describe('schemas de autenticação', () => {
  it('login exige e-mail válido e senha de 6+ caracteres', () => {
    expect(loginSchema.safeParse({ email: 'x@y.com', password: '123456' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'x', password: '123456' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'x@y.com', password: '123' }).success).toBe(false);
  });

  it('registro exige confirmação igual à senha', () => {
    const base = { name: 'Ana', email: 'ana@x.com', password: 'segredo1' };
    expect(registerSchema.safeParse({ ...base, confirmPassword: 'segredo1' }).success).toBe(true);
    const bad = registerSchema.safeParse({ ...base, confirmPassword: 'outra123' });
    expect(bad.success).toBe(false);
  });
});
