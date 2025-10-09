import React from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "@/lib/supabase";
import { ExpertAPI } from "@/lib/api";

export default function JoinCTA({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    const token = await getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await ExpertAPI.me();
      if (res.onboarded) navigate('/dashboard');
      else navigate('/expert');
    } catch (err) {
      // If any error, fall back to expert flow
      navigate('/expert');
    }
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
    >
      {children}
    </button>
  );
}
