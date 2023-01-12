import * as vscode from "vscode";
import { DotenvParseOutput, parse } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as child_process from "child_process";

const exec = util.promisify(child_process.exec);
let logger: vscode.OutputChannel;

function log(message: string) {
  const datetime = new Date().toISOString();
  const fullmessage = `[ND280] ${datetime} [INFO] ${message}`;
  logger?.appendLine(fullmessage);
}

function error(message: string) {
  const datetime = new Date().toISOString();
  const fullmessage = `[ND280] ${datetime} [ERROR] ${message}`;
  logger?.appendLine(fullmessage);
}

interface ND280Info {
  nd280ProfileScript: string;
  highlandProfileScript: string;
  nd280System: string;
  env: DotenvParseOutput;
}

export function activate(context: vscode.ExtensionContext) {
  logger = vscode.window.createOutputChannel("ND280");
  log("ND280 extension activated");

  let disposable = vscode.commands.registerCommand("nd280.configure", () =>
    configure()
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}

async function configure() {
  try {
    log("ND280: configuring workspace...");
    const nd280ProfileScript = getND280ProfileScript();
    const highlandProfileScript = getHighlandProfileScript();

    if (!fs.existsSync(nd280ProfileScript)) {
      const msg = `Cannot find ND280 profile script at: "${nd280ProfileScript}". Please set the nd280.nd280SoftwarePilotProfile option.`;
      error(msg);
      vscode.window.showErrorMessage(msg);
      return;
    }

    const info = await loadND280Info(nd280ProfileScript, highlandProfileScript);

    setProcessEnvironment(info.env);
    await configureCmake(info);
    vscode.window.showInformationMessage("Configure ND280 successful!");
    log("ND280: configuring workspace... success");
  } catch (e) {
    error(`Configure ND280 due to exception: ${e}`);
    vscode.window.showErrorMessage(
      "ND280: Configure failed! See output log for details."
    );
    logger?.show();
  }
}

function getND280ProfileScript(): string {
  const candidates = [];
  const userSetting = String(
    vscode.workspace.getConfiguration().get("nd280.nd280SoftwarePilotProfile")
  );
  if (userSetting) {
    candidates.push(path.resolve(userSetting));
  }
  if (process.env.ND280_PILOT) {
    candidates.push(
      path.resolve(
        joinEnvWithPath(process.env.ND280_PILOT, "nd280SoftwarePilot.profile")
      )
    );
  }
  if (process.env.COMMON_BUILD_PREFIX) {
    candidates.push(
      path.resolve(
        joinEnvWithPath(
          process.env.COMMON_BUILD_PREFIX,
          "nd280SoftwarePilot",
          "nd280SoftwarePilot.profile"
        )
      )
    );
  }
  for (const cand of candidates) {
    if (cand && fs.existsSync(cand)) {
      return cand;
    }
  }
  return "";
}

function getHighlandProfileScript(): string {
  const candidates = [];
  const userSetting = String(
    vscode.workspace
      .getConfiguration()
      .get("nd280.highland2SoftwarePilotProfile")
  );
  if (userSetting) {
    candidates.push(path.resolve(userSetting));
  }
  if (process.env.HIGHLAND2_PILOT) {
    candidates.push(
      path.resolve(
        joinEnvWithPath(
          process.env.HIGHLAND2_PILOT,
          "highland2SoftwarePilotProfile.profile"
        )
      )
    );
  }
  if (process.env.COMMON_BUILD_PREFIX) {
    candidates.push(
      path.resolve(
        joinEnvWithPath(
          process.env.COMMON_BUILD_PREFIX,
          "highland2SoftwarePilotProfile",
          "highland2SoftwarePilotProfile.profile"
        )
      )
    );
  }
  for (const cand of candidates) {
    if (cand && fs.existsSync(cand)) {
      return cand;
    }
  }
  return "";
}

function joinEnvWithPath(env: string | undefined, ...tail: string[]): string {
  if (env) {
    return path.join(env, ...tail);
  } else {
    return "";
  }
}

async function loadND280Info(
  nd280ProfileScript: string,
  highlandProfileScript: string
): Promise<ND280Info> {
  const env = await sourceND280Setup(nd280ProfileScript, highlandProfileScript);
  const nd280System = await runND280System(
    nd280ProfileScript,
    highlandProfileScript
  );
  return {
    nd280ProfileScript: nd280ProfileScript,
    highlandProfileScript: highlandProfileScript,
    nd280System: nd280System,
    env: env,
  };
}

async function runInND280Environment(
  nd280ProfileScript: string,
  highlandProfileScript: string,
  cmd: string
): Promise<string> {
  const fullcmd = fs.existsSync(highlandProfileScript)
    ? `. ${nd280ProfileScript} > /dev/null && . ${highlandProfileScript}  > /dev/null && ${cmd}`
    : `. ${nd280ProfileScript}  > /dev/null && ${cmd}`;
  const { stdout } = await exec(fullcmd);
  return stdout;
}

async function sourceND280Setup(
  nd280ProfileScript: string,
  highlandProfileScript: string
): Promise<DotenvParseOutput> {
  const stdout = await runInND280Environment(
    nd280ProfileScript,
    highlandProfileScript,
    "env"
  );
  const env = parse(stdout);
  return env;
}

async function runND280System(
  nd280ProfileScript: string,
  highlandProfileScript: string
): Promise<string> {
  const result = await runInND280Environment(
    nd280ProfileScript,
    highlandProfileScript,
    "nd280-system"
  );
  return result.trim();
}

function setProcessEnvironment(env: DotenvParseOutput) {
  Object.keys(env).forEach((key) => (process.env[key] = env[key]));
}

async function configureCmake(info: ND280Info) {
  await configureCmakeConfig(info);
  await configureCmakeKits(info);
}

async function configureCmakeConfig(info: ND280Info) {
  const config = vscode.workspace.getConfiguration();
  await config.update(
    "cmake.buildDirectory",
    "${workspaceFolder}/" + info.nd280System
  );
  await config.update("cmake.environment", info.env);
  await config.update("cmake.sourceDirectory", "${workspaceFolder}/cmake");
  await config.update(
    "cmake.cmakePath",
    joinEnvWithPath(info.env.ND280_PILOT, "/scripts/cmake")
  );
}

async function configureCmakeKits(info: ND280Info) {
  // if length is greater than 1, we don't know which one to write the kit to
  if (vscode.workspace.workspaceFolders?.length === 1) {
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const kitsfile = workspaceFolder.uri.fsPath + "/.vscode/cmake-kits.json";
    let kits;
    if (fs.existsSync(kitsfile)) {
      const data = fs.readFileSync(kitsfile, "utf8");
      kits = JSON.parse(data);
    } else {
      kits = [];
    }
    if (!kits.find((it: any) => it.name === "ND280 Compiler")) {
      const gcc = joinEnvWithPath(info.env.ND280_PILOT, "/scripts/gcc");
      const newValue = {
        name: "ND280 Compiler",
        compilers: {
          C: gcc, // eslint-disable-line @typescript-eslint/naming-convention
          CXX: gcc, // eslint-disable-line @typescript-eslint/naming-convention
        },
      };
      kits.push(newValue);
      const parentDir = path.dirname(kitsfile);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(kitsfile, JSON.stringify(kits));
    }
  }
}
