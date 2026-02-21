import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
];

export function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeIndex = navItems.findIndex((i) => i.path === location.pathname);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-4 inset-x-0 mx-auto z-50 w-[92%] sm:w-auto max-w-2xl"
    >
      <nav
        className={`glass rounded-full px-2.5 py-1.5 flex items-center justify-between gap-4 sm:gap-6 transition-all duration-300 border ${scrolled ? "py-1 shadow-lg shadow-primary/10 border-white/20 bg-background/70 backdrop-blur-md" : "border-white/5 bg-background/40 backdrop-blur-sm shadow-sm"
          }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 pl-2 pr-1 shrink-0 group">
          <img src="/logo.png" alt="NewsLabs Logo" className="h-5 w-auto object-contain transition-transform group-hover:scale-110 duration-300 drop-shadow-sm" />
          <span className="font-bold text-base tracking-tight text-foreground hidden sm:block">
            NewsLabs
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0.5 relative">
          {navItems.map((item, i) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-colors ${activeIndex === i
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {activeIndex === i && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 bg-primary/90 shadow-md shadow-primary/20 rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`relative px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-colors ${location.pathname === "/dashboard"
                ? "text-primary-foreground bg-primary/90 shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* CTA */}
        <div className="hidden md:block pr-1">
          {isAuthenticated ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
              className="p-1.5 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground p-1 pr-2 hover:opacity-70 transition-opacity"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-2"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Dashboard
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="px-4 py-2 flex justify-center items-center gap-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-500 text-center mt-1"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground text-center mt-1"
            >
              Get Started
            </Link>
          )}
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sign Out</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors flex-1 shadow-lg shadow-red-500/20"
                >
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
