"use client";

import Link from "next/link";
import {
  ChefHat,
  Package,
  Wallet,
  Users,
  ShoppingCart,
  Sparkles,
  CheckCircle,
  Globe,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: ChefHat,
      title: t("landing.kitchenTitle"),
      desc: t("landing.kitchenDesc"),
      color: "from-orange-400 to-red-500",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-100 dark:border-orange-900/40",
    },
    {
      icon: Package,
      title: t("landing.inventoryTitle"),
      desc: t("landing.inventoryDesc"),
      color: "from-green-400 to-emerald-500",
      bg: "bg-green-50 dark:bg-green-950/40",
      border: "border-green-100 dark:border-green-900/40",
    },
    {
      icon: Wallet,
      title: t("landing.financeTitle"),
      desc: t("landing.financeDesc"),
      color: "from-blue-400 to-indigo-500",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-100 dark:border-blue-900/40",
    },
    {
      icon: Users,
      title: t("landing.familyTitle"),
      desc: t("landing.familyDesc"),
      color: "from-violet-400 to-purple-500",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      border: "border-violet-100 dark:border-violet-900/40",
    },
    {
      icon: ShoppingCart,
      title: t("landing.shoppingTitle"),
      desc: t("landing.shoppingDesc"),
      color: "from-cyan-400 to-teal-500",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      border: "border-cyan-100 dark:border-cyan-900/40",
    },
    {
      icon: Sparkles,
      title: t("landing.aiTitle"),
      desc: t("landing.aiDesc"),
      color: "from-pink-400 to-rose-500",
      bg: "bg-pink-50 dark:bg-pink-950/40",
      border: "border-pink-100 dark:border-pink-900/40",
    },
  ];

  const stats = [
    { value: "500+", label: t("landing.statUsers") },
    { value: "30+", label: t("landing.statFeatures") },
    { value: "5", label: t("landing.statLangs") },
    { value: "100%", label: t("landing.statFree") },
  ];

  const highlights = [
    t("landing.kitchenTitle"),
    t("landing.inventoryTitle"),
    t("landing.financeTitle"),
    t("landing.familyTitle"),
    t("landing.shoppingTitle"),
    t("landing.aiTitle"),
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/40">
              <span className="text-white font-bold text-lg leading-none">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">HomeHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/anmelden"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t("auth.login")}
            </Link>
            <Link
              href="/registrieren"
              className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/40 hover:shadow-lg"
            >
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-medium mb-8">
            <Star className="h-3.5 w-3.5 fill-current" />
            {t("landing.trusted")}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6">
            <span className="block">{t("landing.heroTitle")}</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              HomeHub
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.heroSub")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registrieren"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/50 hover:shadow-2xl hover:scale-105"
            >
              {t("landing.heroCta")}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/anmelden"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              {t("landing.heroLogin")}
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
            {highlights.map((h) => (
              <span
                key={h}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium"
              >
                <CheckCircle className="h-3 w-3 text-green-500" />
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* App mockup */}
        <div className="relative mx-auto mt-20">
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-950 rounded-2xl overflow-hidden">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center px-3">
                  <span className="text-xs text-gray-400">homehub.app</span>
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: t("nav.sections.kueche"), color: "from-orange-400 to-red-400", icon: "👨‍🍳" },
                  { label: t("nav.sections.vorrat"), color: "from-green-400 to-emerald-400", icon: "📦" },
                  { label: t("nav.sections.finanzen"), color: "from-blue-400 to-indigo-400", icon: "💰" },
                  { label: t("nav.sections.familie"), color: "from-violet-400 to-purple-400", icon: "👨‍👩‍👧" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-md`}
                  >
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <p className="text-sm font-semibold">{card.label}</p>
                    <div className="mt-2 h-1.5 bg-white/30 rounded-full">
                      <div
                        className="h-full bg-white/70 rounded-full"
                        style={{ width: `${Math.floor(Math.random() * 40 + 50)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Shadow glow */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-blue-500/20 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold">{s.value}</p>
              <p className="text-blue-100 text-sm mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t("landing.featuresSub")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`group relative p-6 rounded-2xl border ${feat.bg} ${feat.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} shadow-md mb-4`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Languages / Global ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 shadow-lg mb-6">
            <Globe className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            🇩🇪 · 🇸🇦 · 🇬🇧 · 🇪🇸 · 🇧🇬
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base mb-2">
            {t("landing.featuresSub")}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              5 {t("landing.statLangs")} · RTL Support
            </span>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-2xl shadow-blue-200 dark:shadow-blue-900/50 overflow-hidden">
            {/* bg circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-extrabold text-3xl leading-none">H</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("landing.heroTitle")}
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                {t("landing.footerTag")}
              </p>
              <Link
                href="/registrieren"
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-blue-700 font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
              >
                {t("landing.heroCta")}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="mt-4 text-blue-200 text-sm">
                100% {t("landing.statFree")} · {t("landing.trusted")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">HomeHub</span>
          </div>
          <p>{t("landing.footerTag")}</p>
          <div className="flex items-center gap-4">
            <Link href="/anmelden" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              {t("auth.login")}
            </Link>
            <Link href="/registrieren" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
