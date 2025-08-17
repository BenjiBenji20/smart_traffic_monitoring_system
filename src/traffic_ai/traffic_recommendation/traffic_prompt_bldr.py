"""
  This script has 5 functions to build a prompt of time series traffic forecast by Prophet model.
  The prompt will be use to send to distilgpt2 model, an AI mondel trained to generate english, human readable response.

  Enhance pa sa future if needed, Bali separate functions kasi separate prompts and separate responses ang gagawin
"""
from src.traffic_ai.traffic_recommendation.traffic_data_summarizer import *

# prompts can be refine more to get the desired ai response
# Define role-specific prompts
ROLE_PROMPTS = {
    'admin': (
        "Give short, actionable administrative recommendations for each prediction summary (Peak, Lowest, Average) "
        "to support high-level decision making for Malabon LGU administrators.\n\n"
        "Focus on: Policy decisions, budget allocation, strategic planning, inter-departmental coordination\n\n"
        "Examples:\n"
        "- Allocate additional budget for traffic management during peak periods\n"
        "- Coordinate with barangay officials for traffic awareness campaigns\n"
        "- Schedule city council meetings to discuss traffic infrastructure improvements\n\n"
        "!!!STRICTLY!!!: Give direct answers. No introduction. Start with recommendations immediately.\n"
        "Note: Data from Malabon City, Barangay Longos C-4. Give realistic administrative recommendations."
    ),
    
    'city_engineer': (
        "Provide technical engineering recommendations for each prediction summary (Peak, Lowest, Average) "
        "to guide infrastructure planning and road engineering decisions for Malabon City.\n\n"
        "Focus on: Infrastructure planning, road design, traffic flow optimization, construction scheduling\n\n"
        "Examples:\n"
        "- Schedule road maintenance during lowest traffic volume periods\n"
        "- Install additional traffic signals at peak congestion points\n"
        "- Plan road widening projects based on traffic density patterns\n"
        "- Implement smart traffic light systems during high-volume hours\n\n"
        "!!!STRICTLY!!!: Give direct technical recommendations. No introduction.\n"
        "Note: Data from Malabon City, Barangay Longos C-4. Focus on engineering solutions."
    ),
    
    'traffic_enforcer': (
        "Provide operational enforcement recommendations for each prediction summary (Peak, Lowest, Average) "
        "to optimize traffic enforcement and personnel deployment in Malabon City.\n\n"
        "Focus on: Personnel deployment, enforcement strategies, traffic management operations\n\n"
        "Examples:\n"
        "- Deploy additional traffic personnel during peak hours\n"
        "- Implement stricter parking enforcement during high-volume periods\n"
        "- Set up temporary traffic checkpoints during low-traffic hours\n"
        "- Coordinate with mobile patrol units for traffic flow assistance\n\n"
        "!!!STRICTLY!!!: Give direct operational recommendations. No introduction.\n"
        "Note: Data from Malabon City, Barangay Longos C-4. Focus on enforcement tactics."
    ),
    
    'end_user': (
        "Give practical travel recommendations for each prediction summary (Peak, Lowest, Average) "
        "to help commuters, drivers, and citizens navigate traffic conditions effectively.\n\n"
        "Focus on: Alternative routes, travel timing, practical travel tips\n\n"
        "Examples:\n"
        "- Use alternative routes during high traffic volume periods\n"
        "- Travel earlier or later to avoid peak congestion\n"
        "- Consider public transportation during heavy traffic hours\n"
        "- Plan extra travel time during predicted high-volume periods\n\n"
        "!!!STRICTLY!!!: Give direct travel advice. No introduction.\n"
        "Note: Data from Malabon City, Barangay Longos C-4. Focus on practical commuting advice."
    )
}

def get_user_prompt(user_type):
    """Get the appropriate prompt based on user type"""
    admin_roles = {"admin", "traffic_enforcer", "city_engineer"}
    
    if user_type in ROLE_PROMPTS:
        return ROLE_PROMPTS[user_type]
    elif user_type in admin_roles:
        return ROLE_PROMPTS['admin']  # fallback for admin roles
    else:
        return ROLE_PROMPTS['end_user']  # fallback for end users


def summary_prompt(summ_data, user_type):
    # extract each summ_data accordingly
    today = summ_data['today']
    t_sum = summ_data['vhcl_today_sum']
    con = summ_data['condition']
    cw_range = summ_data['current_week_range']
    cw_sum = summ_data['vhcl_current_week_sum']
    tm_range = summ_data['three_months_range']
    tm_sum = summ_data['vhcl_three_months_sum']

    # determine whose the user
    prompt = get_user_prompt(user_type)

    return f"Summary of Traffic Prediction for This Year:\n\
    Today {today[:10]}: total of {t_sum:,} Vehicles, which is {con} of volume condition\n\n\
    This week from {cw_range['start']} to {cw_range['end']}: total of {cw_sum} Vehicles\n\
    Three Months from {tm_range['start']} to {tm_range['end']}: total of {tm_sum} Vehicles\n\n\
    {prompt}"


def hourly_prompt(hourly_data, user_type):
    peak = hourly_data['peak']
    p_condition = peak['condition']
    low = hourly_data['low']
    l_condition = low['condition']
    avg = hourly_data['avg']

    # determine whose the user
    prompt = get_user_prompt(user_type)

    return (
        f"Hourly Traffic Prediction Today:\n"
        f"Peak Hour: {peak['time'][-8:-3]} with {peak['value']} vehicles - Condition: {p_condition}\n"
        f"Lowest Hour: {low['time'][-8:-3]} with {low['value']} vehicles - Condition: {l_condition}\n"
        f"Average Vehicles: {avg}\n\n"
        f"{prompt}"
    )


