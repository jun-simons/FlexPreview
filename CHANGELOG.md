# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1], - 2025-10-03

- Update display name for visibility

## [1.1.0], - 2025-08-22

### Added

- Added URL input box to UI
- Added reload button to refresh site to input URL

### Changed

- Improved horizontal scrolling for UI option bar
- Added two layer UI input bar

## [1.0.3], - 2025-06-14

### Added

- Added custom resize width/height buttons to UI

### Changed

- Fixed issue with extension not running in background
- Updated instructions and README images


## [1.0.2], [1.0.1] - 2025-06-12

### Changed

- Lowered the required VS Code engine version from `^1.100.0` to `^1.86.0` to support a wider range of recent editor versions (1.0.1)
- Added app icons and design (1.0.2)

## [1.0.0] - 2025-06-12

### Added

- **Initial Release of Flex Preview.**
- Core feature to preview web applications in a mobile device frame within a VS Code webview panel.
- Interactive dropdown menu in the preview panel to select from a list of preset device resolutions (e.g., iPhone 15 Pro, Google Pixel 8, iPad Air).
- Support for setting custom device resolutions via the Command Palette.
- Automatic and responsive scaling of the device frame to fit within the available editor panel size, preserving aspect ratio.
- Basic device bezel styling that adapts to light, dark, and high-contrast VS Code themes.