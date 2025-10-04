import { secureFetch } from "./token_manager_api.js";

const DASHBOARD_BASE_URL = "http://localhost:8000/api/dashboard/user";
const SERVER_ERROR = "Unexpected Error Occurred";


export async function getFactors() {
  try {
    const response = await secureFetch(`${DASHBOARD_BASE_URL}/factors`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Fetching factors failed' }));
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error(`${SERVER_ERROR}`, error);
    throw error;
  }
}


export async function getAIAnalysis() {
  try {
    const response = await secureFetch(`${DASHBOARD_BASE_URL}/ai-analysis`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Fetching ai analysis failed' }));
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error(`${SERVER_ERROR}`, error);
    throw error
  }
}