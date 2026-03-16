import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, Heart, Bookmark, ChevronRight, ArrowLeft, X, Sparkles, AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { updateProfile, changePassword, getLikedArticles, getSavedArticles, likeArticle, saveArticle } from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };
const bodyFont = { fontFamily: "'Lora', serif" };
const sans = { fontFamily: "'Inter', sans-serif" };

function NpInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string; }) {
    return (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
            className="w-full pb-2 bg-transparent border-b-2 border-[#E5E5E0] focus:border-[#111111] outline-none text-sm text-[#111111] placeholder:text-neutral-300 transition-colors"
            style={{ ...mono, borderRadius: 0 }} />
    );
}

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const queryClient = useQueryClient();
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [email, setEmail] = useState(user?.email || "");
    const [aiProvider, setAiProvider] = useState(user?.aiProvider || "hybrid");
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMsg, setPasswordMsg] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<"liked" | "saved">("liked");

    const { data: likedArticles = [] } = useQuery({ queryKey: ["liked-articles"], queryFn: getLikedArticles });
    const { data: savedArticles = [] } = useQuery({ queryKey: ["saved-articles"], queryFn: getSavedArticles });

    const profileMutation = useMutation({
        mutationFn: () => updateProfile({ name, phone, email, aiProvider }),
        onSuccess: (data) => { updateUser({ ...user!, ...data, topics: data.topics }); setEditMode(false); toast.success("Profile updated"); },
    });

    const passwordMutation = useMutation({
        mutationFn: () => changePassword(currentPassword, newPassword),
        onSuccess: () => { setPasswordMsg("Password changed!"); setCurrentPassword(""); setNewPassword(""); setTimeout(() => { setPasswordMsg(""); setShowPasswordForm(false); }, 2000); },
        onError: () => setPasswordMsg("Failed. Check current password."),
    });

    const unlikeMutation = useMutation({
        mutationFn: likeArticle,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["liked-articles"] }); queryClient.invalidateQueries({ queryKey: ["interactions"] }); toast("Removed from likes", { duration: 2000 }); },
    });

    const unsaveMutation = useMutation({
        mutationFn: saveArticle,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["saved-articles"] }); queryClient.invalidateQueries({ queryKey: ["interactions"] }); toast("Removed from saved", { duration: 2000 }); },
    });

    const displayList: any[] = Array.isArray(activeTab === "liked" ? likedArticles : savedArticles) ? (activeTab === "liked" ? likedArticles : savedArticles) as any[] : [];

    return (
        <div className="min-h-screen bg-[#F9F9F7] pb-20"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}>
            <div className="max-w-2xl mx-auto px-4 pt-20">

                <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-[#111111] transition-colors mb-8" style={sans}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                </Link>

                {/* Masthead */}
                <div className="border-b-2 border-[#111111] pb-5 mb-8">
                    <p className="text-[9px] uppercase tracking-[0.28em] text-[#CC0000] mb-1" style={mono}>Reader Account</p>
                    <h1 className="text-4xl font-black text-[#111111]" style={serif}>Your Profile</h1>
                </div>

                {/* Profile Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="border border-[#111111] bg-white mb-6">
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#111111]">
                            <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-500" style={mono}>Identity</p>
                            <div className="flex gap-2">
                                {editMode ? (
                                    <>
                                        <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
                                            className="px-4 py-1.5 bg-[#111111] text-[#F9F9F7] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#333] disabled:opacity-50 transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                            {profileMutation.isPending ? "Saving…" : "Save"}
                                        </button>
                                        <button onClick={() => setEditMode(false)}
                                            className="px-4 py-1.5 border border-[#111111] text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-[#111111] transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setEditMode(true)}
                                        className="px-4 py-1.5 border border-[#111111] text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all" style={{ ...sans, borderRadius: 0 }}>
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 border-2 border-[#111111] flex items-center justify-center text-2xl font-black text-[#111111] bg-[#F9F9F7]" style={serif}>
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#111111]" style={serif}>{user?.name || "User"}</p>
                                    <p className="text-xs text-neutral-500" style={mono}>{user?.email}</p>
                                </div>
                            </div>
                            {/* Fields */}
                            {[
                                { label: "Full Name", val: name, set: setName, ph: "Full Name", type: "text" },
                                { label: "Email", val: email, set: setEmail, ph: "Email address", type: "email" },
                                { label: "Phone", val: phone, set: setPhone, ph: "Phone number", type: "text" },
                            ].map(({ label, val, set, ph, type }) => (
                                <div key={label}>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1.5" style={mono}>{label}</p>
                                    {editMode ? <NpInput value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type} />
                                        : <p className="text-sm text-[#111111]" style={bodyFont}>{val || <span className="text-neutral-300 italic">Not set</span>}</p>}
                                </div>
                            ))}
                            {/* Password */}
                            <div className="pt-5 border-t border-[#E5E5E0]">
                                {showPasswordForm ? (
                                    <div className="space-y-4">
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400" style={mono}>Change Password</p>
                                        <NpInput type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" />
                                        <NpInput type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" />
                                        {passwordMsg && <p className="text-xs text-[#CC0000] border-l-2 border-[#CC0000] pl-2" style={bodyFont}>{passwordMsg}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || newPassword.length < 6}
                                                className="px-4 py-2 bg-[#111111] text-[#F9F9F7] text-[10px] font-bold uppercase tracking-[0.15em] disabled:opacity-40 hover:bg-[#333] transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                                Update
                                            </button>
                                            <button onClick={() => setShowPasswordForm(false)}
                                                className="px-4 py-2 border border-[#111111] text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-[#111111] transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-[#111111] transition-colors" style={sans}>
                                        <Lock className="h-3.5 w-3.5" /> Change Password <ChevronRight className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AI Preferences */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
                    <div className="border border-[#111111] bg-white mb-6">
                        <div className="px-6 py-3.5 border-b border-[#111111]">
                            <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 mb-0.5" style={mono}>AI Configuration</p>
                            <p className="text-base font-bold text-[#111111] flex items-center gap-2" style={serif}><Sparkles className="h-4 w-4 text-[#CC0000]" /> AI Preferences</p>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-2" style={mono}>Preferred AI Provider</p>
                                <div className="relative">
                                    <select value={aiProvider} onChange={async (e) => {
                                        const newVal = e.target.value as "groq" | "gemini" | "hybrid";
                                        setAiProvider(newVal);
                                        toast.promise(updateProfile({ aiProvider: newVal }).then((data) => { updateUser({ ...user!, ...data }); }), {
                                            loading: "Updating…", success: "AI Provider updated!", error: "Failed to update.",
                                        });
                                    }} className="w-full pb-2 bg-transparent border-b-2 border-[#E5E5E0] focus:border-[#111111] focus:outline-none text-sm text-[#111111] appearance-none cursor-pointer transition-colors" style={{ ...mono, borderRadius: 0 }}>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="groq">Groq</option>
                                        <option value="gemini">Gemini Flash</option>
                                    </select>
                                    <ChevronRight className="absolute right-0 top-1 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed border-l-2 border-[#E5E5E0] pl-3" style={bodyFont}>
                                {aiProvider === "hybrid" && "Hybrid smartly uses Groq for speed and switches to Gemini if rate limited."}
                                {aiProvider === "groq" && "Groq provides the ultimate lowest latency AI summaries, perfect for quick reads."}
                                {aiProvider === "gemini" && "Gemini Flash provides balanced, high-quality analysis."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Liked & Saved */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                    <div className="border border-[#111111] bg-white mb-8">
                        <div className="flex border-b border-[#111111]">
                            {([
                                { key: "liked" as const, label: "Liked", icon: Heart, count: Array.isArray(likedArticles) ? likedArticles.length : 0 },
                                { key: "saved" as const, label: "Saved", icon: Bookmark, count: Array.isArray(savedArticles) ? savedArticles.length : 0 },
                            ]).map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 -mb-[1px] transition-colors ${activeTab === tab.key ? "border-[#111111] text-[#111111]" : "border-transparent text-neutral-400 hover:text-[#111111]"}`}
                                    style={{ ...sans, borderRadius: 0 }}>
                                    <tab.icon className="h-3.5 w-3.5" /> {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                        <div className="divide-y divide-[#E5E5E0]">
                            {displayList.length === 0 ? (
                                <p className="text-center text-sm text-neutral-400 py-10" style={bodyFont}>No {activeTab} articles yet.</p>
                            ) : displayList.map((article: any) => (
                                <div key={article.id} className="group flex items-start gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors">
                                    <a href={article.link || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#CC0000] border border-[#CC0000] px-1.5 py-0.5" style={mono}>{article.topic || "News"}</span>
                                            {article.source && <span className="text-[10px] text-neutral-400" style={mono}>· {article.source}</span>}
                                        </div>
                                        <h4 className="text-sm font-bold text-[#111111] line-clamp-2 group-hover:text-[#CC0000] transition-colors" style={serif}>
                                            {article.title || <span className="italic font-normal text-neutral-400">Untitled</span>}
                                        </h4>
                                        {article.summary && article.summary !== "Click to analyze" && (
                                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5" style={bodyFont}>{article.summary}</p>
                                        )}
                                    </a>
                                    <div className="flex items-center gap-1 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={article.link || "#"} target="_blank" rel="noopener noreferrer" className="p-1 text-neutral-400 hover:text-[#111111] transition-colors"><ExternalLink className="h-3.5 w-3.5" /></a>
                                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); activeTab === "liked" ? unlikeMutation.mutate(article.id) : unsaveMutation.mutate(article.id); }}
                                            className="p-1 text-neutral-400 hover:text-[#CC0000] transition-colors" title="Remove" style={{ borderRadius: 0 }}>
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Sign Out */}
                <div className="text-center mb-8">
                    <button onClick={() => setShowLogoutConfirm(true)}
                        className="px-6 py-2.5 border border-[#CC0000] text-[#CC0000] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#CC0000] hover:text-white transition-all duration-150"
                        style={{ ...sans, borderRadius: 0 }}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Logout Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/60" onClick={() => setShowLogoutConfirm(false)}>
                        <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
                            onClick={(e) => e.stopPropagation()} className="bg-[#F9F9F7] w-full max-w-sm border-2 border-[#111111] p-8 text-center">
                            <div className="w-10 h-10 border border-[#CC0000] text-[#CC0000] flex items-center justify-center mx-auto mb-5"><AlertTriangle className="h-5 w-5" /></div>
                            <h3 className="text-2xl font-black text-[#111111] mb-2" style={serif}>Sign Out?</h3>
                            <p className="text-sm text-neutral-500 mb-8" style={bodyFont}>Are you sure you want to sign out of your account?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2.5 border border-[#111111] text-[10px] font-bold uppercase tracking-[0.18em] text-[#111111] hover:bg-neutral-100 transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                    Cancel
                                </button>
                                <button onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                    className="flex-1 py-2.5 bg-[#CC0000] text-white text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#aa0000] transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                    Yes, Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}