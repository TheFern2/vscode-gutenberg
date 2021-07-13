// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { executePandoc } from "./utils/pandoc";
import * as path from "path";
import * as process from "process";
const fs = require("fs-extra");
import { resolve } from "path";

interface pandocCmdArgs {
  outputFolder: string;
  bookName: string;
  pdfEngine: string;
}

interface fileSelected {
  filePath: string;
  checked: boolean;
}

interface ADirent {
  name: string;
  "Symbol(type)": number;
  isDirectory(): boolean;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-gutenberg" is now active!'
  );

  var gutenbergOutputChannel = vscode.window.createOutputChannel("Gutenberg");

  // Options
  var pandocCmdArgsOption: pandocCmdArgs = vscode.workspace
    .getConfiguration("gutenberg")
    .get("pandocCmdArgs") as pandocCmdArgs;
  var pandocCommandExtraOption: string = vscode.workspace
    .getConfiguration("gutenberg")
    .get("pandocCommandExtra") as string;
  var rootFolderOption: string = vscode.workspace
    .getConfiguration("gutenberg")
    .get("useDifferentRootPath") as string;
  var ignoreRootFoldersOption: Array<string> = vscode.workspace
    .getConfiguration("gutenberg")
    .get("ignoreRootPathFolders") as Array<string>;
  var ignoreFilesOption: Array<string> = vscode.workspace
    .getConfiguration("gutenberg")
    .get("ignoreFiles") as Array<string>;
  var inputExtensionOption: string = vscode.workspace
    .getConfiguration("gutenberg")
    .get("inputExtension") as string;
  var outputExtensionOption: string = vscode.workspace
    .getConfiguration("gutenberg")
    .get("outputExtension") as string;

  // Grab root folder
  const rootfolders = vscode.workspace
    .workspaceFolders as readonly vscode.WorkspaceFolder[];
  let rootPathFull = "";

  // Support for only one workspace opened or rootPath set in config
  if (rootfolders.length === 1 && rootFolderOption === "") {
    //rootPathUri = rootfolders[0].uri
    rootPathFull = rootfolders[0].uri.fsPath;
    console.log(`Root path: ${rootfolders[0].name}`);
  }

  if (rootFolderOption) {
    rootPathFull = rootFolderOption;
    console.log(`Root path: ${rootFolderOption}`);
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "vscode-gutenberg.printBook",
    async function () {
      // The code you place here will be executed every time your command is executed

      // ignore folders come from configuration
      const ignoreFolders = ignoreRootFoldersOption;
      const ignoreFiles = ignoreFilesOption;
      const bookFoldersPromise = getBookFiles(
        rootPathFull,
        ignoreFolders,
        ignoreFiles,
        `.${inputExtensionOption}`
      );
      const bookFilesResponse = await Promise.resolve(bookFoldersPromise);
      //console.log(bookFilesResponse)

      // Need to join the filesString for the pandoc command
      let filesArray: Array<string> = [];
      let filesString = "";
      bookFilesResponse.forEach((element) => {
        element.files.forEach((file) => {
          if (process.platform === "win32") {
            if (element.isFolder) {
              filesArray.push(
                `"${rootPathFull}\\${element.folderPath}\\${file}"`
              );
            } else {
              filesArray.push(`"${rootPathFull}\\${file}"`);
            }
          } else {
            if (element.isFolder) {
              filesArray.push(`./"${element.folderPath}/${file}"`);
            } else {
              filesArray.push(`./"${file}"`);
            }
          }
        });
      });

      //console.log(process.platform)

      if (filesArray.length > 0) {
        vscode.window.showInformationMessage("Files names have been collected");
        filesString = filesArray.join(" ");
      } else {
        vscode.window.showErrorMessage("No files found!");
        return;
      }

      // Ensure output folder exists
      const outputFolderExists = await fs.pathExists(
        `${rootPathFull}/${pandocCmdArgsOption.outputFolder}`
      );
      if (!outputFolderExists) {
        try {
          await fs.ensureDir(
            `${rootPathFull}/${pandocCmdArgsOption.outputFolder}`
          );
          console.log("success!");
        } catch (err) {
          console.error(err);
          vscode.window.showErrorMessage(err);
        }
      }

      let pandocCmdTest = `cd "${rootPathFull}" && ls`;
      let pandocCmd = "";
      if (outputExtensionOption !== "pdf") {
        pandocCmd = `cd "${rootPathFull}" && pandoc -o ./${pandocCmdArgsOption.outputFolder}/${pandocCmdArgsOption.bookName}.${outputExtensionOption} ${filesString} ${pandocCommandExtraOption}`;
      } else {
        pandocCmd = `cd "${rootPathFull}" && pandoc -o ./${pandocCmdArgsOption.outputFolder}/${pandocCmdArgsOption.bookName}.${outputExtensionOption} --pdf-engine=${pandocCmdArgsOption.pdfEngine} ${filesString} ${pandocCommandExtraOption}`;
      }

      executePandoc(pandocCmd, gutenbergOutputChannel);

      console.log("End of function");
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "vscode-gutenberg.printSingle",
    function () {
      console.log("Print a single file");

      let fullPath = "";
      const editor = vscode.window.activeTextEditor;

      // Sanity Checks for active editor, or lack of...
      if (editor) {
        fullPath = path.normalize(editor.document.fileName);
      }
      if (editor === undefined) {
        gutenbergOutputChannel.append(`No file is currently active\n`);
        vscode.window.showErrorMessage("No file is currently active");
        return;
      }

      if (!fullPath.includes(`.${inputExtensionOption}`)) {
        gutenbergOutputChannel.append(
          `File active doesn't match input extension\n`
        );
        vscode.window.showErrorMessage(
          `File active doesn't match input extension`
        );
        return;
      }

      const filePath = path.dirname(fullPath);
      const folderName = path.basename(filePath);
      const fileName = path.basename(fullPath);
      const fileNameNoExtension = path.basename(
        fullPath,
        `.${inputExtensionOption}`
      );

      console.log(fullPath);

      let pandocCmd = "";
      if (outputExtensionOption !== "pdf") {
        pandocCmd = `cd "${rootPathFull}" && pandoc -o "${filePath}/${fileNameNoExtension}.${outputExtensionOption}" "${filePath}/${fileName}" ${pandocCommandExtraOption}`;
      } else {
        pandocCmd = `cd "${rootPathFull}" && pandoc -o "${filePath}/${fileNameNoExtension}.pdf" --pdf-engine=xelatex "${filePath}/${fileName}" ${pandocCommandExtraOption}`;
      }

      executePandoc(pandocCmd, gutenbergOutputChannel);

      console.log("End of function");
    }
  );

  let disposable3 = vscode.commands.registerCommand(
    "vscode-gutenberg.selectFiles",
    async function () {
      const configExists = await fs.pathExists(
        `${rootPathFull}/.selectedFiles.json`
      );
      if (configExists) {
        var configData = fs.readFileSync(`${rootPathFull}/.selectedFiles.json`);
        var configDataJSON = JSON.parse(configData);
        console.log(configDataJSON);
      }

      // Read recursively files from workspace
      const filesInDir = await Promise.resolve(getFiles(rootPathFull));
      // getFiles(rootPathFull)
      // 	.then(files => console.log(files))
      // 	.catch(e => console.error(e));
      console.log(filesInDir);

      const filesWithoutRootPath: Array<string> = [];
      filesInDir.forEach((file) => {
        const initialIndex = rootPathFull.length + 1;
        const fileName = path.basename(file);
        const fileBase = path.dirname(file);
        const folderName = path.basename(fileBase);
        // if the folderName is an ignore folder, continue to next filePath
        if (ignoreRootFoldersOption.includes(folderName)) {
          return;
        } else if (
          !ignoreFilesOption.includes(fileName) &&
          fileName.includes(inputExtensionOption)
        ) {
          filesWithoutRootPath.push(file.substr(initialIndex));
        }
      });

      console.log(filesWithoutRootPath);

      // print file => another command print Selected Files based on .selectedFiles file

      const panel = vscode.window.createWebviewPanel(
        "testPanel",
        "Select Files for Printing",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      //const someArray = ['one.md', 'two.md', 'three.md', '/chapter/file.md']

      // Show files on webview
      const listHTML: Array<string> = [];
      filesWithoutRootPath.forEach((textFile, index) => {
        // here we need to load json data, and check if textFile exists

        if (configExists) {
          if (search(textFile, configDataJSON) >= 0) {
            const dataIndex = search(textFile, configDataJSON);
            const isChecked = configDataJSON[dataIndex].checked;
            if (isChecked) {
              listHTML.push(
                `<input type="checkbox" id="${index}" name="fileName" value="${textFile}" checked> ${textFile}</br>`
              );
            } else {
              listHTML.push(
                `<input type="checkbox" id="${index}" name="fileName" value="${textFile}"> ${textFile}</br>`
              );
            }
            return;
          }
        }

        listHTML.push(
          `<input type="checkbox" id="${index}" name="fileName" value="${textFile}"> ${textFile}</br>`
        );
      });
      panel.webview.html = getWebviewContent(listHTML.join(" "));

      // Handle messages from the webview
      // Retrieve selected checkboxes, when button is pressed & generate .selectedFiles file for next time
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "print":
              console.log(message.checkboxStatuses);
              //console.log(fileCheckboxStatus(filesWithoutRootPath, message.checkboxStatuses))
              saveCheckboxesStatus(rootPathFull, message.checkboxStatuses);

              const data = message.checkboxStatuses;
              printSelectedFiles(
                rootPathFull,
                data,
                outputExtensionOption,
                pandocCmdArgsOption,
                gutenbergOutputChannel,
                pandocCommandExtraOption
              );
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
  context.subscriptions.push(disposable3);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

async function getBookFiles(
  rootPath: string,
  ignoreFolders: Array<string>,
  ignoreFiles: Array<string>,
  fileExtension: string
) {
  let bookFoldersPromise = await Promise.resolve(
    vscode.workspace.fs.readDirectory(vscode.Uri.file(rootPath))
  );
  let bookFoldersPaths: Array<string> = [];
  let bookPaths = await Promise.resolve(bookFoldersPromise);
  let bookFilesOnRoot: Array<string> = [];

  bookPaths.forEach((value) => {
    // add folder paths here
    if (value[1] == 2 && !ignoreFolders.includes(value[0])) {
      bookFoldersPaths.push(value[0]);
    }
    // add files on root, in case they need to be used later
    if (value[1] == 1) {
      bookFilesOnRoot.push(value[0]);
    }
  });

  let bookFilesPromises: Array<any> = [];
  let bookFilesResponse = [];
  let bookFiles = [];

  if (bookFoldersPaths.length > 0) {
    bookFoldersPaths.forEach((folder) => {
      bookFilesPromises.push(
        vscode.workspace.fs.readDirectory(
          vscode.Uri.file(path.join(rootPath, folder))
        )
      );
    });

    bookFilesResponse = await Promise.all(bookFilesPromises);

    for (let i = 0; i < bookFoldersPaths.length; i++) {
      // this should give us folder, plus files found in that folder
      //bookFiles.push(bookFoldersPaths[i], bookFilesResponse[i])
      const basePath = path.basename(bookFoldersPaths[i]);
      // only add files to tempFiles
      const tempFiles: Array<string> = [];
      bookFilesResponse[i].forEach((element: Array<any>) => {
        if (
          element[1] == 1 &&
          element[0].includes(fileExtension) &&
          !ignoreFiles.includes(element[0])
        ) {
          tempFiles.push(element[0]);
        }
        if (element[1] == 2) {
          vscode.window.showWarningMessage(
            `Directory ${basePath} should not have nested folders`
          );
        }
        if (
          element[1] == 1 &&
          !element[0].includes(fileExtension) &&
          !ignoreFiles.includes(element[0])
        ) {
          vscode.window
            .showInformationMessage(`Directory ${basePath} should only have ${fileExtension} files,
					 ${element[0]} is not acceptable, add to ignoreFiles configuration`);
        }
      });

      bookFiles.push({
        folderPath: bookFoldersPaths[i],
        files: tempFiles,
        isFolder: true,
      });
    }
  } else {
    // Do only files as no folder paths were found
    // only add files to tempFiles
    bookFilesOnRoot.forEach((element) => {
      const tempFiles = [];
      if (element.includes(fileExtension) && !ignoreFiles.includes(element)) {
        tempFiles.push(element);
      } else if (
        !element.includes(fileExtension) &&
        !ignoreFiles.includes(element)
      ) {
        vscode.window
          .showInformationMessage(`Files should only have ${fileExtension} extension,
				 ${element} is not acceptable, add to ignoreFiles configuration`);
      }

      if (tempFiles.length > 0) {
        bookFiles.push({
          folderPath: rootPath,
          files: tempFiles,
          isFolder: false,
        });
      }
    });
  }
  return bookFiles;
}

async function getFiles(dir: string) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent: ADirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

async function printSelectedFiles(
  rootPathFull: string,
  data: Array<fileSelected>,
  outputExtensionOption: string,
  pandocCmdArgsOption: pandocCmdArgs,
  gutenbergOutputChannel: vscode.OutputChannel,
  pandocCommandExtraOption: string
) {
  let selectedFiles = searchSelected(data);
  let filesArray: Array<string> = [];
  let filesString = "";

  selectedFiles.forEach((file) => {
    if (process.platform === "win32") {
      filesArray.push(`"${rootPathFull}\\${file}"`);
    } else {
      filesArray.push(`./"${file}"`);
    }
  });

  if (filesArray.length > 0) {
    vscode.window.showInformationMessage("Files names have been collected");
    filesString = filesArray.join(" ");
  } else {
    vscode.window.showErrorMessage("No files selected!");
    return;
  }

  // Ensure output folder exists
  const outputFolderExists = await fs.pathExists(
    `${rootPathFull}/${pandocCmdArgsOption.outputFolder}`
  );
  if (!outputFolderExists) {
    try {
      await fs.ensureDir(`${rootPathFull}/${pandocCmdArgsOption.outputFolder}`);
      console.log("success!");
    } catch (err) {
      console.error(err);
      vscode.window.showErrorMessage(err);
    }
  }

  let pandocCmdTest = `cd "${rootPathFull}" && ls`;
  let pandocCmd = "";
  if (outputExtensionOption !== "pdf") {
    pandocCmd = `cd "${rootPathFull}" && pandoc -o ./${pandocCmdArgsOption.outputFolder}/${pandocCmdArgsOption.bookName}.${outputExtensionOption} ${filesString} ${pandocCommandExtraOption}`;
  } else {
    pandocCmd = `cd "${rootPathFull}" && pandoc -o ./${pandocCmdArgsOption.outputFolder}/${pandocCmdArgsOption.bookName}.${outputExtensionOption} --pdf-engine=${pandocCmdArgsOption.pdfEngine} ${filesString} ${pandocCommandExtraOption}`;
  }

  executePandoc(pandocCmd, gutenbergOutputChannel);
}

function searchSelected(data: Array<fileSelected>) {
  let selectedFiles = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i].checked === true) {
      selectedFiles.push(data[i].filePath);
    }
  }
  return selectedFiles;
}

function search(nameKey: string, data: Array<fileSelected>) {
  for (var i = 0; i < data.length; i++) {
    if (data[i].filePath === nameKey) {
      return i;
    }
  }
  return -1;
}

function saveCheckboxesStatus(rootPath: string, data: Array<object>) {
  fs.writeFile(
    `${rootPath}/.selectedFiles.json`,
    JSON.stringify(data),
    (err: Error) => {
      if (err) throw err;
      console.log("Data written to file");
    }
  );
}

function getWebviewContent(checkboxesHtml: string) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Gutenberg</title>
  </head>
  <body>
	  <h1>vscode-gutenberg</h1>
	  <button onClick="checkAll()">  Select All</button>
	  <button onClick="uncheckAll()">  Unselect All</button>
	  <div>${checkboxesHtml}</div>
	  <div>
		  <button onClick="retrieveCheckboxes()">  Print Book</button>
	  <div>
	  <script>
	  var vscode = acquireVsCodeApi();
		  
	  	function checkAll(){
			const checkboxes = document.getElementsByName('fileName')
			checkboxes.forEach(checkbox => {
				if(!checkbox.checked){
					checkbox.checked = true
				}			
			})
		}

		function uncheckAll(){
			const checkboxes = document.getElementsByName('fileName')
			checkboxes.forEach(checkbox => {
				if(checkbox.checked){
					checkbox.checked = false
				}			
			})
		}

        function retrieveCheckboxes(){
            
			const checkboxes = document.getElementsByName('fileName')
			var checkboxStatuses = []

			checkboxes.forEach(checkbox => {
				checkboxStatuses.push(
					{
						'filePath': checkbox.value,
						'checked': checkbox.checked

					})
			})

			vscode.postMessage({
				command: 'print',
				checkboxStatuses: checkboxStatuses
			})
		}	
        
    </script>
  </body>
  </html>`;
}
