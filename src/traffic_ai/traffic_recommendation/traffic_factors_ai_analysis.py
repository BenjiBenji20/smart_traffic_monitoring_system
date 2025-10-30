"""
Mixtral 8x7B Instruct free api key from openrouter

response time to answer sequentially the 5 propmpts -> 30 seconds
"""
from datetime import datetime
import json
from pathlib import Path
import time
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv
import sys
import os

# Append the src/traffic_ai folder to sys.path
current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))  # this points to traffic_ai/
sys.path.append(parent_dir)

from src.traffic_ai.traffic_recommendation.traffic_analytics_w_factors import *
from src.traffic_ai.traffic_recommendation.traffic_prompt_bldr import (
  analyze_hourly_factors_prompt, analyze_daily_factors_prompt,
  analyze_weekly_factors_prompt, analyze_monthly_factors_prompt
)


class AITrafficFactorsAnalysis:
  def __init__(self):
    # prompt handler
    self.prompts = {
      'hp': None,
      'dp': None,
      'wp': None,
      'mp': None,
    }
    
    # ai generated analysis hand;er variables
    self.factors_ai_analysis = {
      'hourly_anal': None,
      'daily_anal': None,
      'weekly_anal': None,
      'monthly_anal': None
    }
    
    load_dotenv()
    
    self.client = Groq(
      api_key=os.getenv('AI_API_KEY'),
    )
    
    self.CACHE_DIR = Path(__file__).resolve().parents[3] / 'cache'
    self.ANALYSIS_CACHE_FILE = self.CACHE_DIR / 'daily_traffic_factors_analysis.json'
    
    self.anal_json = {}
    self.max_retries = 3
    self.timeout = 5
    
    
  def client_chat(self, prompt, max_tokens=2000):
    """Enhanced client chat with timeout and token limits"""
    for attempt in range(self.max_retries):
      try:
        completion = self.client.chat.completions.create(
          model="openai/gpt-oss-120b",
          messages=[{"role": "user", "content": prompt}],
          max_tokens=max_tokens,
          temperature=0.1,  
          timeout=self.timeout
        )
        
        return completion
      except Exception as e:
        print(f"Attempt {attempt + 1} failed: {e}")
        if attempt == self.max_retries - 1:
          raise ConnectionError(f"Failed after {self.max_retries} attempts: {e}")
        time.sleep(2)
  
  
  def ai_analysis_today_exists(self):
    if not self.ANALYSIS_CACHE_FILE.exists():
      return False
    # checks the last time when the file was edited
    modified_time = datetime.fromtimestamp(self.ANALYSIS_CACHE_FILE.stat().st_mtime)
    return modified_time.date() == datetime.today().date()
  
  
  def load_ai_analysis_today(self):
    with open(self.ANALYSIS_CACHE_FILE, 'r') as f:
      self.anal_json = json.load(f)
      self.factors_ai_analysis = dict(self.anal_json)
      
    return self.anal_json
  
  
  def generate_ai_analysis(self):
    # build prompt
    self.prompts = {
      'hp': analyze_hourly_factors_prompt(get_today_analytics_w_factors()),
      'dp': analyze_daily_factors_prompt(get_daily_analytics_w_factors()),
      'wp': analyze_weekly_factors_prompt(get_weekly_analytics_w_factors()),
      'mp': analyze_monthly_factors_prompt(get_monthly_analytics_w_factors())
    }
    
    for (key, prompt) in zip(self.factors_ai_analysis.keys(), self.prompts.values()):
      try:
        print("Delivering AI Analysis for Traffic Factors...\n\n")
        ai = self.client_chat(prompt)
        
        ai_res = ai.choices[0].message.content
        # store ai generated analysis to the dict handler
        self.factors_ai_analysis[key] = ai_res
        
        self.anal_json[key] = ai_res
      except Exception as e:
        raise ConnectionError(f"Failed client connection: {e}")
      
    # store to json cache file
    self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(self.ANALYSIS_CACHE_FILE, 'w') as f:
      json.dump(self.anal_json, f, indent=2)
      
    return self.anal_json
        
        
  def get_traffic_factors_ai_analysis(self):
    if not self.ai_analysis_today_exists():
      return self.generate_ai_analysis()
    
    print("AI Analysis cache today exists and fresh!")
    return self.load_ai_analysis_today()
  