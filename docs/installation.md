# Micboard Installation

If you just want to try micboard, the easiest way is Docker Desktop on your Mac — no server required. If you want a permanent single venue install, a Raspberry Pi is inexpensive and runs micboard reliably. If you have multiple venues or existing server infrastructure, Ubuntu Server is the recommended path.

> **Note:** This fork (v0.9.0+) has been modernized to run on Ubuntu 22.04/24.04 LTS. The original installation instructions for Ubuntu 18.04 are no longer supported.

## macOS — Docker Desktop

Docker is the easiest way to try micboard on a Mac. It handles all the dependencies automatically so you don't need to install Python, Node.js, or anything else manually.

> **Note:** Docker Desktop is approximately 3GB because it includes a lightweight Linux VM. This is a one-time install. If you plan to run micboard permanently, a Raspberry Pi is a more practical long-term solution.

Download and install Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Choose the Apple Silicon version for M1/M2/M3/M4 Macs, or Intel Chip for older Macs.

Then clone and run micboard:
```
$ git clone https://github.com/wjarrell-ccc/micboard.git
$ cd micboard/
$ docker-compose up --build
```

The first run will take a few minutes to build. When you see `Starting Micboard` in the terminal, open a browser and go to `http://localhost:8058`

To stop micboard press `Ctrl+C`. Next time just run `docker-compose up` — no need to rebuild.

Check the [configuration](configuration.md) docs for more information on configuring micboard.



## Raspberry Pi

Micboard v0.9.3 has been tested and confirmed working on a Raspberry Pi 3B+ running Raspberry Pi OS Trixie (Debian 13) 64-bit.

> **Important:** You must use the **64-bit** version of Raspberry Pi OS. Node.js 20 does not support 32-bit ARM. In Raspberry Pi Imager select **Raspberry Pi OS Lite (64-bit)**.

Follow the same installation steps as Ubuntu above. A few Pi-specific notes:

- `pip install` will automatically use [piwheels.org](https://www.piwheels.org) for optimized ARM packages — no special configuration needed
- `npm install` takes approximately 4 minutes on a Pi 3B+ — this is normal, it is not hung
- `npm run build` takes approximately 30 seconds on a Pi 3B+ — also normal
- For a single venue install on a Pi, nginx is not required — just run micboard directly and access it at `http://PI_IP_ADDRESS:8058`

## Ubuntu 22.04 / 24.04 LTS

### Install dependencies
```
$ sudo apt update
$ sudo apt install git python3-pip python3-venv -y
$ curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
$ sudo apt install nodejs -y
```

### Clone micboard
```
$ git clone https://github.com/wjarrell-ccc/micboard.git
$ cd micboard/
```

### Set up Python virtual environment
```
$ python3 -m venv venv
$ source venv/bin/activate
$ pip install tornado==6.4
```

### Install JavaScript dependencies and build
```
$ npm install
$ npm run build
```

### Run micboard
```
$ cd py && python3 micboard.py
```

Check the [configuration](configuration.md) docs for more information on configuring micboard.

### Install as a systemd service
Edit `User`, `WorkingDirectory`, and `ExecStart` within `micboard.service` to match your installation.

> **Important:** Use the full path to the Python virtual environment, not the system Python. Replace `~` with the full path to your home directory.
```
[Unit]
Description=Micboard Service
After=network.target

[Service]
Environment=MICBOARD_PORT=8058
ExecStart=/home/YOUR_USERNAME/micboard/venv/bin/python3 -u py/micboard.py
WorkingDirectory=/home/YOUR_USERNAME/micboard
StandardOutput=inherit
StandardError=inherit
Restart=always
User=YOUR_USERNAME
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

Install and enable the service:
```
$ sudo cp micboard.service /etc/systemd/system/
$ sudo systemctl daemon-reload
$ sudo systemctl start micboard.service
$ sudo systemctl enable micboard.service
```


---

## Tested On

These are the platforms that have been confirmed working with micboard v0.9.4:

- Ubuntu 24.04 LTS on VMware ESXi VM (x86_64) — 8 venue multivenue setup
- Raspberry Pi 3B+ running Raspberry Pi OS Trixie (Debian 13) 64-bit — single venue
- Apple Silicon Mac via Docker Desktop — single venue

Ubuntu 22.04 LTS has not yet been formally tested but should work identically to 24.04.