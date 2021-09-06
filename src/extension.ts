import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) : void {
  if (context.extension.packageJSON) {
    for (const command of context.extension.packageJSON.contributes.commands) {
      let commandFactory: ((...args: Array<{rootUri?: vscode.Uri}>) => void) | undefined;
      if (command.command === 'git-buttons.pullContext') {
        commandFactory = (...args: Array<{rootUri?: vscode.Uri}>) => {
          const uri = getRootUri(args);
          if (uri) {
            vscode.commands.executeCommand('git.pull', uri);
          } else if (vscode.extensions.getExtension('eamodio.gitlens')?.isActive) {
            vscode.commands.executeCommand('gitlens.pullRepositories');
          } else {
            vscode.window.showInformationMessage('Please install eamodio.gitlens');
          }
        };

      } else if (command.command === 'git-buttons.pushContext') {
        commandFactory = (...args: Array<{rootUri?: vscode.Uri}>) => {
          const uri = getRootUri(args);
          if (uri) {
            vscode.commands.executeCommand('git.push', uri);
          } else if (vscode.extensions.getExtension('eamodio.gitlens')?.isActive) {
            vscode.commands.executeCommand('gitlens.pushRepositories');
          } else {
            vscode.window.showInformationMessage('Please install eamodio.gitlens');
          }
        };

      } else if (command.command.startsWith('git-buttons.')) {
        const vscodeCommand = command.command.replace('-buttons', '');
        commandFactory = (...args: {rootUri?: vscode.Uri}[]) => {
          vscode.commands.executeCommand(vscodeCommand, getRootUri(args));
        };
      }
      if (commandFactory) {
        context.subscriptions.push(vscode.commands.registerCommand(command.command, commandFactory));
      }
    }
  }
}
function getRootUri(args: { rootUri?: vscode.Uri | undefined; }[]) {
  if (args.length > 0) {
    const rootUri = args[0]?.rootUri;
    if (rootUri instanceof vscode.Uri) {
      return rootUri;
    }
  }
  return undefined;
}
