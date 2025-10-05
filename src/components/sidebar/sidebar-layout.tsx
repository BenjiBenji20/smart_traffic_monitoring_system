// components/sidebar/sidebar-layout.tsx
"use client"

import { cn } from "@/lib/utils"

interface SidebarLayoutProps {
    children: React.ReactNode
    sidebar: React.ReactNode
    className?: string
}

export function SidebarLayout({
    children,
    sidebar,
    className
}: SidebarLayoutProps) {
    const isCollapsed = false;

    return (
        <div className={cn("flex h-screen bg-background", className)}>
            {/* Sidebar - Modern, borderless design */}
            <aside className={cn(
                "flex flex-col bg-background/50 backdrop-blur-sm transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-64"
            )}>
                {sidebar}
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}