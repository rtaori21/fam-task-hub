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

    console.log("Checking for upcoming events that need reminders...");

    // Get all users' notification preferences to know their reminder advance times
    const { data: allPreferences } = await supabase
      .from("notification_preferences")
      .select("user_id, family_id, reminder_advance_minutes, event_reminders");

    if (!allPreferences?.length) {
      console.log("No notification preferences found");
      return new Response(
        JSON.stringify({ success: true, message: "No preferences found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const now = new Date();
    let remindersSent = 0;

    // Group users by their reminder advance time
    const reminderGroups = new Map<number, any[]>();
    
    for (const pref of allPreferences) {
      if (!pref.event_reminders) continue; // Skip users who disabled event reminders
      
      const advanceMinutes = pref.reminder_advance_minutes || 15;
      if (!reminderGroups.has(advanceMinutes)) {
        reminderGroups.set(advanceMinutes, []);
      }
      reminderGroups.get(advanceMinutes)!.push(pref);
    }

    // Process each reminder advance time group
    for (const [advanceMinutes, users] of reminderGroups) {
      const reminderTime = new Date(now.getTime() + advanceMinutes * 60000);
      const windowStart = new Date(reminderTime.getTime() - 2 * 60000); // 2 minutes before
      const windowEnd = new Date(reminderTime.getTime() + 2 * 60000); // 2 minutes after

      console.log(`Checking events starting between ${windowStart.toISOString()} and ${windowEnd.toISOString()} for ${users.length} users`);

      // Get family IDs for this group
      const familyIds = [...new Set(users.map(u => u.family_id))];

      // Get events in the reminder window for these families
      const { data: upcomingEvents } = await supabase
        .from("calendar_events")
        .select("*")
        .in("family_id", familyIds)
        .gte("start_time", windowStart.toISOString())
        .lte("start_time", windowEnd.toISOString());

      if (!upcomingEvents?.length) {
        console.log(`No events found in reminder window for advance time ${advanceMinutes} minutes`);
        continue;
      }

      console.log(`Found ${upcomingEvents.length} events in reminder window`);

      for (const event of upcomingEvents) {
        // Get users from this family who should receive notifications
        const familyUsers = users.filter(u => u.family_id === event.family_id);
        
        // Filter users based on event assignees if specified
        let targetUsers = familyUsers;
        if (event.assignees && event.assignees.length > 0) {
          targetUsers = familyUsers.filter(u => event.assignees.includes(u.user_id));
        }

        for (const user of targetUsers) {
          // Check if we already sent a reminder for this event to this user
          const { data: existingReminder } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", user.user_id)
            .eq("type", "event_reminder")
            .contains("data", { eventId: event.id });

          if (existingReminder?.length > 0) {
            console.log(`Reminder already sent for event ${event.id} to user ${user.user_id}`);
            continue;
          }

          // Create the reminder notification
          await supabase.rpc("create_notification", {
            p_family_id: event.family_id,
            p_user_id: user.user_id,
            p_type: "event_reminder",
            p_title: "Upcoming Event",
            p_message: `"${event.title}" starts in ${advanceMinutes} minutes`,
            p_data: { 
              eventId: event.id, 
              startTime: event.start_time,
              advanceMinutes: advanceMinutes
            }
          });

          remindersSent++;
          console.log(`Event reminder sent to user ${user.user_id} for event "${event.title}"`);
        }
      }
    }

    console.log(`Total reminders sent: ${remindersSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        message: `Sent ${remindersSent} event reminders`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error checking event reminders:", error);
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