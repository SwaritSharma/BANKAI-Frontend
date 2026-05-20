import React, { useState } from "react";
import { Modal, Field, Input, Button } from "@/components/ui-kit";
import { toast } from "sonner";
import { api, toastApiError } from "@/lib/api";
import { Building2, Plus } from "lucide-react";

const EMPTY = {
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    initial_quantity: "",
};

export default function AddBranchDialog({ open, onOpenChange, vendorId, onDone }) {
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!form.street || !form.city || !form.state || !form.postal_code) {
            toast.error("Please fill all address fields");
            return;
        }
        const qty = parseFloat(form.initial_quantity || "0");
        if (qty < 0 || Number.isNaN(qty)) {
            toast.error("Initial quantity must be ≥ 0");
            return;
        }
        try {
            setBusy(true);
            const { data } = await api.post(`/vendors/${vendorId}/branches`, {
                ...form,
                initial_quantity: qty,
            });
            toast.success(`Branch #${data.branch_id} added in ${data.address.city}`);
            setForm(EMPTY);
            onOpenChange(false);
            onDone?.();
        } catch (err) {
            toastApiError(err, "Add branch failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title={
                <span className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-accent" /> Add a new branch
                </span>
            }
            subtitle="Create a vault location with starting inventory"
            testId="add-branch-dialog"
            size="lg"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        data-testid="branch-cancel-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="accent"
                        onClick={submit}
                        disabled={busy}
                        data-testid="branch-submit-btn"
                    >
                        <Plus className="w-4 h-4" />
                        {busy ? "Saving…" : "Create branch"}
                    </Button>
                </>
            }
        >
            <form
                onSubmit={submit}
                className="space-y-4"
                data-testid="add-branch-form"
            >
                <Field label="Street address">
                    <Input
                        value={form.street}
                        onChange={(e) => set("street", e.target.value)}
                        placeholder="e.g. 14 Bandra Linking Road"
                        data-testid="branch-street-input"
                    />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="City">
                        <Input
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            placeholder="Mumbai"
                            data-testid="branch-city-input"
                        />
                    </Field>
                    <Field label="State">
                        <Input
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                            placeholder="MH"
                            data-testid="branch-state-input"
                        />
                    </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Postal code">
                        <Input
                            value={form.postal_code}
                            onChange={(e) => set("postal_code", e.target.value)}
                            placeholder="400050"
                            className="mono"
                            data-testid="branch-postal-input"
                        />
                    </Field>
                    <Field label="Country">
                        <Input
                            value={form.country}
                            onChange={(e) => set("country", e.target.value)}
                            data-testid="branch-country-input"
                        />
                    </Field>
                </div>
                <Field label="Initial gold inventory (grams)">
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.initial_quantity}
                        onChange={(e) => set("initial_quantity", e.target.value)}
                        placeholder="0.0"
                        className="mono text-lg"
                        data-testid="branch-quantity-input"
                    />
                </Field>
                {/* hidden submit for Enter key */}
                <button type="submit" className="hidden" />
            </form>
        </Modal>
    );
}
