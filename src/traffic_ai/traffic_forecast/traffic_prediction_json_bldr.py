from src.traffic_ai.traffic_forecast.forecast_manager import *
from src.traffic_ai.traffic_recommendation.traffic_data_summarizer import calculate, determine_traffic_condition
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd
import numpy as np

forecast_data = None
# check if prophet already trained and json file existed
if forecast_today_exist():
  forecast_data = get_forecast()
else:
  # generate and get forecast data from json
  generate_forecast()
  forecast_data = get_forecast()

h_forecast = forecast_data['hourly']
d_forecast = forecast_data['daily']
w_forecast = forecast_data['weekly']
m_forecast = forecast_data['monthly']

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
  hourly_data = [
    {"time": ts.isoformat(), "value": int(val)}
    for ts, val in zip(hourly['ds'], hourly['yhat'])
  ]

  # --- WEEKLY ---
  weekly = w_forecast[
    (w_forecast['ds'].dt.date >= start_of_week.date()) &
    (w_forecast['ds'].dt.date <= end_of_week.date()) 
  ]
  vhcl_current_week_sum = int(np.sum(weekly['yhat']))

  weekly_data = [
    {"date": ts.strftime('%Y-%m-%d'), "value": int(val)}
    for ts, val in zip(weekly['ds'], weekly['yhat'])
  ]

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
  current_year = today.year
  monthly = m_forecast[m_forecast['ds'].dt.year == current_year]
  monthly_data = [
    {"month": ts.strftime('%Y-%m-%d'), "value": int(val)}
    for ts, val in zip(three_months_forecast['ds'], three_months_forecast['yhat'])
  ]
 
  return {
    "today": today.isoformat(),
    "vhcl_today_sum": vhcl_today_sum,
    "today_analytics": calculate(hourly_data),
    "current_week_range": {
      "start": str(start_of_week.date()),
      "end": str(end_of_week.date())
    },
    "vhcl_current_week_sum": vhcl_current_week_sum,
    "weekly_analytics": calculate(weekly_data),
    "three_months_range": {
      "start": str(start_date.date()),
      "end": str(end_date.date())
    },
    "vhcl_three_months_sum": vhcl_three_months_sum,
    "three_months_analytics": calculate(monthly_data)
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


# --- Hourly ---
def hourly_req(forecast, start, end):
  hourly = h_forecast[(h_forecast['ds'] >= start) & (h_forecast['ds'] <= end)]
  for ts, val in zip(hourly['ds'], hourly['yhat']):
    forecast['forecast']['hourly'].append({
      "time": ts.isoformat(),
      "value": int(val)
    })

# --- Daily ---
def daily_req(forecast, remaining_hrs, _, start, end):
  daily = d_forecast[(d_forecast['ds'] >= start) & (d_forecast['ds'] <= end)]
  for ts, val in zip(daily['ds'], daily['yhat']):
    forecast['forecast']['daily'].append({
      "date": ts.strftime('%Y-%m-%d'),
      "value": int(val)
    })

  # Handle potential leftover partial day (hours)
  total_hours = (end - start).total_seconds() / 3600
  full_days = int(total_hours // 24)
  leftover_hours = int(round(total_hours - (full_days * 24)))  # safer with round

  if leftover_hours >= 1:
    hourly_start = end - timedelta(hours=leftover_hours)
    hourly_end = end

    # Prevent duplicate hourly call if the range is exactly on a full day
    if hourly_start < hourly_end:
        hourly_req(forecast, hourly_start, hourly_end)

# --- Weekly ---
def weekly_req(forecast, start, end):
  days_to_sunday = (6 - start.weekday()) % 7  # Sunday = 6
  cursor = start + timedelta(days=days_to_sunday)
  cursor = cursor.replace(hour=0, minute=0, second=0, microsecond=0)

  first_week_start = None
  last_week_end = None

  while cursor <= end:
    week_start = cursor - timedelta(days=6)
    weekly = w_forecast[w_forecast['ds'].dt.date == cursor.date()]

    if not weekly.empty:
      forecast['forecast']['weekly'].append({
        "week_start": week_start.strftime('%Y-%m-%d'),
        "week_end": cursor.strftime('%Y-%m-%d'),
        "value": int(weekly['yhat'].values[0])
      })

      if first_week_start is None:
          first_week_start = week_start
      last_week_end = cursor

    cursor += timedelta(days=7)

  return first_week_start, last_week_end

# --- Monthly ---
def monthly_req(forecast, start, end):
  from calendar import monthrange

  cursor = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
  first_valid = None
  last_valid = None

  while cursor <= end:
    last_day = monthrange(cursor.year, cursor.month)[1]
    month_end = cursor.replace(day=last_day)
    month_data = m_forecast[m_forecast['ds'].dt.date == month_end.date()]

    if not month_data.empty:
      forecast['forecast']['monthly'].append({
        "month_start": cursor.strftime('%Y-%m-%d'),
        "month_end": month_end.strftime('%Y-%m-%d'),
        "value": int(month_data['yhat'].values[0])
      })

      if not first_valid:
        first_valid = cursor
      last_valid = month_end

    cursor = (cursor + relativedelta(months=1)).replace(day=1)

  return first_valid, last_valid


# --- ADMIN/PERSONNEL/LGU ---
def admin_prediction_req(req):
  forecast = {
    "request_date": req,
    "forecast": {
      "monthly": [],
      "weekly": [],
      "daily": [],
      "hourly": []
    }
  }

  start = pd.to_datetime(req['start'])
  end = pd.to_datetime(req['end'])

  diff = end - start # get the difference to know the date distannce
  # extract days, seconds
  days = diff.days
  remaining_hrs = diff.seconds // 3600

  if days < 2:
    hourly_req(forecast, start, end)

  elif days < 14:
    daily_req(forecast, remaining_hrs, days, start, end)

  elif days < 45:
    first_week_start, last_week_end = weekly_req(forecast, start, end)

    if first_week_start and start < first_week_start:
      daily_req(
        forecast,
        0,
        (first_week_start - start).days,
        start,
        first_week_start - timedelta(seconds=1)
      )

    if last_week_end and end > last_week_end:
      daily_req(
        forecast,
        0,
        (end - last_week_end).days,
        last_week_end + timedelta(seconds=1),
        end
      )

  else:
    first_month_start, last_month_end = monthly_req(forecast, start, end)

    # Fill leftover days before first full month
    if first_month_start and start < first_month_start:
      days_before = (first_month_start - start).days
      daily_req(
        forecast,
        0,
        days_before,
        start,
        first_month_start - timedelta(seconds=1)
      )

    # Fill leftover days after last full month
    if last_month_end and end > last_month_end:
      days_after = (end - last_month_end).days
      daily_req(
        forecast,
        0,
        days_after,
        last_month_end + timedelta(seconds=1),
        end
      )

  return forecast


# --- ENDUSER/COMMUTERS/DRIVERS/CITIIZEN ---
def user_prediction_req(req):
  forecast = {
    "request_time": req,
    "forecast": []
  }

  start_time = pd.to_datetime(req['time'])
  end_time = start_time + timedelta(hours=5)

  prediction = h_forecast[
    (h_forecast['ds'] >= start_time) &
    (h_forecast['ds'] <= end_time)
  ]
  for ts, val in zip(prediction['ds'], prediction['yhat']):
    forecast['forecast'].append({
      'time': ts.isoformat(),
      'value': int(val)
    })

  return forecast
