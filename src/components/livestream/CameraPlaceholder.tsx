import { Card, CardContent } from "@/components/ui/card";
import { Camera, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraPlaceholderProps {
    className?: string;
    title?: string;
    message?: string;
    size?: "sm" | "md" | "lg";
}

export function CameraPlaceholder({
    className,
    title = "Add AI Vision Camera",
    message = "Implemented on next patch update",
    size = "md"
}: CameraPlaceholderProps) {
    const sizeClasses = {
        sm: "pt-10 mt-4 h-21", 
        md: "p-6 pt-8 h-32",
        lg: "p-8 pt-10 h-40"
    };

    const iconSizes = {
        sm: "h-6 w-6", 
        md: "h-10 w-10",
        lg: "h-14 w-14"
    };

    return (
        <Card
            className={cn(
                "relative rounded-xl border-2 border-dashed bg-muted/30 transition-all duration-300",
                "cursor-not-allowed hover:bg-muted/50 hover:border-muted-foreground/30",
                sizeClasses[size],
                className
            )}
            title={message}
        >
            <CardContent className="flex flex-col items-center justify-center text-center p-0 space-y-2 h-full">
                {/* Wrench icon in corner */}
                <div className="absolute top-2 right-2">
                    <Wrench className="h-3 w-3 text-muted-foreground/60" />
                </div>

                {/* Camera icon */}
                <div className={cn(
                    "text-muted-foreground/60",
                    iconSizes[size]
                )}>
                    <Camera className="h-full w-full" />
                </div>

                {/* Title */}
                <h3 className={cn(
                    "font-semibold text-muted-foreground/80",
                    size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
                )}>
                    {title}
                </h3>

                {/* Hover message (visible on hover) */}
                <div className={cn(
                    "text-muted-foreground/60 transition-opacity duration-200 opacity-0 group-hover:opacity-100",
                    size === "sm" ? "text-[10px]" : "text-xs"
                )}>
                    {message}
                </div>
            </CardContent>
        </Card>
    );
}