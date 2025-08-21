import pandas as pd
import asyncio
import logging
import os
from datetime import datetime

from fastapi.exceptions import HTTPException

from src.app.exceptions.custom_exceptions import FileDownloadException
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import (
  prediction_detail, prediction_summary
)

def download_path() -> str:
  """Dir to Downloads folder to save the download file"""
  DOWNLOADS_FOLDER = ""
  # Check os type
  if os.name == "nt": # windows
    DOWNLOADS_FOLDER = os.path.join(os.getenv("USERPROFILE"), "Downloads") # dir, windows Downloads folder
  else: # mac/linux
    DOWNLOADS_FOLDER = os.path.join(os.getenv('HOME'), 'Downloads')
    
  return DOWNLOADS_FOLDER


def file_name(file_type: str) -> str:
  import time
  timestr = time.strftime("%Y-%m-%d-%H-%M-%S")
  
  return f"traffic_data_report_{timestr}.{file_type}"
  

def pred_json() -> dict:
  """Send to download route the raw prediction data for for download"""
  try:
    pred_d: dict = prediction_detail()
    pred_s: dict = prediction_summary()
    
    if not pred_d or not pred_s:
      raise HTTPException(504, detail="Failed to get data. Try again.")
    
    return {"prediction_summary": pred_s, "prediction_detail": pred_d}
    
  except Exception:
    logging.exception("Failed to get prediction data")
    raise
  

async def formatted_ai_recommendation(user_type: str) -> dict:
  """Send formatted ai recommendation to save for download"""
  try:
    from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation
    pred_data: dict = pred_json()
    d1: dict = pred_data["prediction_summary"]
    d2: dict = pred_data["prediction_detail"]
    
    ai_reco = AIRecommendation()
    
    await asyncio.to_thread(ai_reco.run_ai_recommendation, d1, d2, user_type)
      
    raw_reco: dict = ai_reco.reco_json
    if not raw_reco:
      raise HTTPException(504, detail="Failed to get data. Try again.")
    
    formatted_reco: dict = {}

    for key, val in raw_reco.items():
      # format the \n to become enter space
      formatted_reco[key] = val.encode("utf-8").decode("unicode_escape")
      
    return formatted_reco
  
  except Exception:
    logging.exception("Internal error occurred in formatted_ai_recommendation")
    raise
      
      
# DOWNLOAD FILE FORMATTING FUNCTIONS
# JSON
def formatted_json_dl_file(pred_data: dict, reco_data: dict) -> dict: 
  return {
    "date": datetime.now().isoformat(),
    "prediction_summary": {
      "prediction": pred_data["prediction_summary"],
      "recommendation": reco_data["summary_reco"]
    },
    "prediction_hourly_detail": {
      "prediction": pred_data["prediction_detail"]["hourly"],
      "recommendation": reco_data["hourly_reco"]
    },
    "prediction_daily_detail": {
      "prediction": pred_data["prediction_detail"]["daily"],
      "recommendation": reco_data["daily_reco"]
    },
    "prediction_weekly_detail": {
      "prediction": pred_data["prediction_detail"]["weekly"],
      "recommendation": reco_data["weekly_reco"]
    },
    "prediction_monthly_detail": {
      "prediction": pred_data["prediction_detail"]["monthly"],
      "recommendation": reco_data["monthly_reco"]
    }
  }


# EXCEL
import io
import pandas as pd
async def generate_excel_file(user_type: str) -> io.BytesIO:
  """Generate Excel file with multiple sheets."""
  try:
    pred_data: dict = pred_json()  # Assume this returns your data
    d1: dict = pred_data["prediction_summary"]
    d2: dict = pred_data["prediction_detail"]
    
    reco = await formatted_ai_recommendation(user_type)
    
    # Flatten d1 for DataFrame creation
    d1_flat = {
      "today": d1["today"],
      "vhcl_today_sum": d1["vhcl_today_sum"],
      "today_peak_time": d1["today_analytics"]["peak"]["time"],
      "today_peak_value": d1["today_analytics"]["peak"]["value"],
      "today_peak_condition": d1["today_analytics"]["peak"]["condition"],
      "today_low_time": d1["today_analytics"]["low"]["time"],
      "today_low_value": d1["today_analytics"]["low"]["value"],
      "today_low_condition": d1["today_analytics"]["low"]["condition"],
      "today_avg": d1["today_analytics"]["avg"],
      
      "current_week_start": d1["current_week_range"]["start"],
      "current_week_end": d1["current_week_range"]["end"],
      "vhcl_current_week_sum": d1["vhcl_current_week_sum"],
      
      "weekly_peak_date": d1["weekly_analytics"]["peak"]["date"],
      "weekly_peak_value": d1["weekly_analytics"]["peak"]["value"],
      "weekly_peak_condition": d1["weekly_analytics"]["peak"]["condition"],
      "weekly_low_date": d1["weekly_analytics"]["low"]["date"],
      "weekly_low_value": d1["weekly_analytics"]["low"]["value"],
      "weekly_low_condition": d1["weekly_analytics"]["low"]["condition"],
      "weekly_avg": d1["weekly_analytics"]["avg"],
      
      "three_months_start": d1["three_months_range"]["start"],
      "three_months_end": d1["three_months_range"]["end"],
      "vhcl_three_months_sum": d1["vhcl_three_months_sum"],
      "three_months_peak_month": d1["three_months_analytics"]["peak"]["month"],
      "three_months_peak_value": d1["three_months_analytics"]["peak"]["value"],
      "three_months_peak_condition": d1["three_months_analytics"]["peak"]["condition"],
      "three_months_low_month": d1["three_months_analytics"]["low"]["month"],
      "three_months_low_value": d1["three_months_analytics"]["low"]["value"],
      "three_months_low_condition": d1["three_months_analytics"]["low"]["condition"],
      "three_months_avg": d1["three_months_analytics"]["avg"]
    }
    
    # Create DataFrames from d2 lists directly
    df_hourly = pd.DataFrame(d2["hourly"])  # Columns: time, value
    df_daily = pd.DataFrame(d2["daily"])    # Columns: date, value
    df_weekly = pd.DataFrame(d2["weekly"])  # Columns: week_start, week_end, value
    df_monthly = pd.DataFrame(d2["monthly"]) # Columns: month, value
    
    # Create DataFrame for summary (single row)
    df_summary = pd.DataFrame([d1_flat])
    
    # Create DataFrame for AI recommendations
    df_reco = pd.DataFrame([
      {"Type": "Summary", "Recommendation": reco.get("summary_reco", "")},
      {"Type": "Hourly", "Recommendation": reco.get("hourly_reco", "")},
      {"Type": "Daily", "Recommendation": reco.get("daily_reco", "")},
      {"Type": "Weekly", "Recommendation": reco.get("weekly_reco", "")},
      {"Type": "Monthly", "Recommendation": reco.get("monthly_reco", "")}
    ])
    
    # Convert into Excel file with multiple sheets
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as w:
      df_summary.to_excel(w, sheet_name="Summary of Prediction Report", index=False)
      df_hourly.to_excel(w, sheet_name="Hourly of Prediction Report", index=False)
      df_daily.to_excel(w, sheet_name="Daily of Prediction Report", index=False)
      df_weekly.to_excel(w, sheet_name="Weekly of Prediction Report", index=False)
      df_monthly.to_excel(w, sheet_name="Monthly of Prediction Report", index=False)
      df_reco.to_excel(w, sheet_name="AI Recommendation for Prediction Data", index=False)
    output.seek(0)
    
    return output
  except Exception as e:
      raise FileDownloadException(f"Failed to generate Excel file: {str(e)}")