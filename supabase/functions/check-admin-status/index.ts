
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Get the user information from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error getting user from token:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Check for action parameter from URL query params or request body
    const url = new URL(req.url)
    let action = url.searchParams.get('action')
    
    // If action is not in query params, check in the request body
    if (!action && req.method === 'POST') {
      try {
        const body = await req.json()
        action = body.action
      } catch (e) {
        // If parsing fails, continue without body action
        console.log('Could not parse request body')
      }
    }
    
    // For GET requests, try to get action from the body too
    if (!action && req.method === 'GET') {
      try {
        const body = await req.json()
        action = body.action
      } catch (e) {
        // If parsing fails, continue without body action
        console.log('Could not parse request body for GET')
      }
    }
    
    console.log('Action parameter:', action)
    
    if (action === 'list_admins') {
      console.log('Listing all admin users')
      
      // Direct SQL query to avoid RLS
      const { data: adminUsersData, error: adminUsersError } = await supabaseClient
        .from('admin_users')
        .select('id, created_at')
      
      if (adminUsersError) {
        console.error('Error fetching admin users:', adminUsersError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch admin users' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      console.log('Found admin users:', adminUsersData.length)
      
      // Get profile details for each admin
      const adminUsersWithDetails = await Promise.all(
        adminUsersData.map(async (admin) => {
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('email, full_name')
            .eq('id', admin.id)
            .single()
          
          return {
            id: admin.id,
            email: profileData?.email || 'Unknown',
            full_name: profileData?.full_name || null,
            created_at: admin.created_at,
          }
        })
      )
      
      console.log('Returning admin users with details:', adminUsersWithDetails.length)
      
      return new Response(
        JSON.stringify({ admin_users: adminUsersWithDetails }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      // Check if the user is an admin by directly querying the admin_users table
      const { data, error } = await supabaseClient
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('Error checking admin status:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to check admin status' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      const isAdmin = !!data
      
      return new Response(
        JSON.stringify({ is_admin: isAdmin }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
