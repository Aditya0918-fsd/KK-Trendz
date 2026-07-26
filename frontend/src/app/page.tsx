'use client';

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col font-sans transition-colors duration-300 overflow-hidden">
      {/* Background Animated Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-600/30 animate-blob"></div>
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl dark:bg-pink-600/20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-600/30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-200/50 bg-white/70 px-8 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
            <span className="text-xl font-black tracking-tighter">KK</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-gradient">
            KK Trendz
          </span>
        </div>
        
        <div className="hidden gap-8 text-sm font-semibold md:flex">
          <a href="#" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Inventory</a>
          <a href="#" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Production</a>
          <a href="#" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Orders</a>
          <a href="#" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Reports</a>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"></div>
          ) : user ? (
            <Link href="/dashboard">
              <Button variant="primary" className="shadow-lg shadow-indigo-500/25 bg-linear-to-r from-violet-600 to-indigo-600 border-none hover:from-violet-500 hover:to-indigo-500 transition-all">
                Dashboard →
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signin">
              <Button variant="secondary" className="shadow-md hover:shadow-indigo-500/10 border-indigo-200 dark:border-indigo-800/40">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-8 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/80 px-4 py-1.5 backdrop-blur-md dark:border-indigo-500/30 dark:bg-indigo-950/40 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Next-Gen Textile ERP System
                </span>
              </div>

              <h1 className="mt-6 text-5xl font-black leading-tight lg:text-6xl tracking-tight text-slate-900 dark:text-white">
                Streamline Your <br />
                <span className="text-gradient">Fabric Production</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-normal max-w-xl">
                Empower your manufacturing flow: real-time loom tracking, raw material automated allocation, batch-wise Quality Control, and seamless sales reporting—all in one place.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href={user ? "/dashboard" : "/auth/signin"}>
                  <button className="h-14 px-8 rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-pink-500 text-white font-bold text-base shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                    Get Started Now
                  </button>
                </Link>
                <button className="h-14 px-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md font-bold text-base shadow-md hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-300">
                  Explore Features
                </button>
              </div>

              {/* Stats Bar */}
              <div className="mt-14 grid grid-cols-3 gap-6 border-t border-slate-200/80 pt-10 dark:border-slate-800/80">
                <div className="glass-card p-4 rounded-2xl text-center hover:-translate-y-0.5 transition-transform">
                  <div className="text-3xl font-black text-gradient">1.2M+</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meters Woven</div>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center hover:-translate-y-0.5 transition-transform">
                  <div className="text-3xl font-black text-gradient">500+</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Batches</div>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center hover:-translate-y-0.5 transition-transform">
                  <div className="text-3xl font-black text-gradient">99.8%</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">QC Accuracy</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup Card */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-violet-500/20 via-pink-500/20 to-indigo-500/20 blur-3xl" />
              
              <div className="relative glass-card p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden group">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                    LIVE SYSTEM MATRIX
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300 font-bold">
                        ⚙️
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Loom Unit #04</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Cotton Twill 240 GSM — High Speed</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Active 98%
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        📦
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Batch #TX-482 QC</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Inspected 500m — 0 Defect</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                      Passed
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300 font-bold">
                        🚚
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Order Dispatch #892</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Out for delivery to Client</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-950/60 px-2.5 py-1 text-xs font-bold text-violet-600 dark:text-violet-400">
                      Dispatched
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Live Socket Connected
                  </span>
                  <span className="italic">Auto-updated milliseconds ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-slate-200/60 bg-white/40 px-8 py-8 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} KK Trendz. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

