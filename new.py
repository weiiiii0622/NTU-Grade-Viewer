from importlib import import_module
from pathlib import Path

import requests

# m = import_module("new_")
# print(getattr(m, "b", None))

url = "http://localhost:5000/submit/page?cookie=_ga%3D%3B%20ASP.NET_SessionId%3Ddxb5gl0flxss1eail1k3t0b5%3B%20TS01c67bb5%3D0104881522047cd3c56d040880933d3b059b5079373ad25d59ef11e13f84eee2eec52baf64c4bb0c2de19b934343e91f3566b5c4c0af445371bad22720923870f02db897d1%3B%20_ga_X3821T0R42%3D%3B%20"

res = requests.post(url)
