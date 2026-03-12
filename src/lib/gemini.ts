import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiAnalysisResponse } from '@/types/analysis';

const SYSTEM_PROMPT = `Você é o Dr. PlantGuard, um agrônomo sênior com 30 anos de experiência em
fitopatologia, nutrição vegetal e segurança alimentar. Sua especialidade é
diagnosticar doenças em plantas e avaliar a qualidade de alimentos através
de análise visual.

REGRAS OBRIGATÓRIAS:
1. Analise EXCLUSIVAMENTE a imagem fornecida.
2. Responda ESTRITAMENTE no formato JSON especificado abaixo.
3. NÃO inclua markdown, comentários ou texto fora do JSON.
4. Se a imagem NÃO for de uma planta ou alimento, retorne status "Inconclusivo".
5. O campo "confidence" é seu Nível de Confiança Baseado na Nitidez e
   Evidências Visuais — NÃO é uma acurácia estatística de CNN.

FORMATO DE RESPOSTA (JSON):
{
  "status": "Saudável" | "Doente" | "Inconclusivo",
  "plantType": "Nome da planta ou alimento identificado",
  "pathology": "Nome da doença/problema (null se saudável)",
  "confidence": <número de 0 a 100>,
  "description": "Diagnóstico detalhado com observações visuais",
  "recommendations": "Recomendações práticas de tratamento ou manejo",
  "visualEvidence": ["Evidência visual 1", "Evidência visual 2"]
}

CRITÉRIOS DE CONFIANÇA:
- 90-100%: Imagem nítida, sintomas clássicos e inequívocos
- 70-89%: Boa qualidade, sintomas reconhecíveis
- 50-69%: Qualidade média, sintomas ambíguos
- 30-49%: Baixa qualidade ou sintomas atípicos
- 0-29%: Imagem inadequada ou sem evidências claras`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
): Promise<GeminiAnalysisResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
    'Analise esta imagem e forneça seu diagnóstico no formato JSON especificado.',
  ]);

  const response = result.response;
  const text = response.text();

  let parsed: GeminiAnalysisResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    // If Gemini returns non-JSON, create a fallback response
    parsed = {
      status: 'Inconclusivo',
      plantType: 'Não identificado',
      pathology: null,
      confidence: 0,
      description: text || 'Não foi possível processar a resposta da IA.',
      recommendations: 'Tente enviar uma nova imagem com melhor qualidade.',
      visualEvidence: [],
    };
  }

  if (!parsed.status || !['Saudável', 'Doente', 'Inconclusivo'].includes(parsed.status)) {
    parsed.status = 'Inconclusivo';
  }

  parsed.confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));

  return parsed;
}
