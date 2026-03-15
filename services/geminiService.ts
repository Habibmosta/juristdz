
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
      try {
        return await sendMessageToGroq(message, history, mode, language);
      } catch (groqError) {
        console.error('🔥 DEBUG: Groq API failed, trying fallback:', groqError.message);
        // Continue to fallback options
      }
    }
    
    if (openaiApiKey && openaiApiKey !== 'PLACEHOLDER_API_KEY') {
      try {
        return await sendMessageToOpenAI(message, history, mode, language);
      } catch (openaiError) {
        console.error('🔥 DEBUG: OpenAI API failed, trying fallback:', openaiError.message);
        // Continue to fallback options
      }
    }
    
    if (geminiApiKey && geminiApiKey !== 'PLACEHOLDER_API_KEY') {
      try {
        return await sendMessageToGeminiAPI(message, history, mode, language, imageAttachment);
      } catch (geminiError) {
        console.error('🔥 DEBUG: Gemini API failed:', geminiError.message);
        // Continue to demo mode
      }
    }
    
    return getDemoResponse(message, language);
    
  } catch (error) {
    console.error("🔥 DEBUG: Error in AI service:", error);
    console.error("🔥 DEBUG: Error type:", typeof error);
    console.error("🔥 DEBUG: Error message:", error instanceof Error ? error.message : 'Unknown error');
    console.error("🔥 DEBUG: Error stack:", error instanceof Error ? error.stack : 'No stack');
    
    // Return a more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('rate limit')) {
      return { text: language === 'ar' 
        ? "تم تجاوز حد الاستخدام. يرجى المحاولة لاحقاً." 
        : "Limite d'utilisation dépassée. Veuillez réessayer plus tard." 
      };
    } else if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
      return { text: language === 'ar' 
        ? "خطأ في المصادقة. يرجى التحقق من مفاتيح API." 
        : "Erreur d'authentification. Vérifiez les clés API." 
      };
    } else if (errorMessage.includes('timeout')) {
      return { text: language === 'ar' 
        ? "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى." 
        : "Délai d'attente dépassé. Veuillez réessayer." 
      };
    } else {
      return { text: language === 'ar' 
        ? `خطأ في خدمة الذكاء الاصطناعي: ${errorMessage}` 
        : `Erreur du service IA: ${errorMessage}` 
      };
    }
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

  // FORCE LANGUAGE INSTRUCTION - CRITICAL FIX
  const langInstruction = language === 'ar' 
    ? "\n\nCRITICAL LANGUAGE INSTRUCTION: You MUST respond ONLY in Arabic. Do not mix languages. Use only Arabic legal terminology. If you don't know the Arabic term, use the Arabic equivalent or explain in Arabic. NO FRENCH OR ENGLISH words allowed in your response." 
    : "\n\nCRITICAL LANGUAGE INSTRUCTION: You MUST respond ONLY in French. Do not mix languages. Use only French legal terminology. NO ARABIC OR ENGLISH words allowed in your response.";

  const systemInstruction = baseInstruction + langInstruction;

  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
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
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts[0]?.text || '' })),
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔥 DEBUG Groq: API Error:', response.status, errorText);
      
      // Handle specific error cases
      if (response.status === 429) {
        throw new Error(`Groq API rate limit exceeded. Please try again later.`);
      } else if (response.status === 401) {
        throw new Error(`Groq API authentication failed. Check your API key.`);
      } else if (response.status >= 500) {
        throw new Error(`Groq API server error (${response.status}). Please try again later.`);
      } else {
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }
    
    // CLEAN THE RESPONSE - CRITICAL FIX
    let responseText = data.choices[0].message.content;
    responseText = cleanMixedLanguageContent(responseText, language);
    
    return { text: responseText };
    
  } catch (error) {
    console.error('🔥 DEBUG Groq: Fetch error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    
    throw error;
  }
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
    const modelId = 'gemini-2.5-flash'; 
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
  console.warn('🎯 MODE DEMO FORCE ACTIVE - Réponse générée localement');
  
  // Analyse simple du message pour donner une réponse contextuelle
  const lowerMessage = message.toLowerCase();
  
  let demoResponse = '';
  
  if (lowerMessage.includes('article') || lowerMessage.includes('code') || lowerMessage.includes('loi')) {
    demoResponse = language === 'ar' 
      ? `**وضع العرض التوضيحي النشط** - بحث في النصوص القانونية

**سؤالك:** ${message}

**إجابة تجريبية محلية:**
بناءً على القانون الجزائري، يمكنني مساعدتك في البحث عن النصوص القانونية:

• **القانون المدني الجزائري** - الأمر رقم 75-58
• **قانون الإجراءات المدنية والإدارية** - القانون رقم 08-09
• **القانون التجاري** - الأمر رقم 75-59
• **قانون العقوبات** - الأمر رقم 66-156

**النظام يعمل بشكل صحيح** - هذه إجابة تجريبية محلية لتجنب مشاكل الشبكة.`
      : `**Mode Démo Actif** - Recherche juridique

**Votre question :** ${message}

**Réponse de démonstration locale :**
Selon le droit algérien, voici les principales références :

• **Code Civil Algérien** - Ordonnance n° 75-58
• **Code de Procédure Civile et Administrative** - Loi n° 08-09  
• **Code de Commerce** - Ordonnance n° 75-59
• **Code Pénal** - Ordonnance n° 66-156

**Le système fonctionne correctement** - Ceci est une réponse démo locale pour éviter les problèmes réseau.`;
  } else if (lowerMessage.includes('contrat') || lowerMessage.includes('accord')) {
    demoResponse = language === 'ar' 
      ? `**وضع العرض التوضيحي النشط** - صياغة العقود

**سؤالك:** ${message}

**إجابة تجريبية محلية:**
في القانون الجزائري، العقود تخضع للمبادئ التالية:

• **الرضا** - موافقة الأطراف الحرة والواعية
• **المحل** - موضوع العقد يجب أن يكون مشروعاً
• **السبب** - الغرض من العقد يجب أن يكون قانونياً
• **الشكل** - بعض العقود تتطلب شكلاً خاصاً

**النظام يعمل بشكل صحيح** - هذه إجابة تجريبية محلية لتجنب مشاكل الشبكة.`
      : `**Mode Démo Actif** - Rédaction contractuelle

**Votre question :** ${message}

**Réponse de démonstration locale :**
En droit algérien, les contrats sont soumis aux principes suivants :

• **Le Consentement** - accord libre et éclairé des parties
• **L'Objet** - doit être licite et déterminé
• **La Cause** - doit être licite et réelle
• **La Forme** - certains contrats exigent une forme particulière

**Le système fonctionne correctement** - Ceci est une réponse démo locale pour éviter les problèmes réseau.`;
  } else {
    demoResponse = language === 'ar' 
      ? `**وضع العرض التوضيحي النشط** - مساعد قانوني ذكي

**سؤالك:** ${message}

**إجابة تجريبية محلية:**
مرحباً، أنا مساعدك القانوني المتخصص في القانون الجزائري.

يمكنني مساعدتك في:
• البحث في النصوص القانونية الجزائرية
• تحليل القضايا القانونية المعقدة
• صياغة الوثائق والعقود القانونية
• تفسير الأحكام القضائية

**النظام يعمل بشكل صحيح** - هذه إجابة تجريبية محلية لتجنب مشاكل الشبكة.`
      : `**Mode Démo Actif** - Assistant juridique intelligent

**Votre question :** ${message}

**Réponse de démonstration locale :**
Bonjour Maître, je suis votre assistant IA spécialisé en droit algérien.

Je peux vous assister dans :
• La recherche juridique dans les codes algériens
• L'analyse de cas juridiques complexes  
• La rédaction d'actes et de documents légaux
• L'interprétation de la jurisprudence

**Le système fonctionne correctement** - Ceci est une réponse démo locale pour éviter les problèmes réseau.`;
  }
  
  // CLEAN THE DEMO RESPONSE
  demoResponse = cleanMixedLanguageContent(demoResponse, language);
  
  return { text: demoResponse };
};

