"use client";

import { useEffect, useState } from "react";
import { Header, type AppView } from "@/components/Header";
import { AssessmentPage } from "@/components/pages/AssessmentPage";
import { DocumentsPage } from "@/components/pages/DocumentsPage";
import { LandingPage } from "@/components/pages/LandingPage";
import { LoginPage } from "@/components/pages/LoginPage";
import { PatientsPage } from "@/components/pages/PatientsPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { UsersPage } from "@/components/pages/UsersPage";
import { logout as logoutSession, me, type UserResponse, type UserRole } from "@/lib/api";

const defaultViewForRole = (role: UserRole): AppView =>
  role === "superadmin" ? "documents" : "assessment";

export function AppShell() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [view, setView] = useState<AppView>("assessment");
  const [authView, setAuthView] = useState<"landing" | "login">("landing");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    me()
      .then((sessionUser) => {
        setUser(sessionUser);
        setView(defaultViewForRole(sessionUser.role));
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    await logoutSession().catch(() => undefined);
    setUser(null);
    setView("assessment");
    setAuthView("landing");
  };

  if (checking) return <div className="min-h-screen bg-cream" />;

  if (!user) {
    if (authView === "landing") {
      return <LandingPage onLogin={() => setAuthView("login")} />;
    }

    return (
      <LoginPage
        onBack={() => setAuthView("landing")}
        onLoggedIn={(sessionUser) => {
          setUser(sessionUser);
          setView(defaultViewForRole(sessionUser.role));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <Header user={user} view={view} onViewChange={setView} onLogout={logout} />
      <div className="min-w-0">
        {view === "assessment" && user.role === "apoteker" && <AssessmentPage />}
        {view === "patients" && user.role === "apoteker" && <PatientsPage />}
        {view === "patients" && user.role === "superadmin" && (
          <PatientsPage
            canDelete
            showApoteker
            title="Seluruh pasien"
            description="Pantau seluruh pasien yang terdaftar beserta apoteker penanggung jawab dan riwayat asesmennya."
          />
        )}
        {view === "profile" && user.role === "apoteker" && (
          <ProfilePage user={user} onUserUpdated={setUser} />
        )}
        {view === "documents" && user.role === "superadmin" && <DocumentsPage />}
        {view === "users" && user.role === "superadmin" && <UsersPage />}
      </div>
    </div>
  );
}
