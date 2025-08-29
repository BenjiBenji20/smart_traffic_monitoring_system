import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from configs.db_connection import sql_connection
from mysql.connector import Error
from pathlib import Path
import pandas as pd

def csv_to_sql(path, table_name):
  try:
    df = pd.read_csv(path, sep=";")
    # enforece column
    df.columns = ["ds", "y"]
    
    # enfore correct data type
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = pd.to_numeric(df["y"], errors="coerce")  # invalid values become NaN

    # drop any rows with NaN
    df.dropna(inplace=True)
    
    conn = sql_connection()

    cursor = conn.cursor()

    # create table and insert column from csv to db table
    create_tbl_query = f"CREATE TABLE {table_name} (ds DATETIME NOT NULL, y INT NOT NULL)"
    cursor.execute(create_tbl_query)
    for index, row in df.iterrows():
      query = f"INSERT INTO {table_name} (ds, y) VALUES (%s, %s)"
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
  csv_to_sql("prophet_training_data.csv", 'prophet_training_data')


if __name__ == "__main__":
  main()