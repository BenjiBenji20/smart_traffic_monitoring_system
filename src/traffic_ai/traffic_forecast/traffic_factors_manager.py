# Import the explanation generator
from datetime import datetime
import json
from pathlib import Path
from src.traffic_ai.traffic_forecast.factors_for_prediction_data import generate_explanation
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import prediction_detail

# cd to cache dir
CACHE_DIR = Path(__file__).resolve().parents[3] / 'cache'
TRAFFIC_FACTORS_CACHE_FILE = CACHE_DIR / 'daily_traffic_factors.json'


def traffic_factors_today_exist():
    """Check if traffic factors cache file exist and fresh"""
    if not TRAFFIC_FACTORS_CACHE_FILE.exists():
        return False
        
    traffic_factors_modified_time = datetime.fromtimestamp(TRAFFIC_FACTORS_CACHE_FILE.stat().st_mtime)
    
    # if today's date and the date the files were modified is same, return true
    today = datetime.today().date()
    return traffic_factors_modified_time.date() == today


def generate_traffic_factors():
    """Generate traffic factors json and write in json cache file"""
    # Get the prophet model and forecast data
    forecast = prediction_detail()
    traffic_factors = generate_explanation(forecast)
    
    # Create cache directory
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Write the traffic factors
    with open(TRAFFIC_FACTORS_CACHE_FILE, 'w') as f:
        json.dump(traffic_factors, f, indent=2)
        
    return traffic_factors


def get_traffic_factors():
    """Get traffic factors from cache or generate new ones"""
    if traffic_factors_today_exist():
        with open(TRAFFIC_FACTORS_CACHE_FILE, 'r') as f:
            traffic_factors = json.load(f)
        return traffic_factors
    
    print("Generating fresh traffic factors...")
    return generate_traffic_factors()


def main():
    """Test function"""
    factors = get_traffic_factors()
    print(factors)


if __name__ == '__main__':
    main()