import pandas as pd
from traffic_ai.traffic_forecast.prophet_modeling import ProphetModel
from datetime import datetime
import json
from pathlib import Path
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# cd to cache dir
CACHE_DIR = Path(__file__).resolve().parents[3] / 'cache'
# create cache file json
CACHE_FILE = CACHE_DIR / 'daily_forecast.json'


def forecast_today_exist():
  # checks if the file exists
  if not CACHE_FILE.exists():
    return False
  # checks the last time when the file was edited
  modified_time = datetime.fromtimestamp(CACHE_FILE.stat().st_mtime)
  # if today's date and the date the file was modified is same, return true (meaning the file's content is fresh)
  return modified_time.date() == datetime.today().date() 


def generate_forecast():
  load_dotenv()
  # db connection
  engine = create_engine(f"mysql+pymysql://{os.getenv('mysql_user')}:{os.getenv('mysql_password')}@{os.getenv('mysql_host')}/{os.getenv('mysql_database')}")

  # sql query
  query = "SELECT ds, y FROM vehicle_aggregated"

  # train the modelusing the class
  model = ProphetModel(query, engine=engine)
  model.train_model()

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
  with open(CACHE_FILE, 'w') as f:
      json.dump({k: v.to_dict(orient='records') for k, v in forecast_json.items()}, f, indent=2)

  return forecast_json


def get_forecast():
  if forecast_today_exist():
      with open(CACHE_FILE, 'r') as f:
          raw = json.load(f)

      # Convert back into DataFrames and restore datetime format
      forecast = {}
      for key, records in raw.items():
        df = pd.DataFrame(records)
        df['ds'] = pd.to_datetime(df['ds'])
        forecast[key] = df
      return forecast

  return generate_forecast()
  

def main():
  forecast = get_forecast()
  print(forecast)

if __name__ == '__main__':
  main()