import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Globe, Server, Database, Brain, LucideIcon } from "lucide-react";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string || "http://localhost:3000/api").replace(/\/api\/?$/, "");

export type ServiceStatus = "checking" | "operational" | "degraded" | "down";

export interface Service {
    id: string;
    label: string;
    icon: LucideIcon;
    status: ServiceStatus;
    latency: number | null;
    detail: string;
}

const INITIAL: Service[] = [
    { id: "vercel", label: "Frontend", icon: Globe, status: "checking", latency: null, detail: "Vercel CDN" },
    { id: "render", label: "API", icon: Server, status: "checking", latency: null, detail: "Render Backend" },
    { id: "supabase", label: "Database", icon: Database, status: "checking", latency: null, detail: "Supabase Postgres" },
    // { id: "nlp", label: "NLP Engine", icon: Brain, status: "checking", latency: null, detail: "Naive Bayes Classifier" },
];

interface StatusContextType {
    services: Service[];
    isGreen: boolean;
    isDegraded: boolean;
    isChecking: boolean;
    lastPing: number;
    isDetailsOpen: boolean;
    setDetailsOpen: (open: boolean) => void;
    checkHealth: () => Promise<void>;
}

const StatusContext = createContext<StatusContextType | null>(null);

export function StatusProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>(INITIAL);
    const [lastPing, setLastPing] = useState(Date.now());
    const [isDetailsOpen, setDetailsOpen] = useState(false);

    // Track consecutive DB failures using a ref to avoid stale closure issues.
    // We only mark DB as degraded after 2 consecutive failures to avoid false
    // alarms during Render cold starts where the first health check may fail
    // transiently even though the DB is actually reachable.
    const dbFailCount = useRef(0);

    const setService = useCallback((id: string, patch: Partial<Service>) => {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    }, []);

    const checkHealth = useCallback(async () => {
        // Ping Frontend
        const t0Front = performance.now();
        fetch("/logo.png", { method: "HEAD", cache: "no-store" })
            .then(() => setService("vercel", { status: "operational", latency: Math.round(performance.now() - t0Front), detail: "Vercel CDN" }))
            .catch(() => setService("vercel", { status: "degraded", latency: null, detail: "Connection slow" }));

        // Ping API & DB
        const t0Backend = performance.now();
        const controller = new AbortController();
        // Extended timeout to accommodate Render free-tier cold starts (can take 30-50s)
        const timeout = setTimeout(() => controller.abort(), 20_000);

        try {
            const res = await fetch(`${API_BASE}/health`, { signal: controller.signal, cache: "no-store" });
            const latency = Math.round(performance.now() - t0Backend);

            // Handle both 200 OK and 503 Service Unavailable (DB down) gracefully
            let body: any = {};
            try {
                body = await res.json();
            } catch (e) { }

            const dbOk = body?.database === "connected";
            const dbLatency = body?.dbLatency ?? (latency + 5);

            setService("render", { status: "operational", latency, detail: "Render Backend" });

            if (dbOk) {
                // DB confirmed healthy — reset failure counter and show green
                dbFailCount.current = 0;
                setService("supabase", {
                    status: "operational",
                    latency: dbLatency,
                    detail: "Supabase Postgres",
                });
            } else {
                // DB check failed — only commit to "degraded" after 2+ consecutive
                // failures to avoid flipping on a single transient cold-start error.
                dbFailCount.current += 1;
                if (dbFailCount.current >= 2) {
                    setService("supabase", {
                        status: "degraded",
                        latency: null,
                        detail: "Database Unreachable / Cold Start",
                    });
                } else {
                    // First failure: stay as "checking" and give it another poll cycle
                    setService("supabase", {
                        status: "checking",
                        latency: null,
                        detail: "Supabase Postgres",
                    });
                }
            }
            // setService("nlp", {
            //     status: body?.nlpClassifier === "ready" ? "operational" : body?.nlpClassifier === "training" ? "degraded" : "down",
            //     latency: body?.nlpClassifier === "ready" ? latency : null,
            //     detail: body?.nlpClassifier === "ready" ? "Naive Bayes Classifier" : body?.nlpClassifier === "training" ? "Training on startup..." : "Classifier failed to load",
            // });
        } catch (err: any) {
            const latency = Math.round(performance.now() - t0Backend);
            const isTimeout = err?.name === "AbortError" || latency >= 19_000;
            const isColdStart = latency > 4_000 && !isTimeout;

            setService("render", {
                status: isTimeout ? "down" : isColdStart ? "degraded" : "down",
                latency: isTimeout ? null : latency,
                detail: isColdStart ? "Render cold start — warming up..." : "Backend offline or unreachable",
            });

            // API unreachable — increment DB fail counter but apply same grace period
            dbFailCount.current += 1;
            if (dbFailCount.current >= 2) {
                setService("supabase", {
                    status: "degraded",
                    detail: "Status unknown — API unreachable",
                    latency: null,
                });
            } else {
                // Stay as "checking" on first failure
                setService("supabase", {
                    status: "checking",
                    detail: "Status unknown — API unreachable",
                    latency: null,
                });
            }
        } finally {
            clearTimeout(timeout);
            setLastPing(Date.now());
        }
    }, [setService]);

    // Initial check
    useEffect(() => {
        checkHealth();
    }, [checkHealth]);

    // Derived states based on fully-set state
    const isGreen = services.length > 0 && services.every((s) => s.status === "operational");
    const isChecking = services.some((s) => s.status === "checking");
    const isDegraded = services.some((s) => s.status === "degraded" || s.status === "down");

    // Dynamic polling based on the LATEST state results
    useEffect(() => {
        if (isChecking) return; // Wait until initial check finishes

        const intervalMs = isGreen ? 5 * 60 * 1000 : 5 * 1000;
        const timer = setInterval(checkHealth, intervalMs);
        return () => clearInterval(timer);
    }, [isGreen, isChecking, checkHealth, lastPing]);

    return (
        <StatusContext.Provider value={{ services, isGreen, isDegraded, isChecking, lastPing, isDetailsOpen, setDetailsOpen, checkHealth }}>
            {children}
        </StatusContext.Provider>
    );
}

export function useStatus() {
    const context = useContext(StatusContext);
    if (!context) throw new Error("useStatus must be used within a StatusProvider");
    return context;
}
