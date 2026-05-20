import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui-kit";

const TEAM = [
    {
        id: 1,
        name: "Kashvi Sharma",
        module: "Vendor & Branch Module",
        desc: "Efficiently manages trusted gold vendors, branch networks, live gold pricing, and branch-wise inventory for smooth order fulfillment.",
        seed: "Jack"
    },
    {
        id: 2,
        name: "Swarit Sharma",
        module: "Virtual Gold Holdings Module",
        desc: "Allows users to securely buy, sell, and manage their digital gold assets with real-time balance tracking and transparent records.",
        seed: "Alex"
    },
    {
        id: 3,
        name: "Divyesh Thakur",
        module: "Physical Gold Transactions Module",
        desc: "Streamlines physical gold purchases and delivery processes with secure order handling and branch-based fulfillment management.",
        seed: "Daniel"
    },
    {
        id: 4,
        name: "Anand",
        module: "User & Address Module",
        desc: "Provides secure user account management with personalized profiles and multiple address support for seamless transactions and deliveries.",
        seed: "Jocelyn"
    },
    {
        id: 5,
        name: "Rajveer",
        module: "Payments & Transactions Module",
        desc: "Securely handles wallet top-ups, payment processing, and end-to-end transaction tracking for a reliable financial experience.",
        seed: "Aneka"
    },
    {
        id: 6,
        name: "Rohit Mahajan",
        module: "Gold Holdings Conversion Module",
        desc: "Empowers users to convert digital gold into physical gold effortlessly with intelligent inventory allocation and secure delivery processing.",
        seed: "Avery"
    }
];

export default function About() {
    return (
        <div className="min-h-screen bg-background flex flex-col relative">
            {/* Background grid */}
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
                    <div className="grid place-items-center w-10 h-10 rounded-md bg-accent/15 ring-1 ring-accent/40">
                        <Coins className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">BNKAI</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Meet the Team</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        The brilliant minds behind BNKAI. We are a dedicated group of engineers, designers, and visionaries working to revolutionize digital bullion trading.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TEAM.map((member) => (
                        <div key={member.id} className="group flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden mb-6 ring-4 ring-background group-hover:ring-primary/20 transition-all">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}&backgroundColor=e5e7eb`} 
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                            <div className="text-xs font-mono uppercase tracking-wider text-accent mb-4 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                                {member.module}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                                {member.desc}
                            </p>
                            
                            <div className="flex items-center gap-3">
                                <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition">
                                    <Github className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition">
                                    <Linkedin className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-border mt-12 py-8 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} BNKAI Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}
