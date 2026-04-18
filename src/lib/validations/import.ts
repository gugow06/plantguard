import { z } from 'zod';

export const importRowSchema = z.object({
  imageName: z.string().min(1, 'Nome da imagem é obrigatório').max(255),
  status: z.enum(['Saudável', 'Doente', 'Inconclusivo'], {
    error: 'Status deve ser Saudável, Doente ou Inconclusivo',
  }),
  plantType: z.string().optional().nullable(),
  pathology: z.string().optional().nullable(),
  confidence: z.coerce.number().min(0).max(100),
  description: z.string().optional().default('Importado via CSV/JSON'),
  recommendations: z.string().optional().default(''),
  createdAt: z.coerce.date().optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;
