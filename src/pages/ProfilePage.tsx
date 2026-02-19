import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User, Mail, Phone, Lock, Heart, Bookmark,
    ChevronRight, Clock, ArrowLeft, X, Sparkles
} from "lucide-react"; // Removed Sun, Moon
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
    getUserProfile, updateProfile, changePassword,
    getLikedArticles, getSavedArticles, likeArticle, saveArticle
} from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const queryClient = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [email, setEmail] = useState(user?.email || "");
    // Removed darkMode state
    const [aiProvider, setAiProvider] = useState(user?.aiProvider || "hybrid");

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMsg, setPasswordMsg] = useState("");

    const [activeTab, setActiveTab] = useState<"liked" | "saved">("liked");

    const { data: likedArticles = [] } = useQuery({
        queryKey: ['liked-articles'],
        queryFn: getLikedArticles,
    });

    const { data: savedArticles = [] } = useQuery({
        queryKey: ['saved-articles'],
        queryFn: getSavedArticles,
    });

    const profileMutation = useMutation({
        mutationFn: () => updateProfile({ name, phone, email, aiProvider }), // Removed darkMode
        onSuccess: (data) => {
            updateUser({ ...user!, ...data, topics: data.topics });
            setEditMode(false);
        },
    });

    const passwordMutation = useMutation({
        mutationFn: () => changePassword(currentPassword, newPassword),
        onSuccess: () => {
            setPasswordMsg("Password changed!");
            setCurrentPassword("");
            setNewPassword("");
            setTimeout(() => { setPasswordMsg(""); setShowPasswordForm(false); }, 2000);
        },
        onError: () => setPasswordMsg("Failed. Check current password."),
    });

    // Unlike mutation
    const unlikeMutation = useMutation({
        mutationFn: likeArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['liked-articles'] });
            queryClient.invalidateQueries({ queryKey: ['interactions'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            toast("Removed from likes", { duration: 2000 });
        },
    });

    // Unsave mutation
    const unsaveMutation = useMutation({
        mutationFn: saveArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-articles'] });
            queryClient.invalidateQueries({ queryKey: ['interactions'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            toast("Removed from saved", { duration: 2000 });
        },
    });

    // Force Dark Mode
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back to Dashboard */}
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold">Profile</h1>
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle Removed */}
                            {editMode ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => profileMutation.mutate()}
                                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                                        disabled={profileMutation.isPending}
                                    >
                                        {profileMutation.isPending ? "Saving..." : "Save"}
                                    </button>
                                    <button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg glass text-muted-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* AI Settings */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            AI Preferences
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Preferred AI Provider</label>
                                <div className="relative">
                                    <select
                                        value={aiProvider}
                                        onChange={async (e) => {
                                            const newVal = e.target.value as "groq" | "gemini" | "hybrid";
                                            setAiProvider(newVal);
                                            toast.promise(
                                                updateProfile({ aiProvider: newVal }).then((data) => {
                                                    updateUser({ ...user!, ...data });
                                                }),
                                                {
                                                    loading: 'Updating preference...',
                                                    success: 'AI Provider updated!',
                                                    error: (err) => {
                                                        console.error('Update failed:', err);
                                                        return 'Failed to update setting';
                                                    }
                                                }
                                            );
                                        }}
                                        className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <option value="hybrid">✨ Hybrid (Smart Select)</option>
                                        <option value="groq">⚡ Groq (Fastest)</option>
                                        <option value="gemini">🧠 Gemini 3 Flash (Balanced)</option>
                                    </select>
                                    <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Hybrid uses Groq for speed and switches to Gemini if rate limited.
                            </p>
                        </div>
                    </div>


                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6 mt-6 pt-4 border-t border-border">
                        <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{user?.name || "User"}</h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    {/* Profile Fields */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            {editMode ? (
                                <input
                                    value={name} onChange={e => setName(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Full Name"
                                />
                            ) : (
                                <span className="text-sm">{user?.name || "Not set"}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            {editMode ? (
                                <input
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Email"
                                />
                            ) : (
                                <span className="text-sm">{user?.email}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            {editMode ? (
                                <input
                                    value={phone} onChange={e => setPhone(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Phone Number"
                                />
                            ) : (
                                <span className="text-sm">{user?.phone || "Not set"}</span>
                            )}
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="mt-6 pt-4 border-t border-border">
                        {showPasswordForm ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-primary" /> Change Password
                                </h3>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="Current Password"
                                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="New Password (min 6 chars)"
                                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {passwordMsg && <p className="text-xs text-primary">{passwordMsg}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => passwordMutation.mutate()}
                                        disabled={passwordMutation.isPending || newPassword.length < 6}
                                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                                    >
                                        Update Password
                                    </button>
                                    <button
                                        onClick={() => setShowPasswordForm(false)}
                                        className="px-3 py-1.5 rounded-lg glass text-xs text-muted-foreground"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowPasswordForm(true)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Lock className="h-4 w-4" /> Change Password <ChevronRight className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Liked & Saved Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-2xl p-6"
                >
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveTab("liked")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "liked" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Heart className="h-4 w-4" /> Liked ({Array.isArray(likedArticles) ? likedArticles.length : 0})
                        </button>
                        <button
                            onClick={() => setActiveTab("saved")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "saved" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Bookmark className="h-4 w-4" /> Saved ({Array.isArray(savedArticles) ? savedArticles.length : 0})
                        </button>
                    </div>

                    <div className="space-y-2">
                        {(activeTab === "liked" ? likedArticles : savedArticles).length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                No {activeTab} articles yet. Start exploring your feed!
                            </p>
                        ) : (
                            (activeTab === "liked" ? likedArticles : savedArticles).map((article: any) => (
                                <div key={article.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                    <a
                                        href={article.link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-0 block cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                {article.topic || "News"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {article.timeToRead || "3 min"}
                                            </span>
                                            {article.source && (
                                                <span className="text-[10px] text-muted-foreground font-medium">· {article.source}</span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                            {(article.title && article.title.trim()) || <span className="italic text-muted-foreground font-normal">Untitled article</span>}
                                        </h4>
                                        {article.summary && article.summary !== "Click to analyze" && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">{article.summary}</p>
                                        )}
                                    </a>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (activeTab === "liked") {
                                                unlikeMutation.mutate(article.id);
                                            } else {
                                                unsaveMutation.mutate(article.id);
                                            }
                                        }}
                                        className="shrink-0 p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all self-start mt-1"
                                        title={activeTab === "liked" ? "Remove from liked" : "Remove from saved"}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Sign Out */}
                <div className="mt-6 text-center">
                    <button
                        onClick={logout}
                        className="text-sm text-muted-foreground hover:text-red-500 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div >
        </div >
    );
}

