FROM python:3.13.3

ENV PYTHONUNBUFFERED 1

WORKDIR /rolkotech-blog/

COPY . /rolkotech-blog/

ENV PYTHONPATH=/rolkotech-blog/backend

RUN pip install -r backend/requirements_dev.txt
