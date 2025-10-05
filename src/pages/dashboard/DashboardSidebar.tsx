// components/DashboardSidebar.tsx
"use client"

import { cn } from "@/lib/utils"
import { SidebarMenuItem } from "@/components/sidebar/sidebar-menu-item"
import { Submenu } from "@/components/sidebar/submenu"
import { UserProfileFooter } from "@/components/sidebar/user-profile-footer"
import { Home, BarChart, Users, Mail, Settings, History } from "lucide-react"

export function DashboardSidebar() {
    const isCollapsed = false;
    const user = {
        name: "John Doe",
        email: "john@example.com",
        role: "Admin"
    }

    return (
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background z-40">
            {/* Sidebar */}
            <aside className={cn(
                "flex flex-col h-full bg-background/50 backdrop-blur-sm transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-64"
            )}>
                {/* Sidebar Content - Fixed height with scroll */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 px-2 py-4">
                    <SidebarMenuItem
                        icon={<Home className="h-4 w-4" />}
                        name="Dashboard"
                        href="/dashboard"
                        isActive={true}
                        isCollapsed={isCollapsed}
                    />

                    <Submenu
                        title="Analytics"
                        icon={<BarChart className="h-4 w-4" />}
                        defaultOpen={false}
                        isCollapsed={isCollapsed}
                    >
                        <SidebarMenuItem
                            name="Traffic Flow"
                            href="/analytics/traffic"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Peak Hours"
                            href="/analytics/peak-hours"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Reports"
                            href="/analytics/reports"
                            badge="3"
                            isCollapsed={isCollapsed}
                        />
                        {/* Add more items to test scroll */}
                        <SidebarMenuItem
                            name="Real-time Data"
                            href="/analytics/realtime"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Historical Data"
                            href="/analytics/historical"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Performance"
                            href="/analytics/performance"
                            isCollapsed={isCollapsed}
                        />
                    </Submenu>

                    <SidebarMenuItem
                        icon={<Users className="h-4 w-4" />}
                        name="Users"
                        href="/users"
                        isCollapsed={isCollapsed}
                    />

                    <SidebarMenuItem
                        icon={<Mail className="h-4 w-4" />}
                        name="Messages"
                        href="/messages"
                        badge="5"
                        isCollapsed={isCollapsed}
                    />

                    <SidebarMenuItem
                        icon={<History className="h-4 w-4" />}
                        name="History"
                        href="/history"
                        isCollapsed={isCollapsed}
                    />

                    <SidebarMenuItem
                        icon={<Settings className="h-4 w-4" />}
                        name="Settings"
                        href="/settings"
                        isCollapsed={isCollapsed}
                    />
                </div>

                {/* User Profile Footer */}
                <UserProfileFooter
                    user={user}
                    isCollapsed={isCollapsed}
                    onLogout={() => console.log("Logout")}
                    onProfileClick={() => console.log("Profile")}
                    onSettingsClick={() => console.log("Settings")}
                />
            </aside>
        </div>
    )
}