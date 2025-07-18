"""
  This script will be use to calculate and create a summarized of type string
  of traffic data generated from traffic_forecast.traffic_prediction_json_bldr.py

  The generated summary will then be use to concatenate to prompt for AI model
  recommendation generator.
"""
def sum_summary(data):
  # Extract and summarize necessary values
  today = data['today']
  t_sum = data['vhcl_today_sum']

  cw_range = data['current_week_range']
  cw_sum = data['vhcl_current_week_sum']

  tm_range = data['three_months_range']
  tm_sum = data['vhcl_three_months_sum']

  return {
      'today': today,
      'vhcl_today_sum': t_sum,
      'current_week_range': cw_range,
      'vhcl_current_week_sum': cw_sum,
      'three_months_range': tm_range,
      'vhcl_three_months_sum': tm_sum
  }


def hourly_summary(data):
  # extract each data accordingly
  hourly_vals = data['hourly']['prediction']
  peak_hour = max(hourly_vals, key=lambda x: x['value'])
  low_hour = min(hourly_vals, key=lambda x: x['value'])
  avg_hour = sum(x['value'] for x in hourly_vals) // len(hourly_vals)

  return {
    'peak': peak_hour,
    'low': low_hour,
    'avg': avg_hour
  }


def daily_summary(data):
  daily_vals = data['daily']['prediction']

  date_range = {
    'start': daily_vals[0]['date'],
    'end': daily_vals[-1]['date']
  }
  peak_day = max(daily_vals, key=lambda x: x['value'])
  low_day = min(daily_vals, key=lambda x: x['value'])
  avg_day = sum((x['value'] for x in daily_vals)) // len(daily_vals)

  return {
    'date_range': date_range,
    'peak': peak_day,
    'low': low_day,
    'avg': avg_day
  }


def weekly_summary(data):
  weekly_vals = data['weekly']['prediction']

  week_range = {
    'start': weekly_vals[0]['week_start'],
    'end': weekly_vals[-1]['week_end']
  }
  peak_week = max(weekly_vals, key=lambda x: x['value'])
  low_week = min(weekly_vals, key=lambda x: x['value'])
  avg_week = sum((x['value'] for x in weekly_vals)) // len(weekly_vals)

  return {
    'week_range': week_range,
    'peak': peak_week,
    'low': low_week,
    'avg': avg_week
  }


def monthly_summary(data):
  monthly_vals = data['monthly']['prediction']

  month_range = {
    'start': monthly_vals[0]['month'],
    'end': monthly_vals[-1]['month']
  }
  peak_month = max(monthly_vals, key=lambda x: x['value'])
  low_month = min(monthly_vals, key=lambda x: x['value'])
  avg_month = sum((x['value'] for x in monthly_vals)) // len(monthly_vals)

  return {
    'month_range': month_range,
    'peak': peak_month,
    'low': low_month,
    'avg': avg_month
  }


def main():
  print("Hello World!")

if __name__ == "__main__":
  main()