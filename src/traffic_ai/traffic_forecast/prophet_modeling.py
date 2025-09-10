import pandas as pd
from prophet import Prophet
from mysql.connector import Error

class ProphetModel:
  def __init__(self, query, engine):
    try:
      self.df = pd.read_sql(query, con=engine)

      # check for availability of ds & y column (required by prophet)
      if not {'ds', 'y'}.issubset(self.df.columns):
        raise ValueError(f"Data Frame {self.df} must have both ds & y column")
      
      # convert column type into proper data type accepted by prophet
      self.df['ds'] = pd.to_datetime(self.df['ds'])
      self.df['y'] = pd.to_numeric(self.df['y'])
      
      # These are all columns that are not the mandatory 'ds' and 'y'
      self.regressors = [col for col in self.df.columns if col not in ['ds', 'y']]

      # forecast handler
      self._forecast = None
      self._hourly = None
      self._daily = None
      self._weekly = None
      self._monthly = None
    except Error as e:
      print(f"Unexpected SQL Database connection error ocurred: {e}")
    except Exception as e:
      print(f"Initialization failed: {e}")


  # train the modl
  def train_model(self):
    self.m = Prophet(
      daily_seasonality=True,
      weekly_seasonality=True,
      yearly_seasonality=True
    )
    self.m.add_seasonality(name='hourly', period=24, fourier_order=5)
    
    # add regressors to the model
    for regressor in self.regressors:
      self.m.add_regressor(regressor)
    
    self.m.fit(self.df)

    return self.m


  # make future preidction
  def predict_future(self):
    if self._forecast is None:
      future = self.m.make_future_dataframe(periods=24*365, freq='h')
      
      # separate historical and future parts of the dataframe
      historical_dates = self.df['ds']
      future_dates = future[~future['ds'].isin(historical_dates)]
      
      for regressor in self.regressors:
        # For historical dates, use actual values
        future.loc[future['ds'].isin(historical_dates), regressor] = self.df[regressor].values
        
        # For future dates, use intelligent defaults
        future_dates = future[~future['ds'].isin(historical_dates)]
        
        if regressor.startswith('is_') and regressor in ['is_monday', 'is_tuesday', 'is_wednesday', 'is_thursday', 'is_friday', 'is_saturday', 'is_sunday']:
          # For day-of-week flags: calculate the actual day of week
          day_name = regressor[3:]  # Extract 'monday' from 'is_monday'
          future.loc[~future['ds'].isin(historical_dates), regressor] = (
            future_dates['ds'].dt.day_name().str.lower() == day_name
          ).astype(int)
          
        elif regressor in ['holiday_flag', 'accident_flag']:
          historical_probability = self.df[regressor].mean()  
          future.loc[~future['ds'].isin(historical_dates), regressor] = historical_probability
          
        elif regressor == 'weather_rain_mm':
          # For continuous variables: use historical average or 0
          future_dates_df = future[~future['ds'].isin(historical_dates)].copy()
          for idx, row in future_dates_df.iterrows():
            # Use same month's historical average
            same_month_avg = self.df[self.df['ds'].dt.month == row['ds'].month][regressor].mean()
            future.loc[idx, regressor] = same_month_avg
            
        else:
          # Default: use historical mean (for continuous variables)
          future.loc[~future['ds'].isin(historical_dates), regressor] = self.df[regressor].mean()
      
      self._forecast = self.m.predict(future)
      
    return self._forecast
  

  # AGGREGATE HOURLY PREDICTION TO GENERATE HOURLY, DAILY, WEEKLY AND MONTHLY PREIDCTIONS
  @property
  def hourly_prediction(self):
    if self._hourly is None:
      forecast = self.predict_future()
      self._hourly = forecast[['ds', 'yhat']].copy()

    return self._hourly

  @property
  def daily_prediction(self):
    if self._daily is None:
      forecast = self.predict_future()
      self._daily = forecast.set_index('ds').resample('D')['yhat'].sum().reset_index()

    return self._daily
  
  @property
  def weekly_prediction(self):
    if self._weekly is None:
      forecast = self.predict_future()
      self._weekly = forecast.set_index('ds').resample('W')['yhat'].sum().reset_index()

    return self._weekly
  
  @property
  def monthly_prediction(self):
    if self._monthly is None:
      forecast = self.predict_future()
      self._monthly = forecast.set_index('ds').resample('ME')['yhat'].sum().reset_index()

    return self._monthly


  def get_full_forecast(self):
    """Get the full forecast with all components for explanation generation"""
    return self.predict_future()
  
  
  def get_regressor_names(self):
    """Get list of regressor column names"""
    return self.regressors.copy()
  
  
  def get_model_components(self):
    """Get available model components for base traffic calculation"""
    forecast = self.predict_future()
    available_components = []
    
    # Check which components are available in the forecast
    possible_components = ['trend', 'yearly', 'weekly', 'daily', 'hourly', 
                          'extra_regressors_additive', 'additive_terms']
    
    for component in possible_components:
      if component in forecast.columns:
        available_components.append(component)
    
    return available_components
  
  
  def calculate_base_traffic(self, forecast_row=None):
    """Calculate base traffic (without regressor effects) for a given forecast row"""
    if forecast_row is None:
      forecast = self.predict_future()
      forecast_row = forecast.iloc[0]  # Get first row as example
    
    base_components = []
    possible_base_components = ['trend', 'yearly', 'weekly', 'daily', 'hourly']
    
    for component in possible_base_components:
      if component in forecast_row.index:
        base_components.append(forecast_row[component])
    
    return sum(base_components) if base_components else forecast_row['yhat'] * 0.8
  
  def estimate_regressor_contribution(self, regressor_name, regressor_value, forecast_row):
    """Estimate the contribution of a specific regressor to the prediction"""
    base_traffic = self.calculate_base_traffic(forecast_row)
    total_regressor_impact = forecast_row['yhat'] - base_traffic
    
    # Estimate based on regressor type and value
    if regressor_name.startswith('is_') and regressor_value >= 1:
      # Day-of-week flags: assume they have moderate impact
      return total_regressor_impact * 0.3  # multiplier based on your data
    
    elif regressor_name == 'weather_rain_mm':
      # Rain: negative impact proportional to amount
      return regressor_value * -0.8  # Each mm reduces traffic by 0.8 vehicles
    
    elif regressor_name in ['accident_flag', 'holiday_flag']:
      # Binary flags with significant impact
      return regressor_value * total_regressor_impact * 0.4
    
    elif regressor_name in ['is_special_holiday', 'is_regular_holiday']:
      # Holiday flags
      return regressor_value * total_regressor_impact * 0.2
    
    else:
      # Default estimation for other regressors
      return total_regressor_impact * 0.1
  
  
  def get_historical_data(self):
    """Get the original historical data used for training"""
    return self.df.copy()
  
  
  def get_regressor_stats(self):
    """Get statistics about regressors for better impact estimation"""
    stats = {}
    for regressor in self.regressors:
      stats[regressor] = {
        'mean': self.df[regressor].mean(),
        'std': self.df[regressor].std(),
        'min': self.df[regressor].min(),
        'max': self.df[regressor].max(),
        'unique_values': self.df[regressor].nunique()
      }
    return stats
  