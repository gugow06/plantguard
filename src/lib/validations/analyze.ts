import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BASE64_SIZE = 10 * 1024 * 1024 * 1.37; // ~10MB in base64

export const analyzeSchema = z.object({
  image: z
    .string()
    .min(1, 'Imagem é obrigatória')
    .max(MAX_BASE64_SIZE, 'Imagem deve ter no máximo 10MB'),
  mimeType: z.enum(ALLOWED_MIME_TYPES, { error: 'Formato inválido. Use JPEG, PNG ou WebP.' }),
  imageName: z.string().min(1, 'Nome do arquivo é obrigatório').max(255),
});

export type AnalyzeInput = z.infer<typeof analyzeSchema>;
