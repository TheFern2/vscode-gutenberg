import { exec } from "child_process";
import * as vscode from "vscode";

export function executePandoc(
  pandocCmd: string,
  gutenbergOutputChannel: vscode.OutputChannel
) {
  exec(pandocCmd, (error, stdout, stderr) => {
    if (error !== null) {
      console.log(`error: ${error.message}`);
      gutenbergOutputChannel.append(`error: ${error.message}\n`);
    }
    if (stderr !== null && stderr !== "") {
      console.log(`stderr: ${stderr}`);
      vscode.window.showErrorMessage("stderr: " + stderr.toString());
      gutenbergOutputChannel.append(`stderr: ${stderr}\n`);
    }
    if (stdout !== null) {
      console.log(`stdout: ${stdout}`);
      gutenbergOutputChannel.append(`stdout: ${stdout}\n`);
    }
  });
}
