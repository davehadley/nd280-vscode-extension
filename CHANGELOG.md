# Change Log

All notable changes to the "nd280" extension will be documented in this file.

## 0.1.3

- Environment variables are now set in the CMake kits file.

## 0.1.2

- Fix bug where we failed to generate `bin/setup.sh`.
- Improve logging.

## 0.1.1

- Now automatically runs `${workspaceDir}/bin/setup.sh` if it exists and tries to
  generate it if it does not exist. This is neccessary for some packages to
  compile.
- Fix a bug where the wrong path was used for the highland2Pilot profile script.

## 0.1.0

- Initial release
- Automatically configures VSCode CMake extension to work with ND280 software.
