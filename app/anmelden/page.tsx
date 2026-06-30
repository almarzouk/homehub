"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(
    error ? t("auth.invalidCredentials") : null
  );

  useEffect(() => {
    fetch("/api/einrichten")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasUsers === false) router.replace("/einrichten");
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setLoginError(t("auth.invalidCredentials"));
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
          <Home className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>HomeHub</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{t("auth.loginTagline")}</p>
      </div>

      <div
        className="rounded-2xl shadow-xl border p-8"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--foreground)" }}>{t("auth.login")}</h2>

        {registered && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm mb-5 border"
            style={{ background: "var(--success-subtle)", borderColor: "var(--success)", color: "var(--success)" }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Konto erstellt! Bitte melde dich an.
          </div>
        )}

        {loginError && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm mb-5 border"
            style={{ background: "var(--danger-subtle)", borderColor: "var(--danger)", color: "var(--danger)" }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              placeholder={t("auth.emailPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                style={{ color: "var(--muted)" }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 btn-press shadow-sm"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("common.loading") : t("auth.loginButton")}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          {t("auth.noAccount")}{" "}
          <Link href="/registrieren" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AnmeldenPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
