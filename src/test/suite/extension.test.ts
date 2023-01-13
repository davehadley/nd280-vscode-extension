import * as assert from "assert";
import * as fs from "fs";
import { file } from "tmp-promise";

import * as vscode from "vscode";

// async function sleep(duration: number) {
//   return new Promise((resolve) => setTimeout(resolve, duration));
// }

suite("Extension Test Suite", function () {
  this.timeout(20000);
  vscode.window.showInformationMessage("Start all tests.");

  test("Test environment is workspace", async () => {
    // The tests are only expected to pass if there is a workspace.
    const workspace = vscode.workspace.workspaceFolders?.at(0);
    assert(workspace);
  });

  test("ND280 Configure Command Exists", async () => {
    // the extension only becomes active once the nd280.configure command has
    // been called
    await vscode.commands.executeCommand("nd280.configure");
    const commands = await vscode.commands.getCommands(true);
    assert(commands.includes("nd280.configure"));
  });

  test("Test ND280 Configure Command Sets-up CMake", async () => {
    // setup mock workspace
    const workspace = vscode.workspace.workspaceFolders?.at(0);
    assert(workspace);
    const nd280system = workspace.uri.fsPath + "/nd280-system";
    await fs.promises.writeFile(nd280system, "echo nd280SystemExampleValue");
    await fs.promises.chmod(nd280system, 500);
    let cleanups = [];
    const { path: nd280SoftwarePilotProfile, cleanup: cleanup0 } = await file();
    cleanups.push(cleanup0);
    const { path: highland2SoftwarePilotProfile, cleanup: cleanup1 } =
      await file();
    cleanups.push(cleanup1);
    await fs.promises.writeFile(
      nd280SoftwarePilotProfile,
      `export EXAMPLE_ENV_1=1\nexport ND280_PILOT=nd280PilotExampleValue\nexport PATH=${workspace.uri.fsPath}:\${PATH}`,
      "utf8"
    );
    await fs.promises.writeFile(
      highland2SoftwarePilotProfile,
      "export EXAMPLE_ENV_2=2",
      "utf8"
    );
    fs.promises.mkdir(workspace.uri.fsPath + "/bin");
    await fs.promises.writeFile(
      workspace.uri.fsPath + "/bin/setup.sh",
      "export EXAMPLE_ENV_3=3",
      "utf8"
    );
    let config = vscode.workspace.getConfiguration();
    await config.update(
      "nd280.nd280SoftwarePilotProfile",
      nd280SoftwarePilotProfile
    );
    await config.update(
      "nd280.highland2SoftwarePilotProfile",
      highland2SoftwarePilotProfile
    );

    // run nd280.configure
    await vscode.commands.executeCommand("nd280.configure");

    // check that CMake has been configured as expected
    config = vscode.workspace.getConfiguration();
    assert(
      config.get("cmake.buildDirectory") ===
        "${workspaceFolder}/nd280SystemExampleValue"
    );
    assert(config.get("cmake.sourceDirectory") === "${workspaceFolder}/cmake");
    assert(
      config.get("cmake.cmakePath") === "nd280PilotExampleValue/scripts/cmake"
    );
    const env: any = config.get("cmake.environment");
    assert(env["EXAMPLE_ENV_1"] === "1");
    assert(env["EXAMPLE_ENV_2"] === "2");
    assert(env["EXAMPLE_ENV_3"] === "3");
    // check that a kit has been defined that contains the ND280 compiler
    const kitsfile = `${workspace.uri.fsPath}/.vscode/cmake-kits.json`;
    assert(fs.existsSync(kitsfile));
    const kits: any = JSON.parse(fs.readFileSync(kitsfile, "utf8"));
    assert(kits.find((it: any) => it.name === "ND280 Compiler"));

    // clean up mock workspace
    cleanups.forEach((it) => it());
  });
});
