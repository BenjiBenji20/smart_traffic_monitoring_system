import type { HistoryListData, HistoryData } from "@/types/history.types";
import securedRequest from "./authentication_api";


const BASEURL = "/dashboard/history";

// DISCLAIMER: its just id, version name, and date 
export async function getAllHistoryRecord(): Promise<HistoryListData> {
    const response = await securedRequest.get<HistoryListData>(
        `${BASEURL}/all-history`
    );

    return response.data;
}


export async function getOneHistoryRecord(id: string): Promise<HistoryData> {
    const response = await securedRequest.get<HistoryData>(
        `${BASEURL}/one-history?id=${id}`
    );

    return response.data;
}


export async function updateVersionName(id: string, newVersionName: string): Promise<boolean> {
    const response = await securedRequest.put<boolean>(
        `${BASEURL}/update-version-name?id=${id}&new_ver_name=${newVersionName}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}
