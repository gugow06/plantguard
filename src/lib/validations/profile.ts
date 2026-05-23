import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(80).optional(),
  email: z.string().email('Email inválido').optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const setPasswordSchema = z.object({
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const updateImageSchema = z.object({
  image: z
    .string()
    .max(700_000, 'Imagem muito grande (limite ~500KB)')
    .nullable()
    .refine(
      (val) => val === null || /^data:image\/(png|jpe?g|webp);base64,/.test(val),
      { message: 'Formato de imagem inválido' },
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
