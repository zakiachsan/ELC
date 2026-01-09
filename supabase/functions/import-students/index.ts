import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentData {
  name: string;
  email: string;
  password: string;
  kelas: string;
  tipe_kelas: string;
}

interface ImportRequest {
  students: StudentData[];
  location_name: string; // e.g., "TK ABDI SISWA BINTARO", "SD ABDI SISWA BINTARO"
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL");
    const serviceRoleKeyEnv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrlEnv || !serviceRoleKeyEnv) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      supabaseUrlEnv,
      serviceRoleKeyEnv,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify JWT token and get user
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${userError?.message || "No user found"}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: `Only admins can import students. Your role: ${profile?.role}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ImportRequest = await req.json();
    const { students, location_name } = body;

    if (!location_name) {
      return new Response(
        JSON.stringify({ error: "Missing location_name parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty students array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get location ID for the specified location
    const { data: locationData, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id, name")
      .ilike("name", `%${location_name}%`)
      .limit(1)
      .single();

    if (locationError || !locationData) {
      return new Response(
        JSON.stringify({ error: `Location not found: ${location_name}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Using location:", locationData);

    const results: { success: number; failed: number; errors: string[]; created: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    // Process students in batches of 10 to avoid timeout
    const batchSize = 10;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (student) => {
          try {
            // Create auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: student.email,
              password: student.password,
              email_confirm: true,
            });

            if (authError) {
              results.failed++;
              results.errors.push(`${student.email}: ${authError.message}`);
              return;
            }

            const userId = authData.user.id;
            const schoolInfo = `${locationData.name} - ${student.kelas} (${student.tipe_kelas})`;

            // Create profile
            const { error: profileError } = await supabaseAdmin
              .from("profiles")
              .insert({
                id: userId,
                email: student.email,
                name: student.name,
                role: "STUDENT",
                status: "ACTIVE",
                assigned_location_id: locationData.id,
                school_origin: schoolInfo,
              });

            if (profileError) {
              // Rollback auth user
              await supabaseAdmin.auth.admin.deleteUser(userId);
              results.failed++;
              results.errors.push(`${student.email}: Profile error - ${profileError.message}`);
              return;
            }

            results.success++;
            results.created.push(student.email);
          } catch (err) {
            results.failed++;
            results.errors.push(`${student.email}: ${err.message}`);
          }
        })
      );

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}, success: ${results.success}, failed: ${results.failed}`);
    }

    return new Response(
      JSON.stringify({
        message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
        ...results,
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
