import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mail, Phone, Lock, Heart, Bookmark, ChevronRight, ArrowLeft, X,
    Sparkles, AlertTriangle, ExternalLink, Key, Plus, Trash2, Check,
    Shield, ShieldCheck, ToggleLeft, ToggleRight, Loader2, ChevronDown, Eye, EyeOff,
    Rss, Edit2, Save, Send, MessageSquare, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
    updateProfile, changePassword, getLikedArticles, getSavedArticles,
    likeArticle, saveArticle,
    getByokState, updateByokPreference, validateByokCredential,
    createByokCredential, activateByokCredential, deleteByokCredential,
    getUserFeeds, addUserFeed, updateUserFeed, deleteUserFeed,
    getBotSettings, updateBotSettings, connectTelegram, pollTelegramStatus,
    disconnectTelegram, connectDiscord, disconnectDiscord, sendTestNotification, NotificationSlot
} from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };
const bodyFont = { fontFamily: "'Lora', serif" };
const sans = { fontFamily: "'Inter', sans-serif" };

function NpInput({
    value, onChange, placeholder, type = "text",
}: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }) {
    return (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
            className="w-full pb-2 bg-transparent border-b-2 border-divider-grey focus:border-ink outline-none text-sm text-ink placeholder:text-neutral-300 transition-colors"
            style={{ ...mono, borderRadius: 0 }} />
    );
}

function SectionCard({ label, title, icon: Icon, children, delay = 0 }: {
    label: string; title: string; icon?: any; children: React.ReactNode; delay?: number;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
            <div className="border border-ink bg-paper mb-6">
                <div className="px-6 py-3.5 border-b border-ink">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 mb-0.5" style={mono}>{label}</p>
                    <p className="text-base font-bold text-ink flex items-center gap-2" style={serif}>
                        {Icon && <Icon className="h-4 w-4 text-editorial-red" />} {title}
                    </p>
                </div>
                <div className="px-6 py-6">{children}</div>
            </div>
        </motion.div>
    );
}

// ── Summary Mode picker ────────────────────────────────────────────────────────
const SUMMARY_MODES = [
    { value: "concise" as const, label: "Concise", desc: "2-3 sentence snapshot with 3 key insights. Best for scanning many articles quickly." },
    { value: "balanced" as const, label: "Balanced", desc: "4-5 sentence summary with 5 insights. Clear context for informed reading." },
    { value: "detailed" as const, label: "Detailed", desc: "6-8 sentence deep-dive with 5 layered insights. Best for science, tech and politics." },
];

// ── BYOK providers ─────────────────────────────────────────────────────────────
const BYOK_PROVIDERS = [
    { value: "groq", label: "Groq", placeholder: "e.g. llama-3.1-8b-instant" },
    { value: "gemini", label: "Gemini", placeholder: "e.g. gemini-2.5-flash" },
    { value: "openai", label: "OpenAI", placeholder: "e.g. gpt-4o-mini" },
    { value: "custom", label: "Custom (OpenAI-compatible)", placeholder: "e.g. mistral-7b" },
];

