import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { fmtGrams, fmtINR } from "@/lib/api";

const COLORS = [
    "hsl(var(--accent))",
    "hsl(var(--primary))",
    "#a78bfa",
    "#f472b6",
    "#34d399",
    "#fb923c",
];

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-md px-3 py-2 shadow-lg">
            <div className="text-xs font-medium">{p.name}</div>
            <div className="text-xs text-muted-foreground mono">
                {fmtGrams(p.quantity)} · {fmtINR(p.value)}
            </div>
        </div>
    );
}

export default function HoldingsDonut({ holdings, height = 240 }) {
    const data = holdings.map((h) => ({
        name: h.vendor_name,
        value: h.value,
        quantity: h.quantity,
    }));
    if (!data.length) {
        return (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No holdings yet
            </div>
        );
    }
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, i) => (
                            <Cell
                                key={i}
                                fill={COLORS[i % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Total Value
                </div>
                <div className="mono text-xl font-bold neon-gold">
                    {fmtINR(total)}
                </div>
            </div>
        </div>
    );
}

export { COLORS };
