import mysql.connector as conn
from mysql.connector import Error
from dotenv import load_dotenv
import os

def sql_connection():
  load_dotenv()

  try:
    # establish connection
    c = conn.connect(
      host=os.getenv('mysql_host'),
      password=os.getenv('mysql_password'), # include mu nlng pass 
      user=os.getenv('mysql_user'), # eto den
      database=os.getenv('mysql_database')
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