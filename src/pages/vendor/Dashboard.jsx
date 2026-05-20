import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtINR, fmtINR2, fmtGrams, toastApiError } from "@/lib/api";
import { Card, StatCard, PageHeader, Button, Badge } from "@/components/ui-kit";
import GoldPriceChart from "@/components/charts/GoldPriceChart";
import AddBranchDialog from "@/components/vendor/AddBranchDialog";
import { Link } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    CartesianGrid,
    Tooltip,
} from "recharts";
import {
    Building2,
    Coins,
    TrendingUp,
    IndianRupee,
    Phone,
    Mail,
    Globe,
    Plus,
    ArrowUpRight,
    MapPin,
    User,
} from "lucide-react";

export default function VendorDashboard() {
    const { user } = useAuth();
    const [dash, setDash] = useState(null);
    const [branches, setBranches] = useState([]);
    const [priceHist, setPriceHist] = useState([]);
    const [addOpen, setAddOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const [d, b, p] = await Promise.all([
                api.get(`/vendors/${user.vendor_id}/dashboard`),
                api.get(`/vendors/${user.vendor_id}/branches`),
                api.get(`/gold/price-history?days=30`),
            ]);
            setDash(d.data);
            setBranches(b.data || []);
            setPriceHist(p.data || []);
        } catch (err) {
            const parsed = toastApiError(err, "Failed to load dashboard data");
            setLoadError(parsed.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6" data-testid="vendor-dashboard">
                <div className="text-destructive font-medium mb-3">{loadError}</div>
                <Button onClick={load} variant="outline" size="sm">
                    Retry Loading
                </Button>
            </div>
        );
    }

    if (loading && !dash) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-2 text-sm text-muted-foreground" data-testid="vendor-dashboard">
                <div className="inline-block w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />{" "}
                Loading dashboard…
            </div>
        );
    }

    const branchData = branches.map((b) => ({
        name: b.address?.city,
        quantity: b.quantity,
    }));

    return (
        <div data-testid="vendor-dashboard">
            <PageHeader
                eyebrow={`Vendor Console · ${user.name}`}
                title="Inventory & Performance"
                subtitle="Real-time vault metrics across all branches"
                actions={
                    <Button
                        variant="accent"
                        size="lg"
                        onClick={() => setAddOpen(true)}
                        data-testid="dashboard-add-branch-btn"
                    >
                        <Plus className="w-4 h-4" /> Add Branch
                    </Button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <StatCard
                    label="Total Inventory"
                    value={fmtGrams(dash.total_gold_quantity)}
                    hint="Available for sale"
                    icon={Coins}
                    accent="accent"
                    testId="vendor-stat-inventory"
                />
                <StatCard
                    label="Active Branches"
                    value={String(dash.total_branches)}
                    hint="Vault locations"
                    icon={Building2}
                    accent="primary"
                    testId="vendor-stat-branches"
                />
                <StatCard
                    label="Sold to date"
                    value={fmtGrams(dash.total_sold_quantity)}
                    hint="All-time success"
                    icon={TrendingUp}
                    accent="success"
                    testId="vendor-stat-sold"
                />
                <StatCard
                    label="Current Rate"
                    value={fmtINR2(dash.current_gold_price)}
                    hint="Per gram · 24K"
                    icon={IndianRupee}
                    accent="accent"
                    testId="vendor-stat-rate"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card
                    className="lg:col-span-2"
                    data-testid="vendor-price-chart-card"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                Market
                            </div>
                            <div className="text-lg font-semibold">
                                30-day Gold Spot Trend
                            </div>
                        </div>
                        <Badge tone="accent">24K · INR</Badge>
                    </div>
                    <GoldPriceChart data={priceHist} />
                </Card>

                <Card data-testid="vendor-contact-card">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Vendor Profile
                    </div>
                    <div className="text-lg font-semibold mt-1">
                        {dash.vendor_name}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {dash.description}
                    </p>
                    <div className="mt-4 space-y-2.5 text-sm">
                        <Row icon={User} value={dash.contact_person_name} />
                        <Row icon={Mail} value={dash.contact_email} />
                        <Row icon={Phone} value={dash.contact_phone} />
                        <Row icon={Globe} value={dash.website_url} link />
                    </div>
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-5 gap-4">
                <Card
                    className="xl:col-span-3 p-0"
                    data-testid="vendor-branches-summary"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                Network
                            </div>
                            <div className="text-lg font-semibold flex items-center gap-2">
                                Branches
                                <Badge tone="primary">{branches.length}</Badge>
                            </div>
                        </div>
                        <Link to="/vendor/branches" data-testid="manage-branches-link">
                            <Button variant="ghost" size="sm">
                                Manage all <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                    {branches.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                            No branches yet. Click <strong>Add Branch</strong> above.
                        </div>
                    ) : (
                        <table className="w-full text-sm" data-testid="dashboard-branches-table">
                            <thead className="bg-secondary/30 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                                <tr>
                                    <th className="text-left font-medium px-5 py-2.5">#</th>
                                    <th className="text-left font-medium px-5 py-2.5">City</th>
                                    <th className="text-left font-medium px-5 py-2.5">Address</th>
                                    <th className="text-right font-medium px-5 py-2.5">Inventory</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.slice(0, 6).map((b) => (
                                    <tr
                                        key={b.branch_id}
                                        className="border-t border-border hover:bg-secondary/30"
                                        data-testid={`dash-branch-row-${b.branch_id}`}
                                    >
                                        <td className="px-5 py-3 mono text-xs text-muted-foreground">
                                            #{b.branch_id}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium">{b.address?.city}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {b.address?.state}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-muted-foreground max-w-[280px]">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3 h-3 mt-0.5 text-accent shrink-0" />
                                                <span>
                                                    {b.address?.street} — {b.address?.postal_code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right mono font-semibold">
                                            {fmtGrams(b.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {branches.length > 6 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan={4} className="px-5 py-2.5 text-xs text-center text-muted-foreground border-t border-border">
                                            +{branches.length - 6} more · see{" "}
                                            <Link to="/vendor/branches" className="text-primary hover:underline">
                                                Branches
                                            </Link>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    )}
                </Card>

                <Card className="xl:col-span-2" data-testid="vendor-branch-chart">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Distribution
                    </div>
                    <div className="text-lg font-semibold mb-2">
                        Inventory by City
                    </div>
                    {branchData.length === 0 ? (
                        <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">
                            Add a branch to see chart
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={branchData}>
                                <CartesianGrid strokeDasharray="3 6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis
                                    tickFormatter={(v) => `${v}g`}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={42}
                                />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--accent) / 0.06)" }}
                                    contentStyle={{
                                        background: "hsl(var(--popover))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                    formatter={(v) => [fmtGrams(v), "Inventory"]}
                                />
                                <Bar dataKey="quantity" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            <AddBranchDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                vendorId={user.vendor_id}
                onDone={load}
            />
        </div>
    );
}

function Row({ icon: Icon, value, link }) {
    return (
        <div className="flex items-center gap-2.5">
            <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
            {link ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                >
                    {value}
                </a>
            ) : (
                <span className="truncate">{value}</span>
            )}
        </div>
    );
}
