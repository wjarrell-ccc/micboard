## About This Fork

This is a community-maintained fork of [karlcswanson/micboard](https://github.com/karlcswanson/micboard).
The original project was last updated in 2019 and can no longer be installed on modern operating systems. This fork modernizes the codebase and incorporates fixes and features from Karl's unfinished 0.8.7 branch.

This fork was created and maintained by [@wjarrell-ccc](https://github.com/wjarrell-ccc) at Crossings Community Church, Oklahoma City, OK — a multi-campus church running 8 venue instances monitoring 50+ wireless microphones and IEMs across multiple campuses every weekend on a single AV VLAN.

Micboard has been a huge win for us. Shure Wireless Workbench is powerful but having that many people opening different files on the same network always made us nervous about accidental changes. Micboard's read-only display plus the custom names and photo backgrounds gave our stage managers and volunteers exactly what they needed without the risk.

When the original project stopped working on modern operating systems we modernized it rather than move on. Modernization work was completed with the assistance of AI (Claude by Anthropic). All credit for the original application design and architecture goes to Karl Swanson.

### What's changed in this fork
- Updated to run on Ubuntu 22.04/24.04 LTS
- Replaced Node.js 10 with Node.js 20 LTS
- Upgraded webpack 4 to webpack 5
- Replaced node-sass with dart-sass for ARM compatibility
- Fixed Python compatibility issues for Python 3.10+
- Incorporated Karl's unfinished 0.8.7 branch fixes (powerlock, Axient improvements, HUD link, extended names)
- Fixed spurious battery/runtime values displayed when no transmitter is present
- Fixed Hz display incorrectly showing instead of MHz
- Fixed extended name editor save timing bug
- Fixed powerlock icon and quality dot positioning
- Updated nginx multivenue configuration for Ubuntu 24.04/nginx 1.24
- Added Docker support for easy Mac installation

### Installation
The easiest way to try micboard is Docker Desktop on a Mac. For permanent installs, a Raspberry Pi is recommended for single venue and Ubuntu Server for multi-venue. See [installation docs](docs/installation.md) for full details.

### Tested On
- Ubuntu 24.04 LTS on VMware ESXi VM (x86_64) — 8 venue multivenue setup
- Raspberry Pi 3B+ running Raspberry Pi OS Trixie (Debian 13) 64-bit — single venue
- Apple Silicon Mac via Docker Desktop — single venue

### Known Behavior
- The `e` (edit) keyboard shortcut is intentionally disabled on the all-channels view (group 0).
  Use a numbered group view to edit slot order.

---

<p align="center">
  <a href="https://micboard.io"><img width="90px" height="90px" src="docs/img/logo.png"></a>
</p>

<h1 align="center">Micboard</h1>

A visual monitoring tool for network enabled Shure devices.  Micboard simplifies microphone monitoring and storage for artists, engineers, and volunteers.  View battery, audio, and RF levels from any device on the network.

![Micboard Storage Photo](docs/img/wccc.jpg)


![micboard diagram](docs/img/slug.png)

## Screenshots
#### Desktop
![Desktop](docs/img/desktop_ui.png)


#### Mobile
<p align="center">
  <img width="33%" src="docs/img/phone_home.png"><img width="33%" src="docs/img/phone_ui.png"><img width="33%" src="docs/img/phone_ui_exp.png">
</p>

#### Mic Storage
![mic storage](docs/img/tv_imagebg.png)

## Compatible Devices
Micboard supports the following devices -
* Shure UHF-R
* Shure QLX-D<sup>[1](#qlxd)</sup>
* Shure ULX-D
* Shure Axient Digital
* Shure PSM 1000

Micboard uses IP addresses to connect to RF devices.  RF devices can be addressed through static or reserved IPs.  They just need to be consistent.


## Documentation
* [Installation](docs/installation.md)
* [Configuration](docs/configuration.md)
* [Micboard MultiVenue](docs/multivenue.md)

#### Developer Info
* [Building the Electron wrapper for macOS](docs/electron.md)
* [Extending micboard using the API](docs/api.md)


## Known Issues
<a name="qlxd">1</a>: [QLX-D Firmware](docs/qlxd.md)
