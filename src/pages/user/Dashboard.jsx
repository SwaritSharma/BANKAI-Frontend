import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtINR2, fmtGrams, fmtDateTime, toastApiError } from "@/lib/api";
import { Card, StatCard, PageHeader, Button, Badge } from "@/components/ui-kit";
import GoldPriceChart from "@/components/charts/GoldPriceChart";
import HoldingsDonut, { COLORS } from "@/components/charts/HoldingsDonut";
import TopupDialog from "@/components/wallet/TopupDialog";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
    Wallet,
    Coins,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Plus,
    Activity,
} from "lucide-react";

const RANGES = [
    { v: 7, label: "1W" },
    { v: 30, label: "1M" },
    { v: 90, label: "3M" },
];

export default function UserDashboard() {
    const { user } = useAuth();
    const [dash, setDash] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [txns, setTxns] = useState([]);
    const [priceHist, setPriceHist] = useState([]);
    const [livePrice, setLivePrice] = useState(null);
    const [range, setRange] = useState(30);
    const [topupOpen, setTopupOpen] = useState(false);
    const [loadError, setLoadError] = useState("");

    const load = useCallback(async () => {
        if (!user?.user_id) return;
        try {
            setLoadError("");
            const [d, h, t, p, lp] = await Promise.all([
                api.get(`/users/${user.user_id}/dashboard`),
                api.get(`/users/${user.user_id}/holdings`),
                api.get(`/users/${user.user_id}/transactions`),
                api.get(`/gold/price-history?days=${range}`),
                api.get(`/gold/price`),
            ]);
            setDash(d.data);
            setHoldings(h.data || []);
            setTxns(t.data || []);
            setPriceHist(p.data || []);
            setLivePrice(lp.data || null);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load dashboard data");
            setLoadError(parsed.message || "Failed to load dashboard data");
        }
    }, [user, range]);

    useEffect(() => {
        load();
    }, [load]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
                <div className="text-destructive font-medium mb-3">{loadError}</div>
                <Button onClick={load} variant="outline" size="sm">
                    Retry Loading
                </Button>
            </div>
        );
    }

    if (!dash) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4 animate-spin text-primary" />{" "}
                Loading portfolio…
            </div>
        );
    }

    const positive = dash.pnl_amount >= 0;

    return (
        <div data-testid="user-dashboard">
            <PageHeader
                eyebrow="Command Center"
                title={`Welcome back, ${user.name.split(" ")[0]}`}
                subtitle="Real-time portfolio · Live spot · Auto-refreshing"
                testId="dashboard-header"
                actions={
                    <Button
                        variant="accent"
                        size="lg"
                        onClick={() => setTopupOpen(true)}
                        data-testid="header-topup-btn"
                    >
                        <Plus className="w-4 h-4" /> Top up Wallet
                    </Button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <StatCard
                    label="Wallet Balance"
                    value={fmtINR(dash.balance)}
                    icon={Wallet}
                    accent="primary"
                    hint="Available to invest"
                    testId="stat-wallet-balance"
                />
                <StatCard
                    label="Gold Holdings"
                    value={fmtGrams(dash.total_holdings_grams)}
                    icon={Coins}
                    accent="accent"
                    hint={`${holdings.length} vendor${holdings.length !== 1 ? "s" : ""}`}
                    testId="stat-holdings"
                />
                <StatCard
                    label="Portfolio Value"
                    value={fmtINR(dash.total_holdings_value)}
                    icon={ArrowUpRight}
                    accent="primary"
                    hint={`@ ${fmtINR2(dash.current_gold_price)}/g`}
                    testId="stat-portfolio-value"
                />
                <StatCard
                    label="Net P&L"
                    value={`${positive ? "+" : ""}${fmtINR(dash.pnl_amount)}`}
                    icon={positive ? TrendingUp : TrendingDown}
                    accent={positive ? "success" : "destructive"}
                    hint={`${positive ? "+" : ""}${dash.pnl_percent}% all-time`}
                    testId="stat-pnl"
                    valueClassName={
                        positive ? "text-emerald-400" : "text-destructive"
                    }
                />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card
                    className="lg:col-span-2"
                    data-testid="gold-price-chart-card"
                >
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                Gold Spot · 24K
                            </div>
                            <div className="flex items-baseline gap-3 mt-1">
                                <span className="mono text-3xl font-bold neon-gold">
                                    {fmtINR2(livePrice?.price || 0)}
                                </span>
                                <Badge
                                    tone={
                                        (livePrice?.change_24h || 0) >= 0
                                            ? "success"
                                            : "destructive"
                                    }
                                >
                                    {(livePrice?.change_24h || 0) >= 0 ? "▲" : "▼"}{" "}
                                    {Math.abs(livePrice?.change_pct || 0).toFixed(2)}%
                                </Badge>
                            </div>
                        </div>
                        <div className="inline-flex p-1 rounded-lg border border-border bg-background/40">
                            {RANGES.map((r) => (
                                <button
                                    key={r.v}
                                    onClick={() => setRange(r.v)}
                                    data-testid={`price-range-${r.label}`}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition",
                                        range === r.v
                                            ? "bg-primary/15 text-primary"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <GoldPriceChart data={priceHist} />
                </Card>

                <Card data-testid="holdings-donut-card">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                Allocation
                            </div>
                            <div className="text-lg font-semibold">
                                Holdings Breakdown
                            </div>
                        </div>
                        <Badge tone="primary">{holdings.length} vendors</Badge>
                    </div>
                    <HoldingsDonut holdings={holdings} />
                    <div className="mt-4 space-y-2">
                        {holdings.slice(0, 4).map((h, i) => (
                            <div
                                key={h.holding_id}
                                className="flex items-center justify-between text-xs"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="h-2 w-2 rounded-full shrink-0"
                                        style={{
                                            background:
                                                COLORS[i % COLORS.length],
                                        }}
                                    />
                                    <span className="font-medium truncate">
                                        {h.vendor_name}
                                    </span>
                                </div>
                                <span className="mono">
                                    {fmtGrams(h.quantity)}
                                </span>
                            </div>
                        ))}
                        {holdings.length === 0 && (
                            <div className="text-xs text-muted-foreground">
                                No holdings yet.
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <Card className="mt-6" data-testid="recent-activity-card">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            Live Feed
                        </div>
                        <div className="text-lg font-semibold">
                            Recent Activity
                        </div>
                    </div>
                    <Link to="/app/transactions" data-testid="view-all-transactions">
                        <Button variant="ghost" size="sm">
                            All transactions{" "}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                    </Link>
                </div>

                {txns.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        No transactions yet.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {txns.slice(0, 6).map((t) => {
                            const isBuy = t.transaction_type === "Buy";
                            const isSell = t.transaction_type === "Sell";
                            return (
                                <div
                                    key={t.transaction_id}
                                    className="py-3 flex items-center justify-between gap-4 -mx-2 px-2 rounded-md hover:bg-secondary/30 transition"
                                    data-testid={`txn-row-${t.transaction_id}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={cn(
                                                "w-9 h-9 grid place-items-center rounded-lg ring-1 shrink-0",
                                                isBuy &&
                                                    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
                                                isSell &&
                                                    "bg-destructive/10 text-destructive ring-destructive/30",
                                                !isBuy &&
                                                    !isSell &&
                                                    "bg-accent/10 text-accent ring-accent/30",
                                            )}
                                        >
                                            {isBuy ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : isSell ? (
                                                <TrendingDown className="w-4 h-4" />
                                            ) : (
                                                <Coins className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {t.transaction_type} ·{" "}
                                                <span className="text-muted-foreground">
                                                    {t.vendor_name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate mono">
                                                {fmtGrams(t.quantity)} · {fmtINR(t.amount)} ·{" "}
                                                {fmtDateTime(t.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        tone={
                                            t.transaction_status === "Success"
                                                ? "success"
                                                : "destructive"
                                        }
                                    >
                                        {t.transaction_status}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <TopupDialog
                open={topupOpen}
                onOpenChange={setTopupOpen}
                userId={user.user_id}
                onDone={load}
            />
        </div>
    );
}
