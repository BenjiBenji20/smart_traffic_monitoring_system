"""
  This script has 5 functions to build a prompt of time series traffic forecast by Prophet model.
  The prompt will be use to send to distilgpt2 model, an AI mondel trained to generate english, human readable response.

  Enhance pa sa future if needed, Bali separate functions kasi separate prompts and separate responses ang gagawin
"""
from traffic_data_summarizer import *

concat = ("Give a short yet detailed road recommendation for each prediction summary Peak, Lowest and Average \nto enhance Malabon LGU Road Decision Making.\n\n"
"Ex.: (you can recommend this example)"
"\n- Road rehabilitation must move to date with low vehicle counts"
"\n- Any road activity must move to date with low vehicle counts"
"\n- Assign more traffic personnel at the area to date with low vehicle counts"
"\n\n!!!STRICKLY!!!: Give your direct answer. Dont give an introduction. Just start with the anwer already."
"\nYour response will be use during capstone demo"
"\n\nNote:\n-The collected vehicle data are from Malabon City, Barangay Longos C-4"
"\n-Give a short, proper and realistic recommendation"
)


def summary_prompt(summ_data):
  # extract each summ_data accordingly
  today = summ_data['today']
  t_sum = summ_data['vhcl_today_sum']
  cat = summ_data['category']
  cw_range = summ_data['current_week_range']
  cw_sum = summ_data['vhcl_current_week_sum']
  tm_range = summ_data['three_months_range']
  tm_sum = summ_data['vhcl_three_months_sum']

  return f"Summary of Traffic Prediction for This Year:\n\
Today {today[:10]}: total of {t_sum:,} Vehicles, which is {cat} of volume category\n\n\
This week from {cw_range['start']} to {cw_range['end']}: total of {cw_sum} Vehicles\n\
Three Months from {tm_range['start']} to {tm_range['end']}: total of {tm_sum} Vehicles\n\n\
{concat}"


def hourly_prompt(hourly_data):
  peak_hour = hourly_data['peak']
  low_hour = hourly_data['low']
  avg_hour = hourly_data['avg']

  return f"Hourly Traffic Prediction Today:\n\
Peak Hour: {peak_hour['time'][-8:-3]} - Vehicles: {peak_hour['value']}\n\
Lowest Hour: {low_hour['time'][-8:-3]} - Vehicles: {low_hour['value']}\n\
Average Vehicles: {avg_hour}\n\n\
{concat}"


def daily_prompt(daily_data):
  date_range = daily_data['date_range']
  peak = daily_data['peak']
  low = daily_data['low']
  avg = daily_data['avg']

  return (
    f"Daily Traffic Prediction Summary\n"
    f"Date Range: {date_range['start']} to {date_range['end']}\n\n"
    f"Peak Day: {peak['date']} with {peak['value']:,} vehicles\n"
    f"Lowest Day: {low['date']} with {low['value']:,} vehicles\n"
    f"Average Vehicles per Day: {avg:,}\n\n"
    f"{concat}"
  )


def weekly_prompt(weekly_data):
  week_range = weekly_data['week_range']
  peak = weekly_data['peak']
  low = weekly_data['low']
  avg = weekly_data['avg']

  return (
    f"Weekly Traffic Prediction Summary\n"
    f"Week Range: {week_range['start']} to {week_range['end']}\n\n"
    f"Peak Week: {peak['week_start']} to {peak['week_end']} with {peak['value']:,} vehicles\n"
    f"Lowest Week: {low['week_start']} to {low['week_end']} with {low['value']:,} vehicles\n"
    f"Average Vehicles per Week: {avg:,}\n\n"
    f"{concat}"
  )


def monthly_prompt(monthly_data):
  month_range = monthly_data['month_range']
  peak = monthly_data['peak']
  low = monthly_data['low']
  avg = monthly_data['avg']

  return (
    f"Monthly Traffic Prediction Summary\n"
    f"Month Range: {month_range['start']} to {month_range['end']}\n\n"
    f"Peak Month: {peak['month']} with {peak['value']:,} vehicles\n"
    f"Lowest Month: {low['month']} with {low['value']:,} vehicles\n"
    f"Average Vehicles per Month: {avg:,}\n\n"
    f"{concat}"
  )
