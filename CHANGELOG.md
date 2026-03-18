# Changelog

## [0.9.4] - 2026-03-18
### Added
- Updated Dockerfile for Python 3.12-slim, Node.js 20, modern build process
- Updated docker-compose.yaml with build directive and restart policy
- Confirmed working on macOS (Apple Silicon) via Docker Desktop

## [0.9.3] - 2026-03-17
### Fixed
- Extended name editor save now correctly fires POST before page reload
- Frequency display now correctly shows MHz instead of Hz
- Powerlock icon and quality dots no longer overlap in slot view
- nginx multivenue config rewritten with explicit location blocks for reliability on Ubuntu 24.04

## [0.9.2] - 2026-03-13
### Added
- Powerlock support for QLXD, ULXD, and Axient Digital transmitters (shows 🔒 when locked)
- HUD link added to hamburger menu

### Fixed
- Axient Digital powerlock state handling improved
- Extended names now preserved correctly on config change

## [0.9.1] - 2026-03-13
### Fixed
- Spurious battery runtime values (65535, stale time display) no longer shown when no transmitter is present

## [0.9.0] - 2026-03-13
### Changed
- Forked from karlcswanson/micboard v0.8.5
- Updated Node.js requirement from 10.x to 20.x LTS
- Upgraded webpack from v4 to v5
- Replaced node-sass with dart-sass (pure JS, ARM compatible)
- Updated all npm dependencies to current versions
- Fixed Python 3.10+ compatibility (logging.handlers import, asyncio deprecation)
- Pinned tornado to 6.4
- Bumped version to 0.9.0


## [0.8.5] - 2019-10-10
### Added
- Device configuration page.
- Estimated battery times for devices using Shure rechargeable batteries.
- Offline device type for devices like PSM900s.
- Added color guide to help HUD.
- Custom QR code support using `local_url` config key.
- docker-compose for simplified docker deployment.

### Changed
- Migrated CSS display from flex to grid based system.
- Cleaned up node dependencies.
- Updated DCID map with additional devices.

### Fixed
- Disable caching for background images.
- Updated Dockerfile to Node 10.
- Invalid 'p10t' device type in configuration documentation.
- Resolved issue with PyInstaller that required the Mac app to be occasionally restarted.
- Cleaned up device discovery code.


## [0.8.0] - 2019-8-29
Initial public beta

[0.8.5]: https://github.com/karlcswanson/micboard/compare/v0.8.0...v0.8.5
[0.8.0]: https://github.com/karlcswanson/micboard/releases/tag/v0.8.0
