import * as path from "path";

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests,
} from "@vscode/test-electron";

import * as cp from "child_process";

import { file, dir } from "tmp-promise";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");
    const vscodeExecutablePath = await downloadAndUnzipVSCode("1.74.1");
    const [cli, ...args] =
      resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    cp.spawnSync(
      cli,
      [...args, "--install-extension", "ms-vscode.cmake-tools"],
      {
        encoding: "utf-8",
        stdio: "inherit",
      }
    );

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // Download VS Code, unzip it and run the integration test
    const { path: tempdir, cleanup } = await dir({ unsafeCleanup: true });
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [tempdir],
    });
    cleanup();
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
