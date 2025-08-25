import base64
import logging
import pandas as pd
import asyncio
import logging
import os
from datetime import datetime

from fastapi.exceptions import HTTPException

from src.app.models.user import User
from src.app.schemas.request_schema import PDFRequest
from src.app.exceptions.custom_exceptions import FileDownloadException
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import (
  prediction_summary
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
  

async def formatted_ai_recommendation(ai_reco: dict) -> dict:
  """Send formatted ai recommendation to save for download"""
  try:
    if not ai_reco:
      raise HTTPException(504, detail="Failed to get data. Try again.")
    
    formatted_reco: dict = {}

    for key, val in ai_reco.items():
      # format the \n to become enter space
      formatted_reco[key] = val.encode("utf-8").decode("unicode_escape")
      
    return formatted_reco
  
  except Exception:
    logging.exception("Internal error occurred in formatted_ai_recommendation")
    raise
      
      
# DOWNLOAD FILE FORMATTING FUNCTIONS
# JSON
def formatted_json_dl_file(d1: dict, d2: dict, reco_data: dict) -> dict: 
  try:
    return {
      "date": datetime.now().isoformat(),
      "prediction_summary": {
        "prediction": d1,
        "recommendation": reco_data["summary_reco"]
      },
      "prediction_hourly_detail": {
        "prediction": d2["hourly"],
        "recommendation": reco_data["hourly_reco"]
      },
      "prediction_daily_detail": {
        "prediction": d2["daily"],
        "recommendation": reco_data["daily_reco"]
      },
      "prediction_weekly_detail": {
        "prediction": d2["weekly"],
        "recommendation": reco_data["weekly_reco"]
      },
      "prediction_monthly_detail": {
        "prediction": d2["monthly"],
        "recommendation": reco_data["monthly_reco"]
      }
    }
  except Exception as e:
    logging.exception("Error formatting JSON file")
    raise HTTPException(status_code=500, detail=f"Failed to format JSON file: {str(e)}")


# EXCEL
import io
import pandas as pd
async def generate_excel_file(d1: dict, d2: dict, reco_data: dict) -> io.BytesIO:
  """Generate Excel file with multiple sheets."""
  try:
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
      {"Type": "Summary", "Recommendation": reco_data.get("summary_reco", "")},
      {"Type": "Hourly", "Recommendation": reco_data.get("hourly_reco", "")},
      {"Type": "Daily", "Recommendation": reco_data.get("daily_reco", "")},
      {"Type": "Weekly", "Recommendation": reco_data.get("weekly_reco", "")},
      {"Type": "Monthly", "Recommendation": reco_data.get("monthly_reco", "")}
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
    

# PDF
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
async def generate_pdf_file(request: PDFRequest, user: User) -> io.BytesIO:
  try:
    d1 = prediction_summary()
    
    # Create PDF in memory
    output = io.BytesIO()
    doc = SimpleDocTemplate(
      output, 
      pagesize=letter,
      title="Smart Traffic Monitoring Data Report"
    )
    styles = getSampleStyleSheet()
    # Define a custom justify style
    styles.add(ParagraphStyle(name="Justify", parent=styles["Normal"], alignment=TA_JUSTIFY))
    story = []

    # Add Title
    story.append(Paragraph("Smart Traffic Monitoring Data Report - Longos C4 Road, Malabon City", styles['Title']))
    story.append(Spacer(1, 12))
    
    # add the detail of the user who request the report
    story.append(Paragraph("File Request Report", styles["Heading4"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Date: {datetime.today().strftime("%Y-%m-%d")}", styles["Justify"]))
    story.append(Paragraph(f"To: {user.complete_name} - {user.role}", styles["Justify"]))
    story.append(Paragraph(f"From: Di ko alam dito jahahj", styles["Justify"]))
    story.append(Paragraph(f"Subject: Request for File Report", styles["Justify"]))
    story.append(Spacer(1, 12))

    # Add Summary (as a table for clarity)
    story.append(Paragraph("Summary Report:", styles['Heading2']))
    summary_data = [
      ["Field", "Value"],
      ["Today", d1['today']],
      ["Vehicle Today Sum", d1['vhcl_today_sum']],
      ["Today Peak Time", d1['today_analytics']['peak']['time']],
      ["Today Peak Value", d1['today_analytics']['peak']['value']],
      ["Today Peak Condition", d1['today_analytics']['peak']['condition']],
      ["Today Low Time", d1['today_analytics']['low']['time']],
      ["Today Low Value", d1['today_analytics']['low']['value']],
      ["Today Low Condition", d1['today_analytics']['low']['condition']],
      ["Today Average", d1['today_analytics']['avg']],
      ["Current Week Start", d1['current_week_range']['start']],
      ["Current Week End", d1['current_week_range']['end']],
      ["Vehicle Week Sum", d1['vhcl_current_week_sum']],
    ]
    
    available_width = 612 - 2 * 72  # maximize table width
    col_widths = [available_width * 0.4, available_width * 0.6]  # column width
    table = Table(summary_data, colWidths=col_widths)
    table.setStyle(TableStyle([
      ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
      ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
      ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
      ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
      ('FONTSIZE', (0, 0), (-1, 0), 12),
      ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
      ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
      ('GRID', (0, 0), (-1, -1), 1, colors.black),
      ('WORDWRAP', (0, 0), (-1, -1), 'CJK')
    ]))
    story.append(table)
    
    story.append(Spacer(1, 12))
    
    # add recommendation for traffic data summary
    story.append(Paragraph("Traffic Summary AI Recommendations:", styles["Heading3"]))
    story.append(Paragraph(request.recommendations["summary_reco"], styles["Justify"]))
    story.append(Spacer(1, 6))

    # Charts and Corresponding Recommendations
    story.append(Paragraph("Traffic Chart with AI Recommendations", styles['Heading2']))
    # Append chart images first 
    for period in ['hourly', 'daily', 'weekly', 'monthly']:
      if period in request.charts:
        # add chart
        story.append(Paragraph(f"{period.capitalize()} Predictions", styles['Heading3']))
        # Convert base64 image to bytes
        img_data = base64.b64decode(request.charts[period].split(',')[1])
        img_io = io.BytesIO(img_data)
        story.append(Image(img_io, width=500, height=250))
        story.append(Spacer(1, 12))
        
      # Add corresponding recommendation
      reco_key = f"{period}_reco"
      if reco_key in request.recommendations:
        story.append(Paragraph(f"{period.capitalize()} AI Recommendations:", styles['Heading3']))
        story.append(Paragraph(request.recommendations[reco_key], styles["Justify"]))
        story.append(Spacer(1, 6))

    doc.build(story)
    output.seek(0)

    return output
  except Exception as e:
    logging.error(f"Error generating PDF: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))
    