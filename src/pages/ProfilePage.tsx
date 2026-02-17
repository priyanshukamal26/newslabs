import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User, Mail, Phone, Lock, Moon, Sun, Heart, Bookmark,
    ChevronRight, Clock, ArrowLeft, Save, Check, X, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
    getUserProfile, updateProfile, changePassword,
    getLikedArticles, getSavedArticles
} from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const queryClient = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [email, setEmail] = useState(user?.email || "");
    const [darkMode, setDarkMode] = useState(user?.darkMode !== false);

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
        mutationFn: () => updateProfile({ name, phone, email, darkMode }),
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

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleToggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        updateProfile({ darkMode: newMode }).then(() => {
            updateUser({ ...user!, darkMode: newMode });
        });
    };

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
                            {/* Dark/Light Mode Toggle */}
                            <button
                                onClick={handleToggleDarkMode}
                                className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors"
                                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                            >
                                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </button>
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

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
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

                    <div className="space-y-3">
                        {(activeTab === "liked" ? likedArticles : savedArticles).length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                No {activeTab} articles yet. Start exploring your feed!
                            </p>
                        ) : (
                            (activeTab === "liked" ? likedArticles : savedArticles).map((article: any) => (
                                <div key={article.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {article.topic || "News"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {article.timeToRead || "3 min"}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium line-clamp-1">{article.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{article.source}</p>
                                    </div>
                                    {article.link && (
                                        <a
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
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
            </div>
        </div>
    );
}
