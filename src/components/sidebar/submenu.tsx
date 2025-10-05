// components/sidebar/submenu.tsx
"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubmenuProps {
    title: string
    icon?: React.ReactNode
    children: React.ReactNode
    isCollapsed?: boolean
    defaultOpen?: boolean
}

export function Submenu({
    title,
    icon,
    children,
    isCollapsed = false,
    defaultOpen = false
}: SubmenuProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    if (isCollapsed) {
        return (
            <div className="relative group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-center w-full p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
                >
                    {icon}
                </button>

                {/* Tooltip for collapsed state */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {title}
                </div>

                {/* Dropdown for collapsed state */}
                {isOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-popover border rounded-lg shadow-lg py-2 z-40 min-w-48 max-h-60 overflow-y-auto">
                        {children}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
                {icon}
                <span className="flex-1 text-left">{title}</span>
                <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="ml-4 mt-1 border-l border-sidebar-border pl-2 space-y-1 max-h-48 overflow-y-auto">
                    {children}
                </div>
            )}
        </div>
    )
}