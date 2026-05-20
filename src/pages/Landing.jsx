import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui-kit";

export default function Landing() {
    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden relative">
            {/* Background grid */}
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="grid place-items-center w-10 h-10 rounded-md bg-accent/15 ring-1 ring-accent/40">
                        <Coins className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">BNKAI</span>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium">
                    <Link to="/about" className="text-muted-foreground hover:text-foreground transition">
                        About Us
                    </Link>
                    <Link to="/login">
                        <Button variant="primary">Sign In</Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-8 animate-fade-in-up">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>The Future of Digital Bullion is Here</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                    Institutional-Grade <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-500">
                        Gold Trading
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                    Experience real-time spot pricing, instant settlement, and vault-grade custody. Join BNKAI and manage your entire bullion portfolio from one powerful command center.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                    <Link to="/login">
                        <Button variant="accent" className="group rounded-full px-10 py-5 text-lg shadow-xl shadow-accent/20">
                            Get Started Now
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link to="/about">
                        <Button variant="ghost" className="rounded-full px-10 py-5 text-lg bg-secondary/30 hover:bg-secondary/60">
                            Meet the Team
                        </Button>
                    </Link>
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                    <FeatureCard 
                        icon={ShieldCheck} 
                        title="Secure Vaults" 
                        desc="Your assets are stored in world-class, fully insured vault facilities."
                    />
                    <FeatureCard 
                        icon={Zap} 
                        title="Instant Settlement" 
                        desc="Trade at real-time market prices with zero execution delay."
                    />
                    <FeatureCard 
                        icon={Coins} 
                        title="Digital & Physical" 
                        desc="Hold digital gold or request physical delivery to your doorstep."
                    />
                </div>
            </main>
            
            {/* Footer */}
            <footer className="relative z-10 border-t border-border mt-20 py-8 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} BNKAI Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 grid place-items-center rounded-full bg-secondary/50 text-foreground mb-4 ring-1 ring-border">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
    );
}

function SparklesIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    );
}
