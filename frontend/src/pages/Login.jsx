import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { api, getFieldErrors, toastApiError } from "@/lib/api";
import {
    Coins,
    Lock,
    Mail,
    ArrowRight,
    ShieldCheck,
    Store,
    User as UserIcon,
    MapPin,
    Building2,
    Phone,
    Globe,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button, Field, Input } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

const STATS = [
    { k: "Spot Price", v: "₹7,240/g", tone: "accent" },
    { k: "Vault Cities", v: "12+", tone: "cyan" },
    { k: "Settlement", v: "T+0", tone: "accent" },
];

const normalizePhoneInput = (value) => value.replace(/\D/g, "").slice(0, 10);
const isTenDigitPhone = (value) => value.length === 10 && value.split("").every((char) => char >= "0" && char <= "9");

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [role, setRole] = useState("USER");
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const fd = new FormData(e.currentTarget);
        const email = fd.get("email");
        const password = fd.get("password");
        
        const path = isRegistering 
            ? (role === "VENDOR" ? "/vendor/auth/register" : "/user/auth/register") 
            : (role === "VENDOR" ? "/vendor/auth/login" : "/user/auth/login");

        try {
            setFieldErrors({});
            setLoading(true);
            let payload = { email, password };
            
            if (isRegistering) {
                if (role === "USER") {
                    payload = {
                        name: fd.get("name"),
                        email,
                        password,
                        street: fd.get("street"),
                        city: fd.get("city"),
                        state: fd.get("state"),
                        postalCode: fd.get("postalCode"),
                        country: fd.get("country"),
                    };
                } else if (role === "VENDOR") {
                    payload = {
                        vendorName: fd.get("vendorName"),
                        contactPersonName: fd.get("contactPersonName"),
                        contactEmail: email,
                        contactPhone: normalizePhoneInput(String(fd.get("contactPhone") || "")),
                        password,
                        street: fd.get("street"),
                        city: fd.get("city"),
                        state: fd.get("state"),
                        postalCode: fd.get("postalCode"),
                        country: fd.get("country"),
                        description: fd.get("description") || "",
                        websiteUrl: fd.get("websiteUrl") || "",
                    };
                    if (!isTenDigitPhone(payload.contactPhone)) {
                        const message = "Contact phone must be exactly 10 digits";
                        setFieldErrors({ contactPhone: message });
                        toast.error(message);
                        return;
                    }
                }
            } else {
                payload = { email, password };
            }
            
            const { data } = await api.post(path, payload);
            login(data);
            toast.success(isRegistering ? `Registered successfully! Welcome, ${data.name}` : `Welcome back, ${data.name}`);
            nav(role === "VENDOR" ? "/vendor" : "/app");
        } catch (err) {
            setFieldErrors(getFieldErrors(err));
            toastApiError(err, isRegistering ? "Registration failed" : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex bg-background relative overflow-hidden"
            data-testid="login-page"
        >
            <div className="absolute inset-0 bg-grid opacity-30" />

            {/* Left panel — brand */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 border-r border-border bg-secondary/20">
                <div className="relative z-10 max-w-md animate-slide-in-left">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="grid place-items-center w-11 h-11 rounded-md bg-accent/15 ring-1 ring-accent/40">
                            <Coins className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <div className="text-xl font-semibold tracking-tight">
                                BNKAI
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                                Digital Gold Wallet
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight">
                        Trade 24K gold with{" "}
                        <span className="accent-gold">institutional</span>{" "}
                        precision.
                    </h1>
                    <p className="mt-4 text-muted-foreground text-base leading-relaxed">
                        Real-time spot prices, instant settlement, vault-grade
                        custody — one command center for your entire bullion
                        portfolio.
                    </p>

                    <div className="mt-8 grid grid-cols-2 gap-3 stagger">
                        {STATS.map((s) => (
                            <div
                                key={s.k}
                                className="rounded-md border border-border bg-card p-4"
                            >
                                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                    {s.k}
                                </div>
                                <div
                                    className={cn(
                                        "mono text-lg font-semibold mt-1",
                                        s.tone === "accent"
                                            ? "accent-gold"
                                            : "accent-primary",
                                    )}
                                >
                                    {s.v}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground mono">
                        <span className="dot bg-emerald-500 animate-pulse-ring" />
                        <span>MARKET LIVE</span>
                        <span className="text-border">·</span>
                        <span>91 days of price history loaded</span>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div
                    className="w-full max-w-md rounded-lg border border-border bg-card p-8 animate-fade-in-up"
                    data-testid="login-card"
                >
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        Secure Access · JWT
                    </div>
                    <h2 className="text-2xl font-semibold mt-2 tracking-tight">
                        {isRegistering ? "Create an account" : "Sign in"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isRegistering ? "Register as a new investor." : `Continue as ${role === "VENDOR" ? "vendor" : "investor"}.`}
                    </p>

                    {/* Role tabs */}
                    {!isRegistering && (
                        <div
                            className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-lg border border-border bg-background/40"
                            data-testid="login-role-tabs"
                        >
                            <RoleTab
                                active={role === "USER"}
                                onClick={() => { setRole("USER"); setFieldErrors({}); }}
                                icon={ShieldCheck}
                                label="Investor"
                                testId="user-tab"
                            />
                            <RoleTab
                                active={role === "VENDOR"}
                                onClick={() => { setRole("VENDOR"); setFieldErrors({}); }}
                                icon={Store}
                                label="Vendor"
                                testId="vendor-tab"
                            />
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                        className="mt-6 space-y-4"
                        data-testid={`${isRegistering ? "register" : role.toLowerCase()}-login-form`}
                        key={isRegistering ? "register" : role}
                    >
                        {isRegistering && (
                            <>
                                {role === "USER" && (
                                    <Field label="Name" error={fieldErrors.name}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                                            <input
                                                name="name"
                                                type="text"
                                                placeholder="Full Name"
                                                required
                                                className="flex-1 bg-transparent outline-none text-sm"
                                                data-testid="register-name-input"
                                            />
                                        </div>
                                    </Field>
                                )}
                                
                                {role === "VENDOR" && (
                                    <>
                                        <Field label="Vendor Name" error={fieldErrors.vendorName}>
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                                <Store className="w-4 h-4 text-muted-foreground" />
                                                <input name="vendorName" type="text" placeholder="Gold Co." required className="flex-1 bg-transparent outline-none text-sm" />
                                            </div>
                                        </Field>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Contact Person" error={fieldErrors.contactPersonName}>
                                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                                                    <input name="contactPersonName" type="text" placeholder="John Doe" required className="flex-1 bg-transparent outline-none text-sm" />
                                                </div>
                                            </Field>
                                            <Field label="Phone" error={fieldErrors.contactPhone}>
                                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        name="contactPhone"
                                                        type="tel"
                                                        inputMode="numeric"
                                                        pattern="\d{10}"
                                                        maxLength={10}
                                                        placeholder="9876543210"
                                                        required
                                                        onInput={(e) => { e.currentTarget.value = normalizePhoneInput(e.currentTarget.value); }}
                                                        className="flex-1 bg-transparent outline-none text-sm"
                                                    />
                                                </div>
                                            </Field>
                                        </div>
                                        <Field label="Description (Optional)" error={fieldErrors.description}>
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                                <input name="description" type="text" placeholder="Premium Gold Dealer" className="flex-1 bg-transparent outline-none text-sm" />
                                            </div>
                                        </Field>
                                        <Field label="Website URL (Optional)" error={fieldErrors.websiteUrl}>
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                                <Globe className="w-4 h-4 text-muted-foreground" />
                                                <input name="websiteUrl" type="url" placeholder="https://example.com" className="flex-1 bg-transparent outline-none text-sm" />
                                            </div>
                                        </Field>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Field label={role === "VENDOR" ? "Business Street Address" : "Street Address"} error={fieldErrors.street}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <input name="street" type="text" placeholder="123 Main St" required className="flex-1 bg-transparent outline-none text-sm" />
                                        </div>
                                    </Field>
                                    <Field label="City" error={fieldErrors.city}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                            <input name="city" type="text" placeholder="Mumbai" required className="flex-1 bg-transparent outline-none text-sm" />
                                        </div>
                                    </Field>
                                    <Field label="State" error={fieldErrors.state}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                            <input name="state" type="text" placeholder="MH" required className="flex-1 bg-transparent outline-none text-sm" />
                                        </div>
                                    </Field>
                                    <Field label="Postal Code" error={fieldErrors.postalCode}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                            <input name="postalCode" type="text" placeholder="400001" required className="flex-1 bg-transparent outline-none text-sm" />
                                        </div>
                                    </Field>
                                    <Field label="Country" className="col-span-2" error={fieldErrors.country}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                            <input name="country" type="text" placeholder="United States" required className="flex-1 bg-transparent outline-none text-sm" />
                                        </div>
                                    </Field>
                                </div>
                            </>
                        )}

                        <Field label={role === "VENDOR" && isRegistering ? "Contact Email" : "Email"} error={role === "VENDOR" && isRegistering ? (fieldErrors.contactEmail || fieldErrors.email) : fieldErrors.email}>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue=""
                                    placeholder="Enter email"
                                    required
                                    className="flex-1 bg-transparent outline-none text-sm"
                                    data-testid={`${isRegistering ? "register" : role.toLowerCase()}-email-input`}
                                />
                            </div>
                        </Field>

                        <Field label="Password" error={fieldErrors.password}>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    defaultValue=""
                                    placeholder="Enter password"
                                    required
                                    className="flex-1 bg-transparent outline-none text-sm"
                                    data-testid={`${isRegistering ? "register" : role.toLowerCase()}-password-input`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>

                        {!isRegistering && (
                            <div className="rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5 select-none transition-all duration-300">
                                <span className="text-accent mt-0.5 text-sm">💡</span>
                                <div>
                                    <span className="font-semibold text-foreground">Tip:</span> If you recently updated your email address in your profile, please use your <span className="font-semibold text-accent">new email address</span> to sign in.
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            size="lg"
                            className="w-full mt-2"
                            data-testid={`${isRegistering ? "register" : role.toLowerCase()}-login-submit`}
                        >
                            {loading ? (isRegistering ? "Registering…" : "Authenticating…") : (isRegistering ? "Create account" : "Sign in")}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        {isRegistering ? (
                            <span className="text-muted-foreground">
                                Already have an account?{" "}
                                <button type="button" onClick={() => { setIsRegistering(false); setFieldErrors({}); }} className="text-primary hover:underline">
                                    Sign in
                                </button>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                New here?{" "}
                                <button type="button" onClick={() => { setIsRegistering(true); setFieldErrors({}); }} className="text-primary hover:underline">
                                    Create an account
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoleTab({ active, onClick, icon: Icon, label, testId }) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-testid={testId}
            className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition",
                active
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
        >
            <Icon className="w-4 h-4" /> {label}
        </button>
    );
}
