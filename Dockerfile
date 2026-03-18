FROM python:3.12-slim

MAINTAINER Will Jarrell <wjarrell@crossings.church>

WORKDIR /usr/src/app

# Install Node.js 20
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . .

# Install Python dependencies
RUN pip3 install --no-cache-dir tornado==6.4

# Install Node dependencies and build frontend
RUN npm install
RUN npm run build

EXPOSE 8058

CMD ["python3", "py/micboard.py"]
