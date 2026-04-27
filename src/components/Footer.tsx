import { Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "Sign In", path: "/auth" },
];

export function Footer() {
    const year = 2026;

    return (
        <footer
            className="border-t-2 border-ink bg-paper mt-auto newsprint-texture"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* Main footer grid */}
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-12 border-b border-ink">

                {/* Col 1 — Brand & tagline (span 4) */}
                <div className="md:col-span-4 px-6 py-8 border-b md:border-b-0 md:border-r border-ink">
                    <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
                        <img
                            src="/logo.png"
                            alt="NewsLabs Logo"
                            className="h-7 w-auto object-contain grayscale"
                        />
                        <span
                            className="font-black text-xl text-ink"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            NewsLabs
                        </span>
                    </Link>
                    <p
                        className="text-sm text-neutral-600 leading-relaxed mb-5 max-w-xs"
                        style={{ fontFamily: "'Lora', serif" }}
                    >
                        Personalized, AI-curated live feeds — built on open standards, not scraping.
                    </p>
                    <p
                        className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                        Edition Vol. 2.0 &nbsp;·&nbsp; Web Platform
                    </p>
                </div>

                {/* Col 2 — Navigation (span 3) */}
                <div className="md:col-span-3 px-6 py-8 border-b md:border-b-0 md:border-r border-ink">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 mb-4">
                        Navigation
                    </h4>
                    <ul className="space-y-3">
                        {footerLinks.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className="text-sm font-medium text-ink hover:text-editorial-red transition-colors duration-150 editorial-link"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Col 3 — About (span 3) */}
                <div className="md:col-span-3 px-6 py-8 border-b md:border-b-0 md:border-r border-ink">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 mb-4">
                        About
                    </h4>
                    <p
                        className="text-sm text-neutral-600 leading-relaxed"
                        style={{ fontFamily: "'Lora', serif" }}
                    >
                        Built by{" "}
                        <a
                            href="https://www.linkedin.com/in/priyanshukamal/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-ink hover:text-editorial-red transition-colors editorial-link"
                        >
                            Priyanshu Kamal
                        </a>
                        . NewsLabs is an independent project committed to ethical AI and transparent content curation.
                    </p>
                </div>

                {/* Col 4 — Connect (span 2) */}
                <div className="md:col-span-2 px-6 py-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 mb-4">
                        Connect
                    </h4>
                    <div className="flex flex-row md:flex-col gap-3">
                        <a
                            href="https://github.com/priyanshukamal26/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            className="w-10 h-10 border border-ink flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-all duration-150"
                        >
                            <Github className="h-4 w-4" strokeWidth={1.5} />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/priyanshukamal/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="w-10 h-10 border border-ink flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-all duration-150"
                        >
                            <Linkedin className="h-4 w-4" strokeWidth={1.5} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p
                    className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                    © {year} NewsLabs · All rights reserved
                </p>
                <p
                    className="text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                    Ethical AI · Open Standards · Privacy First
                </p>
            </div>
        </footer>
    );
}
