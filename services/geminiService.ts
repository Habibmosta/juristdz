
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_RESEARCH, SYSTEM_INSTRUCTION_DRAFTING, SYSTEM_INSTRUCTION_ANALYSIS } from "../constants";
import { AppMode, Language } from "../types";

export interface ChatResponse {
  text: string;
  citations?: { uri: string; title: string }[];
}

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] }[],
  mode: AppMode = AppMode.RESEARCH,
  language: Language = 'fr',
  imageAttachment?: { mimeType: string; data: string }
): Promise<ChatResponse> => {
  try {
    const modelId = 'gemini-3-pro-preview'; 
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let baseInstruction = SYSTEM_INSTRUCTION_RESEARCH;
    let temperature = 0.4;
    let tools: any[] = [{ googleSearch: {} }];

    switch (mode) {
      case AppMode.DRAFTING:
        baseInstruction = SYSTEM_INSTRUCTION_DRAFTING;
        temperature = 0.2;
        break;
      case AppMode.ANALYSIS:
        baseInstruction = SYSTEM_INSTRUCTION_ANALYSIS;
        temperature = 0.1;
        break;
      default:
        baseInstruction = SYSTEM_INSTRUCTION_RESEARCH;
        temperature = 0.5;
        break;
    }

    const langInstruction = language === 'ar' 
      ? "\nIMPORTANT : Réponds en ARABE JURIDIQUE ALGÉRIEN. Utilise le vocabulaire officiel utilisé dans les tribunaux d'Algérie." 
      : "\nIMPORTANT : Réponds en FRANÇAIS JURIDIQUE ALGÉRIEN. Fais référence au JORA (Journal Officiel).";

    const systemInstruction = baseInstruction + langInstruction + "\nUtilise ta capacité de raisonnement pour vérifier la hiérarchie des normes.";

    const currentParts: any[] = [{ text: message }];
    
    if (imageAttachment) {
      currentParts.unshift({
        inlineData: {
          mimeType: imageAttachment.mimeType,
          data: imageAttachment.data
        }
      });
    }

    const contents = [
      ...history,
      { role: 'user', parts: currentParts }
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
        temperature: temperature,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    const text = response.text || (language === 'ar' ? "عذراً، لم أتمكن من إنشاء إجابة." : "Désolé, je n'ai pas pu générer de réponse.");
    
    const citations: { uri: string; title: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          citations.push({
            uri: chunk.web.uri,
            title: chunk.web.title
          });
        }
      });
    }

    return { text, citations };

  } catch (error) {
    console.error("Error calling Gemini:", error);
    return { text: language === 'ar' 
      ? "حدث خطأ في الاتصال. يرجى التأكد من أن الجلسة ما زالت نشطة." 
      : "Erreur de session. Veuillez rafraîchir la page si le lien a expiré." 
    };
  }
};
