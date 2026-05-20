import React, { useState } from "react";
import { Modal, Field, Input, Button } from "@/components/ui-kit";
import { toast } from "sonner";
import { api, fmtINR, toastApiError } from "@/lib/api";
import {
    Banknote,
    CreditCard,
    Smartphone,
    QrCode,
    Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const METHODS = [
    { id: "UPI", label: "UPI", icon: QrCode },
    { id: "Credit Card", label: "Credit Card", icon: CreditCard },
    { id: "Debit Card", label: "Debit Card", icon: CreditCard },
    { id: "Google Pay", label: "Google Pay", icon: Smartphone },
    { id: "PhonePe", label: "PhonePe", icon: Smartphone },
    { id: "Paytm", label: "Paytm", icon: Smartphone },
    { id: "Bank Transfer", label: "Bank Transfer", icon: Banknote },
    { id: "Amazon Pay", label: "Amazon Pay", icon: Wallet },
];

const QUICK = [1000, 5000, 10000, 25000, 50000, 100000];

export default function TopupDialog({ open, onOpenChange, userId, onDone }) {
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("UPI");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (busy) return;
        const amt = parseFloat(amount);
        if (!amt || amt < 1) return toast.error("Enter a valid amount");
        try {
            setBusy(true);
            await api.post("/wallet/topup", {
                user_id: userId,
                amount: amt,
                payment_method: method,
            });
            toast.success(`${fmtINR(amt)} credited to wallet`);
            setAmount("");
            onOpenChange(false);
            onDone?.();
        } catch (err) {
            toastApiError(err, "Topup failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title="Top up wallet"
            subtitle="Funds settle instantly · T+0"
            testId="topup-dialog"
            size="lg"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        data-testid="topup-cancel"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submit}
                        disabled={busy}
                        data-testid="topup-submit-button"
                    >
                        {busy
                            ? "Processing…"
                            : `Add ${amount ? fmtINR(parseFloat(amount) || 0) : "Funds"}`}
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                <Field label="Amount (INR)">
                    <Input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="mono text-lg"
                        data-testid="topup-amount-input"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        {QUICK.map((q) => (
                            <button
                                key={q}
                                type="button"
                                onClick={() => setAmount(String(q))}
                                className="rounded-md border border-border bg-background/40 px-2.5 py-1 text-xs mono hover:border-primary hover:text-primary"
                                data-testid={`topup-quick-${q}`}
                            >
                                {fmtINR(q)}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Payment method">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {METHODS.map((m) => {
                            const Icon = m.icon;
                            const active = method === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMethod(m.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition",
                                        active
                                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                                    )}
                                    data-testid={`topup-method-${m.id.toLowerCase().replace(/\s/g, "-")}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                </Field>
            </div>
        </Modal>
    );
}
