import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...rest }) {
    return (
        <div
            className={cn(
                "glass rounded-lg p-5 relative overflow-hidden",
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

export function StatCard({ label, value, hint, icon: Icon, accent = "primary", testId, valueClassName }) {
    const ring =
        accent === "primary"
            ? "ring-primary/30 bg-primary/10 text-primary"
            : accent === "accent"
              ? "ring-accent/30 bg-accent/10 text-accent"
              : accent === "destructive"
                ? "ring-destructive/30 bg-destructive/10 text-destructive"
                : accent === "success"
                  ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "ring-muted/30 bg-muted/30 text-muted-foreground";

    return (
        <Card data-testid={testId}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                    </div>
                    <div
                        className={cn(
                            "mt-2 mono text-2xl font-semibold tracking-tight truncate",
                            valueClassName,
                        )}
                    >
                        {value}
                    </div>
                    {hint && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {hint}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div
                        className={cn(
                            "w-10 h-10 grid place-items-center rounded-lg ring-1 flex-shrink-0",
                            ring,
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </Card>
    );
}

export function Badge({ tone = "muted", children, className }) {
    const tones = {
        muted: "bg-secondary text-muted-foreground border-border",
        primary: "bg-primary/15 text-primary border-primary/30",
        accent: "bg-accent/15 text-accent border-accent/30",
        success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        destructive:
            "bg-destructive/15 text-destructive border-destructive/30",
    };
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider border",
                tones[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

export function Button({ className, variant = "primary", size = "md", ...rest }) {
    const variants = {
        primary:
            "bg-primary text-primary-foreground hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary/70",
        outline: "border border-border hover:bg-secondary/60",
        destructive:
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };
    const sizes = {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3.5 py-2 text-sm",
        lg: "px-4 py-2.5 text-sm",
    };
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium btn-hover disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className,
            )}
            {...rest}
        />
    );
}

export function PageHeader({ title, subtitle, actions, eyebrow, testId }) {
    return (
        <div
            className="flex flex-wrap items-end justify-between gap-4 mb-6"
            data-testid={testId}
        >
            <div className="animate-slide-in-left">
                {eyebrow && (
                    <div className="text-[11px] uppercase tracking-[0.25em] text-primary mono">
                        {eyebrow}
                    </div>
                )}
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">{actions}</div>
            )}
        </div>
    );
}

export function EmptyState({ title, description, icon: Icon, action }) {
    return (
        <Card className="text-center py-12">
            {Icon && (
                <div className="mx-auto w-12 h-12 grid place-items-center rounded-xl bg-muted text-muted-foreground mb-4">
                    <Icon className="w-6 h-6" />
                </div>
            )}
            <h3 className="font-semibold">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </Card>
    );
}

export function Modal({ open, onClose, title, subtitle, children, footer, testId, size = "md" }) {
    if (!open) return null;
    const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            data-testid={testId}
        >
            <div
                className="absolute inset-0 bg-background/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className={cn(
                    "relative glass rounded-2xl w-full p-6 animate-fade-in-up max-h-[92vh] overflow-y-auto",
                    sizes[size],
                )}
            >
                <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="modal-close-btn"
                    >
                        ✕
                    </button>
                </div>
                <div>{children}</div>
                {footer && (
                    <div className="mt-6 flex justify-end gap-2">{footer}</div>
                )}
            </div>
        </div>
    );
}

export function Field({ label, children, hint, error }) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </span>
            <div className="mt-1.5">{children}</div>
            {error ? (
                <span className="block text-[11px] text-destructive mt-1" role="alert">
                    {error}
                </span>
            ) : hint ? (
                <span className="block text-[11px] text-muted-foreground mt-1">
                    {hint}
                </span>
            ) : null}
        </label>
    );
}

export function Input({ error, className, ...props }) {
    return (
        <input
            {...props}
            aria-invalid={error ? "true" : undefined}
            className={cn(
                "w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-sm outline-none",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 transition",
                error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                className,
            )}
        />
    );
}

export function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className={cn(
                "w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-sm outline-none",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 transition",
                props.className,
            )}
        >
            {children}
        </select>
    );
}

export function Spinner({ className }) {
    return (
        <div
            className={cn(
                "inline-block w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin",
                className,
            )}
        />
    );
}
