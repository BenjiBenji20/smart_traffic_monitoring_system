import pandas as pd
from prophet import Prophet
from pathlib import Path

class ProphetModel:
  def __init__(self, ds_dir):
    try:
      self.df = pd.read_csv(ds_dir)

      # check for availability of ds & y column (required by prophet)
      if not {'ds', 'y'}.issubset(self.df.columns):
        raise ValueError(f"Data Frame {self.df} must have both ds & y column")
      
      # convert column type into proper data type accepted by prophet
      self.df['ds'] = pd.to_datetime(self.df['ds'])
      self.df['y'] = pd.to_numeric(self.df['y'])

      # forecast handler
      self._forecast = None
      self._hourly = None
      self._daily = None
      self._weekly = None
      self._monthly = None
    except FileNotFoundError:
      print(f"File name {ds_dir} not found.")
    except Exception as e:
      print(f"Initialization failed: {e}")


  # train the modl
  def train_model(self):
    self.m = Prophet()
    self.m.fit(self.df)

    return self.m


  # make future preidction
  def predict_future(self):
    if self._forecast is None:
      future = self.m.make_future_dataframe(periods=24*365, freq='h')
      self._forecast = self.m.predict(future)
      self._forecast['ds'] = pd.to_datetime(self._forecast['ds'])
      
    return self._forecast
  

  # AGGREGATE HOURLY PREDICTION TO GENERATE HOURLY, DAILY, WEEKLY AND MONTHLY PREIDCTIONS
  @property
  def hourly_prediction(self):
    if self._hourly is None:
      self._hourly = self.predict_future()

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


def main():
  # pathlib since direct path results an error dunno why
  data_path = Path(__file__).resolve().parents[2] / 'data' / 'processed' / 'vehicle-data-feed-prophet-model.csv'
  model = ProphetModel(str(data_path))
  model.train_model()

  print(model.hourly_prediction.tail())
  print(model.daily_prediction.tail())
  print(model.weekly_prediction.tail())
  print(model.monthly_prediction.tail())


if __name__ == "__main__":
  main()