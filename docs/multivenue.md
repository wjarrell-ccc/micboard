# Micboard Multivenue Server

![micboard multivenue](img/multivenue.png)

A single server can provide separate instances of micboard for multiple venues across a campus.

For Micboard multivenue, [NGINX](https://www.nginx.com) is used as a transparent proxy server. NGINX internally routes traffic for each venue to the correct micboard instance based on the URL. `micboard.local/venue-a` renders the instance for venue-a while `/venue-b` serves the instance for venue b.

## Micboard Configuration

Create a separate systemd service file for each venue by copying the template:
```
$ cp micboard.service micboard-venue-a.service
```

Edit the service file for each venue:
```
[Unit]
Description=Micboard Service
After=network.target

[Service]
# Set the network port for this venue
Environment=MICBOARD_PORT=8080
# Use the full path to the Python virtual environment - do not use ~
ExecStart=/home/YOUR_USERNAME/micboard/venv/bin/python3 -u py/micboard.py -f /home/YOUR_USERNAME/.local/share/micboard/venue-a
WorkingDirectory=/home/YOUR_USERNAME/micboard
StandardOutput=inherit
StandardError=inherit
Restart=always
User=YOUR_USERNAME
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

> **Important:** Use full paths — do not use `~` in systemd service files as it may not expand correctly.

Install and enable the service for each venue:
```
$ sudo cp micboard-venue-a.service /etc/systemd/system/
$ sudo systemctl daemon-reload
$ sudo systemctl start micboard-venue-a.service
$ sudo systemctl enable micboard-venue-a.service
```

Assign sequential ports to each venue starting at 8080.

## Configure Landing Page
```
$ cp static/multivenue-template.html static/multivenue.html
```

Edit `static/multivenue.html` and add your venues. Link hrefs must include a trailing slash:
```
<div class="card-body">
    <p class="card-text"><a href="/venue-a/" class="btn btn-secondary btn-block">Venue A</a></p>
    <p class="card-text"><a href="/venue-b/" class="btn btn-secondary btn-block">Venue B</a></p>
</div>
```

## Configure NGINX

Install Nginx:
```
$ sudo apt update
$ sudo apt install nginx -y
```

> **Important:** On Ubuntu 22.04/24.04, the micboard nginx configuration goes in `/etc/nginx/nginx.conf` — **not** in `sites-available/sites-enabled`. Replace the entire contents of that file with your configuration.

A sample [nginx-sample.conf](nginx-sample.conf) is provided in the `docs` directory. For each venue you must add:
- An `upstream` block defining the backend port
- A `/venue/static/` location block serving static files directly
- A `/venue/bg/` location block serving background images
- A `/venue/` proxy location block

> **Important:** Use explicit location blocks for each venue rather than regex patterns. Regex alias patterns cause trailing slash redirect issues on Ubuntu 24.04/nginx 1.24.

Example for two venues:
```nginx
user YOUR_USERNAME;
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    upstream micboard_venue_a {
        server localhost:8080;
    }
    upstream micboard_venue_b {
        server localhost:8081;
    }

    server {
        listen 80;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        sendfile on;
        sendfile_max_chunk 512k;

        location /static/ {
            alias "/home/YOUR_USERNAME/micboard/static/";
        }

        location /venue-a/static/ {
            alias "/home/YOUR_USERNAME/micboard/static/";
        }
        location /venue-a/bg/ {
            alias "/home/YOUR_USERNAME/.local/share/micboard/venue-a/backgrounds/";
        }
        location /venue-a/ {
            proxy_pass http://micboard_venue_a;
            rewrite /venue-a/(.*) /$1 break;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }

        location /venue-b/static/ {
            alias "/home/YOUR_USERNAME/micboard/static/";
        }
        location /venue-b/bg/ {
            alias "/home/YOUR_USERNAME/.local/share/micboard/venue-b/backgrounds/";
        }
        location /venue-b/ {
            proxy_pass http://micboard_venue_b;
            rewrite /venue-b/(.*) /$1 break;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }

        location / {
            root "/home/YOUR_USERNAME/micboard/static/";
            index multivenue.html;
        }
    }
}
```

Apply the configuration:
```
$ sudo nginx -t
$ sudo systemctl restart nginx
```

## Setup Background Fileshare
Setup [Samba](fileshare.md) to map to the micboard `backgrounds` folder. Multiple venues can share or have separate background image repositories.

Micboard defaults to a separate backgrounds folder for each instance. A shared directory can be set via `-b`. For micboard multivenue, this can be set in the systemd service file:
```bash
ExecStart=/home/YOUR_USERNAME/micboard/venv/bin/python3 -u py/micboard.py -f /home/YOUR_USERNAME/.local/share/micboard/venue-a -b /home/YOUR_USERNAME/.local/share/micboard/backgrounds
```
