import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center border border-ink p-12 max-w-sm w-full mx-4"
      >
        {/* Ornament */}
        <div
          className="text-2xl text-neutral-300 tracking-[0.5em] mb-6 select-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
          aria-hidden="true"
        >
          ✦ ✦
        </div>

        <p
          className="text-[10px] uppercase tracking-[0.3em] text-editorial-red mb-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Error 404
        </p>

        <h1
          className="text-6xl font-black text-ink leading-none mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          404
        </h1>

        <div className="w-8 h-[2px] bg-editorial-red mx-auto mb-4" />

        <p
          className="text-base text-neutral-600 leading-relaxed mb-8"
          style={{ fontFamily: "'Lora', serif" }}
        >
          Page not found. This article may have been moved, archived, or never existed.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-[0.2em] hover:bg-paper hover:text-ink border border-ink transition-all duration-150"
          style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
