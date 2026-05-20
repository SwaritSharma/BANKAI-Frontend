import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtGrams, fmtDateTime, toastApiError } from "@/lib/api";
import { Card, PageHeader, Input, Badge, EmptyState, Button } from "@/components/ui-kit";
import { Search, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorTransactions() {
    const { user } = useAuth();
    const [txns, setTxns] = useState([]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const PAGE_SIZE = 10;

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const { data } = await api.get(`/vendors/${user.vendor_id}/transactions`);
            setTxns(data || []);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load transactions history");
            setLoadError(parsed.message || "Failed to load transactions history");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const filteredTxns = useMemo(() => {
        const term = q.toLowerCase();
        if (!term) return txns;
        return txns.filter(
            (t) =>
                t.transaction_type?.toLowerCase().includes(term) ||
                t.transaction_status?.toLowerCase().includes(term) ||
                t.user_name?.toLowerCase().includes(term) ||
                t.user_address?.toLowerCase().includes(term) ||
                t.branch_name?.toLowerCase().includes(term) ||
                t.branch_address?.toLowerCase().includes(term)
        );
    }, [txns, q]);

    useEffect(() => {
        setPage(1);
    }, [q]);

    const paginatedTxns = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredTxns.slice(start, start + PAGE_SIZE);
    }, [filteredTxns, page]);

    const totalPages = Math.ceil(filteredTxns.length / PAGE_SIZE);

    return (
        <div data-testid="vendor-transactions-page">
            <PageHeader
                eyebrow="Ledger"
                title="Branch Transactions"
                subtitle="All transactions associated with your branches"
                actions={
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search user, branch, type, status…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-9 w-72"
                            data-testid="vendor-transactions-search"
                        />
                    </div>
                }
            />

            {loadError ? (
                <div className="flex flex-col items-center justify-center min-h-[250px] text-center p-6 border border-dashed border-border rounded-lg bg-card/10">
                    <div className="text-destructive font-medium mb-3">{loadError}</div>
                    <Button onClick={load} variant="outline" size="sm">
                        Retry Loading
                    </Button>
                </div>
            ) : loading ? (
                <div className="text-sm text-muted-foreground py-10">Loading transactions…</div>
            ) : filteredTxns.length === 0 ? (
                <EmptyState
                    icon={Receipt}
                    title="No transactions found"
                    description="When users buy or sell gold from your branches, they will appear here."
                />
            ) : (
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-sm" data-testid="vendor-transactions-table">
                        <thead className="bg-secondary/40 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                            <tr>
                                <th className="text-left font-medium px-5 py-3">User</th>
                                <th className="text-left font-medium px-5 py-3">Branch</th>
                                <th className="text-left font-medium px-5 py-3">Type</th>
                                <th className="text-right font-medium px-5 py-3">Qty</th>
                                <th className="text-right font-medium px-5 py-3">Amount</th>
                                <th className="text-center font-medium px-5 py-3">Status</th>
                                <th className="text-right font-medium px-5 py-3">When</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTxns.map((t) => (
                                <tr key={t.transaction_id} className="border-t border-border hover:bg-secondary/30">
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-sm">{t.user_name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{t.user_address}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-sm">{t.branch_name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{t.branch_address}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <Badge tone={typeTone(t.transaction_type)}>
                                            {t.transaction_type}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3 text-right mono">{fmtGrams(t.quantity)}</td>
                                    <td className="px-5 py-3 text-right mono">{fmtINR(t.amount)}</td>
                                    <td className="px-5 py-3 text-center">
                                        <Badge tone={t.transaction_status === "Success" ? "success" : "destructive"}>
                                            {t.transaction_status}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3 text-right text-xs text-muted-foreground mono">
                                        {fmtDateTime(t.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

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

function typeTone(t) {
    if (t === "Buy") return "success";
    if (t === "Sell") return "destructive";
    return "accent";
}
