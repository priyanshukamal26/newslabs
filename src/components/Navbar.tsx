import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "How it Works", path: "/how-it-works" },
  { label: "Docs", path: "/docs" },
];

export function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      className="fixed top-4 inset-x-0 mx-auto z-50 w-[92%] max-w-3xl"
    >
      <nav
        className={`glass rounded-full px-4 py-2 flex items-center justify-between transition-all duration-300 ${scrolled ? "py-1.5 shadow-lg shadow-primary/5" : ""
          }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm tracking-tight text-foreground">
            AutoDigest<span className="text-primary">.AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 relative">
          {navItems.map((item, i) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeIndex === i
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {activeIndex === i && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${location.pathname === "/dashboard"
                ? "text-primary-foreground bg-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground p-1"
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
                logout();
                setMobileOpen(false);
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary text-center mt-1"
            >
              Sign Out
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
    </motion.header>
  );
}
