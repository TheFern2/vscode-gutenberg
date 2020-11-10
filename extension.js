// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const { exec } = require("child_process");
const process = require("process")
const fs = require('fs-extra')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-gutenberg" is now active!');

	var gutenbergOutputChannel = vscode.window.createOutputChannel('Gutenberg')

	// Options
	pandocCmdArgsOption = vscode.workspace.getConfiguration('gutenberg').get('pandocCmdArgs');
	pandocCommandExtraOption = vscode.workspace.getConfiguration('gutenberg').get('pandocCommandExtra');
	defaultPdfEngineOption = vscode.workspace.getConfiguration('gutenberg').get('defaultPdfEngine');
	rootFolderOption = vscode.workspace.getConfiguration('gutenberg').get('useDifferentRootPath');
	ignoreRootFoldersOption = vscode.workspace.getConfiguration('gutenberg').get('ignoreRootPathFolders');
	ignoreFilesOption = vscode.workspace.getConfiguration('gutenberg').get('ignoreFiles');
	inputExtensionOption = vscode.workspace.getConfiguration('gutenberg').get('inputExtension');
	outputExtensionOption = vscode.workspace.getConfiguration('gutenberg').get('outputExtension');

	//console.log(pandocCmdArgsOption)

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-gutenberg.printBook', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello VS Code!');
		const rootfolders = vscode.workspace.workspaceFolders
		let rootPathFull = ''

		// Support for only one workspace opened or rootPath set in config
		if(rootfolders.length === 1 && rootFolderOption === ""){
			//rootPathUri = rootfolders[0].uri
			rootPathFull = rootfolders[0].uri.fsPath
			console.log(`Root path found: ${rootfolders[0].name}`)
		}

		if(rootFolderOption){
			rootPathFull = rootFolderOption
			console.log(`Root path found: ${rootFolderOption}`)
		}
	
		// ignore folders come from configuration
		const ignoreFolders = ignoreRootFoldersOption
		const ignoreFiles = ignoreFilesOption		
		const bookFoldersPromise = getBookFiles(rootPathFull, ignoreFolders, ignoreFiles, `.${inputExtensionOption}`)		
		const bookFilesResponse = await Promise.resolve(bookFoldersPromise)
		//console.log(bookFilesResponse)		
		
		// Need to join the filesString for the pandoc command
		let filesArray = []
		let filesString = ''
		bookFilesResponse.forEach(element => {
			element.files.forEach(file => {	

				if(process.platform === "win32"){
					if(element.isFolder){
						filesArray.push(`"${rootPathFull}\\${element.folderPath}\\${file}"`)
					} else {
						filesArray.push(`"${rootPathFull}\\${file}"`)
					}
				} else {
					if(element.isFolder){
						filesArray.push(`./"${element.folderPath}/${file}"`)
					} else {
						filesArray.push(`./"${file}"`)
					}
				}			
			});
		});

		//console.log(process.platform)

		if(filesArray.length > 0){
			vscode.window.showInformationMessage('Files names have been collected');
			filesString = filesArray.join(" ")
		} else {
			vscode.window.showErrorMessage('No files found!');
			return
		}
		
		// Ensure output folder exists
		const outputFolderExists = await fs.pathExists(`${rootPathFull}/${pandocCmdArgsOption.outputFolder}`)
		if(!outputFolderExists){
			try {
				await fs.ensureDir(`${rootPathFull}/${pandocCmdArgsOption.outputFolder}`)
				console.log('success!')
			  } catch (err) {
				console.error(err)
				vscode.window.showErrorMessage(err);
			  }
		}

		let pandocCmdTest = `cd "${rootPathFull}" && ls`
		let pandocCmd = ''
		if(outputExtensionOption !== "pdf"){		
			pandocCmd = `cd "${rootPathFull}" && pandoc -o ./${pandocCmdArgsOption.outputFolder}/${pandocCmdArgsOption.bookName}.${outputExtensionOption} ${filesString} ${pandocCommandExtraOption}`
		} else {
			pandocCmd = `cd "${rootPathFull}" && pandoc -o ./${pandocCmdArgsOption.outputFolder}/${pandocCmdArgsOption.bookName}.${outputExtensionOption} --pdf-engine=${pandocCmdArgsOption.pdfEngine} ${filesString} ${pandocCommandExtraOption}`
		}

		exec(pandocCmd, (error, stdout, stderr) => {
			if (error !== null) {
				console.log(`error: ${error.message}`);
				gutenbergOutputChannel.append(`error: ${error.message}\n`)
			}
			if (stderr !== null && stderr !== "") {
				console.log(`stderr: ${stderr}`);
				vscode.window.showErrorMessage('stderr: ' + stderr.toString());
				gutenbergOutputChannel.append(`stderr: ${stderr}\n`)
				
			}
			if (stdout !== null){
				console.log(`stdout: ${stdout}`);
				gutenbergOutputChannel.append(`stdout: ${stdout}\n`)
			}
			
		});

		console.log('End of function')
	});

	let disposable2 = vscode.commands.registerCommand('vscode-gutenberg.printSingle', function () {
		console.log('Print a single file')
		const rootfolders = vscode.workspace.workspaceFolders

		if(rootFolderOption){
			rootPathFull = rootFolderOption
		} else {
			rootPathFull = rootfolders[0].uri.fsPath
		}		

		let fullPath = ''
		const editor = vscode.window.activeTextEditor

		// Sanity Checks for active editor, or lack of...
		if(editor){
			fullPath = path.normalize(editor.document.fileName)
		}
		if(editor === undefined){
			gutenbergOutputChannel.append(`No file is currently active\n`)
			vscode.window.showErrorMessage('No file is currently active');
			return
		}		

		if(!fullPath.includes(`.${inputExtensionOption}`)){
			gutenbergOutputChannel.append(`File active doesn't match input extension\n`)
			vscode.window.showErrorMessage(`File active doesn't match input extension`);
			return
		}		

		const filePath = path.dirname(fullPath)
		const folderName = path.basename(filePath)
		const fileName = path.basename(fullPath)
		const fileNameNoExtension = path.basename(fullPath, `.${inputExtensionOption}`)

		console.log(fullPath)

		let pandocCmd = ''
		if(outputExtensionOption !== "pdf"){		
			pandocCmd = `cd "${rootPathFull}" && pandoc -o "${filePath}/${fileNameNoExtension}.${outputExtensionOption}" "${filePath}/${fileName}" ${pandocCommandExtraOption}`
		} else {
			pandocCmd = `cd "${rootPathFull}" && pandoc -o "${filePath}/${fileNameNoExtension}.pdf" --pdf-engine=xelatex "${filePath}/${fileName}" ${pandocCommandExtraOption}`
		}

		exec(pandocCmd, (error, stdout, stderr) => {
			if (error !== null) {
				console.log(`error: ${error.message}`);
				gutenbergOutputChannel.append(`error: ${error.message}\n`)
			}
			if (stderr !== null && stderr !== "") {
				console.log(`stderr: ${stderr}`);
				vscode.window.showErrorMessage('stderr: ' + stderr.toString());
				gutenbergOutputChannel.append(`stderr: ${stderr}\n`)
				
			}
			if (stdout !== null){
				console.log(`stdout: ${stdout}`);
				gutenbergOutputChannel.append(`stdout: ${stdout}\n`)
			}
			
		});

		console.log('End of function')
	})

	let disposable3 = vscode.commands.registerCommand('vscode-gutenberg.selectFiles', function (){
		
		// Read recursively files from workspace

		// Show files on webview

		// Retrieve selected checkboxes, when button is pressed & generate .selectedFiles file for next time

		// print file => another command print Selected Files based on .selectedFiles file
		
		const panel = vscode.window.createWebviewPanel(
			'testPanel',
			'Select Files for Printing',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		)

		
		const someArray = ['one.md', 'two.md', 'three.md', '/chapter/file.md']
		const listHTML = []
		someArray.forEach((textFile, index) => {
			listHTML.push(
				`<input type="checkbox" id="${index}" name="fileName" value="1" checked> ${textFile}</br>`
			)
		})
		panel.webview.html = getWebviewContent(listHTML.join(' '))

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			message => {
			  switch (message.command) {
				case 'status':
				  console.log(message.text);
				  return;
			  }
			},
			undefined,
			context.subscriptions
		);
	})

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

