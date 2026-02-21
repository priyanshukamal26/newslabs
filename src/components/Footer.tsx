import { Zap, Github, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-border py-10 px-6 mt-auto">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="NewsLabs Logo" className="h-5 w-auto object-contain grayscale opacity-70" />
                    <span className="text-sm">
                        <span className="font-semibold">NewsLabs</span> by Priyanshu Kamal
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground">Connect:</span>
                    <a
                        href="https://github.com/priyanshukamal26/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="h-5 w-5" />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/priyanshukamal/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Linkedin className="h-5 w-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
