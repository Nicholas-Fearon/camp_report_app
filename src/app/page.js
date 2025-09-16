// /app/page.js (Updated Login Page)
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";

export default function Login() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        // Create coach record if it doesn't exist
        createCoachIfNeeded(session.user);
        router.push("/dashboard");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) {
        await createCoachIfNeeded(session.user);
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const createCoachIfNeeded = async (user) => {
    try {
      // Check if coach exists
      const { data: existingCoach } = await supabase
        .from("coaches")
        .select("id")
        .eq("email", user.email)
        .single();

      // If coach doesn't exist, create one
      if (!existingCoach) {
        const { error } = await supabase.from("coaches").insert([
          {
            email: user.email,
            full_name:
              user.user_metadata?.full_name || user.email.split("@")[0],
            team_name: "My Team",
          },
        ]);

        if (error) {
          console.error("Error creating coach:", error);
        }
      }
    } catch (error) {
      console.error("Error checking/creating coach:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Camp Report App</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your team</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          // Remove providers to use email/password only
          // providers={['google']}
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  );
}
