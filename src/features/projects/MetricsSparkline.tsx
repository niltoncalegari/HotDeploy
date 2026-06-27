interface MetricsSparklineProps {
  values: number[];
  label: string;
}

export function MetricsSparkline({ values, label }: MetricsSparklineProps) {
  if (values.length < 2) {
    return (
      <div
        aria-label={label}
        className="bg-muted text-muted-foreground flex h-16 items-center justify-center rounded-md text-xs"
      >
        Not enough data
      </div>
    );
  }

  const width = 240;
  const height = 64;
  const padding = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x =
        padding +
        (index / (values.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-label={label}
      className="text-primary h-16 w-full"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
    >
      <polyline
        fill="none"
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
