// /app/player/join/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PlayerJoin() {
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");

  useEffect(() => {
    if (inviteCode) {
      validateInvite();
    } else {
      setError("No invite code provided");
      setLoading(false);
    }
  }, [inviteCode]);

  const validateInvite = async () => {
    try {
      const { data: invite, error } = await supabase
        .from("player_invites")
        .select(
          `
          *,
          players:player_id (name, position),
          coaches:coach_id (full_name, team_name)
        `
        )
        .eq("invite_code", inviteCode)
        .gt("expires_at", new Date().toISOString())
        .is("accepted_at", null)
        .single();

      if (error || !invite) {
        setError("Invalid or expired invite code");
        return;
      }

      setInviteData(invite);
    } catch (err) {
      setError("Error validating invite");
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsCreatingAccount(true);
    setError("");

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: password,
        options: {
          data: {
            full_name: inviteData.players.name,
            user_type: "player",
          },
        },
      });

      if (authError) throw authError;

      // Mark invite as accepted
      const { error: updateError } = await supabase
        .from("player_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", inviteData.id);

      if (updateError) throw updateError;

      // Update player's last_login
      await supabase
        .from("players")
        .update({ last_login: new Date().toISOString() })
        .eq("id", inviteData.player_id);

      // Redirect to player dashboard
      router.push("/player/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Join Your Team</h1>
          <p className="text-gray-600 mt-2">
            You&apos;ve been invited by{" "}
            <strong>{inviteData.coaches.full_name}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Team: {inviteData.coaches.team_name}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="font-medium text-blue-800">Player Details:</h3>
          <p className="text-blue-700">Name: {inviteData.players.name}</p>
          <p className="text-blue-700">
            Position: {inviteData.players.position || "Not specified"}
          </p>
          <p className="text-blue-700">Email: {inviteData.email}</p>
        </div>

        <form onSubmit={createAccount} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Create Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              minLength="6"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              minLength="6"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreatingAccount}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isCreatingAccount
              ? "Creating Account..."
              : "Create Account & Join Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
