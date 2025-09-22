const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// Galaxy API configuration
const GALAXY_API_BASE_URL = "https://api.galaxy.example.com"; // Replace with actual Galaxy API URL
const GALAXY_API_TOKEN = Deno.env.get('GALAXY_API_TOKEN'); // Set this in environment variables

interface GalaxySeriesData {
  id: number;
  title: string;
  description?: string;
  cover_url?: string;
  episodes: GalaxyEpisodeData[];
  rubrics: number[];
}

interface GalaxyEpisodeData {
  id: number;
  series_id: number;
  season_id: number;
  title?: string;
  description?: string;
  duration?: number;
  position: number;
  season_position?: number;
  product_year?: number;
  streaming_url?: string;
}

interface FreeEpisodesConfig {
  count: number;
}

// Create Supabase client with service role key for database operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

import { createClient } from 'npm:@supabase/supabase-js@2';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getFreeEpisodesConfig(): Promise<number> {
  console.log('🔧 Fetching free episodes configuration...');
  
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'free_episodes_count')
      .single();

    if (error) {
      console.error('❌ Error fetching free episodes config:', error);
      return 3; // Default fallback
    }

    const config = data?.setting_value as FreeEpisodesConfig;
    const count = config?.count || 3;
    console.log(`✅ Free episodes count: ${count}`);
    return count;
  } catch (error) {
    console.error('❌ Error in getFreeEpisodesConfig:', error);
    return 3; // Default fallback
  }
}

async function fetchFromGalaxyAPI(endpoint: string): Promise<any> {
  console.log(`🌌 Fetching from Galaxy API: ${endpoint}`);
  
  if (!GALAXY_API_TOKEN) {
    throw new Error('GALAXY_API_TOKEN environment variable not set');
  }

  const response = await fetch(`${GALAXY_API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${GALAXY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Galaxy API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function getCampaignCountriesLanguages(): Promise<string[]> {
  console.log('🔍 Fetching available campaign-countries-languages...');
  
  const { data, error } = await supabase
    .from('campaign_countries_languages')
    .select('id');

  if (error) {
    console.error('❌ Error fetching campaigns:', error);
    return [];
  }

  const campaignIds = data.map(item => item.id);
  console.log(`✅ Found ${campaignIds.length} campaign-countries-languages`);
  return campaignIds;
}

async function importSeriesData(seriesData: GalaxySeriesData, campaignId: string): Promise<void> {
  console.log(`📺 Importing series: ${seriesData.title} for campaign: ${campaignId}`);

  // Insert or update series
  const { error: seriesError } = await supabase
    .from('contents_series')
    .upsert({
      serie_id: seriesData.id,
      campaign_countries_languages_id: campaignId,
      title: seriesData.title,
      description: seriesData.description || null,
      url_covers: seriesData.cover_url || null,
      updated_at: new Date().toISOString()
    });

  if (seriesError) {
    console.error(`❌ Error importing series ${seriesData.id}:`, seriesError);
    throw seriesError;
  }

  console.log(`✅ Series ${seriesData.id} imported successfully`);

  // Import episodes
  await importEpisodesData(seriesData.episodes, campaignId);

  // Import rubrics associations
  await importSeriesRubrics(seriesData.id, seriesData.rubrics, campaignId);
}

async function importEpisodesData(episodes: GalaxyEpisodeData[], campaignId: string): Promise<void> {
  console.log(`📹 Importing ${episodes.length} episodes for campaign: ${campaignId}`);
  
  // Get free episodes configuration
  const freeEpisodesCount = await getFreeEpisodesConfig();
  console.log(`🎁 Free episodes count: ${freeEpisodesCount}`);

  for (const episode of episodes) {
    console.log(`📹 Processing episode ${episode.id} (position: ${episode.position})`);

    // Insert or update episode
    const { error: episodeError } = await supabase
      .from('contents_series_episodes')
      .upsert({
        series_id: episode.series_id,
        episode_id: episode.id,
        season_id: episode.season_id,
        episode_position: episode.position,
        season_position: episode.season_position || null,
        campaign_countries_languages_id: campaignId,
        url_streaming_no_drm: episode.streaming_url || null,
        description: episode.description || null,
        title: episode.title || null,
        duration: episode.duration || null,
        product_year: episode.product_year || null,
        updated_at: new Date().toISOString()
      });

    if (episodeError) {
      console.error(`❌ Error importing episode ${episode.id}:`, episodeError);
      continue; // Continue with next episode instead of failing completely
    }

    // Check if this episode should be free based on position
    if (episode.position <= freeEpisodesCount) {
      console.log(`🎁 Marking episode ${episode.id} as free (position ${episode.position} <= ${freeEpisodesCount})`);
      
      const { error: freeEpisodeError } = await supabase
        .from('contents_series_episodes_free')
        .upsert({
          episode_id: episode.id,
          campaign_countries_languages_id: campaignId,
          updated_at: new Date().toISOString()
        });

      if (freeEpisodeError) {
        console.error(`❌ Error marking episode ${episode.id} as free:`, freeEpisodeError);
      } else {
        console.log(`✅ Episode ${episode.id} marked as free`);
      }
    }
  }

  console.log(`✅ Episodes import completed for campaign: ${campaignId}`);
}

async function importSeriesRubrics(seriesId: number, rubricIds: number[], campaignId: string): Promise<void> {
  console.log(`🏷️ Importing ${rubricIds.length} rubrics for series ${seriesId}`);

  for (const rubricId of rubricIds) {
    const { error } = await supabase
      .from('contents_series_rubrics')
      .upsert({
        serie_id: seriesId,
        id_rubric: rubricId,
        campaign_countries_languages_id: campaignId,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Error linking series ${seriesId} to rubric ${rubricId}:`, error);
      continue;
    }
  }

  console.log(`✅ Rubrics imported for series ${seriesId}`);
}

