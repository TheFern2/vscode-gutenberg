// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const { exec } = require("child_process");

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
	rootFolderOption = vscode.workspace.getConfiguration('gutenberg').get('useDifferentRootPath');
	ignoreRootFoldersOption = vscode.workspace.getConfiguration('gutenberg').get('ignoreRootPathFolders');
	ignoreFilesOption = vscode.workspace.getConfiguration('gutenberg').get('ignoreFiles');
	outputExtensionOption = vscode.workspace.getConfiguration('gutenberg').get('outputExtension');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-gutenberg.printBook', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello VS Code!');
		const rootfolders = vscode.workspace.workspaceFolders
		console.log(rootfolders)

		//let rootPathUri = ''
		let rootPathFull = ''

		// Support for only one workspace opened or rootPath set in config
		if(rootfolders.length === 1 && rootFolderOption === ""){
			//rootPathUri = rootfolders[0].uri
			rootPathFull = rootfolders[0].uri.path
			console.log(`Root path found: ${rootfolders[0].name}`)
		}

		if(rootFolderOption){
			rootPathFull = rootFolderOption
			console.log(`Root path found: ${rootFolderOption}`)
		}
	
		// ignore folders need to be part of configuration
		const ignoreFolders = ignoreRootFoldersOption
		const ignoreFiles = ignoreFilesOption
		
		const bookFoldersPromise = getBookFiles(rootPathFull, ignoreFolders, ignoreFiles, '.md')		
		const bookFilesResponse = await Promise.resolve(bookFoldersPromise)
		console.log(bookFilesResponse)		
		
		// Need to join the filesString for the pandoc command
		let filesArray = []
		let filesString = ''
		bookFilesResponse.forEach(element => {
			element.files.forEach(file => {
				if(element.isFolder){
					filesArray.push(`./${element.folderPath}/${file}`)
				} else {
					filesArray.push(`./${file}`)
				}
				
			});
		});

		if(filesArray.length > 0){
			vscode.window.showInformationMessage('Files names have been collected');
			filesString = filesArray.join(" ")
		} else {
			vscode.window.showErrorMessage('No files found!');
			return
		}		

		let pandocCmd = `cd ${rootPathFull} && pandoc -o book.pdf --pdf-engine=xelatex ${filesString}`
		if(outputExtensionOption !== "pdf"){		
			pandocCmd = `cd ${rootPathFull} && pandoc -o book.${outputExtensionOption} ${filesString}`
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
			rootPathFull = rootfolders[0].uri.path
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

		if(!fullPath.includes('md')){
			gutenbergOutputChannel.append(`File active is not markdown\n`)
			vscode.window.showErrorMessage('File active is not markdown');
			return
		}		

		const filePath = path.dirname(fullPath)
		const folderName = path.basename(filePath)
		const fileName = path.basename(fullPath)
		const fileNameNoExtension = path.basename(fullPath, '.md')

		console.log(fullPath)

		let pandocCmd = `cd ${rootPathFull} && pandoc -o ${filePath}/${fileNameNoExtension}.pdf --pdf-engine=xelatex ${filePath}/${fileName}`
		if(outputExtensionOption !== "pdf"){		
			pandocCmd = `cd ${rootPathFull} && pandoc -o ${filePath}/${fileNameNoExtension}.${outputExtensionOption} ${filePath}/${fileName}`
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

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
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
					vscode.window.showInformationMessage(`Directory ${basePath} should not have nested folders`);
				}
				if(element[1] == 1 && !element[0].includes(fileExtension) && !ignoreFiles.includes(element[0])){
					vscode.window.showInformationMessage(`Directory ${basePath} should only have ${fileExtension} files, ${element[0]} is not acceptable`);
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
				vscode.window.showInformationMessage(`Files should only have ${fileExtension} extension, ${element} is not acceptable, add to ignoreFiles setting`);
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