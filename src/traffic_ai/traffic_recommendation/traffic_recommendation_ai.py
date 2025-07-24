"""
Mixtral 8x7B Instruct free api key from openrouter

response time to answer sequentially the 5 propmpts -> 30 seconds
"""
import time
from openai import OpenAI
from dotenv import load_dotenv
import sys
import os

# Append the src/traffic_ai folder to sys.path
current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))  # this points to traffic_ai/
sys.path.append(parent_dir)

from traffic_ai.traffic_forecast.traffic_prediction_json_bldr import *
from traffic_ai.traffic_recommendation.traffic_data_summarizer import *
from traffic_ai.traffic_recommendation.traffic_prompt_bldr import *

def config():
  load_dotenv()

class AIRecommendation:
  def __init__(self, d1, d2, user_type):
    # extract summary and convert to prompt using prompt builder
    sum_s = sum_summary(d1)
    hour_s = hourly_summary(d2)
    day_s = daily_summary(d2)
    week_s = weekly_summary(d2)
    month_s = monthly_summary(d2)

    # build prompt
    self.prompt = {
      'sp': summary_prompt(sum_s, user_type),
      'hp': hourly_prompt(hour_s, user_type),
      'dp': daily_prompt(day_s, user_type),
      'wp': weekly_prompt(week_s, user_type),
      'mp': monthly_prompt(month_s, user_type)
    }

    # ai generated recommendation hand;er variables
    self.ai_recommendation = {
      'summary_reco': None,
      'hourly_reco': None,
      'daily_reco': None,
      'weekly_reco': None,
      'monthly_reco': None
    }

    # initialize client
    config()

    self.client = OpenAI(
      base_url="https://openrouter.ai/api/v1",
      api_key=os.getenv('ai_api_key'),
    )


  def client_chat(self, prompt):
    self.completion = self.client.chat.completions.create(
      model="mistralai/mixtral-8x7b-instruct",
      messages=[
        {
          "role": "user",
          "content": prompt
        }
      ]
    )

    return self.completion


  def recommendation(self):
    for (key, prompt) in zip(self.ai_recommendation.keys(), self.prompt.values()):
      if self.ai_recommendation[key] is not None:
        continue # if the key has already made ai recommendation, skip it

      try:
        # pass the prompt to ai
        comp = self.client_chat(prompt)
        # pass as value the ai generated recommendation to the dictionary
        self.ai_recommendation[key] = comp.choices[0].message.content
        time.sleep(3) # 3 seconds idle to avoid internet problem
      except Exception as e:
        raise ConnectionError(f"Failed client connection from {self.client}")
      
    return self.ai_recommendation
        

def main():
  d1 = prediction_summary()
  d2 = prediction_detail() 

  reco = AIRecommendation(d1=d1, d2=d2, user_type='enduser')

  r = reco.recommendation()
  for val in r.values():
    print(f"{val}\n\n------------------------------------------------------------------------------")

if __name__ == "__main__":
  main()