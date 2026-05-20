import React, { useState } from "react";
import { Modal, Field, Input, Button } from "@/components/ui-kit";
import { toast } from "sonner";
import { api, toastApiError } from "@/lib/api";
import { Coins, Plus } from "lucide-react";

export default function AddGoldDialog({ open, onOpenChange, vendorId, onDone }) {
    const [branchId, setBranchId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!branchId) {
            toast.error("Please enter a Branch ID");
            return;
        }
        const qty = parseFloat(quantity || "0");
        if (qty <= 0 || Number.isNaN(qty)) {
            toast.error("Quantity must be > 0");
            return;
        }
        try {
            setBusy(true);
            await api.post(`/vendors/${vendorId}/add-gold`, {
                branchId: parseInt(branchId),
                quantity: qty,
            });
            toast.success(`Successfully added ${qty}g to Branch #${branchId}`);
            setBranchId("");
            setQuantity("");
            onOpenChange(false);
            onDone?.();
        } catch (err) {
            toastApiError(err, "Failed to add gold");
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
                    <Coins className="w-5 h-5 text-accent" /> Add Gold to Branch
                </span>
            }
            subtitle="Increase the gold inventory of a specific branch"
            testId="add-gold-dialog"
            size="md"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        data-testid="gold-cancel-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="accent"
                        onClick={submit}
                        disabled={busy}
                        data-testid="gold-submit-btn"
                    >
                        <Plus className="w-4 h-4" />
                        {busy ? "Adding…" : "Add Gold"}
                    </Button>
                </>
            }
        >
            <form
                onSubmit={submit}
                className="space-y-4"
                data-testid="add-gold-form"
            >
                <Field label="Branch ID">
                    <Input
                        type="number"
                        min="1"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        placeholder="e.g. 1"
                        className="mono"
                        data-testid="gold-branch-id-input"
                    />
                </Field>
                <Field label="Gold Quantity (grams)">
                    <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.0"
                        className="mono text-lg"
                        data-testid="gold-quantity-input"
                    />
                </Field>
                <button type="submit" className="hidden" />
            </form>
        </Modal>
    );
}
