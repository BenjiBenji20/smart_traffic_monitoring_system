from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import prediction_summary, prediction_detail
from src.traffic_ai.traffic_forecast.traffic_factors_manager import get_traffic_factors
from src.traffic_ai.traffic_recommendation.traffic_data_summarizer import calculate

traffic_factors: dict = get_traffic_factors()

def extract_factor_per_analytics(analytics, factors, entry, time):
  factor = next (
    (f for f in factors if f[time] == analytics[entry][time])
  )  
  
  return {
    'base_traffic': factor['base_traffic'],
    'contributing_factors': factor['contributing_factors'],
    'net_impact': factor['net_impact'],
    'final_prediction': factor['final_prediction']
  }


def get_today_analytics_w_factors():
  prediction_summary_w_analytics: dict = prediction_summary()
  today_analytics: dict = prediction_summary_w_analytics['today_analytics']
  today_factors: dict = traffic_factors['hourly']
  
  return {
    'peak': {
      'time': today_analytics['peak']['time'],
      'value': today_analytics['peak']['value'],
      'condition': today_analytics['peak']['condition'],
      'factors': extract_factor_per_analytics(today_analytics, today_factors, 'peak', 'time')
    },
    'low': {
      'time': today_analytics['low']['time'],
      'value': today_analytics['low']['value'],
      'condition': today_analytics['low']['condition'],
      'factors': extract_factor_per_analytics(today_analytics, today_factors, 'low', 'time')
    }
  }
  

def get_daily_analytics_w_factors():
  daily_data = prediction_detail()['daily']
  daily_factors: dict = traffic_factors['daily']
  daily_analytics: dict = calculate(daily_data)
  
  return {
    'peak': {
      'date': daily_analytics['peak']['date'],
      'value': daily_analytics['peak']['value'],
      'condition': daily_analytics['peak']['condition'],
      'factors': extract_factor_per_analytics(daily_analytics, daily_factors, 'peak', 'date')
    },
    'low': {
      'date': daily_analytics['low']['date'],
      'value': daily_analytics['low']['value'],
      'condition': daily_analytics['low']['condition'],
      'factors': extract_factor_per_analytics(daily_analytics, daily_factors, 'low', 'date')
    }
  }
  
  
def get_weekly_analytics_w_factors():
  weekly_data = prediction_detail()['weekly']
  weekly_factors: dict = traffic_factors['weekly']
  weekly_analytics: dict = calculate(weekly_data)
  
  return {
    'peak': {
      'week_start': weekly_analytics['peak']['week_start'],
      'week_end': weekly_analytics['peak']['week_end'],
      'value': weekly_analytics['peak']['value'],
      'condition': weekly_analytics['peak']['condition'],
      'factors': extract_factor_per_analytics(weekly_analytics, weekly_factors, 'peak', 'week_start')
    },
    'low': {
      'week_start': weekly_analytics['low']['week_start'],
      'week_end': weekly_analytics['low']['week_end'],
      'value': weekly_analytics['low']['value'],
      'condition': weekly_analytics['low']['condition'],
      'factors': extract_factor_per_analytics(weekly_analytics, weekly_factors, 'low', 'week_start')
    }
  }
  
  
def get_monthly_analytics_w_factors():
  monthly_data = prediction_detail()['monthly']
  monthly_factors: dict = traffic_factors['monthly']
  monthly_analytics: dict = calculate(monthly_data)
  
  return {
    'peak': {
      'month': monthly_analytics['peak']['month'],
      'value': monthly_analytics['peak']['value'],
      'condition': monthly_analytics['peak']['condition'],
      'factors': extract_factor_per_analytics(monthly_analytics, monthly_factors, 'peak', 'month')
    },
    'low': {
      'month': monthly_analytics['low']['month'],
      'value': monthly_analytics['low']['value'],
      'condition': monthly_analytics['low']['condition'],
      'factors': extract_factor_per_analytics(monthly_analytics, monthly_factors, 'low', 'month')
    }
  }


def get_analytics_w_factors():
  """Combined all analytics with factors"""
  return {
    'hourly': get_today_analytics_w_factors(),
    'daily': get_daily_analytics_w_factors(),
    'weekly': get_weekly_analytics_w_factors(),
    'monthly': get_monthly_analytics_w_factors()
  }
  
