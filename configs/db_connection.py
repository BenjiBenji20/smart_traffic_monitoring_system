from urllib.parse import urlparse
import mysql.connector as conn
from mysql.connector import Error
from dotenv import load_dotenv
import os

def sql_connection():
  load_dotenv()
  url = os.getenv("MYSQL_PUBLIC_URL")
  parsed = urlparse(url)

  try:
    c = conn.connect(
      user=parsed.username,
      password=parsed.password,
      host=parsed.hostname,
      port=parsed.port,
      database=parsed.path.lstrip("/")
    )

    if c.is_connected():
      print("SQL database successfully connected!")
      return c
  except Error as e:
    print(f"An expected SQL Database connection occurred: {e}")
