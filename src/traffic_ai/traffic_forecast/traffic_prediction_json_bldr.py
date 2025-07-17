from pathlib import Path
from prophet_modeling import ProphetModel
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd
import numpy as np

# pathlib since direct path results an error dunno why
# load and train the model
data_path = Path(__file__).resolve().parents[3] / 'data' / 'processed' / 'vehicle-data-feed-prophet-model.csv'
model = ProphetModel(str(data_path))
model.train_model()

h_forecast = model.hourly_prediction
d_forecast = model.daily_prediction
w_forecast = model.weekly_prediction
m_forecast = model.monthly_prediction

# extract current date
today = pd.to_datetime(datetime.now().date())
# get the 24hrs forecast for the current day
hourly = h_forecast[h_forecast['ds'].dt.date == today.date()]


# function JSON schmea builder for dashboard summary
def prediction_summary():
  y_h_sum = int(np.sum(hourly['yhat']))

  start_of_week = (today - timedelta(days=today.weekday())) # monday
  end_of_week = (today + timedelta(days=6 - today.weekday())) # sunday
  weekly = w_forecast[
    (w_forecast['ds'].dt.date >= start_of_week.date()) &
    (w_forecast['ds'].dt.date <= end_of_week.date()) 
  ]
  y_w_sum = int(np.sum(weekly['yhat']))

  # get the 3 months range from current month to 3rd months prior
  start_date = today.replace(day=1) # First day of current month
  end_month_first_day = (start_date + relativedelta(months=3)).replace(day=1) # Get first day of the 4th month (3 months ahead)
  end_date = end_month_first_day - relativedelta(days=1) # Subtract 1 day to get the **last day of the 3rd month**

  # get prphet 3 months forecast
  three_months_forecast = m_forecast[
    (m_forecast['ds'].dt.date >= start_date.date()) &
    (m_forecast['ds'].dt.date <= end_date.date())
  ]
  y_m_sum = int(np.sum(three_months_forecast['yhat']))
 
  return {
    "current_date": today.isoformat(),
    "yhat_daily_sum": y_h_sum,
    "current_week": {
      "start": str(start_of_week.date()),
      "end": str(end_of_week.date())
    },
    "yhat_weekly_sum": y_w_sum,
    "three_months_range": {
      "start": str(start_date.date()),
      "end": str(end_date.date())
    },
    "yhat_monthly_sum": y_m_sum
  }


def prediction_detail():
  # --- Hourly (24h forecast) ---
  hourly_data = [
    {"time": ts.isoformat(), "value": int(val)}
    for ts, val in zip(hourly['ds'], hourly['yhat'])
  ]
  # include AI generated summary and recommendation keys
  hourly_res = {
    "prediction": hourly_data,
    "summary": "", 
    "recommendation": "" 
  }

  # --- Daily (current week) ---
  start_of_week = today - timedelta(days=today.weekday())
  end_of_week = start_of_week + timedelta(days=6)

  daily = d_forecast[
    (d_forecast['ds'].dt.date >= start_of_week.date()) &
    (d_forecast['ds'].dt.date <= end_of_week.date())
  ]
  daily_data = [
    {"date": ts.strftime('%Y-%m-%d'), "value": int(val)}
    for ts, val in zip(daily['ds'], daily['yhat'])
  ]
  # include AI generated summary and recommendation keys
  daily_res = {
    "prediction": daily_data,
    "summary": "", 
    "recommendation": "" 
  }

  # --- Weekly (next 16 weeks) ---
  start_month = today.replace(day=1)
  sw = start_month - timedelta(days=start_month.weekday())
  weekly = w_forecast[w_forecast['ds'].dt.date >= sw.date()].head(16)

  weekly_data = []
  for ts, val in zip(weekly['ds'], weekly['yhat']):
    ws = ts - timedelta(days=ts.weekday())
    we = ws + timedelta(days=6)
    weekly_data.append({
      "week_start": ws.strftime('%Y-%m-%d'),
      "week_end": we.strftime('%Y-%m-%d'),
      "value": int(val)
    })
  # include AI generated summary and recommendation keys
  weekly_res = {
    "prediction": weekly_data,
    "summary": "", 
    "recommendation": "" 
  }

  # --- Monthly (current year) ---
  current_year = today.year
  monthly = m_forecast[m_forecast['ds'].dt.year == current_year]
  monthly_data = [
    {"month": ts.strftime('%Y-%m-%d'), "value": int(val)}
    for ts, val in zip(monthly['ds'], monthly['yhat'])
  ]
  # include AI generated summary and recommendation keys
  monthly_res = {
    "prediction": monthly_data,
    "summary": "",
    "recommendation": ""
  }

  return {
    "hourly": hourly_res,
    "daily": daily_res,
    "weekly": weekly_res,
    "monthly": monthly_res
  }


"""
  HERE FOR USER PREDICTION REQUEST
"""