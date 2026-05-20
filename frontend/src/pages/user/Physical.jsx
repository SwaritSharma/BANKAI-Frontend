import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtINR2, fmtGrams, fmtDateTime, toastApiError } from "@/lib/api";
import { Card, PageHeader, Button, Field, Input, Select, Badge } from "@/components/ui-kit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Truck, ShieldCheck, MapPin, Boxes, Package } from "lucide-react";

export default function Physical() {
    const { user } = useAuth();
    const [tab, setTab] = useState("buy");
    const [vendors, setVendors] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const [v, h, a, d, dash] = await Promise.all([
                api.get("/vendors"),
                api.get(`/users/${user.user_id}/holdings`),
                api.get(`/users/${user.user_id}/addresses`),
                api.get(`/users/${user.user_id}/physical-gold`),
                api.get(`/users/${user.user_id}/dashboard`),
            ]);
            setVendors(v.data || []);
            setHoldings(h.data || []);
            setAddresses(a.data || []);
            setDeliveries(d.data || []);
            setBalance(dash.data?.balance || 0);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load physical gold page data");
            setLoadError(parsed.message || "Failed to load physical gold page data");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6" data-testid="physical-page">
                <div className="text-destructive font-medium mb-3">{loadError}</div>
                <Button onClick={load} variant="outline" size="sm">
                    Retry Loading
                </Button>
            </div>
        );
    }

    if (loading && !vendors.length && !holdings.length && !deliveries.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-2 text-sm text-muted-foreground" data-testid="physical-page">
                <div className="inline-block w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />{" "}
                Loading physical gold desk…
            </div>
        );
    }

    return (
        <div data-testid="physical-page">
            <PageHeader
                eyebrow="Vault Operations"
                title="Physical Gold"
                subtitle="999.9 Purity coins · Insured doorstep delivery"
            />

            <div className="inline-flex p-1 rounded-lg border border-border bg-background/40 mb-6">
                <TabBtn
                    active={tab === "buy"}
                    onClick={() => setTab("buy")}
                    label="Buy Physical"
                    testId="physical-buy-tab"
                />
                <TabBtn
                    active={tab === "convert"}
                    onClick={() => setTab("convert")}
                    label="Convert Virtual → Physical"
                    testId="physical-convert-tab"
                />
                <TabBtn
                    active={tab === "deliveries"}
                    onClick={() => setTab("deliveries")}
                    label={`Deliveries (${deliveries.length})`}
                    testId="physical-deliveries-tab"
                />
            </div>

            {tab === "buy" && (
                <BuyPhysical
                    vendors={vendors}
                    addresses={addresses}
                    userId={user.user_id}
                    balance={balance}
                    onDone={load}
                />
            )}
            {tab === "convert" && (
                <ConvertPhysical
                    holdings={holdings}
                    addresses={addresses}
                    userId={user.user_id}
                    onDone={load}
                />
            )}
            {tab === "deliveries" && (
                <DeliveryList deliveries={deliveries} />
            )}
        </div>
    );
}

function TabBtn({ active, onClick, label, testId }) {
    return (
        <button
            onClick={onClick}
            data-testid={testId}
            className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition",
                active
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            {label}
        </button>
    );
}

