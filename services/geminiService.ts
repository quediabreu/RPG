import { GoogleGenAI, Type } from "@google/genai";
import { AttributeType } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateQuestIdeas = async (
  userLevel: number,
  focusAttribute: AttributeType
): Promise<Array<{ title: string; description: string; difficulty: string }>> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return [
      { title: "Missão Manual", description: "Chave de API ausente. Crie uma missão manualmente.", difficulty: "Easy" }
    ];
  }

  try {
    const prompt = `
      Gere 3 desafios de hábitos diários no estilo RPG para um usuário que quer melhorar seu atributo: ${focusAttribute}.
      O usuário é Nível ${userLevel}.
      O idioma do conteúdo DEVE ser Português do Brasil.
      Retorne o resultado como um array JSON.
      A dificuldade (difficulty) deve ser estritamente uma destas strings em inglês (para compatibilidade de código): "Easy", "Medium", "Hard".
      O título e a descrição devem ser criativos e em português.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
            },
            required: ["title", "description", "difficulty"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quests:", error);
    return [];
  }
};

export const getAiCoaching = async (stats: Record<string, number>): Promise<string> => {
  if (!apiKey) return "Configure a Chave de API para receber conselhos.";

  try {
    const prompt = `
      Atue como um Mestre de Guilda RPG. Analise os status deste usuário e dê um conselho motivacional curto (2 frases)
      sobre o que ele deve focar para equilibrar suas habilidades.
      Responda em Português do Brasil.
      Status: ${JSON.stringify(stats)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Continue avançando, aventureiro!";
  } catch (error) {
    console.error("Error fetching coaching:", error);
    return "O Mestre da Guilda está em silêncio (Erro ao conectar com a IA).";
  }
};