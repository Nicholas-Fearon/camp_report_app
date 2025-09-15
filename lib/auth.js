import { supabase } from "./supabase";

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getCurrentCoach = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("email", user.email)
    .single();

  return coach;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
