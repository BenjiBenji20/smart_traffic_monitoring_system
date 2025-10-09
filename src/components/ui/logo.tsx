import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
      <div className={cn("flex items-center gap-4", className)}>
          {/* Logo Image */}
          <div className="flex-shrink-0">
              <img
                  src="/vite.svg"
                  alt="Smart Traffic Monitoring Logo"
                  className="h-10 w-10"
              />
          </div>

          {/* Text Content */}
          <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  C4Vision
              </h2>
              <p className="text-xs text-muted-foreground">
                  powered by <span className="text-primary">AI</span>
              </p>
          </div>
      </div>
  );
}