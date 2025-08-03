from enum import Enum

class Role(str, Enum):
  # add more role kung gusto pa
  ADMIN = "admin"
  CITY_ENGINEER = "city_engineer"
  TRAFFIC_ENFORCER = "traffic_enforcer"