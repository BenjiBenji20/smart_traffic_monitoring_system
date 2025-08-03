from configs.db_connection import sql_connection
from mysql.connector import Error
from pathlib import Path
import pandas as pd

def csv_to_sql(path, table_name):
  try:
    df = pd.read_csv(path)

    conn = sql_connection()

    cursor = conn.cursor()

    # create table and insert column from csv to db table
    create_tbl_query = f"CREATE TABLE {table_name} (ds DATETIME NOT NULL, y INT NOT NULL)"
    cursor.execute(create_tbl_query)
    for index, row in df.iterrows():
      query = "INSERT INTO prophet_trainig_data (ds, y) VALUES (%s, %s)"
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
  data_path = Path(__file__).resolve().parents[1] / 'data' / 'processed' / 'vehicle-data-feed-prophet-model.csv'
  csv_to_sql(data_path, 'prophet_trainig_data')


if __name__ == "__main__":
  main()