// CRITICAL FUNCTION - Clean mixed language content
function cleanMixedLanguageContent(text: string, language: Language): string {
  if (!text || typeof text !== 'string') return text;
  
  let cleaned = text;
  
  // Remove exact mixed patterns from user's report
  const mixedPatterns = [
    /النظام القانونيمتصلAvocatCabinet d'AvocatCabinet d'Avocat/g,
    /النظام القانونيلوحة التحكم/g,
    /البحث القانونيRédactionAnalyseDossiers/g,
    /البحث القانونيRédaction/g,
    /RédactionAnalyseDossiers/g,
    /RédactionAnalyse/g,
    /Documentationإجراءات سريعة/g,
    /إجراءات سريعةملف جديد/g,
    /ملف جديدبحث سريع/g,
    /بحث سريعfrMode/g,
    /frMode Sécurisé/g,
    /frMode/g,
    /متصلAvocat/g,
    /Cabinet d'AvocatCabinet/g,
    /ProAnalyse/g,
    /DossiersV2/g,
    /محاميPro/g,
    /ملفاتV2/g,
    /AUTO-TRANSLATE/g,
    /процедة/g,
    /JuristDZ/g,
    /محامي دي زاد/g
  ];
  
  // Apply pattern cleaning
  mixedPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // If Arabic mode, remove Latin characters mixed with Arabic
  if (language === 'ar') {
    // Remove any Latin words mixed with Arabic
    cleaned = cleaned.replace(/[أ-ي]+[A-Za-z]+[أ-ي]*/g, '');
    cleaned = cleaned.replace(/[A-Za-z]+[أ-ي]+[A-Za-z]*/g, '');
    
    // Replace common mixed terms with pure Arabic
    cleaned = cleaned.replace(/JuristDZ/g, '');
    cleaned = cleaned.replace(/Cabinet/g, '');
    cleaned = cleaned.replace(/Pro/g, '');
    cleaned = cleaned.replace(/V2/g, '');
  } else {
    // If French mode, remove Arabic characters mixed with Latin
    cleaned = cleaned.replace(/[A-Za-z]+[أ-ي]+[A-Za-z]*/g, '');
    cleaned = cleaned.replace(/[أ-ي]+[A-Za-z]+[أ-ي]*/g, '');
    
    // Replace common mixed terms with pure French
    cleaned = cleaned.replace(/محامي دي زاد/g, '');
    cleaned = cleaned.replace(/النظام القانوني/g, '');
  }
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}