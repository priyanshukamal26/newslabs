import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useStatus } from "../lib/status";

function statusColor(s: string) {
    return {
        checking: "text-neutral-400",
        operational: "text-emerald-600",
        degraded: "text-amber-500",
        down: "text-[#CC0000]",
    }[s as string] || "text-neutral-400";
}

function statusDot(s: string) {
    return {
        checking: "bg-neutral-300 animate-pulse",
        operational: "bg-emerald-500",
        degraded: "bg-amber-400 animate-pulse",
        down: "bg-[#CC0000] animate-pulse",
    }[s as string] || "bg-neutral-300";
}

function statusLabel(s: string) {
    return { checking: "Checking…", operational: "Operational", degraded: "Slow/Degraded", down: "Unreachable" }[s as string] || "Unknown";
}

function formatLatency(ms: number | null) {
    if (ms === null) return "";
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
}

// Framer motion variants for staggered list
const listContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const listItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function StatusBar() {
    const { services, isGreen, isDegraded, isChecking, isDetailsOpen, setDetailsOpen } = useStatus();

    // Bottom bar dismissed state
    const [dismissedBottom, setDismissedBottom] = useState(false);

    // Top banner dismissed state
    const [dismissedTop, setDismissedTop] = useState(false);

    const autoCloseBottomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto dismiss banners when all operational
    useEffect(() => {
        if (!isChecking && isGreen) {
            autoCloseBottomTimer.current = setTimeout(() => {
                setDismissedBottom(true);
                setDismissedTop(true);
            }, 4000);
        } else if (!isGreen && isDegraded) {
            // Keep top banner open if there are issues during a real cold start
            setDismissedTop(false);
            setDismissedBottom(false);
        }
        return () => {
            if (autoCloseBottomTimer.current) clearTimeout(autoCloseBottomTimer.current);
        };
    }, [isGreen, isChecking, isDegraded]);

    const summaryColor = isGreen ? "text-emerald-600" : isDegraded ? "text-amber-500" : isChecking ? "text-neutral-400" : "text-[#CC0000]";
    const summaryText = isGreen
        ? "All systems operational"
        : isDegraded
            ? "Service experiencing delays"
            : isChecking
                ? "Checking infrastructure…"
                : "Service disruption detected";

    // If details are meant to be open, we must ensure the bottom bar is visible
    const showBottomBar = !dismissedBottom || isDetailsOpen;

    return (
        <>
            {/* Top Side Explanatory Banner */}
            <AnimatePresence>
                {!dismissedTop && (
                    <motion.div
                        initial={{ y: -80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -80, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="fixed top-14 inset-x-0 z-30 shadow-md border-b-2 border-[#111111] bg-[#F9F9F7]"
                    >
                        <div className="max-w-screen-xl mx-auto px-4 py-3 sm:py-4 flex items-start gap-4">
                            <Info className={`w-5 h-5 shrink-0 ${isGreen ? "text-emerald-600" : "text-amber-500"}`} />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    System Diagnostics {isChecking ? "Running…" : isGreen ? "Complete" : "Ongoing"}
                                </h4>
                                <p className="text-sm text-neutral-600 mt-1 mb-2 leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                                    {isGreen
                                        ? "All checks passed. The platform is ready."
                                        : isChecking
                                            ? "Verifying connections to the delivery network, API, and database..."
                                            : "Backend cold start in progress. Services may take 30-50s to wake up. Retrying every 5s."}
                                </p>
                            </div>
                            <button
                                onClick={() => setDismissedTop(true)}
                                className="w-8 h-8 flex items-center justify-center border border-[#E5E5E0] text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 transition-colors shrink-0"
                                aria-label="Dismiss banner"
                                style={{ borderRadius: 0 }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Status Bar (Entry Dialog) */}
            <AnimatePresence>
                {showBottomBar && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="fixed bottom-0 inset-x-0 z-50"
                        role="status"
                        aria-live="polite"
                    >
                        {/* Expanded detail panel */}
                        <AnimatePresence>
                            {isDetailsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden border-t-2 border-[#111111] bg-[#F9F9F7]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
                                    }}
                                >
                                    <motion.div
                                        variants={listContainer}
                                        initial="hidden"
                                        animate="show"
                                        className="max-w-screen-xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x divide-[#E5E5E0]"
                                    >
                                        {services.map((svc) => (
                                            <motion.div variants={listItem} key={svc.id} className="flex items-start gap-4 px-0 sm:px-8 first:pl-0 last:pr-0">
                                                <div className={`w-10 h-10 border-2 flex items-center justify-center shrink-0 border-[#111111] ${svc.status === "operational" ? "bg-emerald-50" : svc.status === "degraded" ? "bg-amber-50" : svc.status === "down" ? "bg-red-50" : "bg-white"}`}>
                                                    {svc.status === "checking" ? (
                                                        <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" />
                                                    ) : svc.status === "operational" ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-[#CC0000]" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#111111] flex flex-wrap items-center gap-2 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                                                        {svc.label}
                                                        {svc.latency !== null && (
                                                            <span className="font-normal text-neutral-400 normal-case tracking-normal" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatLatency(svc.latency)}</span>
                                                        )}
                                                    </p>
                                                    <p className={`text-sm font-medium mb-1 ${statusColor(svc.status)}`} style={{ fontFamily: "'Lora', serif" }}>
                                                        {statusLabel(svc.status)}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                                        {svc.detail}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main status strip */}
                        <div className={`border-t-2 border-[#111111] transition-colors duration-500 ${isGreen ? "bg-emerald-50" : !isChecking && !isGreen ? "bg-amber-50" : "bg-[#F9F9F7]"}`}>
                            <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {services.map((svc) => (
                                            <motion.span
                                                key={svc.id}
                                                title={`${svc.label}: ${statusLabel(svc.status)}`}
                                                className={`block w-2.5 h-2.5 ${statusDot(svc.status)}`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                style={{ borderRadius: 0 }}
                                            />
                                        ))}
                                    </div>
                                    <span className="w-px h-4 bg-[#E5E5E0] shrink-0" />
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={summaryText}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.2 }}
                                            className={`text-xs font-bold uppercase tracking-[0.18em] truncate ${summaryColor}`}
                                            style={{ fontFamily: "'Inter', sans-serif" }}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isChecking && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-neutral-400" />}
                                                {isGreen && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                                {summaryText}
                                            </span>
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-0 shrink-0 h-full">
                                    <button
                                        onClick={() => setDetailsOpen(!isDetailsOpen)}
                                        className={`h-full px-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors border-l border-[#E5E5E0] ${isDetailsOpen
                                            ? "bg-[#111111] text-white hover:bg-neutral-800"
                                            : "bg-transparent text-neutral-500 hover:text-[#111111] hover:bg-neutral-100"
                                            }`}
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                    >
                                        {isDetailsOpen ? "Close Details" : "View Details"}
                                        {isDetailsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
