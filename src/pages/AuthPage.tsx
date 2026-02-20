import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Sparkles, User as UserIcon, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };

      const { data } = await api.post(endpoint, payload);

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1.5s" }} />
      {/* Left Panel - Form */}
      <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-24 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{isLogin ? "Welcome back" : "Create an account"}</h1>
            <p className="text-muted-foreground">
              {isLogin ? "Enter your credentials to access your personalized feed." : "Join thousands of professionals staying ahead of the curve."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    name="name"
                    required
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  name="password"
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-primary"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-semibold hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-col justify-center items-center p-12 relative overflow-hidden z-10 glass rounded-l-3xl my-6 mr-6 shadow-2xl border border-white/10 dark:border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-xl mb-8">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Smart News Intelligence</h2>
          <p className="text-muted-foreground leading-relaxed">
            NewsLabs curates, summarizes, and analyzes thousands of sources to deliver only the insights that matter to you.
          </p>
        </div>
      </div>
    </div>
  );
}
