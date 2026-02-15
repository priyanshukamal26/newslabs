import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-bold">AutoDigest<span className="text-primary">.AI</span></span>
        </div>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a magic link.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Send Magic Link
              </button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Don't have an account?{" "}
              <span className="text-primary cursor-pointer hover:underline">Sign up</span>
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-2">Check your inbox</h2>
            <p className="text-sm text-muted-foreground mb-4">
              We sent a magic link to <span className="text-foreground font-medium">{email}</span>
            </p>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Go to Dashboard <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
