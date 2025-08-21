import { secureFetch } from "./token_manager_api.js";
import { formatDateWithoutMS } from "./dashboard_prediction_api.js";

const BASE_URL = "http://localhost:8000/api/dashboard/download-file";

async function fetchJSONFile() {
  try {
    // Make authenticated request to download JSON file
    const response = await secureFetch(`${BASE_URL}/json`, {
      method: "GET",
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Failed to download JSON file: ${response.status} ${response.statusText}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Extract filename from Content-Disposition header
    let filename;
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match && match[1]) {
        filename = match[1];
      } else {
        filename = `traffic_data_report_${formatDateWithoutMS(new Date)}.json`;
      }
    } else {
      filename = `traffic_data_report_${formatDateWithoutMS(new Date)}.json`;
    }

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: `JSON file "${filename}" downloaded successfully` };
  } catch (error) {
    console.error("Error downloading JSON file:", error);
    throw error;
  }
}


async function fetchExcelFile() {
  try {
    const response = await secureFetch(`${BASE_URL}/xlsx`, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Failed to download Excel file: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    let filename;
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match && match[1]) {
        filename = match[1];
      } else {
        filename = `traffic_data_report_${formatDateWithoutMS(new Date)}.xlsx`;
      }
    } else {
      filename = `traffic_data_report_${formatDateWithoutMS(new Date)}.xlsx`;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, message: `Excel file "${filename}" downloaded successfully` };
  } catch (error) {
    console.error("Error downloading Excel file:", error);
    throw error;
  }
}

export { fetchJSONFile, fetchExcelFile };