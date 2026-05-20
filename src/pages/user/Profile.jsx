import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtGrams, toastApiError, getFieldErrors } from "@/lib/api";
import { Card, PageHeader, Badge, Input, Button, Field } from "@/components/ui-kit";
import { Mail, MapPin, ShieldCheck, Wallet, Coins, TrendingUp, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
    const { user, refreshAuth } = useAuth();
    const [dash, setDash] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editStreet, setEditStreet] = useState("");
    const [editCity, setEditCity] = useState("");
    const [editState, setEditState] = useState("");
    const [editPostalCode, setEditPostalCode] = useState("");
    const [editCountry, setEditCountry] = useState("India");

    const load = useCallback(async () => {
        try {
            setLoadError("");
            const d = await api.get(`/users/${user.user_id}/dashboard`);
            const a = await api.get(`/users/${user.user_id}/addresses`);
            setDash(d.data);
            setAddresses(a.data || []);
        setEditName(d.data.name || "");
        setEditEmail(d.data.email || "");
        if (a.data && a.data.length > 0) {
            const addr = a.data[0];
            setEditStreet(addr.street || "");
            setEditCity(addr.city || "");
            setEditState(addr.state || "");
            setEditPostalCode(addr.postal_code || addr.postalCode || "");
            setEditCountry(addr.country || "India");
            }
        } catch (err) {
            setLoadError(toastApiError(err, "Failed to load profile").message);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSave = async () => {
        if (saving) return;
        try {
            setSaving(true);
            setFieldErrors({});
            const response = await api.put(`/users/${user.user_id}/profile`, {
                name: editName,
                email: editEmail,
                street: editStreet,
                city: editCity,
                state: editState,
                postalCode: editPostalCode,
                country: editCountry
            });
            
            const newToken = response?.headers?.["x-new-token"] || response?.headers?.["X-New-Token"];
            if (newToken && refreshAuth) {
                refreshAuth(newToken, editEmail);
            }

            toast.success("Profile updated successfully");
            setIsEditing(false);
            load();
        } catch (e) {
            setFieldErrors(getFieldErrors(e));
            toastApiError(e, "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (!dash) return <div className="text-sm text-muted-foreground">{loadError || "Loading..."}</div>;

    return (
        <div data-testid="profile-page">
            <PageHeader eyebrow="Account" title="Profile & Preferences" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 grid place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-border font-bold text-2xl uppercase">
                                {(dash.name || "User")
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("")}
                            </div>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <Field label="Full Name" error={fieldErrors.name}>
                                        <Input
                                            value={editName}
                                            error={fieldErrors.name}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Full Name"
                                        />
                                    </Field>
                                    <Field label="Email Address" error={fieldErrors.email}>
                                        <Input
                                            value={editEmail}
                                            error={fieldErrors.email}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="Email Address"
                                        />
                                    </Field>
                                    <div className="pt-2 pb-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                        Primary Address
                                    </div>
                                    <Field label="Street Address" error={fieldErrors.street}>
                                        <Input
                                            value={editStreet}
                                            error={fieldErrors.street}
                                            onChange={(e) => setEditStreet(e.target.value)}
                                            placeholder="Street Address"
                                        />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="City" error={fieldErrors.city}>
                                            <Input
                                                value={editCity}
                                                error={fieldErrors.city}
                                                onChange={(e) => setEditCity(e.target.value)}
                                                placeholder="City"
                                            />
                                        </Field>
                                        <Field label="State" error={fieldErrors.state}>
                                            <Input
                                                value={editState}
                                                error={fieldErrors.state}
                                                onChange={(e) => setEditState(e.target.value)}
                                                placeholder="State"
                                            />
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Postal Code" error={fieldErrors.postalCode}>
                                            <Input
                                                value={editPostalCode}
                                                error={fieldErrors.postalCode}
                                                onChange={(e) => setEditPostalCode(e.target.value)}
                                                placeholder="Postal Code"
                                            />
                                        </Field>
                                        <Field label="Country" error={fieldErrors.country}>
                                            <Input
                                                value={editCountry}
                                                error={fieldErrors.country}
                                                onChange={(e) => setEditCountry(e.target.value)}
                                                placeholder="Country"
                                            />
                                        </Field>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition">
                                            <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-xs border border-border px-3 py-1.5 rounded hover:bg-secondary transition">
                                            <X className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-2xl font-bold tracking-tight">
                                        {dash.name || "User"}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Mail className="w-3.5 h-3.5" /> {dash.email || "No email provided"}
                                    </div>
                                    <div className="mt-1">
                                        <Badge tone="primary">
                                            <ShieldCheck className="w-3 h-3" /> Verified Investor
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:bg-secondary rounded-md transition">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="mt-8">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                            Saved addresses
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {addresses.map((a) => (
                                <div
                                    key={a.address_id}
                                    className="rounded-lg border border-border bg-background/40 p-4"
                                    data-testid={`address-${a.address_id}`}
                                >
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                        <MapPin className="w-3 h-3 text-accent" /> Address #{a.address_id}
                                    </div>
                                    <div className="mt-1.5 text-sm">{a.street}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {a.city}, {a.state} — {a.postal_code || a.postalCode}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 mono">{a.country}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        At a glance
                    </div>
                    <div className="mt-4 space-y-4">
                        <Stat icon={Wallet} label="Wallet balance" value={fmtINR(dash.balance)} accent="primary" />
                        <Stat icon={Coins} label="Total gold owned" value={fmtGrams(dash.total_holdings_grams)} accent="accent" />
                        <Stat icon={TrendingUp} label="Portfolio value" value={fmtINR(dash.total_holdings_value)} accent="primary" />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, accent }) {
    const ring = accent === "accent"
        ? "ring-accent/30 bg-accent/10 text-accent"
        : "ring-primary/30 bg-primary/10 text-primary";
    return (
        <div className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
            <div className={`h-10 w-10 grid place-items-center rounded-lg ring-1 ${ring}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mono text-lg font-bold">{value}</div>
            </div>
        </div>
    );
}
