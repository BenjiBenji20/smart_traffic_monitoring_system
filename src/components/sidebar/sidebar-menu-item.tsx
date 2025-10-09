import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useScrollToSection } from '@/hooks/useScrollToSection';

interface SidebarMenuItemProps {
    icon?: React.ReactNode
    name: string
    href: string
    sectionId?: string
    isActive?: boolean
    isCollapsed?: boolean
    badge?: string
    onClick?: () => void
}

export function SidebarMenuItem({
    icon,
    name,
    href,
    sectionId,
    isActive = false,
    isCollapsed = false,
    badge,
    onClick
}: SidebarMenuItemProps) {
    const location = useLocation();
    const scrollToSection = useScrollToSection();

    // Check if this is the current page
    const isCurrentPage = location.pathname === href;

    // Handle click for internal section navigation
    const handleClick = (e: React.MouseEvent) => {
        if (sectionId) {
            e.preventDefault();
            window.history.pushState(null, '', `${href}/${sectionId}`); // Update URL with hash
            scrollToSection(sectionId);
        }
        onClick?.();
    };

    // Determine if this is an internal section link or external page
    const isInternalSection = sectionId && location.pathname === href;

    return (
        <Link
            to={href}
            onClick={handleClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                (isActive || isCurrentPage) && !isInternalSection
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground",
                isCollapsed && "justify-center",
                isInternalSection && "text-muted-foreground"
            )}
            title={name}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}

            {!isCollapsed && (
                <>
                    <span className="flex-1 truncate">{name}</span>
                    {isInternalSection && (
                        <span className="text-xs text-blue-500 ml-1"></span>
                    )}
                </>
            )}

            {!isCollapsed && badge && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {badge}
                </span>
            )}

            {isCollapsed && name && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                    {name}
                    {badge && ` (${badge})`}
                    {isInternalSection && " ↗"}
                </div>
            )}
        </Link>
    );
}