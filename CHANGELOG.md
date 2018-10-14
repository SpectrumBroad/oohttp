# Change Log
All notable changes to the [oohttp library](https://github.com/SpectrumBroad/oohttp) will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
## [Unreleased][]
Nothing notable at the moment.

## [1.1.1][]
### Fixed
-   `Url.parseQueryString(search)` now performs URI component decoding on the key and value before assigning to the `query` object.

## [1.1.0][]
### Added
-   `toFunction`, `toFunctionArray` and `toFunctionMap` methods to pass individual results through a function. These behave much like `toObject` and such, but instead of passing the results to a constructor, they are passed to a function.

-   Support for `basic` proxy authorization.

[Unreleased]: https://github.com/SpectrumBroad/oohttp/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/SpectrumBroad/oohttp/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/SpectrumBroad/oohttp/compare/v1.0.0...v1.1.0