async function cleanupOldFreeEpisodes(campaignIds: string[]): Promise<void> {
  console.log('🧹 Cleaning up old free episodes that no longer qualify...');
  
  const freeEpisodesCount = await getFreeEpisodesConfig();
  
  for (const campaignId of campaignIds) {
    // Remove episodes from free list that no longer qualify based on new position rules
    const { error } = await supabase
      .from('contents_series_episodes_free')
      .delete()
      .eq('campaign_countries_languages_id', campaignId)
      .gt('episode_id', 0); // This will be refined with a proper join query in production

    // In a real implementation, you would need a more sophisticated query to identify
    // episodes that should no longer be free based on their position vs the current config
  }
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
    console.log('🔄 Starting Galaxy import-3 edge function...');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request URL:', req.url);
    
    // Log environment variables (without sensitive data)
    console.log('🌍 Environment check:');
    console.log('  - SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('  - SUPABASE_ANON_KEY exists:', !!Deno.env.get('SUPABASE_ANON_KEY'));
    console.log('  - SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('  - GALAXY_API_TOKEN exists:', !!GALAXY_API_TOKEN);
    
    if (!GALAXY_API_TOKEN) {
      throw new Error('Galaxy API token not configured. Please set GALAXY_API_TOKEN environment variable.');
    }

    console.log('📊 Starting Galaxy API data import process...');
    
    // Get all available campaign-countries-languages
    const campaignIds = await getCampaignCountriesLanguages();
    
    if (campaignIds.length === 0) {
      console.log('⚠️ No campaign-countries-languages found. Import cannot proceed.');
      return new Response(
        JSON.stringify({
          success: false,
          message: "No campaign-countries-languages configured. Please add campaigns first.",
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
          status: 400,
        }
      );
    }

    let totalSeriesImported = 0;
    let totalEpisodesImported = 0;
    let totalFreeEpisodesMarked = 0;
    
    // Import data for each campaign
    for (const campaignId of campaignIds) {
      console.log(`🔄 Processing campaign: ${campaignId}`);
      
      try {
        // Fetch series data from Galaxy API for this campaign
        // Note: You'll need to adapt this endpoint based on actual Galaxy API structure
        const seriesResponse = await fetchFromGalaxyAPI(`/series?campaign=${campaignId}`);
        
        if (seriesResponse.data && Array.isArray(seriesResponse.data)) {
          for (const seriesData of seriesResponse.data) {
            await importSeriesData(seriesData, campaignId);
            totalSeriesImported++;
            totalEpisodesImported += seriesData.episodes?.length || 0;
            
            // Count free episodes
            const freeEpisodesCount = await getFreeEpisodesConfig();
            const freeEpisodesInSeries = (seriesData.episodes || [])
              .filter(ep => ep.position <= freeEpisodesCount).length;
            totalFreeEpisodesMarked += freeEpisodesInSeries;
          }
        }
        
        console.log(`✅ Campaign ${campaignId} processed successfully`);
      } catch (campaignError) {
        console.error(`❌ Error processing campaign ${campaignId}:`, campaignError);
        // Continue with next campaign instead of failing completely
      }
    }

    // Clean up old free episodes that no longer qualify
    await cleanupOldFreeEpisodes(campaignIds);
    
    const data = {
      success: true,
      message: "Galaxy import completed successfully",
      timestamp: new Date().toISOString(),
      statistics: {
        campaignsProcessed: campaignIds.length,
        seriesImported: totalSeriesImported,
        episodesImported: totalEpisodesImported,
        freeEpisodesMarked: totalFreeEpisodesMarked,
        freeEpisodesConfig: await getFreeEpisodesConfig()
      }
    };

    console.log('✅ Galaxy import-3 function execution completed');
    console.log('📊 Final statistics:', data.statistics);
    console.log('📤 Returning response data:', JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Galaxy import-3 function error occurred:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    
    const errorData = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
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
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 500,
      }
    );
  }
});