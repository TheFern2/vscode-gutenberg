[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/TheFern.vscode-gutenberg.svg)](https://marketplace.visualstudio.com/items?itemName=TheFern.vscode-gutenberg)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/TheFern.vscode-gutenberg.svg)](https://marketplace.visualstudio.com/items?itemName=TheFern.vscode-gutenberg)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/TheFern.vscode-gutenberg.svg)](https://marketplace.visualstudio.com/items?itemName=TheFern.vscode-gutenberg#review-details)

# vscode-gutenberg

![Logo](https://raw.githubusercontent.com/TheFern2/vscode-gutenberg/main/images/printed.jpg)

This extension aims to bridge the gap between technical writers of markup languages such as markdown, and eventually a few other light weight markups extensions. The goal is to take files, and print them into a book pdf, doc, or html. This extension is strictly for writers that want to focus on writing markup and print without all the extra hassle.

## New Feature 1.1.2

This release introduces a file selection webview, as shown below. It offers a bit more control, and offers less rigidity when it comes to folder structure. It remembers what you selected previously, saved on a hidden file called `.selectedFiles.json`. 

![File Selection](https://raw.githubusercontent.com/TheFern2/vscode-gutenberg/main/images/fileSelection.jpg)

## Extension Support

The extension supports anything that pandoc supports as that is what is being used in the background for all the magic. As time goes on, I'll keep adding what's supported here so that people can quickly read if is something they can use for school, or work.

- any command that pandoc would normally take in the cmd line, can be added to `gutenberg.pandocCommandExtra`
- mermaid diagrams tested with https://github.com/raghur/mermaid-filter
    - add **--filter mermaid-filter** to `gutenberg.pandocCommandExtra` restart vscode for options to take.

## Features

The extension has three commands:
- gutenberg: Print Book
- gutenberg: Print Single
- gutenberg: Select Files to Print

### Print Book

The workspace will be treated as the root directory, if there are folders in the root directory, and those folders are not in the ignore configuration array they will be treated as chapters. If for whatever reason you don't want the workspace treated as the root directory, you can choose a path of your own in the configuration.

Without taking into consideration ignored folders, if the root path doesn't contain any folders then the extension will look into the  root path for files if they contain the markdown extension.

### Print Single

Prints one single file into the desired output extension.

### Select Files to Print

The workspace will be treated as the root directory, files will be read recursively. Then the files will be shown in a webview for user to select which files to print.

## Requirements

Follow your operating system install instructions.

- Pandoc  https://pandoc.org/installing.html
- LaTeX (I tested with MiKTeX) https://miktex.org/download

Before you attempt to use this extension, do a minimal test to ensure you can use pandoc in the command line to print to your desired output. If that works, then you are good to go. If it didn't work please look on Stack Overflow or google for assistance, gutenberg needs those two dependencies.

```
pandoc someFile.md -pdf-engine=xelatex -o book.pdf
pandoc someFile.md -o book.doc
pandoc someFile.md -o book.html
```

> NB: The first time you use pandoc, you'll get popups for installing MiKTeX packages, or you can choose in settings to install on the fly without popups. Also the first time you convert a document it takes a while, the next time will be fast as all the packages are already downloaded.

## Book Structure (Only needed for Print Book Command)

There are two ways you can structure your book. If you're like me chances are you want some folder structure, keeping in mind, that there should be no nesting within those folders, basically from root folder you can have one nested level of folders or chapters. I thought about gathering files recursively, but that would complicate things a bit with ordering while is certainly doable, I think it isn't worth the trouble for now.

Folder structured book:
```
├── book
│   ├── Chapter1
│   │   ├── Scene1.md
│   │   └── Scene2.md
│   └── Chapter2
│       └── Scene1.md
├── images
│   └── lostbook.jpg
```

Files in root path:
```
├── book_2
│   ├── Scene1.md
│   ├── Scene2.md
│   └── Scene3.md
├── images
│   └── lostbook.jpg
```

## Extension Settings

This extension contributes the following settings:

* `gutenberg.pandocCmdArgs`: Variables that are passed to the default pandoc command.
* `gutenberg.pandocCommandExtra`: If any extra flags are needed, they go here, i.e. --template=, --toc, --filter,etc.
* `gutenberg.useDifferentRootPath`: By default gutenberg reads workspace rootPath, if your book is within a folder, specify the path to be used.
* `gutenberg.inputExtension`: Input file extension, if you're using something other than md.
* `gutenberg.outputExtension`: Output file extension.
* `gutenberg.ignoreRootPathFolders`: Root path folders ignored from the book print.
* `gutenberg.ignoreFiles`: Files to be ignored from the book print.

### ignoreRootPathFolders

This setting can be useful to ignore folders like `images`, or other folder that you wish to exclude from the root path.

### ignoreFiles

This setting ignores files. If there are folders, then it ignores files within the folders. If there are no folders, then it ignores files within the root directory.

## Known Issues

None

## Release Notes

No major changes, added pandocCommandExtra to single print to be in par with book print. Added a bit of information regarding mermaid support.

### 1.1.2

Additions:
- Added webview for file selection
- Previous commands were refactored, but remained the same
- Non-breaking: Added typescript to project

## Credits

Some of the work here is an extension of vscode-pandoc so I thank dfinke for his contributions.

- https://github.com/dfinke/vscode-pandoc
- Icons made by https://www.flaticon.com/authors/freepik

