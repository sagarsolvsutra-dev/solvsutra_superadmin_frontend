"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiShield } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { HEALTH_CHECK } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch(HEALTH_CHECK)
      .then((r) => setBackendStatus(r.ok ? "online" : "offline"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-200">
            <FiShield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">SolvSutra Super Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the Super Admin portal</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <Alert type="error">{error}</Alert>}

          <Input
            label="Email"
            type="email"
            placeholder="admin@solvsutra.com"
            icon={<FiMail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="mt-2 w-full" loading={loading} disabled={backendStatus === "offline"}>
            Sign In
          </Button>

          <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === "online" ? "bg-emerald-500" : backendStatus === "offline" ? "bg-red-500" : "animate-pulse bg-amber-500"
              }`}
            />
            <span className="text-slate-500">
              {backendStatus === "online" ? "Backend connected" : backendStatus === "offline" ? "Backend offline" : "Checking..."}
            </span>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} SolvSutra. All rights reserved.</p>
      </div>
    </div>
  );
}
