import mysql.connector as conn
from mysql.connector import Error
from dotenv import load_dotenv
import os

def sql_connection():
  load_dotenv()

  try:
    # establish connection
    c = conn.connect(
      host=os.getenv('MYSQL_HOST'),
      password=os.getenv('MYSQL_PASSWORD'), # include mu nlng pass 
      user=os.getenv('MYSQL_USER'), # eto den
      database=os.getenv('MYSQL_DATABASE')
    )

    if c.is_connected():
      print("SQL database successfully connected!")
      return c
  except Error as e:
    print(f"An expected SQL Database connection ocurred: {e}")


def main():
  print(sql_connection())


if __name__ == "__main__":
  main()