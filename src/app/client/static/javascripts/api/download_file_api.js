import { secureFetch } from "./token_manager_api.js";
import { formatDateWithoutMS } from "./dashboard_prediction_api.js";

const BASE_URL = "http://localhost:8000/api/dashboard/download-file";

async function fetchJSONFile(payload) {
  try {
    // Make authenticated request to download JSON file
    const response = await secureFetch(`${BASE_URL}/json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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


async function fetchExcelFile(payload) {
  try {
    const response = await secureFetch(`${BASE_URL}/xlsx`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload) 
    });

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


// SEND CHART AS PNG IMAGE TO THE BACKEND
import { prepareChartData, getChartConfig } from "../ui/dashboard_render_prediction_ui.js"
let trafficChart = null;
let aiRecommendationData = null;

// capture all chart images
async function captureChartImages() {
  const periods = ['hourly', 'daily', 'weekly', 'monthly'];
  const chartTypes = { hourly: 'bar', daily: 'bar', weekly: 'bar', monthly: 'bar' };
  const images = {};

  // Create a hidden canvas for rendering charts
  const canvas = document.createElement('canvas');
  canvas.width = 800; // Fixed size for PDF
  canvas.height = 400;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  for (const period of periods) {
    const data = await prepareChartData(period);
    const chartType = chartTypes[period];
    
    // Create chart on hidden canvas
    if (trafficChart) {
      trafficChart.destroy();
    }
    trafficChart = new Chart(ctx, getChartConfig(period, chartType, data));
    
    // Capture as base64 image
    images[period] = canvas.toDataURL('image/png');
    
    // Clean up animation
    trafficChart.destroy();
  }

  // Remove hidden canvas
  document.body.removeChild(canvas);
  return images;
}


import { getRecommendation, getPredictionSummary } from "./dashboard_prediction_api.js";
async function fetchPDFFile() {
  try {
    // Fetch recommendation data
    if (!aiRecommendationData) {
      aiRecommendationData = await getRecommendation();
    }

    // Capture chart images
    const chartImages = await captureChartImages();

    // Prepare payload for backend
    const payload = {
      recommendations: aiRecommendationData,
      charts: chartImages,
      summary: await getPredictionSummary() 
    };

    // Send to backend
    const response = await secureFetch(`${BASE_URL}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    let filename = `traffic_data_report_${formatDateWithoutMS(new Date)}.pdf`;
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: `PDF file "${filename}" downloaded successfully` };
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}

export { fetchJSONFile, fetchExcelFile, fetchPDFFile };