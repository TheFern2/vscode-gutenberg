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
	console.log('Congratulations, your extension "vscode-markdown-pandoc" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-markdown-pandoc.helloWorld', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VS Code!');
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
		

		const bookFolders = Promise.resolve(vscode.workspace.fs.readDirectory(rootPathUri))
		let bookFilesPromise = []
		
		// ignore folders need to be part of configuration
		const ignoreFolders = ['images']

		bookFilesPromise = getBookFiles(bookFolders, rootPathFull, ignoreFolders, '.md')
		
		const bookFilesResponse = await Promise.resolve(bookFilesPromise)
		console.log(bookFilesResponse)
		
		// Need to join the filesString for the pandoc command
		let filesArray = []
		let filesString = ''
		bookFilesResponse.forEach(element => {
			element.files.forEach(file => {
				filesArray.push(`./${element.folderPath}/${file}`)
			});
		});

		filesString = filesArray.join(" ")

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

async function getBookFiles(foldersPromise, rootPath, ignoreFolders, fileExtension){
	let bookFoldersPaths = []
	let bookPaths = await Promise.resolve(foldersPromise)

	bookPaths.forEach(value => {
		// only add folder paths
		if(value[1] == 2 && !ignoreFolders.includes(value[0])){
			bookFoldersPaths.push(value[0])
		}	
	})

	let bookFilesPromises = []
	let bookFilesResponse = []
	let bookFiles = []

	bookFoldersPaths.forEach(folder => {
		bookFilesPromises.push(vscode.workspace.fs.readDirectory(
			vscode.Uri.file(path.join(rootPath, folder))
		))
	});

	bookFilesResponse = await Promise.all(bookFilesPromises)

	for (let i = 0; i < bookFoldersPaths.length; i++) {
		// this should give us folder, plus files found in that folder
		//bookFiles.push(bookFoldersPaths[i], bookFilesResponse[i])

		// only add files to tempFiles
		const tempFiles = []
		bookFilesResponse[i].forEach(element => {
			if(element[1] == 1 && element[0].includes(fileExtension)){
				tempFiles.push(element[0])
			} else{
				vscode.window.showErrorMessage(`Directories should only have ${fileExtension} files, not folders or other file extensions`);
			}
		});
		
		bookFiles.push({
			"folderPath": bookFoldersPaths[i],
			"files": tempFiles
		})	
	}

	return bookFiles
}