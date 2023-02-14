# nd280 README

## Usage

- Check out and build the
  [ND280 software](https://git.t2k.org/nd280/wiki/nd280-wiki/-/wikis/home)
  following [the instructions](https://git.t2k.org/nd280/wiki/nd280-wiki/-/wikis/Install%20ND280%20CMake%20Git).
- Alternatively use a [Docker container](https://git.t2k.org/nd280/wiki/nd280-wiki/-/wikis/Singularity-Containers)
  and connect to it using the [VS code remove containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
  When using containers you will need to [install the extension in the
  container](https://code.visualstudio.com/docs/devcontainers/containers#_managing-extensions).

- Open the directory containing the ND280 package that you want to work on eg
  (`eventAnalysis`, `eventRecon`, `eventCalib` etc).
- Open the command palette (`F1`) and run the `ND280: Configure` command.
  Running this will automatically configure your VS Code workspace to work with the ND280 software.
- Run the normal [CMake extension](https://github.com/microsoft/vscode-cmake-tools/tree/main/docs#cmake-tools-for-visual-studio-code-documentation) commands such as [CMake configure](https://github.com/microsoft/vscode-cmake-tools/blob/main/docs/configure.md) and [CMake build](https://github.com/microsoft/vscode-cmake-tools/blob/main/docs/build.md).

You may need to set the `nd280.nd280SoftwarePilotProfile` and
`nd280.highland2SoftwarePilotProfile` settings first.
You should also install the [CMake extension for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools).

## Features

- Automatically configures VSCode for ND280 software development.

## Requirements

- [CMake extension for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools).
- An installation of the [ND280 software](https://git.t2k.org/nd280/wiki/nd280-wiki/-/wikis/home).

## Extension Settings

This extension contributes the following settings:

- `nd280.nd280SoftwarePilotProfile`: Path to the [ND280 software pilot](https://git.t2k.org/nd280/wiki/nd280-wiki/-/wikis/nd280SoftwarePilot)
  setup script. If not set, the extension will look in the directory set by the
  `ND280_PILOT` environment variable.
- `nd280.highland2SoftwarePilotProfile`: Path to the [Highland 2 software pilot](https://git.t2k.org/nd280/highland2Software/highland2SoftwarePilot)
  setup script. If not set, the extension will look in the directory set by the
  `HIGHLAND2_PILOT` environment variable.

## Known Issues

As the ND280 software is only supported on Linux, this extension is also only
supported on Linux. However, it should work correctly on a Windows/Mac OS
client editing a Linux remote/docker host.

Please report issues on the [issue tracker](https://github.com/davehadley/nd280-vscode-extension/issues).

## Release Notes

### 0.1.0

First released version.

## Building and Installing this Extension from Source

- Install [npm](https://www.npmjs.com/package/npm).
- Inside the package root directory run `npm install`.
- Run `npm test` to run automated tests.
- Build the package: `npm run package`.
- Install it locally with `code --install-extension nd280-0.1.3.vsix`.

## License

Licensed under either of

- Apache License, Version 2.0
  ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license
  ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
