const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// Language mapping with ISO codes
const TARGET_LANGUAGES = [
  { name: 'Afrikaans', code: 'af' },
  { name: 'Amharic', code: 'am' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Dutch', code: 'nl' },
  { name: 'English', code: 'en' },
  { name: 'Filipino, Tagalog', code: 'tl' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Gujarati', code: 'gu' },
  { name: 'Hausa', code: 'ha' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Malay', code: 'ms' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Marathi', code: 'mr' },
  { name: 'Portuguese (Brazil)', code: 'pt-BR' },
  { name: 'Portuguese (Portugal)', code: 'pt-PT' },
  { name: 'Punjabi', code: 'pa' },
  { name: 'Sinhala', code: 'si' },
  { name: 'Somali', code: 'so' },
  { name: 'Spanish', code: 'es' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Telugu', code: 'te' },
  { name: 'Thai', code: 'th' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Vietnamese', code: 'vi' },
];

interface ExistingTranslation {
  id: string;
  event_id: string;
  language_code: string;
  title: string;
  description: string;
  message: string;
}

interface TranslationResult {
  event_id: string;
  language_code: string;
  title: string;
  description: string;
  message: string;
}

// Mock translation service for development
// TODO: Replace with real translation service (DeepL, Google Translate, etc.)
async function translateText(text: string, targetLanguage: string): Promise<string> {
  console.log(`📝 Translating: "${text}" to ${targetLanguage}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock translation - add language code as suffix
  return `${text} [${targetLanguage}]`;
}

async function translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
  console.log(`🔄 Batch translating ${texts.length} texts to ${targetLanguage}`);
  
  // In production, use batch translation API if available
  const translations = await Promise.all(
    texts.map(text => translateText(text, targetLanguage))
  );
  
  return translations;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('🔧 Handling CORS preflight request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🌍 Starting gamification translation process...');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request URL:', req.url);
    
    // Environment check
    console.log('🌍 Environment check:');
    console.log('  - SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('  - SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    console.log('📊 Fetching existing translations...');
    
    // Fetch all existing translations
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/gamification_event_translations?select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      },
    });

    if (!existingResponse.ok) {
      throw new Error(`Failed to fetch existing translations: ${existingResponse.statusText}`);
    }

    const existingTranslations: ExistingTranslation[] = await existingResponse.json();
    console.log('📋 Found', existingTranslations.length, 'existing translations');

    // Group existing translations by event_id
    const existingByEvent = new Map<string, Set<string>>();
    existingTranslations.forEach(translation => {
      if (!existingByEvent.has(translation.event_id)) {
        existingByEvent.set(translation.event_id, new Set());
      }
      existingByEvent.get(translation.event_id)!.add(translation.language_code);
    });

    // Find a source translation for each event (preferably French, then English)
    const sourceTranslations = new Map<string, ExistingTranslation>();
    existingTranslations.forEach(translation => {
      const eventId = translation.event_id;
      const currentSource = sourceTranslations.get(eventId);
      
      // Prefer French, then English, then any other language
      if (!currentSource || 
          translation.language_code === 'fr' ||
          (translation.language_code === 'en' && currentSource.language_code !== 'fr')) {
        sourceTranslations.set(eventId, translation);
      }
    });

    console.log('🔍 Found', sourceTranslations.size, 'unique events to translate');
    console.log('📍 Target languages:', TARGET_LANGUAGES.length);

    let totalTranslationsCreated = 0;
    let totalSkipped = 0;
    const newTranslations: TranslationResult[] = [];

    // Process each event
    for (const [eventId, sourceTranslation] of sourceTranslations) {
      console.log(`\n🔄 Processing event: ${eventId}`);
      console.log(`📝 Source language: ${sourceTranslation.language_code}`);
      console.log(`📄 Source title: "${sourceTranslation.title}"`);
      
      const existingLanguages = existingByEvent.get(eventId) || new Set();
      console.log(`📋 Existing languages for this event: [${Array.from(existingLanguages).join(', ')}]`);

      // Determine which languages need translation
      const languagesToTranslate = TARGET_LANGUAGES.filter(lang => 
        !existingLanguages.has(lang.code)
      );
      
      console.log(`🎯 Languages to translate: [${languagesToTranslate.map(l => l.code).join(', ')}]`);

      if (languagesToTranslate.length === 0) {
        console.log('✅ All translations already exist for this event, skipping...');
        totalSkipped++;
        continue;
      }

      // Translate for each target language
      for (const targetLang of languagesToTranslate) {
        console.log(`\n🌍 Translating to ${targetLang.name} (${targetLang.code})...`);
        
        try {
          // Translate all three fields
          const [translatedTitle, translatedDescription, translatedMessage] = await translateBatch(
            [sourceTranslation.title, sourceTranslation.description, sourceTranslation.message],
            targetLang.code
          );

          const newTranslation: TranslationResult = {
            event_id: eventId,
            language_code: targetLang.code,
            title: translatedTitle,
            description: translatedDescription,
            message: translatedMessage,
          };

          newTranslations.push(newTranslation);
          totalTranslationsCreated++;
          
          console.log(`✅ Created translation for ${targetLang.code}:`);
          console.log(`   Title: "${translatedTitle}"`);
          console.log(`   Description: "${translatedDescription}"`);
          console.log(`   Message: "${translatedMessage}"`);
          
        } catch (error) {
          console.error(`❌ Failed to translate to ${targetLang.code}:`, error);
          continue; // Continue with next language
        }

        // Add small delay to be respectful to translation API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`\n💾 Inserting ${newTranslations.length} new translations...`);

    if (newTranslations.length > 0) {
      // Insert new translations in batches
      const batchSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < newTranslations.length; i += batchSize) {
        const batch = newTranslations.slice(i, i + batchSize);
        
        console.log(`📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newTranslations.length / batchSize)} (${batch.length} items)`);
        
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/gamification_event_translations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(batch),
        });

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error(`❌ Failed to insert batch:`, errorText);
          throw new Error(`Failed to insert translations batch: ${insertResponse.statusText}`);
        }

        insertedCount += batch.length;
        console.log(`✅ Successfully inserted batch (${insertedCount}/${newTranslations.length} total)`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const result = {
      success: true,
      message: `Successfully processed ${sourceTranslations.size} events and created ${totalTranslationsCreated} translations`,
      stats: {
        eventsProcessed: sourceTranslations.size,
        translationsCreated: totalTranslationsCreated,
        translationsSkipped: totalSkipped,
        targetLanguages: TARGET_LANGUAGES.length,
        batchesProcessed: Math.ceil(newTranslations.length / 50),
      },
      timestamp: new Date().toISOString(),
      debug: {
        totalExistingTranslations: existingTranslations.length,
        uniqueEvents: sourceTranslations.size,
        newTranslationsGenerated: newTranslations.length,
      }
    };

    console.log('✅ Translation process completed successfully');
    console.log('📊 Final stats:', JSON.stringify(result.stats, null, 2));

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Translation process error occurred:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    
    const errorResult = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during translation process',
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.constructor.name,
        functionFailed: true,
      }
    };
    
    console.error('📤 Returning error response:', JSON.stringify(errorResult, null, 2));
    
    return new Response(
      JSON.stringify(errorResult),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 500,
      }
    );
  }
});