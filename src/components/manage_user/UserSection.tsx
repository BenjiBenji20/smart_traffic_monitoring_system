import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// Section Component (Collapsible)
interface UserSectionProps {
    title: string;
    icon: React.ReactNode;
    count: number;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export function UserSection({ title, icon, count, isOpen, onToggle, children }: UserSectionProps) {
    return (
        <div className="border-b">
            {/* Section Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-medium text-sm">{title}</span>
                    <span className="text-xs text-muted-foreground">({count})</span>
                </div>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Section Content */}
            {isOpen && (
                <div className="max-h-64 overflow-y-auto">
                    {count === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No {title.toLowerCase()} found
                        </div>
                    ) : (
                        children
                    )}
                </div>
            )}
        </div>
    );
}

