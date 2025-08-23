import { secureFetch } from "./token_manager_api.js"

const BASE_URL = "http://localhost:8000/api/dashboard/history";
const SERVER_ERROR = "Unexpected Error Occurred";

async function fetchAllHistoryRecord() {
  try {
    const response = await secureFetch(`${BASE_URL}/all-history`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch all history record:", errorData);
      
      throw new Error(errorData.message || "Failed to load user profile");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error; // Re-throw to let calling code handle it
  }
}


async function getHistoryData() {
  try {
    const historyData = await fetchAllHistoryRecord();
    return historyData.data; // Return only the data array
  } catch (error) {
    console.error("Error fetching history data:", error);
    return [];
  }
}


async function fetchOneHistoryRecord(id) {
  try {
    const response = await secureFetch(`${BASE_URL}/one-history?id=${id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch all history record:", errorData);
      
      throw new Error(errorData.message || "Failed to load user profile");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error; // Re-throw to let calling code handle it
  }
}


async function updateVersionName(id, newVersionName) {
  try {
    const response = await secureFetch(`${BASE_URL}/update-version-name?id=${id}&new_ver_name=${newVersionName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch all history record:", errorData);
      
      throw new Error(errorData.message || "Failed to load user profile");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error; // Re-throw to let calling code handle it
  }
}


export { fetchAllHistoryRecord, fetchOneHistoryRecord, updateVersionName, getHistoryData };