"""
  This script is to aggregate every individual detected vehicle data according to their date and time
  and will be stored to local sql database. This will be queried by Prophet for Time Series Foreaasting.
  column: ds for date and time and y for aggreagted vehilce count per hour

  This script will run hourly

  RUN This script in ../src/traffic_ai/vehicle_detection/vehicle-counter.py
"""

from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db, exceptions
import pandas as pd
from mysql.connector import Error
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from configs.db_connection import sql_connection

try:
  # get credential key
  cred = credentials.Certificate(r"C:\Users\imper\Documents\capstone-project-v2\configs\traffic-logs-firebase-admin-sdk.json")

  # initialize app with db URL
  firebase_admin.initialize_app(cred, {
      'databaseURL': 'https://capstone-traffic-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app/'
  })

  # get the data today
  today = pd.to_datetime(datetime.now()).date()
  ref = db.reference(f'/detected_vehicle/{today}/individual_vehicle')

  # get raw individual detected vehicle data
  raw_data = ref.get()

  records = []
  for key, value in raw_data.items():
    rec = value
    rec['firebase_key'] = key # get the firebase auto generated keys
    records.append(rec)

  main_df = pd.DataFrame(records) # this will be use for other processing

  # pass df to another df
  df = main_df.copy()

  df['time'] = pd.to_datetime(df['date']) # convert to datetime type
  df['hour'] = df['time'].dt.floor('h') # round down to hour

  # prepare y column to handle aggregate val per hour
  df['y'] = 1

  # drop column not needed by prophet
  df = df.drop(columns=[
      'class', 'confidence_score', 
      'date', 'speed_ms', 
      'time_in', 'time_out', 
      'vehicle_id', 'firebase_key'
    ])

  # aggreagte count per hour
  df = df.groupby('hour')['y'].sum().reset_index()
  # rename column
  df.rename(columns={'hour':'ds'}, inplace=True)

  print(df)

  try:
    # store ds and y to sql general_vehicle table
    table_name = 'vehicle_aggregated' # use this whenever u want to switch and read 

    conn = sql_connection() # initialize sql db
    cursor = conn.cursor()
    if conn is None:
      raise Exception("Database connection failed. `conn` is None.")
    
    # hourly insert df value
    for index, row in df.iterrows():
      # sql query
      insert_query = f"""
                      INSERT INTO {table_name} (ds, y)
                      VALUES (%s, %s)
                    """
      cursor.execute(insert_query, (row['ds'], row['y']))

    # commit and close
    conn.commit()
    print(f"Hourly data\n{df}\nhas been comitted successfully.")

  except Error as e:
    print(f"An expected SQL Database connection ocurred: {e}")
  finally:
    if conn.is_connected():
      conn.close() # close connection
      cursor.close()

except exceptions.DeadlineExceededError as e:
  print(f"[Firebase Error] Timeout occurred: {e}")
except exceptions.FirebaseError as e:
  print(f"[Firebase Error] Has occurred: {e}")
except Exception as e:
  print(f"An expected error has occurred: {e}")