// Supabase Edge Function for ingesting sensor data from ESP32 devices
// Deploy with: supabase functions deploy ingest-sensor-data

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SensorReading {
  type: string;
  value: number;
  unit: string;
}

interface SensorPayload {
  device_id: string;
  api_key: string;
  readings: SensorReading[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: SensorPayload = await req.json();

    // Validate payload
    if (!payload.device_id || !payload.api_key || !payload.readings) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: device_id, api_key, readings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify device exists and API key matches
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, api_key')
      .eq('id', payload.device_id)
      .single();

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: 'Device not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (device.api_key !== payload.api_key) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare readings for insertion
    const readingsToInsert = payload.readings.map((reading) => ({
      device_id: payload.device_id,
      reading_type: reading.type,
      value: reading.value,
      unit: reading.unit,
      recorded_at: new Date().toISOString(),
    }));

    // Insert readings
    const { error: insertError } = await supabase
      .from('sensor_readings')
      .insert(readingsToInsert);

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert readings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update device last_seen (this is also done by trigger, but we do it explicitly for reliability)
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', payload.device_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Inserted ${readingsToInsert.length} readings`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
