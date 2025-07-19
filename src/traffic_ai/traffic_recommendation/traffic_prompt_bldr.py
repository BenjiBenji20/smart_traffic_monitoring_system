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

def main():
  d1 = {'today': '2025-07-19T00:00:00', 'vhcl_today_sum': 87713, 'current_week_range': {'start': '2025-07-14', 'end': '2025-07-20'}, 'vhcl_current_week_sum': 664448, 'three_months_range': {'start': '2025-07-01', 'end': '2025-09-30'}, 'vhcl_three_months_sum': 8357175}

  d2 = {'hourly': [{'time': '2025-07-19T00:00:00', 'value': 3888}, {'time': '2025-07-19T01:00:00', 'value': 3948}, {'time': '2025-07-19T02:00:00', 'value': 3960}, {'time': '2025-07-19T03:00:00', 'value': 3946}, {'time': '2025-07-19T04:00:00', 'value': 3934}, {'time': '2025-07-19T05:00:00', 'value': 3947}, {'time': '2025-07-19T06:00:00', 'value': 3990}, {'time': '2025-07-19T07:00:00', 'value': 4038}, {'time': '2025-07-19T08:00:00', 'value': 4049}, {'time': '2025-07-19T09:00:00', 'value': 3992}, {'time': '2025-07-19T10:00:00', 'value': 3869}, {'time': '2025-07-19T11:00:00', 'value': 3722}, {'time': '2025-07-19T12:00:00', 'value': 3602}, {'time': '2025-07-19T13:00:00', 'value': 3537}, {'time': '2025-07-19T14:00:00', 'value': 3511}, {'time': '2025-07-19T15:00:00', 'value': 3475}, {'time': '2025-07-19T16:00:00', 'value': 3391}, {'time': '2025-07-19T17:00:00', 'value': 3263}, {'time': '2025-07-19T18:00:00', 'value': 3139}, {'time': '2025-07-19T19:00:00', 'value': 3080}, {'time': '2025-07-19T20:00:00', 'value': 3122}, {'time': '2025-07-19T21:00:00', 'value': 3254}, {'time': '2025-07-19T22:00:00', 'value': 3435}, {'time': '2025-07-19T23:00:00', 'value': 3610}], 'daily': [{'date': '2025-07-14', 'value': 94200}, {'date': '2025-07-15', 'value': 100437}, {'date': '2025-07-16', 'value': 100288}, {'date': '2025-07-17', 'value': 99220}, {'date': '2025-07-18', 'value': 94648}, {'date': '2025-07-19', 'value': 87713}, {'date': '2025-07-20', 'value': 87939}], 'weekly': [{'week_start': '2025-06-30', 'week_end': '2025-07-06', 'value': 671663}, {'week_start': '2025-07-07', 'week_end': '2025-07-13', 'value': 685660}, {'week_start': '2025-07-14', 'week_end': '2025-07-20', 'value': 664448}, {'week_start': '2025-07-21', 'week_end': '2025-07-27', 'value': 629079}, {'week_start': '2025-07-28', 'week_end': '2025-08-03', 'value': 594626}, {'week_start': '2025-08-04', 'week_end': '2025-08-10', 'value': 602957}, {'week_start': '2025-08-11', 'week_end': '2025-08-17', 'value': 635621}, {'week_start': '2025-08-18', 'week_end': '2025-08-24', 'value': 618146}, {'week_start': '2025-08-25', 'week_end': '2025-08-31', 'value': 610589}, {'week_start': '2025-09-01', 'week_end': '2025-09-07', 'value': 615768}, {'week_start': '2025-09-08', 'week_end': '2025-09-14', 'value': 624926}, {'week_start': '2025-09-15', 'week_end': '2025-09-21', 'value': 649993}, {'week_start': '2025-09-22', 'week_end': '2025-09-28', 'value': 660599}, {'week_start': '2025-09-29', 'week_end': '2025-10-05', 'value': 662292}, {'week_start': '2025-10-06', 'week_end': '2025-10-12', 'value': 614053}, {'week_start': '2025-10-13', 'week_end': '2025-10-19', 'value': 608027}], 'monthly': [{'month': '2025-01-31', 'value': 2533597}, {'month': '2025-02-28', 'value': 2350706}, {'month': '2025-03-31', 'value': 2776051}, {'month': '2025-04-30', 'value': 2744207}, {'month': '2025-05-31', 'value': 2853825}, {'month': '2025-06-30', 'value': 2703008}, {'month': '2025-07-31', 'value': 2894973}, {'month': '2025-08-31', 'value': 2718664}, {'month': '2025-09-30', 'value': 2743538}, {'month': '2025-10-31', 'value': 2800834}, {'month': '2025-11-30', 'value': 2745254}, {'month': '2025-12-31', 'value': 2692450}]} 

  a = sum_summary(d1)
  b = hourly_summary(d2)
  c = daily_summary(d2)
  d = weekly_summary(d2)
  e = monthly_summary(d2)

  print(f"{summary_prompt(a)}\n\n\n")
  print(f"{hourly_prompt(b)}\n\n\n")
  print(f"{daily_prompt(c)}\n\n\n")
  print(f"{weekly_prompt(d)}\n\n\n")
  print(f"{monthly_prompt(e)}\n\n\n")

  print("Hello World!")

if __name__ == "__main__":
  main()