async function getBookFiles(rootPath, ignoreFolders, ignoreFiles, fileExtension){

	let bookFoldersPromise = await Promise.resolve(vscode.workspace.fs.readDirectory( vscode.Uri.file(rootPath)))
	let bookFoldersPaths = []
	let bookPaths = await Promise.resolve(bookFoldersPromise)
	let bookFilesOnRoot = []

	bookPaths.forEach(value => {
		// add folder paths here
		if(value[1] == 2 && !ignoreFolders.includes(value[0])){
			bookFoldersPaths.push(value[0])
		}
		// add files on root, in case they need to be used later
		if(value[1] == 1){
			bookFilesOnRoot.push(value[0])
		}
	})

	let bookFilesPromises = []
	let bookFilesResponse = []
	let bookFiles = []

	if(bookFoldersPaths.length > 0){
		bookFoldersPaths.forEach(folder => {
			bookFilesPromises.push(vscode.workspace.fs.readDirectory(
				vscode.Uri.file(path.join(rootPath, folder))
			))
		});
	
		bookFilesResponse = await Promise.all(bookFilesPromises)
	
		for (let i = 0; i < bookFoldersPaths.length; i++) {
			// this should give us folder, plus files found in that folder
			//bookFiles.push(bookFoldersPaths[i], bookFilesResponse[i])
			const basePath = path.basename(bookFoldersPaths[i])
			// only add files to tempFiles
			const tempFiles = []
			bookFilesResponse[i].forEach(element => {
				if(element[1] == 1 && element[0].includes(fileExtension) && !ignoreFiles.includes(element[0])){
					tempFiles.push(element[0])
				}
				if(element[1] == 2){
					vscode.window.showWarningMessage(`Directory ${basePath} should not have nested folders`);
				}
				if(element[1] == 1 && !element[0].includes(fileExtension) && !ignoreFiles.includes(element[0])){
					vscode.window.showInformationMessage(`Directory ${basePath} should only have ${fileExtension} files,
					 ${element[0]} is not acceptable, add to ignoreFiles configuration`);
				}
			});
			
			bookFiles.push({
				"folderPath": bookFoldersPaths[i],
				"files": tempFiles,
				"isFolder": true
			})	
		}
	} else {
		// Do only files as no folder paths were found
		// only add files to tempFiles		
		bookFilesOnRoot.forEach(element => {
			const tempFiles = []
			if(element.includes(fileExtension) && !ignoreFiles.includes(element)){
				tempFiles.push(element)				
			} else if(!element.includes(fileExtension) && !ignoreFiles.includes(element)){
				vscode.window.showInformationMessage(`Files should only have ${fileExtension} extension,
				 ${element} is not acceptable, add to ignoreFiles configuration`);
			}

			if(tempFiles.length > 0){
				bookFiles.push({
					"folderPath": rootPath,
					"files": tempFiles,
					"isFolder": false
				})
			}
		});			
		
	}
	return bookFiles
}

function getWebviewContent(list) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <h1>Hello</h1>
	  <div>${list}</div>
	  <script>
        (function() {
            const vscode = acquireVsCodeApi();
            const someCheckbox = document.getElementById('0');
			console.log(someCheckbox.checked)
			vscode.postMessage({
				command: 'status',
				text: someCheckbox.checked
			})
			
        }())
    </script>
  </body>
  </html>`;
}