/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { downloadJSONFile, downloadExcelFile, downloadPDFFile } from "@/api/download_file_api";
import type { FileDownloadPayload } from "@/types/download_file.types";

interface DownloadModalProps {
    payload: FileDownloadPayload;
    disabled?: boolean;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadButton({
    payload,
    disabled = false,
    variant = "outline",
    size = "default"
}: DownloadModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState<'json' | 'excel' | 'pdf' | null>(null);

    // Close modal when downloading starts
    useEffect(() => {
        if (isDownloading) {
            setIsOpen(false);
        }
    }, [isDownloading]);

    const handleDownload = async (format: 'json' | 'excel' | 'pdf') => {
        if (!payload) {
            toast.error("Failed Download", {
                description: "Failed to download file format"
            });
            return;
        }

        setIsDownloading(format);

        try {
            let result;

            switch (format) {
                case 'json':
                    result = await downloadJSONFile(payload);
                    break;
                case 'excel':
                    result = await downloadExcelFile(payload);
                    break;
                case 'pdf':
                    result = await downloadPDFFile(payload);
                    break;
            }

            toast.success("Download successful!", {
                description: "File downloaded successfully"
            });
        } catch (error) {
            console.error(`Download failed:`, error);
            toast.error("Download Failed", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
        } finally {
            setIsDownloading(null);
        }
    };

    const DownloadOption = ({
        format,
        icon: Icon,
        title,
        description,
        color
    }: {
        format: 'json' | 'excel' | 'pdf';
        icon: React.ElementType;
        title: string;
        description: string;
        color: string;
    }) => (
        <Card
            className={`
                cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md
                border-0 shadow-sm bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700
                ${isDownloading === format ? 'opacity-50 cursor-not-allowed' : ''}
                w-full
            `}
            onClick={() => !isDownloading && handleDownload(format)}
        >
            <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="space-y-1">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {isDownloading === format ? (
                            <div className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-xs">Downloading...</span>
                            </div>
                        ) : (
                            title
                        )}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled || isDownloading !== null}
                    className={`
                        flex items-center gap-2 
                        px-6 py-2 w-full
                        border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600
                        dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300
                    `}
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            Download Traffic Data Report
                        </>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-0 shadow-xl">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Download Format
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-3 py-4">
                    <DownloadOption
                        format="json"
                        icon={FileJson}
                        title="JSON"
                        description="Raw data format"
                        color="text-yellow-500"
                    />

                    <DownloadOption
                        format="excel"
                        icon={FileSpreadsheet}
                        title="Excel"
                        description="Spreadsheet format"
                        color="text-green-500"
                    />

                    <DownloadOption
                        format="pdf"
                        icon={FileText}
                        title="PDF"
                        description="Printable report"
                        color="text-red-500"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}