import calendar
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
# get weekly sum forecast for current 
week_range = f"{(today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')} to \
{(today + timedelta(days=6 - today.weekday())).strftime('%Y-%m-%d')}"

# function JSON schmea builder for dashboard summary
def dashboard_summary():
  y_h_sum = np.sum(hourly['yhat'])

  start_of_week = (today - timedelta(days=today.weekday())) # monday
  end_of_week = (today + timedelta(days=6 - today.weekday())) # sunday
  weekly = w_forecast[
    (w_forecast['ds'].dt.date >= start_of_week.date()) &
    (w_forecast['ds'].dt.date <= end_of_week.date()) 
  ]
  y_w_sum = np.sum(weekly['yhat'])

  # get the 3 months range from current month to 3rd months prior
  start_date = today.replace(day=1) # First day of current month
  end_month_first_day = (start_date + relativedelta(months=3)).replace(day=1) # Get first day of the 4th month (3 months ahead)
  end_date = end_month_first_day - relativedelta(days=1) # Subtract 1 day to get the **last day of the 3rd month**
  three_months_range = f"{start_date.date()} to {end_date.date()}" # Format the range

  # get prphet 3 months forecast
  three_months_forecast = m_forecast[
    (m_forecast['ds'].dt.date >= start_date.date()) &
    (m_forecast['ds'].dt.date <= end_date.date())
  ]

  y_m_sum = np.sum(three_months_forecast['yhat'])

  return {
    "current_date": str(today),
    "yhat_daily_sum": int(y_h_sum),
    "current_week": str(week_range),
    "yhat_weekly_sum": int(y_w_sum),
    "next_three_months": str(three_months_range),
    "yhat_monthly_sum": int(y_m_sum)
  }


def dashboard_result_specific():
  hrs = hourly['ds'].dt.time
  hourly_data = dict(zip(hrs.astype(str), hourly['yhat'].astype(int)))

  # get the 16 weeks prediction
  sm = today.replace(day=1) # start of month
  sw = sm - timedelta(days=sm.weekday()) # get the starting week day
  sd = sw.date()

  w = model.weekly_prediction.copy()
  w['ds'] = pd.to_datetime(w['ds'])
  w = w[w['ds'].dt.date >= sd]

  weekly = w.head(16) # 16 weeks prediction
  week_range = f"{sd} to {(sd + timedelta(weeks=16) - timedelta(days=1))}"

  weekly_data = dict(zip(weekly['ds'].astype(str), weekly['yhat'].astype(int)))

  start_of_week = (today - timedelta(days=today.weekday())) # monday
  end_of_week = (today + timedelta(days=6 - today.weekday())) # sunday
  daily = d_forecast[
    (d_forecast['ds'].dt.date >= start_of_week.date()) &
    (d_forecast['ds'].dt.date <= end_of_week.date()) 
  ]

  daily_data = dict(zip(daily['ds'].astype(str), daily['yhat'].astype(int)))

  # Get 12-month forecast for current year
  current_year = today.year
  monthly = m_forecast.copy()
  monthly['year'] = monthly['ds'].dt.year
  monthly['month'] = monthly['ds'].dt.month
  monthly = monthly[monthly['year'] == current_year]

  # Format month names and yhat
  month_names = [calendar.month_abbr[m] for m in monthly['month']]
  monthly_data = dict(zip(month_names, monthly['yhat'].round().astype(int)))

  return {
    "hourly": {
      "ds": str(today),
      "y": hourly_data,
      "summary": "",
      "recommendation": ""
    },
    "daily": {
      "ds": str(week_range),
      "y": daily_data,
      "summary": "",
      "recommendation": ""
    },
    "weekly": {
      "ds": str(week_range),
      "y": weekly_data,
      "summary": "",
      "recommendation": ""
    },
    "monthly": {
      "ds": f"{current_year}-01 to {current_year}-12",
      "y": monthly_data,
      "summary": "",
      "recommendation": ""
    }
  }

"""
  HERE FOR USER PREDICTION REQUEST
"""