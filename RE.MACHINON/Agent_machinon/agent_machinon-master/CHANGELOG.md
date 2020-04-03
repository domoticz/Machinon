# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- If you run the script with parameter -m, your device MUID will be returned.

## [0.3.0-beta] - 2019-02-21
### Added
- Functionality to retrieve the SSH PEM file.
- Error checks to ensure .env contains user credentials.
### Changed
- Most of the env variables have now defaults so most of them have been removed from the .env file.
- The app will download the SSH PEM server key file automatically from the server using an secure/authenticated API request.
- The MQTT server authentication will be made through Re:Machinon credentials instead.
- On Connect tunnel logic reorganized.
- Sorted logging messages.
### Removed
- The SSH Server Key file env variable.
- The MQTT user and password env variables.

## [0.2-beta] (2019-02-18)
### Added
- Added MACHINON_CLIENT_PORT in the .env to set machinon_client's nginx server block port, which now i ([b41b363](https://github.com/EdddieN/agent_machinon/commit/b41b363))
- Create CHANGELOG ([14d4b25](https://github.com/EdddieN/agent_machinon/commit/14d4b25))
- Create LICENSE ([e9e05af](https://github.com/EdddieN/agent_machinon/commit/e9e05af))
### Changed
- Agent now receives tunnel UUID4 instead of device_id. ([129c2bc](https://github.com/EdddieN/agent_machinon/commit/129c2bc))
- Code cleanup ([81da624](https://github.com/EdddieN/agent_machinon/commit/81da624))
- Removed debug line ([956848c](https://github.com/EdddieN/agent_machinon/commit/956848c))
- Sorting some .env variables ([0466d5a](https://github.com/EdddieN/agent_machinon/commit/0466d5a))
### Fixed
- Fixed bug in new DEFAULT_LOCAL_PORT, recasted as int. ([05591d8](https://github.com/EdddieN/agent_machinon/commit/05591d8))
- Fixed issue with MQTT SSL flag on .env ([437de4b](https://github.com/EdddieN/agent_machinon/commit/437de4b))
- Fixed problem reading ethernet address due to Debian Stretch ([e5ac81b](https://github.com/EdddieN/agent_machinon/commit/e5ac81b))
- Fixed static mac_address reading ([daab57c](https://github.com/EdddieN/agent_machinon/commit/daab57c))


