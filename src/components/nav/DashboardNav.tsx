"use client"

import { NavigationMenu } from "@/components/ui/navigation-menu"
import { SearchBar } from "@/components/ui/search-bar"
import { Logo } from "@/components/ui/logo"
import { Profile } from "@/components/ui/profile"
import { ModeToggle } from "@/components/ui/mode-toggle"
import type { UserModel } from "@/types/user_model"

export function DashboardNav({ userData }: { userData: UserModel }) {

    return (
        <div className="flex w-full items-center justify-between px-70 py-2 bg-background">
            <NavigationMenu viewport={false} className="max-w-[50%]">
                <div className="flex items-center gap-3 flex-1">
                    <Profile className="mr-1" user={ userData }/>

                    <div className="flex-1 max-w-sm">
                        <SearchBar placeholder="Search" />
                    </div>

                    <NavigationMenu viewport={false}>
                        <ModeToggle />
                    </NavigationMenu>
                </div>
            </NavigationMenu>

            <Logo />
        </div>
    );
}
