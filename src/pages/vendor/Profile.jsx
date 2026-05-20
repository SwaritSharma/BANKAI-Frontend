import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR2, fmtGrams, toastApiError, getFieldErrors } from "@/lib/api";
import { Card, PageHeader, Badge, Button, Field, Input } from "@/components/ui-kit";
import { Mail, Phone, Globe, Store, User, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const normalizePhoneInput = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);
const isTenDigitPhone = (value) => value.length === 10 && value.split("").every((char) => char >= "0" && char <= "9");

export default function VendorProfile() {
    const { user, refreshAuth } = useAuth();
    const [dash, setDash] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoadError("");
            const { data } = await api.get(`/vendors/${user.vendor_id}/dashboard`);
        setDash(data);
        setFormData({
            contactPersonName: data.contact_person_name,
            contactEmail: data.contact_email,
            contactPhone: normalizePhoneInput(data.contact_phone),
            description: data.description,
            websiteUrl: data.website_url || data.websiteUrl || "",
        });
        } catch (err) {
            setLoadError(toastApiError(err, "Failed to load vendor profile").message);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    if (!dash) return <div className="text-sm text-muted-foreground">{loadError || "Loading..."}</div>;

    const handleSave = async () => {
        if (saving) return;
        try {
            setSaving(true);
            setFieldErrors({});
            const normalizedPhone = normalizePhoneInput(formData.contactPhone);
            if (!isTenDigitPhone(normalizedPhone)) {
                const message = "Contact phone must be exactly 10 digits";
                setFieldErrors({ contactPhone: message });
                toast.error(message);
                return;
            }
            const payload = { ...formData, contactPhone: normalizedPhone };
            const response = await api.put("/vendors/" + user.vendor_id + "/profile", payload);
            
            const newToken = response?.headers?.["x-new-token"] || response?.headers?.["X-New-Token"];
            if (newToken && refreshAuth) {
                refreshAuth(newToken, formData.contactEmail);
            }

            toast.success("Profile updated successfully");
            setIsEditing(false);
            load();
        } catch (err) {
            setFieldErrors(getFieldErrors(err));
            toastApiError(err, "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div data-testid="vendor-profile-page">
            <PageHeader eyebrow="Account" title="Vendor Profile" />

            <Card className="mb-6 relative overflow-hidden">
                <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex items-center gap-5">
                    <div className="relative w-16 h-16 grid place-items-center rounded-xl bg-accent/15 ring-1 ring-accent/40">
                        <Store className="w-8 h-8 text-accent" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse-ring" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Badge tone="success" className="px-2 py-1 gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified Partner
                            </Badge>
                        </div>
                        <div className="text-3xl font-bold tracking-tight mt-1">
                            {dash.vendor_name}
                        </div>
                        {isEditing ? (
                            <div className="mt-2">
                                <Field label="Description" error={fieldErrors.description}>
                                    <Input
                                        value={formData.description || ""}
                                        error={fieldErrors.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Vendor description..."
                                    />
                                </Field>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                                {dash.description || "No description provided"}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            Contact Info
                        </div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        )}
                    </div>
                    {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Contact Person" error={fieldErrors.contactPersonName}>
                                <Input
                                    value={formData.contactPersonName || ""}
                                    error={fieldErrors.contactPersonName}
                                    onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                                />
                            </Field>
                            <Field label="Email" error={fieldErrors.contactEmail}>
                                <Input
                                    type="email"
                                    value={formData.contactEmail || ""}
                                    error={fieldErrors.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </Field>
                            <Field label="Phone" error={fieldErrors.contactPhone}>
                                <Input
                                    type="tel"
                                    value={formData.contactPhone || ""}
                                    error={fieldErrors.contactPhone}
                                    inputMode="numeric"
                                    pattern="\d{10}"
                                    maxLength={10}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: normalizePhoneInput(e.target.value) })}
                                />
                            </Field>
                            <Field label="Website URL" error={fieldErrors.websiteUrl}>
                                <Input
                                    type="url"
                                    value={formData.websiteUrl || ""}
                                    error={fieldErrors.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                />
                            </Field>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoRow icon={User} label="Contact person" value={dash.contact_person_name} />
                            <InfoRow icon={Mail} label="Email" value={dash.contact_email} />
                            <InfoRow icon={Phone} label="Phone" value={dash.contact_phone} />
                            <InfoRow icon={Globe} label="Website" value={dash.website_url || dash.websiteUrl || "-"} link />
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Quick stats
                    </div>
                    <div className="mt-4 space-y-3">
                        <Stat label="Branches" value={dash.total_branches} />
                        <Stat label="Current rate" value={`${fmtINR2(dash.current_gold_price)}/g`} accent="gold" />
                        <Stat label="Inventory" value={fmtGrams(dash.total_gold_quantity)} accent="gold" />
                        <Stat label="Sold to date" value={fmtGrams(dash.total_sold_quantity)} />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, link }) {
    return (
        <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Icon className="w-3 h-3 text-accent" /> {label}
            </div>
            <div className="mt-1 text-sm">
                {link ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline break-all"
                    >
                        {value}
                    </a>
                ) : (
                    <span className="break-words">{value}</span>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value, accent }) {
    return (
        <div className="flex items-baseline justify-between border-b border-border pb-3 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`mono text-xl font-bold ${accent === "gold" ? "neon-gold" : ""}`}>
                {value}
            </span>
        </div>
    );
}
