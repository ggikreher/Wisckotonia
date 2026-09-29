import { cn } from "@/lib/utils"

export function Mark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md",
        light ? "bg-[#e7d3ae] text-[#14211e]" : "bg-sidebar text-[#e7d3ae]",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
        <path
          d="M6.5 9 L12 23 L16 14.5 L20 23 L25.5 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
