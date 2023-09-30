# For more information, please refer to https://aka.ms/vscode-docker-python
FROM python:3.10-buster

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install pip requirements
# get newer mariadb connector
RUN wget https://dlm.mariadb.com/3216102/Connectors/c/connector-c-3.3.5/mariadb-connector-c-3.3.5-debian-buster-amd64.tar.gz -O - | tar -zxf - --strip-components=1 -C /usr
# makes python use this one instead of the old one
# ENV LD_LIBRARY_PATH=/usr/lib/mariadb
# install the packages in requirements.txt
COPY requirements.txt .
RUN python -m pip install -r requirements.txt

WORKDIR /etl
COPY . /etl

# env variable for pythonpath
ENV PYTHONPATH "${PYTHONPATH}:/etl"

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
RUN adduser -u 5678 --disabled-password --gecos "" etluser && chown -R etluser /etl
USER etluser

# During debugging, this entry point will be overridden. For more information, please refer to https://aka.ms/vscode-docker-python-debug
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "-k", "uvicorn.workers.UvicornWorker", "src\server:app"]
CMD ["python", "src/consumer.py"]