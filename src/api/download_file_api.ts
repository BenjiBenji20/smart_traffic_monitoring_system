import type { FileDownloadPayload, PDFRequestPayload } from "@/types/download_file.types";
import securedRequest from "./authentication_api";
import { formatDateWithoutMS } from "@/utils/format-date";
import { PDFPayloadService } from '@/services/pdf-payload-service';
import axios from "axios";

const BASEURL = "/dashboard/download-file";

// Helper function to extract filename from Content-Disposition header
const extractFilename = (contentDisposition: string | null, defaultName: string): string => {
    if (!contentDisposition) {
        return defaultName;
    }

    const match = contentDisposition.match(/filename="([^"]+)"/);
    return match && match[1] ? match[1] : defaultName;
};


// Helper function to handle file download
const handleFileDownload = (blob: Blob, filename: string, fileType: 'JSON' | 'Excel' | 'PDF') => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
        success: true,
        message: `${fileType} file "${filename}" downloaded successfully`
    };
};


export async function downloadJSONFile(payload: FileDownloadPayload): Promise<{ success: boolean; message: string }> {
    try {
        const response = await securedRequest.post(
            `${BASEURL}/json`,
            payload,
            {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const blob = new Blob([response.data], { type: 'application/json' });

        const filename = extractFilename(
            response.headers['content-disposition'],
            `traffic_data_report_${formatDateWithoutMS(new Date())}.json`
        );

        return handleFileDownload(blob, filename, 'JSON');
    } catch (error) {
        console.error("Error downloading JSON file:", error);
        throw new Error(`Failed to download JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


export async function downloadExcelFile(payload: FileDownloadPayload): Promise<{ success: boolean; message: string }> {
    try {
        const response = await securedRequest.post(
            `${BASEURL}/xlsx`,
            payload,
            {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const filename = extractFilename(
            response.headers['content-disposition'],
            `traffic_data_report_${formatDateWithoutMS(new Date())}.xlsx`
        );

        return handleFileDownload(blob, filename, 'Excel');
    } catch (error) {
        console.error("Error downloading Excel file:", error);
        throw new Error(`Failed to download Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

const pdfPayloadService = new PDFPayloadService();

export async function downloadPDFFile(payload: FileDownloadPayload): Promise<{ success: boolean; message: string }> {
    try {
        // Build PDF-specific payload with chart images
        const pdfPayload: PDFRequestPayload = await pdfPayloadService.buildPDFPayload(
            payload.prediction_summary,
            payload.recommendation,
            payload.prediction_detail
        );

        const response = await securedRequest.post(
            `${BASEURL}/pdf`,
            pdfPayload,
            {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });

        const filename = extractFilename(
            response.headers['content-disposition'],
            `traffic_data_report_${formatDateWithoutMS(new Date())}.pdf`
        );

        return handleFileDownload(blob, filename, 'PDF');
    } catch (error: unknown) {
        console.error("Error downloading PDF file:", error);

        if (axios.isAxiosError(error)) {
            if (error.response?.data instanceof Blob) {
                const errorText = await error.response.data.text();
                console.error("Backend error response:", errorText);
            } else {
                console.error("Axios error:", error.message);
            }
        } else {
            console.error("Unexpected error:", error);
        }

        throw new Error(`Failed to download PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
