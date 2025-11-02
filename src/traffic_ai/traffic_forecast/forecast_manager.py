import pandas as pd
from src.traffic_ai.traffic_forecast.prophet_modeling import ProphetModel
from datetime import datetime
import json
from pathlib import Path
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# cd to cache dir
CACHE_DIR = Path(__file__).resolve().parents[3] / 'cache'
# create cache file json
FORECAST_CACHE_FILE = CACHE_DIR / 'daily_forecast.json'


def forecast_today_exist():
  # checks if the file exists
  if not FORECAST_CACHE_FILE.exists():
    return False
  # checks the last time when the file was edited
  modified_time = datetime.fromtimestamp(FORECAST_CACHE_FILE.stat().st_mtime)
  # if today's date and the date the file was modified is same, return true (meaning the file's content is fresh)
  return modified_time.date() == datetime.today().date() 


def generate_forecast():
  model = get_prophet_object()

  # convert each dataframe into one dictionary
  forecast_json = {
    'hourly': model.hourly_prediction.copy(),
    'daily': model.daily_prediction.copy(),
    'weekly': model.weekly_prediction.copy(),
    'monthly': model.monthly_prediction.copy(),
  }

  for key in forecast_json:
      forecast_json[key]['ds'] = forecast_json[key]['ds'].astype(str)

  # convert into json and save content in daily_forecast.json file 
  CACHE_DIR.mkdir(parents=True, exist_ok=True)
  with open(FORECAST_CACHE_FILE, 'w') as f:
      json.dump({k: v.to_dict(orient='records') for k, v in forecast_json.items()}, f, indent=2)

  return forecast_json


def get_forecast():
  if forecast_today_exist():
      with open(FORECAST_CACHE_FILE, 'r') as f:
          raw = json.load(f)

      # Convert back into DataFrames and restore datetime format
      forecast = {}
      for key, records in raw.items():
        df = pd.DataFrame(records)
        df['ds'] = pd.to_datetime(df['ds'])
        forecast[key] = df
      return forecast

  return generate_forecast()


def get_prophet_object() -> ProphetModel: 
    load_dotenv()
  
    # db connection
    engine = create_engine(
      f"mysql+pymysql://"
      f"{os.getenv('MYSQL_USER')}:"
      f"{os.getenv('MYSQL_PASSWORD')}@"
      f"{os.getenv('MYSQL_HOST')}/"
      f"{os.getenv('MYSQL_DATABASE')}"
    )

    # sql query
    query = """
        SELECT 
            ds, 
            y, 
            weather_rain_mm, 
            is_special_holiday, 
            is_regular_holiday, 
            holiday_flag, 
            accident_flag, 
            week_day, 
            is_monday, 
            is_tuesday, 
            is_wednesday, 
            is_thursday, 
            is_friday, 
            is_saturday, 
            is_sunday 
        FROM vehicle_data_for_prophet
    """

    # create a prophet instance model to train it
    model = ProphetModel(query, engine=engine)
    model.train_model()
    
    return model  


def main():
  forecast = get_forecast()
  print(forecast)

if __name__ == '__main__':
  main()