// ── AddCredentialForm ──────────────────────────────────────────────────────────
function AddCredentialForm({ onSuccess }: { onSuccess: () => void }) {
    const [label, setLabel] = useState("");
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [makeActive, setMakeActive] = useState(true);

    const createMutation = useMutation({
        mutationFn: () => createByokCredential({ label, provider, model, apiKey, baseUrl: baseUrl || undefined, makeActive }),
        onSuccess: () => { toast.success("Credential saved & validated"); onSuccess(); },
        onError: (e: any) => toast.error(e?.response?.data?.error || "Validation failed"),
    });

    const selectedProvider = BYOK_PROVIDERS.find(p => p.value === provider);
    const needsBaseUrl = provider === "custom";

    return (
        <div className="space-y-4 pt-4 border-t border-divider-grey">
            <p className="text-[9px] uppercase tracking-[0.2em] text-editorial-red font-bold" style={mono}>New Credential</p>
            <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>Label</p>
                <NpInput value={label} onChange={e => setLabel(e.target.value)} placeholder="My Groq Key" />
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>Provider</p>
                <div className="relative">
                    <select value={provider} onChange={e => setProvider(e.target.value)}
                        className="w-full pb-2 bg-transparent border-b-2 border-divider-grey focus:border-ink outline-none text-sm text-ink appearance-none cursor-pointer"
                        style={{ ...mono, borderRadius: 0 }}>
                        {BYOK_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-0 top-1 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
                </div>
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>Model</p>
                <NpInput value={model} onChange={e => setModel(e.target.value)} placeholder={selectedProvider?.placeholder} />
            </div>
            {needsBaseUrl && (
                <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>Base URL</p>
                    <NpInput value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.your-provider.com/v1" />
                </div>
            )}
            <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>API Key</p>
                <div className="relative">
                    <NpInput value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-…" type={showKey ? "text" : "password"} />
                    <button type="button" onClick={() => setShowKey(v => !v)}
                        className="absolute right-0 top-0 p-1 text-neutral-400 hover:text-ink">
                        {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={makeActive} onChange={e => setMakeActive(e.target.checked)}
                    className="accent-[#CC0000] h-3 w-3" />
                <span className="text-xs text-neutral-500" style={sans}>Set as active key</span>
            </label>
            <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !label || !model || !apiKey || (needsBaseUrl && !baseUrl)}
                className="w-full py-2.5 bg-ink text-paper text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#333] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                style={{ ...sans, borderRadius: 0 }}>
                {createMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating…</> : <><ShieldCheck className="h-3.5 w-3.5" /> Validate & Save</>}
            </button>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
function FeedManagementCard() {
    const queryClient = useQueryClient();
    const { data: feedsData, isLoading } = useQuery({ queryKey: ["user-feeds"], queryFn: getUserFeeds });
    const feeds = feedsData?.feeds || [];

    const [showAddForm, setShowAddForm] = useState(false);
    const [newUrl, setNewUrl] = useState("");
    const [newDisplayName, setNewDisplayName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({ displayName: "", category: "", url: "" });

    const addMutation = useMutation({
        mutationFn: () => addUserFeed({ url: newUrl, displayName: newDisplayName || undefined, category: newCategory || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-feeds"] });
            toast.success("Feed added successfully!");
            setShowAddForm(false);
            setNewUrl(""); setNewDisplayName(""); setNewCategory("");
        },
        onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to add feed"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: any }) => updateUserFeed(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-feeds"] });
            toast.success("Feed updated");
            setEditingFeedId(null);
        },
        onError: () => toast.error("Failed to update feed"),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => updateUserFeed(id, { isActive }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-feeds"] }),
        onError: () => toast.error("Failed to toggle feed status"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteUserFeed(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-feeds"] });
            toast("Feed removed");
        },
    });

    return (
        <SectionCard label="Sources" title="RSS Feed Management" icon={Rss} delay={0.17}>
            <div className="space-y-6">
                <p className="text-xs text-ink/70 leading-relaxed border-l-2 border-divider-grey pl-3" style={bodyFont}>
                    Manage your personal news sources. Add new custom RSS feeds, toggle active sources, and maintain your content reading list.
                </p>

                {isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400" style={mono}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading feeds…
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feeds.length > 0 && (
                            <div className="space-y-2">
                                {feeds.map((feed: any) => (
                                    <div key={feed.id} className={`p-4 border transition-colors ${feed.isActive ? "border-ink bg-ink/5" : "border-divider-grey"}`}>
                                        {editingFeedId === feed.id ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1" style={mono}>Display Name</p>
                                                    <NpInput value={editValues.displayName} onChange={e => setEditValues({ ...editValues, displayName: e.target.value })} placeholder="Custom Name" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1" style={mono}>RSS URL</p>
                                                    <NpInput value={editValues.url} onChange={e => setEditValues({ ...editValues, url: e.target.value })} placeholder="https://..." />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1" style={mono}>Category</p>
                                                    <NpInput value={editValues.category} onChange={e => setEditValues({ ...editValues, category: e.target.value })} placeholder="Technology" />
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <button onClick={() => updateMutation.mutate({ id: feed.id, payload: { displayName: editValues.displayName, category: editValues.category, url: editValues.url } })}
                                                        disabled={updateMutation.isPending}
                                                        className="px-4 py-2 bg-ink text-paper text-[9px] font-bold uppercase tracking-[0.18em] flex items-center gap-1.5 hover:bg-[#333] transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                                        <Save className="h-3.5 w-3.5" /> Save
                                                    </button>
                                                    <button onClick={() => setEditingFeedId(null)}
                                                        className="px-4 py-2 border border-ink text-ink text-[9px] font-bold uppercase tracking-[0.18em] hover:bg-ink/10 transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-ink" style={sans}>{feed.displayName}</span>
                                                        {feed.category && <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-editorial-red border border-editorial-red px-1.5 py-0.5" style={mono}>{feed.category}</span>}
                                                    </div>
                                                    <p className="text-[10px] text-neutral-500 truncate" style={mono}>{feed.url}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button onClick={() => toggleMutation.mutate({ id: feed.id, isActive: !feed.isActive })}
                                                        className="p-1.5 text-neutral-400 hover:text-ink transition-colors" title={feed.isActive ? "Deactivate Source" : "Activate Source"}>
                                                        {feed.isActive ? <ToggleRight className="h-5 w-5 text-ink" /> : <ToggleLeft className="h-5 w-5" />}
                                                    </button>
                                                    <button onClick={() => { setEditValues({ displayName: feed.displayName, category: feed.category || "", url: feed.url }); setEditingFeedId(feed.id); }}
                                                        className="p-1.5 text-neutral-400 hover:text-ink transition-colors">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => { if (confirm("Delete this feed completely?")) deleteMutation.mutate(feed.id); }}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-1.5 text-neutral-400 hover:text-editorial-red transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!showAddForm ? (
                            <button onClick={() => setShowAddForm(true)}
                                className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ink border border-ink px-4 py-2.5 hover:bg-ink hover:text-paper transition-all"
                                style={{ ...sans, borderRadius: 0 }}>
                                <Plus className="h-3.5 w-3.5" /> Add RSS Feed
                            </button>
                        ) : (
                            <div className="space-y-4 pt-4 border-t border-divider-grey">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-editorial-red font-bold" style={mono}>New Feed Details</p>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>RSS URL</p>
                                    <NpInput value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com/rss" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>Name (Optional)</p>
                                        <NpInput value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="TechCrunch" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5" style={mono}>Category (Optional)</p>
                                        <NpInput value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Technology" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !newUrl}
                                        className="flex-1 py-2.5 bg-ink text-paper text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#333] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                                        style={{ ...sans, borderRadius: 0 }}>
                                        {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Feed"}
                                    </button>
                                    <button onClick={() => setShowAddForm(false)}
                                        className="flex-1 py-2.5 border border-ink text-ink text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-ink/10 transition-colors"
                                        style={{ ...sans, borderRadius: 0 }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </SectionCard>
    );
}

// ── Notification Settings ──────────────────────────────────────────────────────
const SLOTS = [
    { value: 'morning' as const, label: 'Morning', time: '6:00 AM' },
    { value: 'noon' as const, label: 'Noon', time: '2:00 PM' },
    { value: 'evening' as const, label: 'Evening', time: '6:00 PM' },
    { value: 'night' as const, label: 'Night', time: '10:00 PM' },
];

function NotificationSettingsCard() {
    const queryClient = useQueryClient();
    const { data: settings, isLoading } = useQuery({ queryKey: ["bot-settings"], queryFn: getBotSettings });
    
    const [discordUrl, setDiscordUrl] = useState("");
    const [telegramPolling, setTelegramPolling] = useState(false);
    const [telegramConnectToken, setTelegramConnectToken] = useState("");
    const [showTelegramDisconnectConfirm, setShowTelegramDisconnectConfirm] = useState(false);
    const [showDiscordDisconnectConfirm, setShowDiscordDisconnectConfirm] = useState(false);

    const activeSlots = settings?.activeSlots || [];

    const updateSlotsMutation = useMutation({
        mutationFn: (slots: NotificationSlot[]) => updateBotSettings({ activeSlots: slots }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
            toast.success("Schedule updated");
        }
    });

    const toggleSlot = (slot: NotificationSlot) => {
        if (activeSlots.includes(slot)) {
            updateSlotsMutation.mutate(activeSlots.filter(s => s !== slot));
        } else {
            if (activeSlots.length >= 4) {
                toast.error("Maximum 4 slots allowed");
                return;
            }
            updateSlotsMutation.mutate([...activeSlots, slot]);
        }
    };

    const telegramConnectMutation = useMutation({
        mutationFn: connectTelegram,
        onSuccess: (data) => {
            setTelegramConnectToken(data.token);
            window.open(data.deepLink, "_blank");
            setTelegramPolling(true);
            toast("Waiting for Telegram connection...", { duration: 5000 });
        }
    });

    const telegramDisconnectMutation = useMutation({
        mutationFn: disconnectTelegram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
            toast("Telegram disconnected");
        }
    });

    const discordConnectMutation = useMutation({
        mutationFn: () => connectDiscord(discordUrl),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
            toast.success(data.message);
            setDiscordUrl("");
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to connect Discord")
    });

    const discordDisconnectMutation = useMutation({
        mutationFn: disconnectDiscord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
            toast("Discord disconnected");
        }
    });

    const instantBriefMutation = useMutation({
        mutationFn: () => sendTestNotification('both'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
            toast.success("Instant brief sent successfully!");
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.error || err?.message || "Failed to send instant brief";
            toast.error(msg);
        }
    });

    useEffect(() => {
        let interval: any;
        if (telegramPolling) {
            interval = setInterval(async () => {
                try {
                    const status = await pollTelegramStatus();
                    if (status.connected) {
                        setTelegramPolling(false);
                        queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
                        toast.success("Telegram connected successfully!");
                    }
                } catch { }
            }, 3000);
            
            // Timeout after 5 mins
            setTimeout(() => setTelegramPolling(false), 5 * 60 * 1000);
        }
        return () => clearInterval(interval);
    }, [telegramPolling, queryClient]);

    return (
        <SectionCard label="Automations" title="Bot Notifications" icon={Send} delay={0.19}>
            <div className="space-y-6">
                <p className="text-xs text-ink/70 leading-relaxed border-l-2 border-divider-grey pl-3" style={bodyFont}>
                    Receive your personalized NewsLabs brief via Telegram or Discord at your preferred times.
                </p>

                {isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400" style={mono}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading settings...
                    </div>
                ) : (
                    <>
                        {/* Schedule */}
                        <div>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-2" style={mono}>Schedule (IST)</p>
                            <div className="flex gap-2 flex-wrap">
                                {SLOTS.map(slot => (
                                    <button key={slot.value} onClick={() => toggleSlot(slot.value)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all ${activeSlots.includes(slot.value) ? "border-ink bg-ink text-paper" : "border-divider-grey text-neutral-500 hover:border-ink hover:text-ink"}`}
                                        style={{ ...sans, borderRadius: 0 }}>
                                        <div className={`w-3 h-3 flex items-center justify-center border ${activeSlots.includes(slot.value) ? "border-paper bg-paper text-ink" : "border-divider-grey bg-transparent text-transparent"}`}>
                                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                        </div>
                                        <span className="text-xs font-bold">{slot.label}</span>
                                        <span className="text-[9px] opacity-70" style={mono}>{slot.time}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Telegram */}
                        <div className="pt-4 border-t border-divider-grey">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1" style={mono}>
                                    <MessageSquare className="w-3 h-3" /> Telegram
                                </p>
                                <span className="text-[9px] flex items-center gap-1 font-bold" style={{ ...mono, color: settings?.telegramConnected ? "#10B981" : "#9CA3AF" }}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${settings?.telegramConnected ? "bg-emerald-500" : "bg-neutral-400"}`} />
                                    {settings?.telegramConnected ? `Connected (${settings?.telegramChatIdMask})` : "Not Connected"}
                                </span>
                            </div>
                            
                            {!settings?.telegramConnected ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-neutral-500" style={bodyFont}>Connect to the NewsLabs bot to receive messages.</p>
                                    
                                    {telegramPolling ? (
                                        <div className="p-3 bg-ink/5 border border-divider-grey rounded-sm space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-ink" style={sans}>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Waiting for connection...
                                            </div>
                                            <p className="text-[10px] text-neutral-500 leading-relaxed" style={bodyFont}>
                                                If Telegram opened but the "Start" button didn't work (common on Web), copy and send this exact message to the bot:
                                            </p>
                                            <div className="bg-paper px-3 py-2 border border-ink text-[11px] font-bold text-ink select-all cursor-text" style={mono}>
                                                /start {telegramConnectToken}
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => telegramConnectMutation.mutate()} disabled={telegramConnectMutation.isPending}
                                            className="px-4 py-2 bg-[#229ED9] text-white text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#1A8CC2] transition-colors disabled:opacity-50 flex items-center gap-2"
                                            style={{ ...sans, borderRadius: 0 }}>
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Connect Telegram Bot
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => setShowTelegramDisconnectConfirm(true)} disabled={telegramDisconnectMutation.isPending}
                                        className="px-4 py-1.5 border border-ink text-ink text-[9px] font-bold uppercase tracking-[0.18em] hover:bg-editorial-red hover:text-white hover:border-editorial-red transition-colors"
                                        style={{ ...sans, borderRadius: 0 }}>
                                        Disconnect
                                    </button>
                                    
                                    {showTelegramDisconnectConfirm && (
                                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                            <div className="bg-paper border-2 border-ink w-full max-w-sm p-6 shadow-2xl">
                                                <h3 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Disconnect Telegram?</h3>
                                                <p className="text-sm text-ink/70 mb-6" style={{ fontFamily: "'Lora', serif" }}>Are you sure you want to disconnect? You will no longer receive automated briefs to your Telegram account.</p>
                                                <div className="flex gap-3">
                                                    <button onClick={() => { telegramDisconnectMutation.mutate(); setShowTelegramDisconnectConfirm(false); }} className="flex-1 py-2.5 bg-editorial-red text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-red-700 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>Yes, Disconnect</button>
                                                    <button onClick={() => setShowTelegramDisconnectConfirm(false)} className="flex-1 py-2.5 border border-ink text-ink text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ink hover:text-paper transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Discord */}
                        <div className="pt-4 border-t border-divider-grey">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1" style={mono}>
                                    <MessageSquare className="w-3 h-3" /> Discord
                                </p>
                                <span className="text-[9px] flex items-center gap-1 font-bold" style={{ ...mono, color: settings?.discordConnected ? "#5865F2" : "#9CA3AF" }}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${settings?.discordConnected ? "bg-[#5865F2]" : "bg-neutral-400"}`} />
                                    {settings?.discordConnected ? "Active" : "Not Connected"}
                                </span>
                            </div>
                            
                            {!settings?.discordConnected ? (
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <NpInput value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." />
                                    </div>
                                    <button onClick={() => discordConnectMutation.mutate()} disabled={discordConnectMutation.isPending || !discordUrl}
                                        className="px-4 py-2 bg-[#5865F2] text-white text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#4752C4] transition-colors disabled:opacity-50 flex items-center gap-2"
                                        style={{ ...sans, borderRadius: 0 }}>
                                        {discordConnectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[10px] text-neutral-500 truncate" style={mono}>{settings?.discordWebhookMask}</p>
                                    <button onClick={() => setShowDiscordDisconnectConfirm(true)} disabled={discordDisconnectMutation.isPending}
                                        className="px-4 py-1.5 border border-ink text-ink text-[9px] font-bold uppercase tracking-[0.18em] hover:bg-editorial-red hover:text-white hover:border-editorial-red transition-colors"
                                        style={{ ...sans, borderRadius: 0 }}>
                                        Disconnect
                                    </button>

                                    {showDiscordDisconnectConfirm && (
                                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                            <div className="bg-paper border-2 border-ink w-full max-w-sm p-6 shadow-2xl">
                                                <h3 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Disconnect Discord?</h3>
                                                <p className="text-sm text-ink/70 mb-6" style={{ fontFamily: "'Lora', serif" }}>Are you sure you want to disconnect? You will no longer receive automated briefs to your Discord webhook.</p>
                                                <div className="flex gap-3">
                                                    <button onClick={() => { discordDisconnectMutation.mutate(); setShowDiscordDisconnectConfirm(false); }} className="flex-1 py-2.5 bg-editorial-red text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-red-700 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>Yes, Disconnect</button>
                                                    <button onClick={() => setShowDiscordDisconnectConfirm(false)} className="flex-1 py-2.5 border border-ink text-ink text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ink hover:text-paper transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Instant Brief Action */}
                        {(settings?.telegramConnected || settings?.discordConnected) && (
                            <div className="pt-4 border-t border-divider-grey">
                                <p className="text-xs text-neutral-500 mb-3" style={bodyFont}>Need the latest news right now? Send a brief instantly to your connected platforms.</p>
                                <button onClick={() => instantBriefMutation.mutate()} disabled={instantBriefMutation.isPending}
                                    className="px-4 py-2 bg-editorial-red text-white text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    style={{ ...sans, borderRadius: 0 }}>
                                    {instantBriefMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Send Instant Brief
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </SectionCard>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const queryClient = useQueryClient();

    // Identity fields
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [email, setEmail] = useState(user?.email || "");

    // AI prefs
    const [aiProvider, setAiProvider] = useState(user?.aiProvider || "hybrid");
    const [summaryMode, setSummaryMode] = useState<"concise" | "balanced" | "detailed">((user as any)?.summaryMode || "balanced");

    // Password
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMsg, setPasswordMsg] = useState("");

    // BYOK UI
    const [showAddForm, setShowAddForm] = useState(false);

    // Misc
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<"liked" | "saved">("liked");

    // Sync state when auth user changes
    useEffect(() => {
        setName(user?.name || "");
        setPhone(user?.phone || "");
        setEmail(user?.email || "");
        setAiProvider(user?.aiProvider || "hybrid");
        setSummaryMode((user as any)?.summaryMode || "balanced");
    }, [user?.email]);

    // ── Queries ──────────────────────────────────────────────────────────────
    const { data: likedArticles = [] } = useQuery({ queryKey: ["liked-articles"], queryFn: getLikedArticles });
    const { data: savedArticles = [] } = useQuery({ queryKey: ["saved-articles"], queryFn: getSavedArticles });
    const { data: byokData, isLoading: byokLoading } = useQuery({ queryKey: ["byok"], queryFn: getByokState });

    const byokPreference = byokData?.preference;
    const byokCredentials = byokData?.credentials || [];

    // ── Mutations ─────────────────────────────────────────────────────────────
    const profileMutation = useMutation({
        mutationFn: () => updateProfile({ name, phone, email, aiProvider }),
        onSuccess: (data) => { updateUser({ ...user!, ...data }); setEditMode(false); toast.success("Profile updated"); },
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

    const byokToggleMutation = useMutation({
        mutationFn: (enabled: boolean) => updateByokPreference({ byokEnabled: enabled }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["byok"] }),
    });

    const activateMutation = useMutation({
        mutationFn: activateByokCredential,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["byok"] }); toast.success("Credential activated"); },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteByokCredential,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["byok"] }); toast("Credential removed"); },
    });

    const displayList: any[] = Array.isArray(activeTab === "liked" ? likedArticles : savedArticles)
        ? (activeTab === "liked" ? likedArticles : savedArticles) as any[]
        : [];

    return (
        <div className="min-h-screen bg-paper pb-20"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")` }}>
            <div className="max-w-2xl mx-auto px-4 pt-20">

                <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-ink transition-colors mb-8" style={sans}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                </Link>

                {/* Masthead */}
                <div className="border-b-2 border-ink pb-5 mb-8">
                    <p className="text-[9px] uppercase tracking-[0.28em] text-editorial-red mb-1" style={mono}>Reader Account</p>
                    <h1 className="text-4xl font-black text-ink" style={serif}>Your Profile</h1>
                </div>

                {/* ── Identity Card ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="border border-ink bg-paper mb-6">
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-ink">
                            <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-500" style={mono}>Identity</p>
                            <div className="flex gap-2">
                                {editMode ? (
                                    <>
                                        <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
                                            className="px-4 py-1.5 bg-ink text-paper text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#333] disabled:opacity-50 transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                            {profileMutation.isPending ? "Saving…" : "Save"}
                                        </button>
                                        <button onClick={() => setEditMode(false)}
                                            className="px-4 py-1.5 border border-ink text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-ink transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setEditMode(true)}
                                        className="px-4 py-1.5 border border-ink text-[10px] font-bold uppercase tracking-[0.15em] text-ink hover:bg-ink hover:text-paper transition-all" style={{ ...sans, borderRadius: 0 }}>
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 border-2 border-ink flex items-center justify-center text-2xl font-black text-ink bg-paper" style={serif}>
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-ink" style={serif}>{user?.name || "User"}</p>
                                    <p className="text-xs text-neutral-500" style={mono}>{user?.email}</p>
                                </div>
                            </div>
                            {[
                                { label: "Full Name", val: name, set: setName, ph: "Full Name", type: "text" },
                                { label: "Email", val: email, set: setEmail, ph: "Email address", type: "email" },
                                { label: "Phone", val: phone, set: setPhone, ph: "Phone number", type: "text" },
                            ].map(({ label, val, set, ph, type }) => (
                                <div key={label}>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1.5" style={mono}>{label}</p>
                                    {editMode ? <NpInput value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type} />
                                        : <p className="text-sm text-ink" style={bodyFont}>{val || <span className="text-neutral-300 italic">Not set</span>}</p>}
                                </div>
                            ))}
                            <div className="pt-5 border-t border-divider-grey">
                                {showPasswordForm ? (
                                    <div className="space-y-4">
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400" style={mono}>Change Password</p>
                                        <NpInput type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" />
                                        <NpInput type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" />
                                        {passwordMsg && <p className="text-xs text-editorial-red border-l-2 border-editorial-red pl-2" style={bodyFont}>{passwordMsg}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || newPassword.length < 6}
                                                className="px-4 py-2 bg-ink text-paper text-[10px] font-bold uppercase tracking-[0.15em] disabled:opacity-40 hover:bg-[#333] transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                                Update
                                            </button>
                                            <button onClick={() => setShowPasswordForm(false)}
                                                className="px-4 py-2 border border-ink text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-ink transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-ink transition-colors" style={sans}>
                                        <Lock className="h-3.5 w-3.5" /> Change Password <ChevronRight className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── AI Preferences Card ── */}
                <SectionCard label="AI Configuration" title="AI Preferences" icon={Sparkles} delay={0.07}>
                    <div className="space-y-6">
                        {/* Provider */}
                        <div>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-2" style={mono}>Preferred System Provider</p>
                            <div className="relative">
                                <select value={aiProvider} onChange={async e => {
                                    const newVal = e.target.value as "groq" | "gemini" | "hybrid";
                                    setAiProvider(newVal);
                                    toast.promise(updateProfile({ aiProvider: newVal }).then(data => updateUser({ ...user!, ...data })), {
                                        loading: "Updating…", success: "AI Provider updated!", error: "Failed to update.",
                                    });
                                }} className="w-full pb-2 bg-transparent border-b-2 border-divider-grey focus:border-ink focus:outline-none text-sm text-ink appearance-none cursor-pointer transition-colors" style={{ ...mono, borderRadius: 0 }}>
                                    <option value="hybrid">Hybrid (Groq → Gemini fallback)</option>
                                    <option value="groq">Groq only</option>
                                    <option value="gemini">Gemini Flash only</option>
                                </select>
                                <ChevronRight className="absolute right-0 top-1 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
                            </div>
                            <p className="text-xs text-ink/70 leading-relaxed border-l-2 border-divider-grey pl-3 mt-3" style={bodyFont}>
                                {aiProvider === "hybrid" && "Hybrid uses Groq for speed and switches to Gemini if rate limited. Recommended."}
                                {aiProvider === "groq" && "Groq provides the lowest latency. Perfect for quick reads."}
                                {aiProvider === "gemini" && "Gemini Flash provides balanced, high-quality analysis."}
                            </p>
                        </div>

                        {/* Summary Mode */}
                        <div>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-3" style={mono}>Default Summary Depth</p>
                            <div className="grid grid-cols-3 gap-px border border-ink bg-ink">
                                {SUMMARY_MODES.map(m => (
                                    <button key={m.value}
                                        onClick={async () => {
                                            setSummaryMode(m.value);
                                            toast.promise(
                                                updateProfile({ summaryMode: m.value }).then(data => updateUser({ ...user!, ...data })),
                                                { loading: "Saving…", success: "Summary mode updated!", error: "Failed." }
                                            );
                                        }}
                                        className={`py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${summaryMode === m.value ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink hover:text-paper"}`}
                                        style={{ ...sans, borderRadius: 0 }}>
                                        {summaryMode === m.value && <span className="mr-1">✓</span>}{m.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-ink/70 leading-relaxed border-l-2 border-divider-grey pl-3 mt-3" style={bodyFont}>
                                {SUMMARY_MODES.find(m => m.value === summaryMode)?.desc}
                            </p>
                            <p className="text-[9px] text-neutral-400 mt-2" style={mono}>
                                You can also override this per-article using the mode switcher inside any news summary.
                            </p>
                        </div>
                    </div>
                </SectionCard>

                {/* ── BYOK Card ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                    <div className="border border-ink bg-paper mb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-ink">
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 mb-0.5" style={mono}>Advanced</p>
                                <p className="text-base font-bold text-ink flex items-center gap-2" style={serif}>
                                    <Key className="h-4 w-4 text-editorial-red" /> Bring Your Own Key
                                </p>
                            </div>
                            {/* Toggle */}
                            <button
                                onClick={() => byokToggleMutation.mutate(!byokPreference?.byokEnabled)}
                                disabled={byokToggleMutation.isPending || byokLoading}
                                className="flex items-center gap-2 text-xs font-bold transition-colors"
                                style={{ ...sans, color: byokPreference?.byokEnabled ? "hsl(var(--np-ink))" : "#9CA3AF" }}>
                                {byokPreference?.byokEnabled
                                    ? <ToggleRight className="h-6 w-6 text-ink" />
                                    : <ToggleLeft className="h-6 w-6 text-neutral-400" />}
                                <span className="text-[9px] uppercase tracking-[0.15em]" style={mono}>
                                    {byokPreference?.byokEnabled ? "On" : "Off"}
                                </span>
                            </button>
                        </div>

                        <div className="px-6 py-6 space-y-5">
                            {/* Description */}
                            <p className="text-xs text-ink/70 leading-relaxed border-l-2 border-divider-grey pl-3" style={bodyFont}>
                                Use your own API key for article summarization. Your key is <strong>AES-256 encrypted</strong> server-side and never exposed in responses.
                                System AI (Groq &amp; Gemini) remains as fallback if your key fails.
                            </p>

                            {byokLoading ? (
                                <div className="flex items-center gap-2 text-xs text-neutral-400" style={mono}>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                                </div>
                            ) : byokPreference?.byokEnabled ? (
                                <>
                                    {/* Credential list */}
                                    {byokCredentials.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400" style={mono}>Saved Keys</p>
                                            {byokCredentials.map((cred: any) => (
                                                <div key={cred.id}
                                                    className={`flex items-center gap-3 px-4 py-3 border transition-colors ${cred.isActive ? "border-ink bg-ink/5" : "border-divider-grey"}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                            <span className="text-xs font-bold text-ink" style={sans}>{cred.label}</span>
                                                            {cred.isActive && (
                                                                <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-paper bg-ink px-1.5 py-0.5" style={mono}>Active</span>
                                                            )}
                                                            {cred.isVerified
                                                                ? <ShieldCheck className="h-3 w-3 text-green-600" />
                                                                : <Shield className="h-3 w-3 text-neutral-300" />}
                                                        </div>
                                                        <p className="text-[9px] text-neutral-400" style={mono}>
                                                            {cred.provider} · {cred.model} · {cred.apiKeyMask}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {!cred.isActive && (
                                                            <button onClick={() => activateMutation.mutate(cred.id)}
                                                                disabled={activateMutation.isPending}
                                                                className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] border border-ink text-ink hover:bg-ink hover:text-paper transition-all disabled:opacity-40"
                                                                style={{ ...mono, borderRadius: 0 }}>
                                                                Use
                                                            </button>
                                                        )}
                                                        <button onClick={() => { if (confirm("Remove this credential?")) deleteMutation.mutate(cred.id); }}
                                                            disabled={deleteMutation.isPending}
                                                            className="p-1 text-neutral-400 hover:text-editorial-red transition-colors disabled:opacity-40"
                                                            style={{ borderRadius: 0 }}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add form toggle */}
                                    {!showAddForm ? (
                                        <button onClick={() => setShowAddForm(true)}
                                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ink border border-ink px-4 py-2.5 hover:bg-ink hover:text-paper transition-all"
                                            style={{ ...sans, borderRadius: 0 }}>
                                            <Plus className="h-3.5 w-3.5" /> Add API Key
                                        </button>
                                    ) : (
                                        <>
                                            <AddCredentialForm onSuccess={() => { setShowAddForm(false); queryClient.invalidateQueries({ queryKey: ["byok"] }); }} />
                                            <button onClick={() => setShowAddForm(false)} className="text-[9px] text-neutral-400 hover:text-ink transition-colors uppercase tracking-[0.15em]" style={mono}>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-neutral-400 italic" style={bodyFont}>
                                    Enable BYOK above to manage your personal API keys.
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Notification Settings Card ── */}
                <NotificationSettingsCard />

                {/* ── RSS Feeds Card ── */}
                <FeedManagementCard />

                {/* ── Liked & Saved ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                    <div className="border border-ink bg-paper mb-8">
                        <div className="flex border-b border-ink">
                            {([
                                { key: "liked" as const, label: "Liked", icon: Heart, count: Array.isArray(likedArticles) ? likedArticles.length : 0 },
                                { key: "saved" as const, label: "Saved", icon: Bookmark, count: Array.isArray(savedArticles) ? savedArticles.length : 0 },
                            ]).map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 -mb-[1px] transition-colors ${activeTab === tab.key ? "border-ink text-ink" : "border-transparent text-neutral-400 hover:text-ink"}`}
                                    style={{ ...sans, borderRadius: 0 }}>
                                    <tab.icon className="h-3.5 w-3.5" /> {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                        <div className="divide-y divide-divider-grey">
                            {displayList.length === 0 ? (
                                <p className="text-center text-sm text-neutral-400 py-10" style={bodyFont}>No {activeTab} articles yet.</p>
                            ) : displayList.map((article: any) => (
                                <div key={article.id} className="group flex items-start gap-4 px-6 py-4 hover:bg-ink/5 transition-colors">
                                    <a href={article.link || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-editorial-red border border-editorial-red px-1.5 py-0.5" style={mono}>{article.topic || "News"}</span>
                                            {article.source && <span className="text-[10px] text-neutral-400" style={mono}>· {article.source}</span>}
                                        </div>
                                        <h4 className="text-sm font-bold text-ink line-clamp-2 group-hover:text-editorial-red transition-colors" style={serif}>
                                            {article.title || <span className="italic font-normal text-neutral-400">Untitled</span>}
                                        </h4>
                                        {article.summary && article.summary !== "Click to analyze" && (
                                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5" style={bodyFont}>{article.summary}</p>
                                        )}
                                    </a>
                                    <div className="flex items-center gap-1 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={article.link || "#"} target="_blank" rel="noopener noreferrer" className="p-1 text-neutral-400 hover:text-ink transition-colors"><ExternalLink className="h-3.5 w-3.5" /></a>
                                        <button onClick={e => { e.stopPropagation(); e.preventDefault(); activeTab === "liked" ? unlikeMutation.mutate(article.id) : unsaveMutation.mutate(article.id); }}
                                            className="p-1 text-neutral-400 hover:text-editorial-red transition-colors" title="Remove" style={{ borderRadius: 0 }}>
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
                        className="px-6 py-2.5 border border-editorial-red text-editorial-red text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-editorial-red hover:text-white transition-all duration-150"
                        style={{ ...sans, borderRadius: 0 }}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Logout Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60" onClick={() => setShowLogoutConfirm(false)}>
                        <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
                            onClick={e => e.stopPropagation()} className="bg-paper w-full max-w-sm border-2 border-ink p-8 text-center">
                            <div className="w-10 h-10 border border-editorial-red text-editorial-red flex items-center justify-center mx-auto mb-5"><AlertTriangle className="h-5 w-5" /></div>
                            <h3 className="text-2xl font-black text-ink mb-2" style={serif}>Sign Out?</h3>
                            <p className="text-sm text-neutral-500 mb-8" style={bodyFont}>Are you sure you want to sign out of your account?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2.5 border border-ink text-[10px] font-bold uppercase tracking-[0.18em] text-ink hover:bg-ink/10 transition-colors" style={{ ...sans, borderRadius: 0 }}>
                                    Cancel
                                </button>
                                <button onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                    className="flex-1 py-2.5 bg-editorial-red text-white text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#aa0000] transition-colors" style={{ ...sans, borderRadius: 0 }}>
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