def daily_prompt(daily_data, user_type):
    date_range = daily_data['date_range']
    peak = daily_data['peak']
    p_condition = peak['condition']
    low = daily_data['low']
    l_condition = low['condition']
    avg = daily_data['avg']

    # determine whose the user
    prompt = get_user_prompt(user_type)

    return (
        f"Daily Traffic Prediction Summary\n"
        f"Date Range: {date_range['start']} to {date_range['end']}\n\n"
        f"Peak Day: {peak['date']} with {peak['value']:,} vehicles - Condition: {p_condition}\n"
        f"Lowest Day: {low['date']} with {low['value']:,} vehicles - Condition: {l_condition}\n"
        f"Average Vehicles per Day: {avg:,}\n\n"
        f"{prompt}"
    )


def weekly_prompt(weekly_data, user_type):
  week_range = weekly_data['week_range']
  peak = weekly_data['peak']
  p_condition = peak['condition']
  low = weekly_data['low']
  l_condition = low['condition']
  avg = weekly_data['avg']

  # determine whose the user
  prompt = get_user_prompt(user_type)

  return (
    f"Weekly Traffic Prediction Summary\n"
    f"Week Range: {week_range['start']} to {week_range['end']}\n\n"
    f"Peak Week: {peak['week_start']} to {peak['week_end']} with {peak['value']:,} vehicles - Condition: {p_condition}\n"
    f"Lowest Week: {low['week_start']} to {low['week_end']} with {low['value']:,} vehicles - Condition: {l_condition}\n"
    f"Average Vehicles per Week: {avg:,}\n\n"
    f"{prompt}"
  )


def monthly_prompt(monthly_data, user_type):
    month_range = monthly_data['month_range']
    peak = monthly_data['peak']
    p_condition = peak['condition']
    low = monthly_data['low']
    l_condition = low['condition']
    avg = monthly_data['avg']

    # determine whose the user
    prompt = get_user_prompt(user_type)

    return (
        f"Monthly Traffic Prediction Summary\n"
        f"Month Range: {month_range['start']} to {month_range['end']}\n\n"
        f"Peak Month: {peak['month']} with {peak['value']:,} vehicles - Condition: {p_condition}\n"
        f"Lowest Month: {low['month']} with {low['value']:,} vehicles - Condition: {l_condition}\n"
        f"Average Vehicles per Month: {avg:,}\n\n"
        f"{prompt}"
    )


def user_request_prompt(request_data):
  request_range = request_data['response_range']
  peak = request_data['peak']
  low = request_data['low']
  avg = request_data['avg']

  peak_time = peak['time']
  peak_value = peak['value']

  low_time = low['time']
  low_value = low['value']

  return (
    f"This is an end user's (jeepney driver, commuter, citizen) summary of response from his/her traffic forecast\n\n"
    f"Hourly Traffic Prediction Summary\n"
    f"Range: {request_range['start']} to {request_range['end']}\n\n"
    f"Peak Hour: {peak_time} with {peak_value:,} vehicles\n"
    f"Lowest Hour: {low_time} with {low_value:,} vehicles\n"
    f"Average Vehicles per Hour: {avg:,}\n\n"
    f"{ROLE_PROMPTS["end_user"]}"
  )


def admin_request_prompt(request_data):
  request_range = request_data['request_date']
  weekly_data = request_data['weekly'][0] if request_data['weekly'] else None
  daily_data = request_data['daily'][0] if request_data['daily'] else None
  hourly_data = request_data['hourly'][0] if request_data['hourly'] else None

  prompt = "Admin-Level Traffic Forecast Summary\n"
  prompt += f"Request Range: {request_range['start']} to {request_range['end']}\n\n"

  if weekly_data:
    peak = weekly_data['peak']
    low = weekly_data['low']
    avg = weekly_data['avg']
    prompt += (
      f"This is an end admin's (Malabon LGU such as Urban Planner, City Engineer, LGU officials...) summary of response from his/her traffic forecast\n\n"
      f"📊 Weekly Summary:\n"
      f"• Peak Week: {peak['week_start']} to {peak['week_end']} with {peak['value']:,} vehicles - Condition: {peak['condition']}\n"
      f"• Lowest Week: {low['week_start']} to {low['week_end']} with {low['value']:,} vehicles - Condition: {low['condition']}\n"
      f"• Average Weekly Vehicles: {avg:,}\n\n"
    )

  if daily_data:
    peak = daily_data['peak']
    low = daily_data['low']
    avg = daily_data['avg']
    prompt += (
      f"📅 Daily Summary:\n"
      f"• Peak Day: {peak['date']} with {peak['value']:,} vehicles - Condition: {peak['condition']}\n"
      f"• Lowest Day: {low['date']} with {low['value']:,} vehicles - Condition: {low['condition']}\n"
      f"• Average Daily Vehicles: {avg:,}\n\n"
    )

  if hourly_data:
    peak = hourly_data['peak']
    low = hourly_data['low']
    avg = hourly_data['avg']
    prompt += (
      f"⏰ Hourly Summary:\n"
      f"• Peak Hour: {peak['time']} with {peak['value']:,} vehicles - Condition: {peak['condition']}\n"
      f"• Lowest Hour: {low['time']} with {low['value']:,} vehicles - Condition: {low['condition']}\n"
      f"• Average Vehicles per Hour: {avg:,}\n\n"
    )

  prompt += ROLE_PROMPTS["admin"]  

  return prompt
