import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, AlertTriangle, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { useStatus } from "../lib/status";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { services, isChecking, setDetailsOpen, checkHealth } = useStatus();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Main navbar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#F9F9F7] border-b-2 border-[#111111]">
        <nav className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="NewsLabs Home"
          >
            <img
              src="/logo.png"
              alt="NewsLabs Logo"
              className="h-6 w-auto object-contain"
            />
            <span
              className="font-black text-lg tracking-tight text-[#111111] leading-none hidden sm:block"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              NewsLabs
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 h-14 flex items-center text-xs font-bold uppercase tracking-[0.15em] border-r border-[#111111] transition-colors duration-150
                  ${isActive(item.path)
                    ? "bg-[#111111] text-[#F9F9F7]"
                    : "text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]"
                  }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`px-4 h-14 flex items-center text-xs font-bold uppercase tracking-[0.15em] border-r border-[#111111] transition-colors duration-150
                  ${isActive("/dashboard")
                    ? "bg-[#111111] text-[#F9F9F7]"
                    : "text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]"
                  }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {/* Status Controls */}
            <div className="flex items-center gap-2 border-r border-[#E5E5E0] pr-4">
              <button
                onClick={() => setDetailsOpen(true)}
                title="View System Status"
                className="flex items-center gap-1.5 px-3 h-8 border border-[#111111] hover:bg-neutral-100 transition-colors"
                style={{ borderRadius: 0 }}
              >
                {services.map((svc) => (
                  <span
                    key={svc.id}
                    className={`block w-2.5 h-2.5 ${svc.status === "checking" ? "bg-neutral-300 animate-pulse" :
                      svc.status === "operational" ? "bg-emerald-500" :
                        svc.status === "degraded" ? "bg-amber-400 animate-pulse" :
                          "bg-[#CC0000] animate-pulse"
                      }`}
                    style={{ borderRadius: 0 }}
                  />
                ))}
              </button>
              <button
                onClick={async () => {
                  try {
                    await checkHealth();
                  } finally {
                    setDetailsOpen(true);
                    setTimeout(() => setDetailsOpen(false), 3000);
                  }
                }}
                disabled={isChecking}
                title="Refresh Health Check"
                className={`w-8 h-8 flex items-center justify-center border border-[#111111] transition-colors ${isChecking ? "bg-[#111111] text-white" : "text-neutral-500 hover:text-[#111111] hover:bg-neutral-100"}`}
                style={{ borderRadius: 0 }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign Out"
                aria-label="Sign Out"
                className="min-h-[36px] px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-150"
                style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="min-h-[36px] px-5 flex items-center text-xs font-bold uppercase tracking-[0.15em] bg-[#111111] text-[#F9F9F7] border border-[#111111] hover:bg-white hover:text-[#111111] transition-all duration-150"
                style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors duration-150"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            style={{ borderRadius: 0 }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden overflow-hidden bg-[#F9F9F7] border-t-2 border-[#111111]"
            >
              <div className="flex flex-col">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] border-b border-[#111111] transition-colors duration-150
                      ${isActive(item.path)
                        ? "bg-[#111111] text-[#F9F9F7]"
                        : "text-[#111111] hover:bg-neutral-100"
                      }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                  </Link>
                ))}
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] border-b border-[#111111] transition-colors duration-150
                      ${isActive("/dashboard")
                        ? "bg-[#111111] text-[#F9F9F7]"
                        : "text-[#111111] hover:bg-neutral-100"
                      }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Dashboard
                  </Link>
                )}
                {isAuthenticated ? (
                  <button
                    onClick={() => { setShowLogoutConfirm(true); setMobileOpen(false); }}
                    className="px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-left text-[#CC0000] border-b border-[#111111] hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] bg-[#111111] text-[#F9F9F7] hover:bg-neutral-800 transition-colors duration-150"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Get Started →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer to push page content below the fixed navbar */}
      <div className="h-14" />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111111]/60 backdrop-blur-none"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-[#F9F9F7] w-full max-w-sm border-2 border-[#111111] p-8 text-center"
              style={{ borderRadius: 0 }}
            >
              <div className="w-12 h-12 border-2 border-[#CC0000] text-[#CC0000] flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3
                className="text-xl font-black mb-2 text-[#111111]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Sign Out
              </h3>
              <p
                className="text-sm text-neutral-600 mb-6 leading-relaxed"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#111111] text-[#111111] hover:bg-neutral-100 transition-colors duration-150"
                  style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); logout(); }}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-[0.15em] bg-[#CC0000] text-white hover:bg-red-700 transition-colors duration-150"
                  style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
                >
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
