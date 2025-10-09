// components/HistorySidebar.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MoreVertical, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HistoryResponseData } from '@/types/history.types';

interface HistorySidebarProps {
    historyData: HistoryResponseData[];
    onVersionSelect?: (id: string) => void;
    onVersionUpdate?: (id: string, newName: string) => Promise<void>;
    className?: string;
}

export function HistoryListSidebar({
    historyData,
    onVersionSelect,
    onVersionUpdate,
    className
}: HistorySidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditStart = (item: HistoryResponseData) => {
        setEditingId(item.id);
        setEditValue(item.version_name);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    const handleEditSave = async () => {
        if (!editingId || !editValue.trim() || !onVersionUpdate) return;

        setIsUpdating(true);
        try {
            await onVersionUpdate(editingId, editValue.trim());
            setEditingId(null);
            setEditValue('');
        } catch (error) {
            console.error('Failed to update version name:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    return (
        <Card className={cn("w-full h-full bg-background border-l", className)}>
            <CardContent className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Version History</h2>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto space-y-2 rounded-lg">
                    {historyData.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative rounded-lg px-3 py-2 cursor-pointer transition-all duration-200",
                                "border-l-4 border-primary/50 hover:border-primary",
                                "bg-card hover:bg-accent/50 hover:shadow-sm"
                            )}
                            onClick={() => {
                                if (editingId !== item.id) {
                                    onVersionSelect?.(item.id);
                                }
                            }}
                        >
                            {/* Version Content */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    {editingId === item.id ? (
                                        <div className="space-y-2">
                                            <Input
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                disabled={isUpdating}
                                                className="h-7 text-sm"
                                                autoFocus
                                            />
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleEditSave}
                                                    disabled={isUpdating}
                                                    className="h-6 px-2"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleEditCancel}
                                                    disabled={isUpdating}
                                                    className="h-6 px-2"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {item.version_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {item.created_at}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Three dots menu */}
                                {editingId !== item.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                            "hover:bg-accent"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditStart(item);
                                        }}
                                    >
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}