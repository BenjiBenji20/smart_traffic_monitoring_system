"""
Mixtral 8x7B Instruct free api key from openrouter
"""

from openai import OpenAI
from dotenv import load_dotenv
import os

def config():
  load_dotenv()

config()

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv('ai_api_key'),
)

prompt = """Summary of Traffic Prediction for This Year:
Today 2025-07-19: total of 87,713 Vehicles, which is congested of volume category

This week from 2025-07-14 to 2025-07-20: total of 664448 Vehicles
Three Months from 2025-07-01 to 2025-09-30: total of 8357175 Vehicles

Give a short yet detailed road recommendation for each prediction summary Peak, Lowest and Average 
to enhance Malabon LGU Road Decision Making.

Ex.: (you can recommend this example)
- Road rehabilitation must move to date with low vehicle counts
- Any road activity must move to date with low vehicle counts
- Assign more traffic personnel at the area to date with low vehicle counts

!!!STRICKLY!!!: Give your direct answer. Dont give an introduction. Just start with the anwer already.
Your response will be use during capstone demo

Note:
-The collected vehicle data are from Malabon City, Barangay Longos C-4
-Give a short, proper and realistic recommendation
"""

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  extra_body={},
  model="mistralai/mixtral-8x7b-instruct",
  messages=[
    {
      "role": "user",
      "content": prompt
    }
  ]
)
print(completion.choices[0].message.content)