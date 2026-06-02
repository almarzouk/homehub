"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Loader2, Eye, EyeOff, AlertCircle, Users, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegistrierenPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [mode, setMode] = useState<"new" | "join">("new");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/registrieren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password,
          householdName: mode === "new" ? householdName.trim() : undefined,
          inviteCode: mode === "join" ? inviteCode.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("common.error")); return; }
      router.push("/anmelden?registered=1");
    } catch { setError(t("common.error")); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HomeHub</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("auth.registerDesc")}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">{t("auth.register")}</h2>
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {(["new","join"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode===m?"bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm":"text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                {m==="new"?<Plus className="h-4 w-4"/>:<Users className="h-4 w-4"/>}
                {m==="new"?t("auth.createHousehold"):t("auth.joinHousehold")}
              </button>
            ))}
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{label:"auth.name",id:"name",type:"text",val:name,set:setName,ac:"name"},{label:"auth.email",id:"email",type:"email",val:email,set:setEmail,ac:"email"}].map(({label,id,type,val,set,ac})=>(
              <div key={id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t(label)}</label>
                <input type={type} value={val} onChange={(e)=>set(e.target.value)} required autoComplete={ac}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("auth.password")}</label>
              <div className="relative">
                <input type={showPassword?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder={t("auth.passwordMin")}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                  {showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                </button>
              </div>
            </div>
            {mode==="new"?(
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("auth.householdName")}</label>
                <input type="text" value={householdName} onChange={(e)=>setHouseholdName(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
            ):(
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("auth.inviteCode")}</label>
                <input type="text" value={inviteCode} onChange={(e)=>setInviteCode(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading&&<Loader2 className="h-4 w-4 animate-spin"/>}
              {loading?t("common.loading"):t("auth.registerButton")}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            {t("auth.alreadyAccount")}{" "}
            <Link href="/anmelden" className="text-blue-600 hover:text-blue-700 font-medium">{t("auth.login")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
