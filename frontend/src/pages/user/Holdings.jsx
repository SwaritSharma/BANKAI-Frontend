import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtGrams, toastApiError } from "@/lib/api";
import { Card, PageHeader, Button, Badge, EmptyState, Input } from "@/components/ui-kit";
import { Link } from "react-router-dom";
import { Coins, MapPin, ArrowLeftRight, Boxes } from "lucide-react";

export default function Holdings() {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const { data } = await api.get(`/users/${user.user_id}/holdings`);
            setHoldings(data || []);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load holdings");
            setLoadError(parsed.message || "Failed to load holdings");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

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
        
        if (sortOrder === "value-high") {
            res.sort((a, b) => b.value - a.value);
        } else if (sortOrder === "value-low") {
            res.sort((a, b) => a.value - b.value);
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

    return (
        <div data-testid="holdings-page">
            <PageHeader
                eyebrow="Portfolio"
                title="Your Gold Holdings"
                subtitle="Vault-grade custody · 999.9 purity"
                actions={
                    <div className="flex gap-2">
                        <Link to="/app/trade">
                            <Button variant="primary" size="lg" data-testid="buy-more-gold-btn">
                                <Coins className="w-4 h-4" /> Buy More Gold
                            </Button>
                        </Link>
                    </div>
                }
            />

            {!loading && holdings.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search by vendor or city…"
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
                        <option value="value-high">Value: High to Low</option>
                        <option value="value-low">Value: Low to High</option>
                    </select>
                </div>
            )}

            {loadError ? (
                <div className="flex flex-col items-center justify-center min-h-[250px] text-center p-6 border border-dashed border-border rounded-lg bg-card/10">
                    <div className="text-destructive font-medium mb-3">{loadError}</div>
                    <Button onClick={load} variant="outline" size="sm">
                        Retry Loading
                    </Button>
                </div>
            ) : loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
            ) : holdings.length === 0 ? (
                <EmptyState
                    icon={Boxes}
                    title="No holdings yet"
                    description="Start your gold journey by buying virtual gold from any of our trusted vendors."
                    action={
                        <Link to="/app/trade">
                            <Button variant="primary">Buy your first gram</Button>
                        </Link>
                    }
                />
            ) : (
                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger"
                    data-testid="holdings-grid"
                >
                    {paginatedHoldings.map((h) => (
                        <Card
                            key={h.holding_id}
                            data-testid={`holding-card-${h.holding_id}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                        Holding #{h.holding_id}
                                    </div>
                                    <div className="text-lg font-semibold mt-1">
                                        {h.vendor_name}
                                    </div>
                                </div>
                                <Badge tone="accent">24K · Vault</Badge>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Quantity
                                    </div>
                                    <div className="mono text-2xl font-bold neon-gold mt-0.5">
                                        {fmtGrams(h.quantity)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Value @ {fmtINR(h.current_gold_price)}/g
                                    </div>
                                    <div className="mono text-2xl font-bold neon-cyan mt-0.5">
                                        {fmtINR(h.value)}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground border-t border-border pt-4">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
                                <span>
                                    {h.branch_address?.street},{" "}
                                    {h.branch_address?.city},{" "}
                                    {h.branch_address?.state} —{" "}
                                    {h.branch_address?.postal_code}
                                </span>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Link to="/app/trade" className="flex-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        data-testid={`sell-holding-${h.holding_id}`}
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5" />{" "}
                                        Sell
                                    </Button>
                                </Link>
                                <Link to="/app/physical" className="flex-1">
                                    <Button
                                        variant="accent"
                                        size="sm"
                                        className="w-full"
                                        data-testid={`convert-holding-${h.holding_id}`}
                                    >
                                        Convert
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {!loading && totalPages > 1 && (
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
