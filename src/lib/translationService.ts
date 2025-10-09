// Translation service for automatic translation of gamification events
// This is a mock implementation - in production you would use DeepL API

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResult {
  translatedText: string;
  confidence?: number;
  service: string;
}

// 30 supported languages with their codes and names
export const SUPPORTED_LANGUAGES = [
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tl', name: 'Filipino (Tagalog)', nativeName: 'Filipino' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  { code: 'pt', name: 'Portuguese (Portugal)', nativeName: 'Português' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];

// Mock translation data for demonstration
const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Common event types and their translations
  'daily_login': {
    'fr': 'connexion_quotidienne',
    'es': 'inicio_sesion_diario',
    'de': 'tägliche_anmeldung',
    'pt': 'login_diario',
    'pt-br': 'login_diario',
  },
  'video_watch': {
    'fr': 'regarder_vidéo',
    'es': 'ver_video',
    'de': 'video_ansehen',
    'pt': 'assistir_video',
    'pt-br': 'assistir_video',
  },
  'profile_complete': {
    'fr': 'profil_complet',
    'es': 'perfil_completo',
    'de': 'profil_vervollständigen',
    'pt': 'perfil_completo',
    'pt-br': 'perfil_completo',
  }
};

// Mock translation service - in production, replace with DeepL API
export class TranslationService {
  private static instance: TranslationService;

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // Mock translation - in production use DeepL API
  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    console.log(`🔄 Translating "${request.text}" to ${request.targetLanguage}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Try mock translations first
    const mockTranslation = MOCK_TRANSLATIONS[request.text]?.[request.targetLanguage];
    if (mockTranslation) {
      return {
        translatedText: mockTranslation,
        confidence: 0.95,
        service: 'deepl-mock'
      };
    }

    // Generate mock translation based on target language
    const translatedText = this.generateMockTranslation(request.text, request.targetLanguage);
    
    return {
      translatedText,
      confidence: 0.85,
      service: 'deepl-mock'
    };
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    console.log(`🔄 Batch translating ${requests.length} texts`);
    
    // Process in parallel but with some delay to simulate real API behavior
    const results = await Promise.all(
      requests.map((request, index) => 
        new Promise<TranslationResult>(resolve => 
          setTimeout(() => 
            this.translateText(request).then(resolve), 
            index * 100 // Stagger requests
          )
        )
      )
    );

    return results;
  }

  private generateMockTranslation(text: string, targetLanguage: string): string {
    // Simple mock translation logic - in production this would be a real API call
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const languageName = language?.name || targetLanguage;
    
    // For event types, add language suffix
    if (text.includes('_')) {
      return `${text}_${targetLanguage}`;
    }
    
    // For sentences, add language prefix
    return `[DeepL-${languageName}] ${text}`;
  }

  // Get language name by code
  getLanguageName(code: string): string {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language?.name || code.toUpperCase();
  }

  // Get all supported language codes
  getSupportedLanguageCodes(): string[] {
    return SUPPORTED_LANGUAGES.map(lang => lang.code);
  }
}

// In production, you would implement DeepL API calls like:
/*
export class DeepLTranslateService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [request.text],
        target_lang: request.targetLanguage.toUpperCase(),
        source_lang: request.sourceLanguage?.toUpperCase() || 'EN',
      })
    });

    const data = await response.json();
    return {
      translatedText: data.translations[0].text,
      confidence: 0.95, // DeepL doesn't provide confidence scores
      service: 'deepl'
    };
  }
}
*/