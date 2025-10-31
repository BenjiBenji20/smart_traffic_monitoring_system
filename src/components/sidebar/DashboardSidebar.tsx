// components/DashboardSidebar.tsx
"use client"

import { cn } from "@/lib/utils"
import { SidebarMenuItem } from "@/components/sidebar/sidebar-menu-item"
import { Submenu } from "@/components/sidebar/submenu"
import { Home, BarChart, History } from "lucide-react"
import { Profile } from "@/components/ui/profile"
import type { UserModel } from "@/types/user_model"
import { useLocation } from "react-router"
import { UserListDropdown } from "./user-list-dropdown"

export function DashboardSidebar({ userData }: { userData: UserModel }) {
    const isCollapsed = false;
    const location = useLocation(); // Get current route

    // Determine active state based on current path
    const isDashboardActive = location.pathname === "/dashboard";
    const isHistoryActive = location.pathname === "/history";
    // const isMessagesActive = location.pathname === "/messages";
    // const isSettingsActive = location.pathname === "/settings";

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
                        isActive={isDashboardActive}
                        isCollapsed={isCollapsed}
                    />

                    <SidebarMenuItem
                        icon={<History className="h-4 w-4" />}
                        name="History"
                        href="/history"
                        isActive={isHistoryActive}
                        isCollapsed={isCollapsed}
                    />

                    <Submenu
                        title="Page Section"
                        icon={<BarChart className="h-4 w-4" />}
                        defaultOpen={false}
                        isCollapsed={isCollapsed}
                    >
                        {/* implemented simple role-based wrapper component for MVP */}
                        {userData?.role === "admin" && (
                            <SidebarMenuItem
                                name="Traffic Livestream"
                                href="/dashboard"
                                sectionId="livestream-section"
                                isCollapsed={isCollapsed}
                            />
                        )}
                        <SidebarMenuItem
                            name="Prediction Summary"
                            href="/dashboard"
                            sectionId="prediction-summary-section"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Traffic Predictions and Analysis"
                            href="/dashboard"
                            sectionId="prediction-detailed-section"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Traffic Predictions and Factors"
                            href="/dashboard"
                            sectionId="prediction-factors-section"
                            isCollapsed={isCollapsed}
                        />
                        <SidebarMenuItem
                            name="Reports"
                            href="/dashboard"
                            sectionId="download-reports-section"
                            badge="3"
                            isCollapsed={isCollapsed}
                        />
                    </Submenu>

                    <UserListDropdown
                        isCollapsed={isCollapsed}
                    />

                    {/* TO IMPLEMENT CHAT PAGE IF HAVE TIME BEFORE THE DEADLINE */}
                    {/* <SidebarMenuItem
                        icon={<Mail className="h-4 w-4" />}
                        name="Messages"
                        href="/messages"
                        isActive={isMessagesActive}
                        badge="5"
                        isCollapsed={isCollapsed}
                    /> */}



                    {/* <SidebarMenuItem
                        icon={<Settings className="h-4 w-4" />}
                        name="Settings"
                        href="/settings"
                        isActive={isSettingsActive}
                        isCollapsed={isCollapsed}
                    /> */}
                </div>

                {/* User Profile Footer */}
                <Profile className="w-full mx-auto px-6 py-4" user={userData} />
            </aside>
        </div>
    )
}