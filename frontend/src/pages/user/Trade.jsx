import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtINR2, fmtGrams, toastApiError } from "@/lib/api";
import { Card, PageHeader, Button, Field, Input, Badge } from "@/components/ui-kit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    TrendingUp,
    TrendingDown,
    Store,
    CheckCircle2,
} from "lucide-react";

export default function Trade() {
    const { user } = useAuth();
    const [tab, setTab] = useState("buy");
    const [vendors, setVendors] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const [v, h, d] = await Promise.all([
                api.get("/vendors"),
                api.get(`/users/${user.user_id}/holdings`),
                api.get(`/users/${user.user_id}/dashboard`),
            ]);
            setVendors(v.data || []);
            setHoldings(h.data || []);
            setBalance(d.data?.balance || 0);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load trade data");
            setLoadError(parsed.message || "Failed to load trade data");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6" data-testid="trade-page">
                <div className="text-destructive font-medium mb-3">{loadError}</div>
                <Button onClick={load} variant="outline" size="sm">
                    Retry Loading
                </Button>
            </div>
        );
    }

    if (loading && !vendors.length && !holdings.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-2 text-sm text-muted-foreground" data-testid="trade-page">
                <div className="inline-block w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />{" "}
                Loading trade desk…
            </div>
        );
    }

    return (
        <div data-testid="trade-page">
            <PageHeader
                eyebrow="Trade Desk"
                title="Buy / Sell Virtual Gold"
                subtitle="Settlement T+0 · Direct from refiners"
                actions={
                    <div className="text-right">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            Wallet
                        </div>
                        <div className="mono text-2xl font-bold neon-cyan">
                            {fmtINR(balance)}
                        </div>
                    </div>
                }
            />

            <div className="inline-flex p-1 rounded-lg border border-border bg-background/40 mb-6">
                <TabBtn
                    active={tab === "buy"}
                    onClick={() => setTab("buy")}
                    icon={TrendingDown}
                    label="Buy"
                    testId="buy-tab"
                />
                <TabBtn
                    active={tab === "sell"}
                    onClick={() => setTab("sell")}
                    icon={TrendingUp}
                    label="Sell"
                    testId="sell-tab"
                />
            </div>

            {tab === "buy" ? (
                <BuyForm
                    vendors={vendors}
                    balance={balance}
                    userId={user.user_id}
                    onDone={load}
                />
            ) : (
                <SellForm
                    holdings={holdings}
                    userId={user.user_id}
                    onDone={load}
                />
            )}
        </div>
    );
}

