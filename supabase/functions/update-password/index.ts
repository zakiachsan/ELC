import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePasswordRequest {
  userId: string;
  password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL");
    const serviceRoleKeyEnv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");

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
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${userError.message}` }),
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
        JSON.stringify({ error: `Only admins can update passwords. Your role: ${profile?.role}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: UpdatePasswordRequest = await req.json();
    const { userId, password } = body;

    // Validate required fields
    if (!userId || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user password
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update password: ${updateError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully",
        userId: updateData.user.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
