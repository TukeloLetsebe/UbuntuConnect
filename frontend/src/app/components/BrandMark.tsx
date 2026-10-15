// Brand lockup used in every dashboard header: a small "UC" tile next to the
// "UbuntuConnect" wordmark. Presentational only — the parent passes onClick so
// the existing "jump to the home tab" behaviour is preserved per dashboard.

interface BrandMarkProps {
  onClick?: () => void;
}

export default function BrandMark({ onClick }: BrandMarkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="UbuntuConnect home"
      className="group flex items-center gap-2.5 cursor-pointer"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm leading-none shadow-sm transition-transform group-hover:scale-105">
        UC
      </span>
      <span className="text-xl font-bold tracking-tight text-neutral-900">
        Ubuntu<span className="text-primary">Connect</span>
      </span>
    </button>
  );
}
