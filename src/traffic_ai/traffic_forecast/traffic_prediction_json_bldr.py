from pathlib import Path
from traffic_ai.traffic_forecast.prophet_modeling import ProphetModel
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
start_of_week = (today - timedelta(days=today.weekday())) # monday
end_of_week = (today + timedelta(days=6 - today.weekday())) # sunday

# function JSON schmea builder for dashboard summary
def prediction_summary():
  # --- HOURLY ---
  vhcl_today_sum = int(np.sum(hourly['yhat']))
  
  # --- WEEKLY ---
  weekly = w_forecast[
    (w_forecast['ds'].dt.date >= start_of_week.date()) &
    (w_forecast['ds'].dt.date <= end_of_week.date()) 
  ]
  vhcl_current_week_sum = int(np.sum(weekly['yhat']))

  # --- THREE MONTHS ---
  # get the 3 months range from current month to 3rd months prior
  start_date = today.replace(day=1) # First day of current month
  end_month_first_day = (start_date + relativedelta(months=3)).replace(day=1) # Get first day of the 4th month (3 months ahead)
  end_date = end_month_first_day - relativedelta(days=1) # Subtract 1 day to get the **last day of the 3rd month**

  # get prphet 3 months forecast
  three_months_forecast = m_forecast[
    (m_forecast['ds'].dt.date >= start_date.date()) &
    (m_forecast['ds'].dt.date <= end_date.date())
  ]
  vhcl_three_months_sum = int(np.sum(three_months_forecast['yhat']))
 
  return {
    "today": today.isoformat(),
    "vhcl_today_sum": vhcl_today_sum,
    "current_week_range": {
      "start": str(start_of_week.date()),
      "end": str(end_of_week.date())
    },
    "vhcl_current_week_sum": vhcl_current_week_sum,
    "three_months_range": {
      "start": str(start_date.date()),
      "end": str(end_date.date())
    },
    "vhcl_three_months_sum": vhcl_three_months_sum
  }


def prediction_detail():
  # --- Hourly (24h forecast) ---
  hourly_data = [
    {"time": ts.isoformat(), "value": int(val)}
    for ts, val in zip(hourly['ds'], hourly['yhat'])
  ]

  # --- Daily (current week) ---
  daily = d_forecast[
    (d_forecast['ds'].dt.date >= start_of_week.date()) &
    (d_forecast['ds'].dt.date <= end_of_week.date())
  ]
  daily_data = [
    {"date": ts.strftime('%Y-%m-%d'), "value": int(val)}
    for ts, val in zip(daily['ds'], daily['yhat'])
  ]

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

  # --- Monthly (current year) ---
  current_year = today.year
  monthly = m_forecast[m_forecast['ds'].dt.year == current_year]
  monthly_data = [
    {"month": ts.strftime('%Y-%m-%d'), "value": int(val)}
    for ts, val in zip(monthly['ds'], monthly['yhat'])
  ]

  return {
    "hourly": hourly_data,
    "daily": daily_data,
    "weekly": weekly_data,
    "monthly": monthly_data
  }

# print(f"{prediction_summary()}\n\n\n\n{prediction_detail()}")

"""
  HERE FOR USER PREDICTION REQUEST
"""