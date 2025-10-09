const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// Target languages with their ISO codes
const TARGET_LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'fil', name: 'Filipino, Tagalog' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ha', name: 'Hausa' },
  { code: 'hi', name: 'Hindi' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' }
];

// Mock translation service for development
// In production, replace with actual translation service (DeepL, Google Translate, etc.)
async function translateText(text: string, targetLanguage: string, sourceLanguage: string = 'fr'): Promise<string> {
  // TODO: Implement actual translation service
  // For now, return mock translation
  console.log(`🌐 Mock translating "${text}" from ${sourceLanguage} to ${targetLanguage}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock translation with language code suffix for development
  return `${text} [${targetLanguage}]`;
}

// Batch translation to avoid hitting API rate limits
async function batchTranslate(texts: string[], targetLanguage: string, sourceLanguage: string = 'fr'): Promise<string[]> {
  console.log(`🔄 Batch translating ${texts.length} texts to ${targetLanguage}`);
  
  const translations = [];
  for (const text of texts) {
    const translation = await translateText(text, targetLanguage, sourceLanguage);
    translations.push(translation);
  }
  
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
    console.log('🚀 Starting event gamification translation process...');
    console.log('📋 Request method:', req.method);
    
    // Environment variables check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('🌍 Environment check passed');
    console.log(`📊 Will translate to ${TARGET_LANGUAGES.length} languages`);

    // Initialize Supabase client with service role
    const { createClient } = await import('npm:@supabase/supabase-js@2.56.0');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get all gamification events
    console.log('📥 Fetching gamification events...');
    const { data: events, error: eventsError } = await supabase
      .from('gamification_events')
      .select('id, event_type')
      .order('event_position', { ascending: true });

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      throw eventsError;
    }

    console.log(`✅ Found ${events?.length || 0} gamification events`);

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No gamification events found to translate",
          stats: { eventsProcessed: 0, translationsCreated: 0 }
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        }
      );
    }

    // Step 2: Get existing translations to avoid duplicates
    console.log('📥 Fetching existing translations...');
    const { data: existingTranslations, error: translationsError } = await supabase
      .from('gamification_event_translations')
      .select('event_id, language_code');

    if (translationsError) {
      console.error('❌ Error fetching existing translations:', translationsError);
      throw translationsError;
    }

    const existingSet = new Set(
      (existingTranslations || []).map(t => `${t.event_id}-${t.language_code}`)
    );
    console.log(`📋 Found ${existingTranslations?.length || 0} existing translations`);

    // Step 3: Process each event
    let totalTranslationsCreated = 0;
    let eventsProcessed = 0;

    for (const event of events) {
      console.log(`\n🔄 Processing event: ${event.event_type} (${event.id})`);
      
      // French base content (you'll need to define these for each event type)
      // For now, using the event_type as base content
      const frenchContent = {
        title: `Événement ${event.event_type}`,
        description: `Description pour l'événement ${event.event_type}`,
        message: `Message pour l'événement ${event.event_type}`
      };

      console.log(`📝 Base French content:`, frenchContent);

      // Translate to all target languages
      for (const targetLang of TARGET_LANGUAGES) {
        const translationKey = `${event.id}-${targetLang.code}`;
        
        // Skip if translation already exists
        if (existingSet.has(translationKey)) {
          console.log(`⏭️  Skipping ${targetLang.name} - already exists`);
          continue;
        }

        console.log(`🌐 Translating to ${targetLang.name} (${targetLang.code})`);

        try {
          // Translate all fields
          const [translatedTitle, translatedDescription, translatedMessage] = await batchTranslate(
            [frenchContent.title, frenchContent.description, frenchContent.message],
            targetLang.code,
            'fr'
          );

          // Insert translation
          const { error: insertError } = await supabase
            .from('gamification_event_translations')
            .insert({
              event_id: event.id,
              language_code: targetLang.code,
              title: translatedTitle,
              description: translatedDescription,
              message: translatedMessage
            });

          if (insertError) {
            console.error(`❌ Error inserting ${targetLang.name} translation:`, insertError);
            // Continue with other translations instead of failing completely
            continue;
          }

          totalTranslationsCreated++;
          console.log(`✅ Created ${targetLang.name} translation`);

          // Add small delay to avoid overwhelming the translation service
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.error(`❌ Error translating to ${targetLang.name}:`, error);
          // Continue with other languages
          continue;
        }
      }

      eventsProcessed++;
      console.log(`✅ Completed event: ${event.event_type}`);
      
      // Add delay between events to be respectful to translation APIs
      if (eventsProcessed < events.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const stats = {
      eventsProcessed,
      translationsCreated: totalTranslationsCreated,
      targetLanguages: TARGET_LANGUAGES.length,
      skippedExisting: (eventsProcessed * TARGET_LANGUAGES.length) - totalTranslationsCreated
    };

    console.log('\n🎉 Translation process completed!');
    console.log('📊 Final stats:', stats);

    const data = {
      success: true,
      message: `Successfully processed ${eventsProcessed} events and created ${totalTranslationsCreated} translations`,
      stats,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(data),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Event gamification translation error occurred:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    
    const errorData = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during translation process',
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.constructor.name,
        functionFailed: true
      }
    };
    
    console.error('📤 Returning error response:', JSON.stringify(errorData, null, 2));
    
    return new Response(
      JSON.stringify(errorData),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});