function TabBtn({ active, onClick, icon: Icon, label, testId }) {
    return (
        <button
            onClick={onClick}
            data-testid={testId}
            className={cn(
                "px-5 py-2 rounded-md text-sm font-medium transition inline-flex items-center gap-2",
                active
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            <Icon className="w-4 h-4" /> {label}
        </button>
    );
}

function BuyForm({ vendors, balance, userId, onDone }) {
    const [vendorId, setVendorId] = useState("");
    const [qty, setQty] = useState("");
    const [busy, setBusy] = useState(false);

    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    const filteredVendors = useMemo(() => {
        let res = [...vendors];
        if (q) {
            const term = q.toLowerCase();
            res = res.filter(
                (v) =>
                    (v.vendor_name || "").toLowerCase().includes(term) ||
                    ((v.description || "").toLowerCase().includes(term))
            );
        }
        
        if (sortOrder === "price-high") {
            res.sort((a, b) => b.current_gold_price - a.current_gold_price);
        } else if (sortOrder === "price-low") {
            res.sort((a, b) => a.current_gold_price - b.current_gold_price);
        } else {
            res.sort((a, b) => b.vendor_id - a.vendor_id);
        }
        return res;
    }, [vendors, q, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [q, sortOrder]);

    const paginatedVendors = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredVendors.slice(start, start + PAGE_SIZE);
    }, [filteredVendors, page]);

    const totalPages = Math.ceil(filteredVendors.length / PAGE_SIZE);

    const vendor = useMemo(
        () => vendors.find((v) => String(v.vendor_id) === vendorId),
        [vendors, vendorId],
    );
    const total = vendor && qty ? vendor.current_gold_price * parseFloat(qty) : 0;
    const insufficient = total > balance;

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        const q = parseFloat(qty);
        if (!vendorId) return toast.error("Select a vendor");
        if (!q || q <= 0) return toast.error("Enter a valid quantity");
        try {
            setBusy(true);
            await api.post("/virtual-gold/buy", {
                user_id: userId,
                vendor_id: parseInt(vendorId),
                quantity: q,
            });
            toast.success(`Purchased ${fmtGrams(q)} of gold`);
            setQty("");
            onDone();
        } catch (err) {
            toastApiError(err, "Buy failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            data-testid="buy-form"
        >
            <Card className="lg:col-span-2 space-y-5">
                <div>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search refiners…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="w-full sm:max-w-xs"
                            />
                        </div>
                        <select
                            className="flex h-10 w-full sm:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Step 1 · Choose vendor
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {paginatedVendors.map((v) => {
                            const active = String(v.vendor_id) === vendorId;
                            return (
                                <button
                                    type="button"
                                    key={v.vendor_id}
                                    onClick={() =>
                                        setVendorId(String(v.vendor_id))
                                    }
                                    className={cn(
                                        "text-left rounded-lg border p-4 transition",
                                        active
                                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                            : "border-border bg-background/40 hover:border-foreground",
                                    )}
                                    data-testid={`vendor-card-${v.vendor_id}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Store className="w-3.5 h-3.5 text-accent" />
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            Refiner
                                        </span>
                                    </div>
                                    <div className="text-base font-semibold leading-tight">
                                        {v.vendor_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {v.description}
                                    </div>
                                    <div className="mt-3 flex items-baseline justify-between border-t border-border pt-2">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            Rate
                                        </span>
                                        <span className="mono text-sm font-semibold neon-gold">
                                            {fmtINR2(v.current_gold_price)}
                                            <span className="text-muted-foreground text-xs ml-1">
                                                /g
                                            </span>
                                        </span>
                                    </div>
                                    {active && (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                            Selected
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-xs text-muted-foreground">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-2 py-1 rounded-md text-xs border border-border bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-2 py-1 rounded-md text-xs border border-border bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Step 2 · Quantity (grams)
                    </div>
                    <div className="flex items-center gap-2 max-w-md">
                        <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="0.0"
                            className="mono text-lg"
                            data-testid="buy-quantity-input"
                        />
                        <div className="flex gap-1">
                            {[0.5, 1, 5, 10].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setQty(String(g))}
                                    className="mono rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"
                                    data-testid={`buy-quick-${g}`}
                                >
                                    {g}g
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="self-start lg:sticky lg:top-6" data-testid="buy-summary">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Order Summary
                </div>
                <div className="mt-4 space-y-3 text-sm">
                    <Row label="Vendor" value={vendor?.vendor_name || "—"} />
                    <Row
                        label="Quantity"
                        value={qty ? fmtGrams(qty) : "—"}
                        mono
                    />
                    <Row
                        label="Rate"
                        value={
                            vendor
                                ? `${fmtINR2(vendor.current_gold_price)}/g`
                                : "—"
                        }
                        mono
                    />
                    <div className="border-t border-border pt-3 flex items-baseline justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="mono text-2xl font-bold neon-gold">
                            {fmtINR(total)}
                        </span>
                    </div>
                    <Row label="Wallet" value={fmtINR(balance)} mono />
                    {insufficient && total > 0 && (
                        <Badge tone="destructive" className="w-full justify-center mt-2">
                            Insufficient wallet balance
                        </Badge>
                    )}
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={busy || !vendor || !qty || insufficient}
                    className="w-full mt-5"
                    data-testid="buy-submit-button"
                >
                    {busy ? "Processing…" : "Confirm Purchase"}
                </Button>
            </Card>
        </form>
    );
}

function SellForm({ holdings, userId, onDone }) {
    const [holdingId, setHoldingId] = useState("");
    const [qty, setQty] = useState("");
    const [busy, setBusy] = useState(false);

    const holding = useMemo(
        () => holdings.find((h) => String(h.holding_id) === holdingId),
        [holdings, holdingId],
    );
    const total = holding && qty ? holding.current_gold_price * parseFloat(qty) : 0;
    const tooMuch = holding && qty && parseFloat(qty) > holding.quantity;

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        const q = parseFloat(qty);
        if (!holdingId) return toast.error("Select a holding");
        if (!q || q <= 0) return toast.error("Enter a valid quantity");
        try {
            setBusy(true);
            await api.post("/virtual-gold/sell", {
                user_id: userId,
                holding_id: parseInt(holdingId),
                quantity: q,
            });
            toast.success(
                `Sold ${fmtGrams(q)} · ${fmtINR(total)} credited`,
            );
            setQty("");
            if (holding && q >= Number(holding.quantity)) {
                setHoldingId("");
            }
            onDone();
        } catch (err) {
            toastApiError(err, "Sell failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            data-testid="sell-form"
        >
            <Card className="lg:col-span-2 space-y-5">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Step 1 · Choose holding
                    </div>
                    {holdings.length === 0 ? (
                        <div className="rounded-lg border border-border bg-background/40 px-4 py-6 text-center text-sm text-muted-foreground">
                            You have no holdings to sell.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {holdings.map((h) => {
                                const active =
                                    String(h.holding_id) === holdingId;
                                return (
                                    <button
                                        type="button"
                                        key={h.holding_id}
                                        onClick={() =>
                                            setHoldingId(String(h.holding_id))
                                        }
                                        className={cn(
                                            "text-left rounded-lg border p-4 transition",
                                            active
                                                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                                : "border-border bg-background/40 hover:border-foreground",
                                        )}
                                        data-testid={`sell-holding-card-${h.holding_id}`}
                                    >
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            #{h.holding_id} · {h.vendor_name}
                                        </div>
                                        <div className="mt-1 flex items-baseline justify-between">
                                            <span className="mono text-xl font-bold neon-gold">
                                                {fmtGrams(h.quantity)}
                                            </span>
                                            <span className="mono text-sm text-muted-foreground">
                                                {fmtINR(h.value)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {h.branch_address?.city},{" "}
                                            {h.branch_address?.state}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Step 2 · Quantity to sell
                    </div>
                    <div className="flex items-center gap-2 max-w-md">
                        <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            disabled={!holding}
                            placeholder="0.0"
                            className="mono text-lg"
                            data-testid="sell-quantity-input"
                        />
                        {holding && (
                            <button
                                type="button"
                                onClick={() =>
                                    setQty(String(holding.quantity))
                                }
                                className="mono rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                                data-testid="sell-max-btn"
                            >
                                MAX
                            </button>
                        )}
                    </div>
                    {tooMuch && (
                        <div className="text-xs text-destructive mt-2">
                            Cannot exceed {fmtGrams(holding.quantity)}
                        </div>
                    )}
                </div>
            </Card>

            <Card className="self-start lg:sticky lg:top-6" data-testid="sell-summary">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Sell Summary
                </div>
                <div className="mt-4 space-y-3 text-sm">
                    <Row
                        label="Holding"
                        value={holding ? `#${holding.holding_id}` : "—"}
                    />
                    <Row label="Vendor" value={holding?.vendor_name || "—"} />
                    <Row
                        label="Quantity"
                        value={qty ? fmtGrams(qty) : "—"}
                        mono
                    />
                    <Row
                        label="Rate"
                        value={
                            holding
                                ? `${fmtINR2(holding.current_gold_price)}/g`
                                : "—"
                        }
                        mono
                    />
                    <div className="border-t border-border pt-3 flex items-baseline justify-between">
                        <span className="text-muted-foreground">
                            Wallet credit
                        </span>
                        <span className="mono text-2xl font-bold text-emerald-400">
                            {fmtINR(total)}
                        </span>
                    </div>
                </div>
                <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    disabled={busy || !holding || !qty || tooMuch}
                    className="w-full mt-5"
                    data-testid="sell-submit-button"
                >
                    {busy ? "Processing…" : "Confirm Sale"}
                </Button>
            </Card>
        </form>
    );
}

function Row({ label, value, mono }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={mono ? "mono" : ""}>{value}</span>
        </div>
    );
}