function BuyPhysical({ vendors, addresses, userId, balance, onDone }) {
    const [vendorId, setVendorId] = useState("");
    const [qty, setQty] = useState("");
    const [addressId, setAddressId] = useState("");
    const [busy, setBusy] = useState(false);

    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 4;

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

    const vendor = vendors.find((v) => String(v.vendor_id) === vendorId);
    const total = vendor && qty ? vendor.current_gold_price * parseFloat(qty) : 0;
    const isInsufficient = total > balance;

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!vendorId || !addressId || !qty)
            return toast.error("Fill all fields");
        if (isInsufficient)
            return toast.error("Insufficient wallet balance");
        try {
            setBusy(true);
            await api.post("/physical-gold/buy", {
                user_id: userId,
                vendor_id: parseInt(vendorId),
                delivery_address_id: parseInt(addressId),
                quantity: parseFloat(qty),
            });
            toast.success("Physical gold order placed!");
            setQty("");
            onDone();
        } catch (err) {
            toastApiError(err, "Order failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-testid="buy-physical-form">
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
                        Choose vendor
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {paginatedVendors.map((v) => {
                            const active = String(v.vendor_id) === vendorId;
                            return (
                                <button
                                    key={v.vendor_id}
                                    type="button"
                                    onClick={() => setVendorId(String(v.vendor_id))}
                                    className={cn(
                                        "text-left p-4 rounded-xl border text-sm transition-all",
                                        active
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "border-border bg-card hover:border-primary/50",
                                    )}
                                    data-testid={`vendor-card-${v.vendor_id}`}
                                >
                                    <div className="font-semibold text-base mb-1">
                                        {v.vendor_name}
                                    </div>
                                    <div className="text-muted-foreground line-clamp-2 mb-3">
                                        {v.description || "Trusted refiner"}
                                    </div>
                                    <div className="flex items-end justify-between mt-auto">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                                Live Rate
                                            </div>
                                            <div className="mono font-bold text-lg neon-gold">
                                                {fmtINR2(v.current_gold_price)}
                                                <span className="text-xs text-muted-foreground">
                                                    /g
                                                </span>
                                            </div>
                                        </div>
                                    </div>
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
                <Field label="Quantity (grams)" hint="Free insured delivery on orders ≥ 10g">
                    <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="mono text-lg"
                        data-testid="buy-physical-qty"
                    />
                    <div className="mt-2 flex gap-2 flex-wrap">
                        {[1, 5, 10, 20, 50].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setQty(String(g))}
                                className="mono rounded-md border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary"
                            >
                                {g}g
                            </button>
                        ))}
                    </div>
                </Field>
                <Field label="Delivery address">
                    <Select
                        value={addressId}
                        onChange={(e) => setAddressId(e.target.value)}
                        data-testid="buy-physical-address"
                    >
                        <option value="">Select address…</option>
                        {addresses.map((a) => (
                            <option key={a.address_id} value={a.address_id}>
                                {`${a.street}, ${a.city}`}
                            </option>
                        ))}
                    </Select>
                </Field>
            </Card>

            <Card className="self-start lg:sticky lg:top-6" data-testid="buy-physical-summary">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Order Summary
                </div>
                <div className="mt-4 space-y-3 text-sm">
                    <Row label="Vendor" value={vendor?.vendor_name || "—"} />
                    <Row label="Quantity" value={qty ? fmtGrams(qty) : "—"} mono />
                    <Row
                        label="Rate"
                        value={vendor ? `${fmtINR2(vendor.current_gold_price)}/g` : "—"}
                        mono
                    />
                    <div className="border-t border-border pt-3 flex items-baseline justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="mono text-2xl font-bold neon-gold">
                            {fmtINR(total)}
                        </span>
                    </div>
                </div>
                <div className="mt-5 grid gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-accent" /> Free insured delivery
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent" /> 999.9 purity certificate
                    </div>
                </div>
                <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    disabled={busy || !vendor || !qty || !addressId || isInsufficient}
                    className={cn(
                        "w-full mt-5",
                        isInsufficient && "opacity-50 cursor-not-allowed"
                    )}
                    data-testid="buy-physical-submit"
                >
                    {busy ? "Processing…" : "Place Order"}
                </Button>
                {isInsufficient && (
                    <div className="text-destructive text-xs text-center mt-2 font-medium">
                        Insufficient Wallet Balance (Available: {fmtINR(balance)})
                    </div>
                )}
            </Card>
        </form>
    );
}

function ConvertPhysical({ holdings, addresses, userId, onDone }) {
    const [holdingId, setHoldingId] = useState("");
    const [qty, setQty] = useState("");
    const [addressId, setAddressId] = useState("");
    const [busy, setBusy] = useState(false);

    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 4;

    const filteredHoldings = useMemo(() => {
        let res = [...holdings];
        if (q) {
            const term = q.toLowerCase();
            res = res.filter(
                (h) =>
                    (h.vendor_name || "").toLowerCase().includes(term) ||
                    (h.branch_address?.city || "").toLowerCase().includes(term)
            );
        }
        
        if (sortOrder === "qty-high") {
            res.sort((a, b) => b.quantity - a.quantity);
        } else if (sortOrder === "qty-low") {
            res.sort((a, b) => a.quantity - b.quantity);
        } else {
            res.sort((a, b) => b.holding_id - a.holding_id);
        }
        return res;
    }, [holdings, q, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [q, sortOrder]);

    const paginatedHoldings = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredHoldings.slice(start, start + PAGE_SIZE);
    }, [filteredHoldings, page]);

    const totalPages = Math.ceil(filteredHoldings.length / PAGE_SIZE);

    const holding = holdings.find((h) => String(h.holding_id) === holdingId);
    const tooMuch = holding && qty && parseFloat(qty) > holding.quantity;

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!holdingId || !addressId || !qty)
            return toast.error("Fill all fields");
        if (tooMuch) return toast.error("Quantity exceeds holding");
        try {
            setBusy(true);
            await api.post("/physical-gold/convert", {
                user_id: userId,
                holding_id: parseInt(holdingId),
                delivery_address_id: parseInt(addressId),
                quantity: parseFloat(qty),
            });
            toast.success("Conversion successful! Delivery scheduled.");
            setQty("");
            onDone();
        } catch (err) {
            toastApiError(err, "Convert failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-testid="convert-physical-form">
            <Card className="lg:col-span-2 space-y-5">
                <div>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search vendor or city…"
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
                            <option value="qty-high">Quantity: High to Low</option>
                            <option value="qty-low">Quantity: Low to High</option>
                        </select>
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Choose holding to convert
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {paginatedHoldings.map((h) => {
                            const active = String(h.holding_id) === holdingId;
                            return (
                                <button
                                    key={h.holding_id}
                                    type="button"
                                    onClick={() => setHoldingId(String(h.holding_id))}
                                    className={cn(
                                        "text-left p-4 rounded-xl border text-sm transition-all",
                                        active
                                            ? "border-accent bg-accent/5 ring-1 ring-accent"
                                            : "border-border bg-card hover:border-accent/50",
                                    )}
                                    data-testid={`holding-card-${h.holding_id}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                Holding #{h.holding_id}
                                            </div>
                                            <div className="font-semibold">{h.vendor_name}</div>
                                        </div>
                                        <Badge tone="accent">24K</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                                Available
                                            </div>
                                            <div className="mono font-semibold neon-gold">
                                                {fmtGrams(h.quantity)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                                Value
                                            </div>
                                            <div className="mono font-semibold">
                                                {fmtINR(h.value)}
                                            </div>
                                        </div>
                                    </div>
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
                <Field label="Quantity (grams)">
                    <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        disabled={!holding}
                        className="mono text-lg"
                        data-testid="convert-qty-input"
                    />
                    {tooMuch && (
                        <div className="text-xs text-destructive mt-1">
                            Max convertible: {fmtGrams(holding.quantity)}
                        </div>
                    )}
                </Field>
                <Field label="Delivery address">
                    <Select
                        value={addressId}
                        onChange={(e) => setAddressId(e.target.value)}
                        data-testid="convert-address-select"
                    >
                        <option value="">Select address…</option>
                        {addresses.map((a) => (
                            <option key={a.address_id} value={a.address_id}>
                                {`${a.street}, ${a.city}`}
                            </option>
                        ))}
                    </Select>
                </Field>
            </Card>

            <Card className="self-start lg:sticky lg:top-6" data-testid="convert-summary">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Conversion Summary
                </div>
                <div className="mt-4 space-y-3 text-sm">
                    <Row
                        label="From holding"
                        value={holding ? `#${holding.holding_id}` : "—"}
                    />
                    <Row
                        label="Quantity"
                        value={qty ? fmtGrams(qty) : "—"}
                        mono
                    />
                    <Row
                        label="Remaining"
                        value={
                            holding && qty
                                ? fmtGrams(
                                      Math.max(
                                          holding.quantity - parseFloat(qty || 0),
                                          0,
                                      ),
                                  )
                                : "—"
                        }
                        mono
                    />
                </div>
                <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    disabled={busy || !holding || !qty || tooMuch || !addressId}
                    className="w-full mt-5"
                    data-testid="convert-submit-button"
                >
                    {busy ? "Processing…" : "Convert & Ship"}
                </Button>
            </Card>
        </form>
    );
}

function DeliveryList({ deliveries }) {
    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    const filteredDeliveries = useMemo(() => {
        let res = [...deliveries];
        if (q) {
            const term = q.toLowerCase();
            res = res.filter(
                (d) =>
                    (d.vendor_name || "").toLowerCase().includes(term) ||
                    (d.delivery_address?.city || "").toLowerCase().includes(term) ||
                    String(d.transaction_id).includes(term)
            );
        }
        
        if (sortOrder === "qty-high") {
            res.sort((a, b) => b.quantity - a.quantity);
        } else if (sortOrder === "qty-low") {
            res.sort((a, b) => a.quantity - b.quantity);
        } else {
            res.sort((a, b) => b.transaction_id - a.transaction_id);
        }
        return res;
    }, [deliveries, q, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [q, sortOrder]);

    const paginatedDeliveries = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredDeliveries.slice(start, start + PAGE_SIZE);
    }, [filteredDeliveries, page]);

    const totalPages = Math.ceil(filteredDeliveries.length / PAGE_SIZE);

    if (deliveries.length === 0) {
        return (
            <Card className="text-center py-10" data-testid="no-deliveries">
                <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <div className="text-sm text-muted-foreground">
                    No physical gold orders yet.
                </div>
            </Card>
        );
    }
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Input
                        placeholder="Search by vendor, city, or ID…"
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
                    <option value="qty-high">Quantity: High to Low</option>
                    <option value="qty-low">Quantity: Low to High</option>
                </select>
            </div>
            <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger"
                data-testid="deliveries-grid"
            >
            {paginatedDeliveries.map((d) => (
                <Card key={d.transaction_id}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                Order #{d.transaction_id}
                            </div>
                            <div className="mono text-xl font-bold neon-gold mt-1">
                                {fmtGrams(d.quantity)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {d.vendor_name}
                            </div>
                        </div>
                        <Badge tone="success">In Transit</Badge>
                    </div>
                    <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground flex gap-2">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
                        <span>
                            {d.delivery_address?.street},{" "}
                            {d.delivery_address?.city},{" "}
                            {d.delivery_address?.state} —{" "}
                            {d.delivery_address?.postal_code}
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground mono">
                        Placed {fmtDateTime(d.created_at)}
                    </div>
                </Card>
            ))}
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                        Showing page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1.5 rounded-md text-sm border border-border bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 rounded-md text-sm border border-border bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
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
