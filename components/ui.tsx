import { clsx } from "clsx";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-white hover:bg-black",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-field",
        variant === "ghost" && "text-ink hover:bg-white",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="focus-ring min-h-10 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
      {...props}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="focus-ring min-h-10 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="space-y-1.5 text-sm font-medium text-ink">{children}</label>;
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx("border-y border-line bg-white", className)}>{children}</section>;
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
    </div>
  );
}
