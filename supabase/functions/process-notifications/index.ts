import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskAssignmentPayload {
  taskId: string;
  assigneeId: string;
  familyId: string;
  taskTitle: string;
  assignedBy: string;
}

interface EventReminderPayload {
  eventId: string;
  familyId: string;
  eventTitle: string;
  startTime: string;
  userIds: string[];
}

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

    const { type, payload } = await req.json();

    console.log("Processing notification:", { type, payload });

    switch (type) {
      case "task_assigned":
        await handleTaskAssignment(supabase, payload as TaskAssignmentPayload);
        break;
      case "event_reminder":
        await handleEventReminder(supabase, payload as EventReminderPayload);
        break;
      case "check_due_tasks":
        await handleDueTasksCheck(supabase);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handleTaskAssignment(supabase: any, payload: TaskAssignmentPayload) {
  const { taskId, assigneeId, familyId, taskTitle, assignedBy } = payload;

  // Check if user wants task assignment notifications
  const { data: preferences } = await supabase
    .rpc("get_user_notification_preferences", { p_user_id: assigneeId })
    .single();

  if (!preferences?.task_assignments) {
    console.log("User has disabled task assignment notifications");
    return;
  }

  // Get assignee profile
  const { data: assigneeProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("user_id", assigneeId)
    .single();

  // Get assigner profile
  const { data: assignerProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("user_id", assignedBy)
    .single();

  const assignerName = assignerProfile 
    ? `${assignerProfile.first_name} ${assignerProfile.last_name}`
    : "Someone";

  await supabase.rpc("create_notification", {
    p_family_id: familyId,
    p_user_id: assigneeId,
    p_type: "task_assigned",
    p_title: "New Task Assigned",
    p_message: `${assignerName} assigned you the task: ${taskTitle}`,
    p_data: { taskId, assignedBy }
  });

  console.log(`Task assignment notification created for user ${assigneeId}`);
}

async function handleEventReminder(supabase: any, payload: EventReminderPayload) {
  const { eventId, familyId, eventTitle, startTime, userIds } = payload;

  for (const userId of userIds) {
    // Check if user wants event reminder notifications
    const { data: preferences } = await supabase
      .rpc("get_user_notification_preferences", { p_user_id: userId })
      .single();

    if (!preferences?.event_reminders) {
      console.log(`User ${userId} has disabled event reminder notifications`);
      continue;
    }

    const startDate = new Date(startTime);
    const timeStr = startDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    await supabase.rpc("create_notification", {
      p_family_id: familyId,
      p_user_id: userId,
      p_type: "event_reminder",
      p_title: "Upcoming Event",
      p_message: `"${eventTitle}" starts at ${timeStr}`,
      p_data: { eventId, startTime }
    });

    console.log(`Event reminder notification created for user ${userId}`);
  }
}

async function handleDueTasksCheck(supabase: any) {
  // Get tasks that are due within the next 24 hours and don't have recent reminders
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: dueTasks } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      due_date,
      assignee_id,
      family_id,
      status
    `)
    .eq("status", "todo")
    .not("assignee_id", "is", null)
    .lt("due_date", tomorrow.toISOString())
    .gt("due_date", new Date().toISOString());

  if (!dueTasks?.length) {
    console.log("No due tasks found");
    return;
  }

  for (const task of dueTasks) {
    // Check for existing due task notifications in the last 12 hours
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const { data: existingNotification } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", task.assignee_id)
      .eq("type", "task_due_soon")
      .contains("data", { taskId: task.id })
      .gt("created_at", twelveHoursAgo.toISOString());

    if (existingNotification?.length > 0) {
      console.log(`Recent due task notification already exists for task ${task.id}`);
      continue;
    }

    // Check user preferences
    const { data: preferences } = await supabase
      .rpc("get_user_notification_preferences", { p_user_id: task.assignee_id })
      .single();

    if (!preferences?.task_due_reminders) {
      console.log(`User ${task.assignee_id} has disabled due task notifications`);
      continue;
    }

    const dueDate = new Date(task.due_date);
    const isOverdue = dueDate < new Date();
    const type = isOverdue ? "task_overdue" : "task_due_soon";
    const title = isOverdue ? "Task Overdue" : "Task Due Soon";
    const message = isOverdue 
      ? `Task "${task.title}" is overdue`
      : `Task "${task.title}" is due soon`;

    await supabase.rpc("create_notification", {
      p_family_id: task.family_id,
      p_user_id: task.assignee_id,
      p_type: type,
      p_title: title,
      p_message: message,
      p_data: { taskId: task.id, dueDate: task.due_date }
    });

    console.log(`Due task notification created for user ${task.assignee_id}, task ${task.id}`);
  }
}

serve(handler);