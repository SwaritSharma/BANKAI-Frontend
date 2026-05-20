import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtGrams, fmtINR, toastApiError } from "@/lib/api";
import { Card, StatCard, PageHeader, Button, Modal, EmptyState, Input } from "@/components/ui-kit";
import AddBranchDialog from "@/components/vendor/AddBranchDialog";
import AddGoldDialog from "@/components/vendor/AddGoldDialog";
import { toast } from "sonner";
import { Building2, Plus, MapPin, Coins, Trash2, Store, AlertTriangle } from "lucide-react";

const PAGE_SIZE = 10;

export default function VendorBranches() {
    const { user } = useAuth();
    const [branches, setBranches] = useState([]);
    const [addOpen, setAddOpen] = useState(false);
    const [addGoldOpen, setAddGoldOpen] = useState(false);
    const [rate, setRate] = useState(0);
    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [page, setPage] = useState(1);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const [b, d] = await Promise.all([
                api.get(`/vendors/${user.vendor_id}/branches`),
                api.get(`/vendors/${user.vendor_id}/dashboard`),
            ]);
            setBranches(b.data || []);
            setRate(d.data?.current_gold_price || 0);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load branches data");
            setLoadError(parsed.message || "Failed to load branches data");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const filteredBranches = useMemo(() => {
        let res = [...branches];
        if (q) {
            const term = q.toLowerCase();
            res = res.filter(
                (b) =>
                    (b.address?.city || "").toLowerCase().includes(term) ||
                    (b.address?.state || "").toLowerCase().includes(term) ||
                    (b.address?.street || "").toLowerCase().includes(term) ||
                    String(b.branch_id).includes(term)
            );
        }

        if (sortOrder === "inv-high") {
            res.sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0));
        } else if (sortOrder === "inv-low") {
            res.sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
        } else {
            res.sort((a, b) => Number(b.branch_id || 0) - Number(a.branch_id || 0));
        }
        return res;
    }, [branches, q, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [q, sortOrder]);

    const paginatedBranches = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredBranches.slice(start, start + PAGE_SIZE);
    }, [filteredBranches, page]);

    const totalPages = Math.ceil(filteredBranches.length / PAGE_SIZE);
    const totalInventory = branches.reduce((sum, branch) => sum + Number(branch.quantity || 0), 0);
    const totalValue = totalInventory * Number(rate || 0);
    const canConfirmDelete = pendingDelete && deleteConfirm.trim() === String(pendingDelete.branch_id);

    const requestDelete = (branch) => {
        setPendingDelete(branch);
        setDeleteConfirm("");
    };

    const closeDelete = () => {
        if (deleteBusy) return;
        setPendingDelete(null);
        setDeleteConfirm("");
    };

    const deleteBranch = async () => {
        if (deleteBusy) return;
        if (!pendingDelete || !canConfirmDelete) return;
        try {
            setDeleteBusy(true);
            await api.delete(`/vendors/${user.vendor_id}/branches/${pendingDelete.branch_id}`);
            setBranches((current) => current.filter((branch) => branch.branch_id !== pendingDelete.branch_id));
            toast.success("Branch #" + pendingDelete.branch_id + " permanently deleted");
            setPendingDelete(null);
            setDeleteConfirm("");
        } catch (err) {
            toastApiError(err, "Delete branch failed");
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <div data-testid="vendor-branches-page">
            <PageHeader
                eyebrow="Network"
                title="Branch Locations"
                subtitle="Manage vault inventory across cities"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => setAddGoldOpen(true)}
                            data-testid="add-gold-btn"
                        >
                            <Coins className="w-4 h-4" /> Add Gold
                        </Button>
                        <Button
                            variant="accent"
                            size="lg"
                            onClick={() => setAddOpen(true)}
                            data-testid="add-branch-btn"
                        >
                            <Plus className="w-4 h-4" /> Add Branch
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger">
                <StatCard
                    label="Total Branches"
                    value={String(branches.length)}
                    icon={Building2}
                    accent="primary"
                    hint="Active vault locations"
                    testId="branches-stat-count"
                />
                <StatCard
                    label="Combined Inventory"
                    value={fmtGrams(totalInventory)}
                    icon={Coins}
                    accent="accent"
                    hint="Across all branches"
                    testId="branches-stat-inventory"
                />
                <StatCard
                    label="Inventory Value"
                    value={fmtINR(totalValue)}
                    icon={Store}
                    accent="primary"
                    hint={`@ ${fmtINR(rate)}/g`}
                    testId="branches-stat-value"
                />
            </div>

            {branches.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Search by city, state, address, or ID..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full sm:max-w-xs"
                        data-testid="branches-search"
                    />
                    <select
                        className="flex h-10 w-full sm:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        data-testid="branches-sort"
                    >
                        <option value="newest">Newest First</option>
                        <option value="inv-high">Inventory: High to Low</option>
                        <option value="inv-low">Inventory: Low to High</option>
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
                <div className="text-sm text-muted-foreground py-10">Loading branches…</div>
            ) : branches.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No branches yet"
                    description="Add your first vault location to start fulfilling orders."
                    action={
                        <Button
                            variant="accent"
                            onClick={() => setAddOpen(true)}
                            data-testid="empty-add-branch-btn"
                        >
                            <Plus className="w-4 h-4" /> Add your first branch
                        </Button>
                    }
                />
            ) : (
                <Card className="p-0 overflow-hidden" data-testid="branches-table-wrap">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/30 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                            <tr>
                                <th className="text-left font-medium px-5 py-3">Branch</th>
                                <th className="text-left font-medium px-5 py-3">City</th>
                                <th className="text-left font-medium px-5 py-3">Address</th>
                                <th className="text-right font-medium px-5 py-3">Inventory</th>
                                <th className="text-right font-medium px-5 py-3">Value</th>
                                <th className="text-right font-medium px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody data-testid="branches-table-body">
                            {paginatedBranches.map((b) => {
                                const quantity = Number(b.quantity || 0);
                                const canDelete = quantity === 0;
                                return (
                                    <tr
                                        key={b.branch_id}
                                        className="border-t border-border hover:bg-secondary/30"
                                        data-testid={`branch-row-${b.branch_id}`}
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 grid place-items-center rounded-md bg-accent/10 text-accent ring-1 ring-accent/30">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="mono text-xs text-muted-foreground">
                                                        #{b.branch_id}
                                                    </div>
                                                    <div className="font-medium">Branch</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium">{b.address?.city || "-"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {b.address?.state || "-"}, {b.address?.country || "-"}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-muted-foreground text-xs max-w-[280px]">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                                                <span>
                                                    {b.address?.street || "-"} - {b.address?.postal_code || "-"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right mono font-semibold neon-gold">
                                            {fmtGrams(quantity)}
                                        </td>
                                        <td className="px-5 py-3 text-right mono">
                                            {fmtINR(quantity * Number(rate || 0))}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => requestDelete(b)}
                                                disabled={!canDelete}
                                                title={canDelete ? "Permanently delete empty branch" : "Move inventory out before deleting this branch"}
                                                className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                data-testid={`delete-branch-${b.branch_id}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Delete empty branch
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-secondary/40 border-t-2 border-border">
                            <tr>
                                <td colSpan={3} className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                                    Total
                                </td>
                                <td className="px-5 py-3 text-right mono font-bold neon-gold">
                                    {fmtGrams(totalInventory)}
                                </td>
                                <td className="px-5 py-3 text-right mono font-bold">
                                    {fmtINR(totalValue)}
                                </td>
                                <td className="px-5 py-3" />
                            </tr>
                        </tfoot>
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
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 rounded-md text-sm border border-border bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 rounded-md text-sm border border-border bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <AddBranchDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                vendorId={user.vendor_id}
                onDone={load}
            />

            <AddGoldDialog
                open={addGoldOpen}
                onOpenChange={setAddGoldOpen}
                vendorId={user.vendor_id}
                onDone={load}
            />

            <Modal
                open={Boolean(pendingDelete)}
                onClose={closeDelete}
                title={
                    <span className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" /> Permanently delete branch
                    </span>
                }
                subtitle="The backend exposes this as a hard delete. This action is limited to empty branches and cannot be undone."
                testId="delete-branch-dialog"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={closeDelete} disabled={deleteBusy}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteBranch}
                            disabled={!canConfirmDelete || deleteBusy}
                            data-testid="confirm-delete-branch"
                        >
                            {deleteBusy ? "Deleting..." : "Permanently delete"}
                        </Button>
                    </>
                }
            >
                {pendingDelete && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            Branch #{pendingDelete.branch_id} at {pendingDelete.address?.city || "unknown city"} will be removed from the backend database.
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Type branch ID <span className="mono text-foreground">{pendingDelete.branch_id}</span> to confirm.
                        </div>
                        <Input
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="Branch ID"
                            className="mono"
                            data-testid="delete-branch-confirm-input"
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
