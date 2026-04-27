import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User as UserIcon, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-paper flex"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
      }}
    >
      {/* Left branding column (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r-2 border-ink relative overflow-hidden">
        {/* Cool modern background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#2a2a2a] z-0" />
        <motion.div
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear", repeatType: "mirror" }}
          className="absolute inset-0 opacity-20 pointer-events-none z-0"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tl from-[#CC0000] to-transparent blur-[100px] z-0"
        />

        <Link
          to="/"
          className="flex items-center gap-2.5 group relative z-10"
          aria-label="Back to NewsLabs"
        >
          <img src="/logo.png" alt="NewsLabs Logo" className="h-7 w-auto object-contain invert" />
          <span
            className="font-black text-xl text-paper"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            NewsLabs
          </span>
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-paper/10 backdrop-blur-sm border border-paper/20 rounded-full mb-8"
          >
            <Sparkles className="h-3 w-3 text-paper animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Intelligent Aggregation
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl lg:text-6xl font-black text-paper leading-[1.05] mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Read Less.
            <br />
            <em className="text-editorial-red" style={{ fontStyle: "italic" }}>
              Understand More.
            </em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-neutral-300 leading-relaxed max-w-md"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Step into a distraction-free environment where your RSS feeds are transformed into concise, actionable insights powered by cutting-edge AI.
          </motion.p>
        </div>

        {/* Bottom metadata */}
        <div
          className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 relative z-10 flex items-center gap-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* Right Form column */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
        {/* Mobile back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-ink transition-colors mb-10 lg:hidden"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        {/* Desktop back link */}
        <Link
          to="/"
          className="hidden lg:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-ink transition-colors mb-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Masthead */}
          <div className="mb-8 pb-6 border-b border-ink overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-header" : "signup-header"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.25em] text-editorial-red mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {isLogin ? "Returning Reader" : "New Subscriber"}
                </p>
                <h1
                  className="text-4xl font-black text-ink leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {isLogin ? "Your Briefing Awaits." : "Begin Your Briefing."}
                </h1>
                <p
                  className="text-sm text-neutral-500 mt-2 leading-relaxed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {isLogin
                    ? "Resume your reading session."
                    : "Set up your personalized intelligence hub."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tab switcher — underline style */}
          <div className="flex mb-8 border-b border-divider-grey">
            {[
              { label: "Sign In", value: true },
              { label: "Sign Up", value: false },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => { setIsLogin(tab.value); setError(null); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-150 border-b-2 -mb-[1px]
                  ${isLogin === tab.value
                    ? "border-ink text-ink"
                    : "border-transparent text-neutral-400 hover:text-ink"
                  }`}
                style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field (sign-up only) */}
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <FieldWithIcon
                    id="name"
                    name="name"
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    icon={<UserIcon className="h-4 w-4 text-neutral-400" />}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <FieldWithIcon
              id="email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail className="h-4 w-4 text-neutral-400" />}
              required
            />

            <FieldWithIcon
              id="password"
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="h-4 w-4 text-neutral-400" />}
              required
            />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-3 border-l-2 border-editorial-red pl-3 py-1"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 text-editorial-red shrink-0 mt-0.5" />
                  <p
                    className="text-sm text-editorial-red leading-snug"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-ink text-paper text-xs font-bold uppercase tracking-[0.2em] border border-ink hover:bg-paper hover:text-ink transition-all duration-150 flex items-center justify-center gap-2 min-h-[48px] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : isLogin ? "Sign In Securely" : "Create Account"
              }
            </button>
          </form>

          {/* Footer note */}
          <p
            className="text-center text-[10px] text-neutral-400 mt-8 leading-relaxed"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            BY CONTINUING, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY. ALL READS ARE SECURE.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Shared input field component ──────────────────────────────────── */
interface FieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  required?: boolean;
}

function FieldWithIcon({ id, name, label, type, placeholder, value, onChange, icon, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </label>
      <div className="relative group">
        <span className="absolute left-0 bottom-0 top-0 flex items-center pb-2 text-neutral-400 group-focus-within:text-ink transition-colors duration-150">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full pl-7 pr-2 pb-2 pt-0 bg-transparent border-b-2 border-divider-grey focus:border-ink outline-none text-sm text-ink placeholder:text-neutral-300 font-medium transition-colors duration-150"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: 0 }}
        />
      </div>
    </div>
  );
}
