import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a regular client to verify the user's token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Get the user's family ID
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('family_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      throw new Error('User not part of any family')
    }

    // Get all family members with explicit join
    const { data: familyMembers, error: membersError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at
      `)
      .eq('family_id', userRole.family_id)

    if (membersError) {
      console.error('Error fetching family members:', membersError)
      throw membersError
    }

    // Get profiles separately to avoid join issues
    const userIds = familyMembers.map(member => member.user_id)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    // Get emails from auth.users for these users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      throw authError
    }

    // Combine family members with profiles and email data
    const familyUsersWithEmail = familyMembers.map(member => {
      const profile = profiles.find(p => p.user_id === member.user_id)
      const authUser = authUsers.users.find(u => u.id === member.user_id)
      
      const firstName = profile?.first_name || ''
      const lastName = profile?.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()
      
      return {
        id: member.user_id,
        user_id: member.user_id,
        name: fullName || 'Unknown',
        email: authUser?.email || 'No email',
        role: member.role,
        joinedAt: member.created_at
      }
    })

    return new Response(
      JSON.stringify({ members: familyUsersWithEmail }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})