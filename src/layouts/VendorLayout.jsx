import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/lib/theme";
import {
    LayoutDashboard,
    Building2,
    UserCircle2,
    Sun,
    Moon,
    LogOut,
    Menu,
    Coins,
    ShieldCheck,
    Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/vendor", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/vendor/branches", label: "Branches", icon: Building2 },
    { to: "/vendor/transactions", label: "Transactions", icon: Receipt },
    { to: "/vendor/profile", label: "Profile", icon: UserCircle2 },
];

export default function VendorLayout() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const nav = useNavigate();
    const [open, setOpen] = useState(true);

    const handleLogout = () => {
        logout();
        nav("/login");
    };

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r border-border bg-card/40 backdrop-blur-xl transition-all duration-300 ease-out",
                    open ? "w-64" : "w-[76px]",
                )}
                data-testid="vendor-sidebar"
            >
                <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
                    <div className="grid place-items-center w-9 h-9 rounded-md bg-accent/15 ring-1 ring-accent/40">
                        <Coins className="w-5 h-5 text-accent" />
                    </div>
                    {open && (
                        <div className="flex flex-col leading-tight animate-fade-in">
                            <div className="text-xl font-semibold tracking-tight">
                                BNKAI
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                Vendor Portal
                            </span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 stagger">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            data-testid={`vendor-nav-${item.label.toLowerCase()}`}
                            className={({ isActive }) =>
                                cn(
                                    "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
                                    "hover:bg-secondary/70 hover:text-foreground",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/30"
                                        : "text-muted-foreground",
                                )
                            }
                        >
                            <item.icon className="w-[18px] h-[18px] shrink-0 group-hover:scale-110 transition-transform" />
                            {open && (
                                <span className="truncate">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-border p-3 space-y-2">
                    <button
                        onClick={() => setOpen((o) => !o)}
                        data-testid="vendor-sidebar-toggle"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-secondary/70"
                    >
                        <Menu className="w-4 h-4" />
                        {open && "Collapse"}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mono">
                        <span className="dot text-emerald-400 bg-current animate-pulse" />
                        <span>VENDOR CONSOLE</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggle}
                            data-testid="vendor-theme-toggle"
                            className="w-9 h-9 grid place-items-center rounded-md border border-border hover:bg-secondary/70 btn-hover"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                        </button>

                        <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-border">
                            <div className="text-right leading-tight">
                                <div className="text-sm font-medium">
                                    {user?.name}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                                    <ShieldCheck className="w-3 h-3" />
                                    {user?.role}
                                </div>
                            </div>
                            <div className="w-9 h-9 grid place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-border font-semibold uppercase">
                                {user?.name?.[0] || "V"}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            data-testid="vendor-logout-button"
                            className="w-9 h-9 grid place-items-center rounded-md border border-border hover:bg-destructive/15 hover:text-destructive btn-hover"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 relative pb-20 md:pb-8">
                    <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40 pointer-events-none" />
                    <div className="relative max-w-[1600px] mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/85 backdrop-blur-xl border-t border-border flex items-center justify-around py-2 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            data-testid={`vendor-nav-mobile-${item.label.toLowerCase().replace(/[/\s]+/g, "-")}`}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition",
                                    isActive ? "text-primary font-medium" : "hover:text-foreground"
                                )
                            }
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] leading-none">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
