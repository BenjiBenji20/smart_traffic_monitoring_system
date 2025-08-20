import mysql.connector as conn
from mysql.connector import Error
from dotenv import load_dotenv
import os

def sql_connection():
  load_dotenv()

  try:
    # establish connection
    c = conn.connect(
      os.getenv('MYSQL_PUBLIC_URL')
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