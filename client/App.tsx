import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/site/Layout";
import Army from "./pages/Army";
import Join from "./pages/Join";
import Compensation from "./pages/Compensation";

import Shop from "./pages/Shop";
import Events from "./pages/Events";
import ProtectedOutlet from "@/components/site/Protected";
import OnboardedOutlet from "@/components/site/Onboarded";
import DashboardLayout from "@/components/site/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Profile from "./pages/dashboard/Profile";
import Team from "./pages/dashboard/Team";
import Orders from "./pages/dashboard/Orders";
import Resources from "./pages/dashboard/Resources";
import Referrals from "./pages/dashboard/Referrals";
import RankPage from "./pages/dashboard/Rank";
import PointsWallet from "./pages/dashboard/Points";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ExpertLayout from "./pages/expert/Layout";
import CartStep from "./pages/expert/Cart";
import SubscriptionStep from "./pages/expert/Subscription";
import AccountStep from "./pages/expert/Account";
import ReviewStep from "./pages/expert/Review";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import Buy from "./pages/Buy";
import AdminSettings from "./pages/admin/Settings";
import LeaderboardPage from "./pages/Leaderboard";
import AdminApplications from "./pages/admin/Applications";
import AdminReviewsPage from "./pages/admin/Reviews";
import { useEffect } from "react";
import supabase, { getSupabase } from "@/lib/supabase";

const queryClient = new QueryClient();

// Initialize Supabase client early and process magic-link fragments (access_token / errors)
const App = () => {
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Process auth redirect: first try PKCE/code exchange, then fallback to hash tokens
    (async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
        const searchParams = url.searchParams;
        const hasCode = !!(searchParams.get("code") || hashParams.get("code"));

        if (hasCode) {
          const verifier = localStorage.getItem("supabase-code-verifier");
          if (verifier) (supabase.auth as any).setCodeVerifier?.(verifier);
          await supabase.auth.exchangeCodeForSession(window.location.href);
          const cleanedSearch = url.search
            .replace(/([?&])(code|state)=[^&]*(&|$)/g, "$1")
            .replace(/[?&]$/, "");
          history.replaceState(null, "", url.pathname + cleanedSearch);
          if (window.location.hash) history.replaceState(null, "", url.pathname + cleanedSearch);
          return;
        }

        // Fallback for legacy hash tokens (access_token/refresh_token)
        const processParams = async (params: URLSearchParams) => {
          const error = params.get("error");
          const error_description = params.get("error_description");
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (error) {
            window.alert(`Authentication error: ${error_description || error}`);
            history.replaceState(null, "", window.location.pathname + window.location.search);
            return;
          }
          if (access_token) {
            try {
              await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? undefined });
            } catch (err) {
              console.error("Failed to set Supabase session from URL", err);
            }
            history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        };

        const hash = window.location.hash || "";
        if (hash.startsWith("#")) {
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          await processParams(params);
        } else if (window.location.search) {
          const params = new URLSearchParams(window.location.search.replace(/^\?/, ""));
          await processParams(params);
        }
      } catch (err) {
        console.error("Error processing auth redirect:", err);
      }
    })();

    // Subscribe to auth changes and log events; restore session
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log("Signed in:", session.user.email);
      }
      if (event === "SIGNED_OUT") {
        console.log("Signed out");
      }
    });

    // restore session after redirect
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        console.log("Session restored:", data.session.user.email);
      }
    });

    return () => {
      try {
        (sub as any)?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="army" element={<Army />} />
              <Route path="join" element={<Join />} />
              <Route element={<ProtectedOutlet />}>
                <Route element={<OnboardedOutlet />}>
                  <Route path="dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="points" element={<PointsWallet />} />
                    <Route path="referrals" element={<Referrals />} />
                    <Route path="rank" element={<RankPage />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="team" element={<Team />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="resources" element={<Resources />} />
                  </Route>
                </Route>
              </Route>
              <Route path="shop" element={<Shop />} />
              <Route path="buy/:handle" element={<Buy />} />
              <Route path="compensation" element={<Compensation />} />
              <Route path="events" element={<Events />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="expert" element={<ExpertLayout />}>
                <Route index element={<CartStep />} />
                <Route path="subscription" element={<SubscriptionStep />} />
                <Route path="account" element={<AccountStep />} />
                <Route path="review" element={<ReviewStep />} />
              </Route>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="auth/callback" element={<AuthCallback />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
