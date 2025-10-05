import { Link } from "react-router"
import { cn } from "@/lib/utils"

interface SidebarMenuItemProps {
    icon?: React.ReactNode
    name: string
    href: string
    isActive?: boolean
    isCollapsed?: boolean
    badge?: string
    onClick?: () => void
}

export function SidebarMenuItem({
    icon,
    name,
    href,
    isActive = false,
    isCollapsed = false,
    badge,
    onClick
}: SidebarMenuItemProps) {
    return (
        <Link
            to={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground",
                isCollapsed && "justify-center"
            )}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}

            {!isCollapsed && (
                <span className="flex-1 truncate">{name}</span>
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
                </div>
            )}
        </Link>
    )
}