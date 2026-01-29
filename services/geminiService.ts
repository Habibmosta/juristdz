
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
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    // Priorité : Groq (gratuit) > OpenAI > Gemini
    if (groqApiKey && groqApiKey !== 'PLACEHOLDER_API_KEY') {
      return await sendMessageToGroq(message, history, mode, language);
    } else if (openaiApiKey && openaiApiKey !== 'PLACEHOLDER_API_KEY') {
      return await sendMessageToOpenAI(message, history, mode, language);
    } else if (geminiApiKey && geminiApiKey !== 'PLACEHOLDER_API_KEY') {
      return await sendMessageToGeminiAPI(message, history, mode, language, imageAttachment);
    } else {
      return getDemoResponse(message, language);
    }
  } catch (error) {
    console.error("Error in AI service:", error);
    return { text: language === 'ar' 
      ? "حدث خطأ في خدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً." 
      : "Erreur du service IA. Veuillez réessayer plus tard." 
    };
  }
};

// Service Groq (Gratuit et rapide)
const sendMessageToGroq = async (
  message: string,
  history: any[],
  mode: AppMode,
  language: Language
): Promise<ChatResponse> => {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  let baseInstruction = SYSTEM_INSTRUCTION_RESEARCH;
  switch (mode) {
    case AppMode.DRAFTING:
      baseInstruction = SYSTEM_INSTRUCTION_DRAFTING;
      break;
    case AppMode.ANALYSIS:
      baseInstruction = SYSTEM_INSTRUCTION_ANALYSIS;
      break;
  }

  const langInstruction = language === 'ar' 
    ? "\nIMPORTANT : Réponds en ARABE JURIDIQUE ALGÉRIEN. Utilise le vocabulaire officiel utilisé dans les tribunaux d'Algérie." 
    : "\nIMPORTANT : Réponds en FRANÇAIS JURIDIQUE ALGÉRIEN. Fais référence au JORA (Journal Officiel).";

  const systemInstruction = baseInstruction + langInstruction;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts[0].text })),
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return { text: data.choices[0].message.content };
};

// Service OpenAI
const sendMessageToOpenAI = async (
  message: string,
  history: any[],
  mode: AppMode,
  language: Language
): Promise<ChatResponse> => {
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  let baseInstruction = SYSTEM_INSTRUCTION_RESEARCH;
  switch (mode) {
    case AppMode.DRAFTING:
      baseInstruction = SYSTEM_INSTRUCTION_DRAFTING;
      break;
    case AppMode.ANALYSIS:
      baseInstruction = SYSTEM_INSTRUCTION_ANALYSIS;
      break;
  }

  const langInstruction = language === 'ar' 
    ? "\nIMPORTANT : Réponds en ARABE JURIDIQUE ALGÉRIEN." 
    : "\nIMPORTANT : Réponds en FRANÇAIS JURIDIQUE ALGÉRIEN.";

  const systemInstruction = baseInstruction + langInstruction;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts[0].text })),
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return { text: data.choices[0].message.content };
};

// Service Gemini original
const sendMessageToGeminiAPI = async (
  message: string,
  history: { role: string; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] }[],
  mode: AppMode = AppMode.RESEARCH,
  language: Language = 'fr',
  imageAttachment?: { mimeType: string; data: string }
): Promise<ChatResponse> => {
  try {
    const modelId = 'gemini-1.5-flash'; 
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.warn('Mode démo activé - pas de vraie API');
      return { text: language === 'ar' 
        ? `**وضع العرض التوضيحي** - مرحباً، أنا JuristDZ، مساعد ذكي متخصص في القانون الجزائري.

**سؤالك:** ${message}

**إجابة تجريبية:**
بناءً على القانون الجزائري، يمكنني مساعدتك في:
- البحث في النصوص القانونية
- تحليل القضايا القانونية  
- صياغة الوثائق القانونية

**ملاحظة:** هذا وضع تجريبي. للحصول على إجابات دقيقة، يرجى تكوين مفتاح Gemini API صالح.`
        : `**Mode Démo** - Bonjour Maître, je suis JuristDZ, votre assistant IA spécialisé en droit algérien.

**Votre question :** ${message}

**Réponse de démonstration :**
Selon le droit algérien, je peux vous assister dans :
- La recherche juridique dans les codes algériens
- L'analyse de cas juridiques complexes
- La rédaction d'actes et de documents légaux

**Note :** Ceci est un mode démo. Pour des réponses précises, veuillez configurer une clé API Gemini valide.`
      };
    }
    
    console.log('🔑 Clé API détectée, utilisation de Gemini API réelle');
    
    const ai = new GoogleGenAI({ apiKey });

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
    
    // Gestion spécifique des erreurs de quota
    if (error instanceof Error && error.message.includes('429')) {
      return { text: language === 'ar' 
        ? "تم تجاوز حد الاستخدام اليومي لـ Gemini API. يرجى المحاولة لاحقاً أو ترقية الخطة." 
        : "Quota API Gemini dépassé. Veuillez réessayer plus tard ou mettre à niveau votre plan API." 
      };
    }
    
    if (error instanceof Error && error.message.includes('quota')) {
      return { text: language === 'ar' 
        ? "حصة API محدودة. يرجى التحقق من إعدادات الفوترة في Google AI Studio." 
        : "Quota API limité. Vérifiez vos paramètres de facturation dans Google AI Studio." 
      };
    }
    
    return { text: language === 'ar' 
      ? "حدث خطأ في الاتصال. يرجى التأكد من أن الجلسة ما زالت نشطة." 
      : "Erreur de connexion API. Vérifiez votre clé API dans Google AI Studio." 
    };
  }
};

// Réponse de démonstration
const getDemoResponse = (message: string, language: Language): ChatResponse => {
  console.warn('Mode démo activé - aucune API configurée');
  return { text: language === 'ar' 
    ? `**وضع العرض التوضيحي** - مرحباً، أنا JuristDZ، مساعد ذكي متخصص في القانون الجزائري.

**سؤالك:** ${message}

**إجابة تجريبية:**
بناءً على القانون الجزائري، يمكنني مساعدتك في:
- البحث في النصوص القانونية
- تحليل القضايا القانونية  
- صياغة الوثائق القانونية

**ملاحظة:** هذا وضع تجريبي. للحصول على إجابات دقيقة، يرجى تكوين مفتاح API صالح.`
    : `**Mode Démo** - Bonjour Maître, je suis JuristDZ, votre assistant IA spécialisé en droit algérien.

**Votre question :** ${message}

**Réponse de démonstration :**
Selon le droit algérien, je peux vous assister dans :
- La recherche juridique dans les codes algériens
- L'analyse de cas juridiques complexes
- La rédaction d'actes et de documents légaux

**Note :** Ceci est un mode démo. Pour des réponses précises, veuillez configurer une clé API valide (Groq, OpenAI, ou Gemini).`
  };
};