import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  phone?: string;
  address?: string;
  linked_student_id?: string;
  assigned_location_id?: string;
  school_origin?: string;
  status?: "ACTIVE" | "INACTIVE";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Debug: Log environment variables (not the actual values, just whether they exist)
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL");
    const serviceRoleKeyEnv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    console.log("ENV Check - SUPABASE_URL exists:", !!supabaseUrlEnv, "URL:", supabaseUrlEnv?.substring(0, 30) + "...");
    console.log("ENV Check - SERVICE_ROLE_KEY exists:", !!serviceRoleKeyEnv, "Key length:", serviceRoleKeyEnv?.length);

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header exists:", !!authHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");
    console.log("Token length:", token.length);
    console.log("Token prefix:", token.substring(0, 50) + "...");

    // Decode JWT to see what project it's from (without verifying)
    try {
      const [, payloadBase64] = token.split(".");
      const payload = JSON.parse(atob(payloadBase64));
      console.log("JWT payload ref (project):", payload.ref);
      console.log("JWT payload sub (user id):", payload.sub);
      console.log("JWT payload exp:", payload.exp, "now:", Math.floor(Date.now() / 1000));
    } catch (e) {
      console.log("Could not decode JWT:", e);
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      supabaseUrlEnv ?? "",
      serviceRoleKeyEnv ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify JWT token and get user using admin client
    console.log("About to verify token...");
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    console.log("Verification result - user:", !!requestingUser, "error:", userError?.message);

    if (userError) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${userError.message}`, debug: { tokenLength: token.length, hasUrl: !!supabaseUrlEnv, hasKey: !!serviceRoleKeyEnv } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No user found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return new Response(
        JSON.stringify({ error: `Failed to get profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile?.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: `Only admins can create users. Your role: ${profile?.role}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, name, role, phone, address, linked_student_id, assigned_location_id, school_origin, status } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, name, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const { data: profileData, error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email,
        name,
        role,
        phone: phone || null,
        address: address || null,
        linked_student_id: linked_student_id || null,
        assigned_location_id: assigned_location_id || null,
        school_origin: school_origin || null,
        status: status || "ACTIVE",
      })
      .select()
      .single();

    if (profileInsertError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileInsertError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          name,
          role,
        },
        profile: profileData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
