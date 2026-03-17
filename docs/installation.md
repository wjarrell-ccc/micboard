# Server Installation
Micboard server can be installed on many different platforms. For small and portable systems, Micboard can run on a Raspberry Pi hidden in the back of a rack. Ubuntu Server is recommended for large permanent installations.

> **Note:** This fork (v0.9.0+) has been modernized to run on Ubuntu 22.04/24.04 LTS. The original installation instructions for Ubuntu 18.04 are no longer supported.

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

## Raspberry Pi
Micboard v0.9.0+ is compatible with Raspberry Pi 4/5 running current Raspberry Pi OS (64-bit). Follow the Ubuntu installation instructions above — the process is identical.

> **Note:** Raspberry Pi compatibility has not yet been fully tested and documented. See [GitHub Issue #X] for status.

## macOS - Desktop Application
Download and run micboard from the project's [GitHub Release](https://github.com/karlcswanson/micboard/releases/) page. Add RF devices to the 'Slot Configuration' and press 'Save'.

> **Note:** The macOS Electron wrapper is currently unsupported in this fork. The web interface works correctly in any browser when running micboard from source.

Check the [configuration](configuration.md) docs for more information on configuring micboard.

## macOS - From Source
Install the Xcode command-line tools
```
$ xcode-select --install
```

Install the homebrew package manager
```
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install python3 and node
```
$ brew install python3 node
```

Clone micboard
```
$ git clone https://github.com/wjarrell-ccc/micboard.git
$ cd micboard/
```

Install micboard software dependencies
```
$ python3 -m venv venv
$ source venv/bin/activate
$ pip install tornado==6.4
$ npm install
$ npm run build
```

Run micboard
```
$ cd py && python3 micboard.py
```

Check the [configuration](configuration.md) docs for more information on configuring micboard.

## Docker
Clone micboard
```
$ git clone https://github.com/wjarrell-ccc/micboard.git
```

Build and run docker image
```
$ cd micboard/
$ docker build -t micboard .
$ docker-compose up
```

> **Note:** The Dockerfile has not yet been updated for this fork. Community contributions welcome.
