from configs.db_connection import sql_connection
from mysql.connector import Error
from pathlib import Path
import pandas as pd

def csv_to_sql(path, table_name):
  try:
    df = pd.read_csv(path)
    
    # convert column types accepted by prophet
    df['ds'] = pd.to_datetime(df['ds'])
    df['y'] = pd.to_numeric(df['y'])
    df['weather_rain_mm'] = pd.to_numeric(df['weather_rain_mm'])
    df['is_special_holiday'] = df['is_special_holiday'].astype(bool)
    df['is_regular_holiday'] = df['is_regular_holiday'].astype(bool)
    df['holiday_flag'] = df['holiday_flag'].astype(bool)
    df['accident_flag'] = df['accident_flag'].astype(bool)
    df['week_day'] = pd.to_numeric(df['week_day'])
    df['is_monday'] = df['is_monday'].astype(bool)
    df['is_tuesday'] = df['is_tuesday'].astype(bool)
    df['is_wednesday'] = df['is_wednesday'].astype(bool)
    df['is_thursday'] = df['is_thursday'].astype(bool)
    df['is_friday'] = df['is_friday'].astype(bool)
    df['is_saturday'] = df['is_saturday'].astype(bool)
    df['is_sunday'] = df['is_sunday'].astype(bool)

    conn = sql_connection()

    cursor = conn.cursor()

    # create table and insert column from csv to db table
    create_tbl_query = (
      f"CREATE TABLE {table_name}" 
      " ("
        "ds DATETIME NOT NULL, y INT NOT NULL, "
        "weather_rain_mm INT NOT NULL, is_special_holiday TINYINT(1) NOT NULL, "
        "is_regular_holiday TINYINT(1) NOT NULL, holiday_flag TINYINT(1) NOT NULL, "
        "accident_flag TINYINT(1) NOT NULL, week_day INT NOT NULL, "
        "is_monday TINYINT(1) NOT NULL, is_tuesday TINYINT(1) NOT NULL, "
        "is_wednesday TINYINT(1) NOT NULL, is_thursday TINYINT(1) NOT NULL, "
        "is_friday TINYINT(1) NOT NULL, is_saturday TINYINT(1) NOT NULL, "
        "is_sunday TINYINT(1) NOT NULL"
      ")"
    )
    
    # insert row by row (not optimized pero pwede na :>)
    cursor.execute(create_tbl_query)
    for index, row in df.iterrows():
      query = (
        f"INSERT INTO {table_name}" 
        " ("
          "ds, y, "
          "weather_rain_mm, is_special_holiday, "
          "is_regular_holiday, holiday_flag, "
          "accident_flag, week_day, "
          "is_monday, is_tuesday, "
          "is_wednesday, is_thursday, "
          "is_friday, is_saturday, "
          "is_sunday"
        ")"
        " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
      )
      cursor.execute(query, tuple(row))

    # commit and close
    conn.commit()
    print(f"Data from {path} transferred successfully.")

  except Error as e:
    print(f"An expected SQL Database connection ocurred: {e}")
  finally:
    if conn.is_connected():
      conn.close() # close connection
      cursor.close()


def main():
  data_path = Path(__file__).resolve().parents[1] / 'data' / 'processed' / 'prophet_dataset.csv'
  csv_to_sql(data_path, 'prophet_dataset')


if __name__ == "__main__":
  main()