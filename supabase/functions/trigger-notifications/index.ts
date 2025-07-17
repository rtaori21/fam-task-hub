import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Manual notification trigger called");

    // Call the process-notifications function for due tasks
    const processNotificationsResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          type: "check_due_tasks"
        }),
      }
    );

    // Call the check-event-reminders function
    const eventRemindersResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/check-event-reminders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
      }
    );

    const processResult = processNotificationsResponse.ok 
      ? await processNotificationsResponse.json() 
      : { error: "Failed to check due tasks" };

    const eventResult = eventRemindersResponse.ok 
      ? await eventRemindersResponse.json() 
      : { error: "Failed to check event reminders" };

    console.log("Process notifications result:", processResult);
    console.log("Event reminders result:", eventResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        processResult,
        eventResult,
        message: "Manual notification check completed"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in manual trigger:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);