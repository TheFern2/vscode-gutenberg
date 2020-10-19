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

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-gutenberg.printBook', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello VS Code!');
		const rootfolders = vscode.workspace.workspaceFolders
		console.log(rootfolders)

		let rootPathUri = ''
		let rootPathFull = ''

		// TODO figure out how to handle multiple folder workspaces
		// TODO if there is one workspace then handle folders as chapters
		// TODO unless bookRootPath has been set in configuration
		if(rootfolders.length > 1){
			rootfolders.forEach(element => {
				console.log(element.name)
				if(element.name == "book"){
					rootPathUri = element.uri
					rootPathFull = element.uri.path
					console.log(`Root path found: ${element.name}`)
				}
			});
		} else {
			rootPathUri = rootfolders[0].uri
			rootPathFull = rootfolders[0].uri.path
			console.log(`Root path found: ${rootfolders[0].name}`) // rootPathFull can also be an option
		}		
	
		// ignore folders need to be part of configuration
		const ignoreFolders = ['images']
		
		const bookFoldersPromise = getBookFiles(rootPathFull, ignoreFolders, '.md')		
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

		// const lsCmdTest = `cd ${rootPathFull} && ls -la`
		const pandocCmdTest = `cd ${rootPathFull} && pandoc -o book.pdf --pdf-engine=xelatex ${filesString}`

		exec(pandocCmdTest, (error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
				return;
			}
			console.log(`stdout: ${stdout}`);
		});

		console.log('End of function')
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

async function getBookFiles(rootPath, ignoreFolders, fileExtension){

	let bookFoldersPromise = await Promise.resolve(vscode.workspace.fs.readDirectory( vscode.Uri.file(rootPath)))
	let bookFoldersPaths = []
	let bookPaths = await Promise.resolve(bookFoldersPromise)
	let bookFilesOnRoot = []

	bookPaths.forEach(value => {
		// only add folder paths here
		if(value[1] == 2 && !ignoreFolders.includes(value[0])){
			bookFoldersPaths.push(value[0])
		}
		// add files on root, in case they need to be used later
		if(value[1] == 1 && !ignoreFolders.includes(value[0])){
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
				if(element[1] == 1 && element[0].includes(fileExtension)){
					tempFiles.push(element[0])
				}
				if(element[1] == 2){
					vscode.window.showInformationMessage(`Directory ${basePath} should not have nested folders`);
				}
				if(element[1] == 1 && !element[0].includes(fileExtension)){
					vscode.window.showInformationMessage(`Directory ${basePath} should only have ${fileExtension} files, ${element[0]} is not acceptable`);
				}
				//  else{
				// 	// TODO error needs to be cleared on what to remove!
				// 	vscode.window.showErrorMessage(`Directory ${basePath} should only have ${fileExtension} files, not folders or other file extensions`);
				// }
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
			if(element.includes(fileExtension)){
				tempFiles.push(element)
				
			} else{
				// TODO error needs to be cleared on what to remove!
				vscode.window.showInformationMessage(`Files should only have ${fileExtension} extension, ${element} is not acceptable`);
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