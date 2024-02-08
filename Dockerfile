FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app ./

RUN ls
CMD [ "python3", "src/app.py" ]