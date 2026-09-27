"use client";

import { useReducedMotion } from "motion/react";
import { Bar, BarChart, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface TrendPoint {
  label: string; // "Oct 5"
  value: number;
}

/** One calm line: minimal axes, no grid, the latest value emphasised. Tap for values. */
export function LineTrend({ data, unit, name }: { data: TrendPoint[]; unit: string; name: string }) {
  const reduce = useReducedMotion();
  const config = { value: { label: name, color: "var(--accent)" } } satisfies ChartConfig;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(1, (max - min) * 0.2);
  const last = data.length - 1;

  return (
    <ChartContainer config={config} className="aspect-auto h-44 w-full">
      <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 12 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          ticks={data.length > 1 ? [data[0].label, data[last].label] : [data[0]?.label]}
          tickMargin={8}
        />
        <YAxis hide domain={[Math.max(0, min - pad), max + pad]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator formatter={(v) => `${v} ${unit}`} />} />
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          isAnimationActive={!reduce}
          animationDuration={500}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === last ? (
              <circle key="last" cx={props.cx} cy={props.cy} r={5} fill="var(--color-value)" stroke="var(--surface)" strokeWidth={2} />
            ) : (
              <circle key={props.index} cx={props.cx} cy={props.cy} r={2.5} fill="var(--color-value)" opacity={0.5} />
            )
          }
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export interface WeekBar {
  label: string; // "W3"
  minutes: number;
  current: boolean;
  deload: boolean;
}

/** Weekly aerobic minutes; the current week in the accent, earlier weeks tinted, deloads lighter. */
export function WeeklyBars({ data }: { data: WeekBar[] }) {
  const reduce = useReducedMotion();
  const config = { minutes: { label: "Minutes", color: "var(--accent)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-40 w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
        <YAxis hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator formatter={(v) => `${v} min`} />} />
        <Bar dataKey="minutes" radius={[6, 6, 2, 2]} isAnimationActive={!reduce} animationDuration={500} maxBarSize={28}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.current ? "var(--accent)" : "var(--chart-2)"} fillOpacity={d.deload && !d.current ? 0.5 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
