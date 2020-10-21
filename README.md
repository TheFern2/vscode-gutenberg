# vscode-gutenberg

This extension aims to bridge the gap between technical writers of markup languages such as markdown, and eventually a few other light weight markups extensions. The goal is to take files, and print them into a book pdf, doc, or html.

Most of the existing extensions I've looked at, print a single markdown file, others preview markdown which is great, but none print a book (Unless I missed that extension somehow). This extension is strictly for writers that want to focus on writing markup and print without all the extra hassle.

## Features

The extension has two commands:
- gutenberg: Print Book
- gutenberg: Print Single

The workspace will be treated as the root directory, if there are folders in the root directory, and those folders are not in the ignore configuration array they will be treated as chapters. If for whatever reason you don't want the workspace treated as the root directory, you can choose a path of your own in the configuration.

Without taking into consideration ignored folders, if the root path doesn't contain any folders then the extension will look into the  root path for files if they contain the markdown extension.

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

## Extension Settings

This extension contributes the following settings:

* `gutenberg.defaultPandocCommand`: Default pandoc command, and output file name. Use this if you need to include a template, or other command flag
* `gutenberg.defaultPdfEngine`: Default pdf engine
* `gutenberg.useDifferentRootPath`: By default gutenberg reads workspace rootPath, if your book is within a folder, specify the path to be used
* `gutenberg.inputExtension`: Input file extension, if you're using something other than md
* `gutenberg.outputExtension`: Output file extension
* `gutenberg.ignoreRootPathFolders`: Root path folders ignored from the book print
* `gutenberg.ignoreFiles`: Files to be ignored from the book print

### ignoreRootPathFolders

This setting can be useful to ignore folders like `images`, or other folder that you wish to exclude from the root path.

### ignoreFiles

This setting ignores files. If there are folders, then it ignores files within the folders. If there are no folders, then it ignores files within the root directory.

## Known Issues

None

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of gutenberg:
- Print a book
- Print a single file

## Credits

Some of the work here is an extension of vscode-pandoc so I thank dfinke for his contributions.

- https://github.com/dfinke/vscode-pandoc
- Icons made by https://www.flaticon.com/authors/freepik

