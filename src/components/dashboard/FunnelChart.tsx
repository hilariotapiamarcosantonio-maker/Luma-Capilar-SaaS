interface FunnelChartProps {
  data: { name: string; value: number; fill: string }[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {data.map((item) => {
        const width = `${Math.max(8, (item.value / max) * 100)}%`;

        return (
          <div
            key={item.name}
            className="grid grid-cols-[116px_1fr_44px] items-center gap-3 text-sm"
          >
            <div className="truncate text-right text-crm-muted" title={item.name}>
              {item.name}
            </div>
            <div className="h-6 rounded-sm bg-crm-surface2">
              <div
                className="h-full rounded-sm"
                style={{ width, backgroundColor: item.fill }}
              />
            </div>
            <div className="text-right font-medium text-crm-text">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
