"""
  This script will be use to calculate and create a summarized of type string
  of traffic data generated from traffic_forecast.traffic_prediction_json_bldr.py

  The generated summary will then be use to concatenate to prompt for AI model
  recommendation generator.
"""
def determine_traffic_condition(value):
  con_th, mod_th, free_th = 1000, 500, 100 # traffic threshold pede pa baguhin to
  condition = None

  if value >= con_th:
    condition = 'congested'
  elif value >= mod_th & value < con_th:
    condition = 'moderate'
  else:
    condition = 'free'

  return condition


def sum_summary(data):
  # Extract and summarize necessary values
  today = data['today']
  t_sum = data['vhcl_today_sum']
  condition = determine_traffic_condition(t_sum)

  cw_range = data['current_week_range']
  cw_sum = data['vhcl_current_week_sum']

  tm_range = data['three_months_range']
  tm_sum = data['vhcl_three_months_sum']

  return {
      'today': today,
      'vhcl_today_sum': t_sum,
      'condition': condition,
      'current_week_range': cw_range,
      'vhcl_current_week_sum': cw_sum,
      'three_months_range': tm_range,
      'vhcl_three_months_sum': tm_sum
  }


def calculate(data):
  peak = max(data, key=lambda x: x['value'])
  peak['condition'] = determine_traffic_condition(peak['value'])

  low = min(data, key=lambda x: x['value'])
  low['condition'] = determine_traffic_condition(low['value'])

  avg = sum((x['value'] for x in data)) // len(data)
  return {
    'peak': peak,
    'low': low,
    'avg': avg
  }


def hourly_summary(data):
  return calculate(data['hourly'])


def daily_summary(data):
  daily_vals = data['daily']
  res = calculate(daily_vals)

  summary = {
    'date_range': {
      'start': daily_vals[0]['date'],
      'end': daily_vals[-1]['date']
    },
    **res
  }
  return summary


def weekly_summary(data):
  weekly_vals = data['weekly']
  res = calculate(weekly_vals)

  summary = {
    'week_range': {
      'start': weekly_vals[0]['week_start'],
      'end': weekly_vals[-1]['week_end']
    },
    **res
  }
  return summary


def monthly_summary(data):
  monthly_vals = data['monthly']
  res = calculate(monthly_vals)

  summary = {
    'month_range': {
      'start': monthly_vals[0]['month'],
      'end': monthly_vals[-1]['month']
    },
    **res # merge 'peak', 'low', and 'avg' into the summary
  }
  return summary


def end_user_req_summary(data):
  vals = data['forecast']

  # determine max, min and average
  peak_hour = max(vals, key=lambda x: x['value'])
  low_hour = min(vals, key=lambda x: x['value'])
  avg_hour = sum(x['value'] for x in vals) // len(vals)

  return {
    'request_time': data['request_time'],
    'response_range': {
      'start': data['request_time'],
      'end': data['forecast'][-1]['time'] # get the last time
    },
    'peak': peak_hour,
    'low': low_hour,
    'avg': avg_hour
  }


def admin_req_summary(data):
  # extract each value
  m_data = data['forecast']['monthly']
  w_data = data['forecast']['weekly']
  d_data = data['forecast']['daily']
  h_data = data['forecast']['hourly']

  summary = {
    'request_date': data['request_date'],
    'monthly': [],
    'weekly': [],
    'daily': [],
    'hourly': []
  }
  # check if there's a value, if true then bgean summarizing
  if m_data:
    res = calculate(m_data)
    summary['monthly'].append(res)

  if w_data:
    res = calculate(w_data)
    summary['weekly'].append(res)

  if d_data:
    res = calculate(d_data)
    summary['daily'].append(res)

  if h_data:
    res = calculate(h_data)
    summary['hourly'].append(res)

  return summary
