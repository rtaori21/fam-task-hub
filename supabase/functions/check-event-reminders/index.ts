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
      // Calculate the time window for events that should trigger reminders NOW
      // Events starting in X minutes (where X = advanceMinutes) should get reminders now
      const eventStartTimeMin = new Date(now.getTime() + (advanceMinutes - 1) * 60000); // 1 minute before target
      const eventStartTimeMax = new Date(now.getTime() + (advanceMinutes + 1) * 60000); // 1 minute after target

      console.log(`Checking for events starting between ${eventStartTimeMin.toISOString()} and ${eventStartTimeMax.toISOString()} (in ~${advanceMinutes} minutes) for ${users.length} users`);

      // Get family IDs for this group
      const familyIds = [...new Set(users.map(u => u.family_id))];

      // Get events in the reminder window for these families
      const { data: upcomingEvents, error: eventsError } = await supabase
        .from("calendar_events")
        .select("*")
        .in("family_id", familyIds)
        .gte("start_time", eventStartTimeMin.toISOString())
        .lte("start_time", eventStartTimeMax.toISOString());

      if (eventsError) {
        console.error(`Error fetching events for advance time ${advanceMinutes}:`, eventsError);
        continue;
      }

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
          // Get family members to match names to user IDs
          const { data: familyMembers } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", familyUsers.map(u => u.user_id));
          
          // Match assignee names to user IDs
          const assigneeUserIds = [];
          for (const assigneeName of event.assignees) {
            const member = familyMembers?.find(m => 
              `${m.first_name} ${m.last_name}`.trim() === assigneeName.trim()
            );
            if (member) {
              assigneeUserIds.push(member.user_id);
            }
          }
          
          targetUsers = familyUsers.filter(u => assigneeUserIds.includes(u.user_id));
        }

        console.log(`Processing event "${event.title}" (${event.id}) for ${targetUsers.length} users`);

        for (const user of targetUsers) {
          // Check if we already sent a reminder for this event to this user
          const { data: existingReminder, error: checkError } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", user.user_id)
            .eq("type", "event_reminder")
            .contains("data", { eventId: event.id });

          if (checkError) {
            console.error(`Error checking existing reminders for user ${user.user_id}:`, checkError);
            continue;
          }

          if (existingReminder?.length > 0) {
            console.log(`Reminder already sent for event ${event.id} to user ${user.user_id}`);
            continue;
          }

          // Calculate more precise time until event
          const eventStart = new Date(event.start_time);
          const minutesUntilEvent = Math.round((eventStart.getTime() - now.getTime()) / 60000);
          
          // Create the reminder notification
          const { error: notificationError } = await supabase.rpc("create_notification", {
            p_family_id: event.family_id,
            p_user_id: user.user_id,
            p_type: "event_reminder",
            p_title: "Upcoming Event",
            p_message: `"${event.title}" starts in ${minutesUntilEvent} minutes`,
            p_data: { 
              eventId: event.id, 
              startTime: event.start_time,
              advanceMinutes: advanceMinutes,
              actualMinutesUntilEvent: minutesUntilEvent
            }
          });

          if (notificationError) {
            console.error(`Error creating notification for user ${user.user_id}:`, notificationError);
            continue;
          }

          remindersSent++;
          console.log(`Event reminder sent to user ${user.user_id} for event "${event.title}" (${minutesUntilEvent} minutes until start)`);
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