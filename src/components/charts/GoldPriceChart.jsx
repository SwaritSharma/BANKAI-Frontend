import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { fmtINR } from "@/lib/api";

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-md px-3 py-2 shadow-lg">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {label}
            </div>
            <div className="mono text-sm font-semibold neon-gold">
                {fmtINR(payload[0].value)}
                <span className="text-muted-foreground text-xs ml-1">/ g</span>
            </div>
        </div>
    );
}

export default function GoldPriceChart({ data, height = 280 }) {
    const fmtX = (d) =>
        new Date(d).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient
                        id="goldFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="hsl(var(--accent))"
                            stopOpacity={0.4}
                        />
                        <stop
                            offset="100%"
                            stopColor="hsl(var(--accent))"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickFormatter={fmtX}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={32}
                />
                <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 80", "dataMax + 80"]}
                    width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#goldFill)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
