import { ExtensionContext, Uri, commands } from 'vscode';

export function activate(context: ExtensionContext) : void {
  if (context.extension.packageJSON) {
    for (const command of context.extension.packageJSON.contributes.commands) {
      if (command.command.startsWith('git-buttons.')) {
        const vscodeCommand = command.command.replace('-buttons', '');
        const commandFactory = (...args: {rootUri?: Uri}[]) => {
          let uri: Uri | undefined;
          if (args.length > 0) {
            const rootUri = args[0]?.rootUri;
            if (rootUri instanceof Uri) {
              uri = rootUri;
            }
          }
          commands.executeCommand(vscodeCommand, uri);
        };
        context.subscriptions.push(commands.registerCommand(command.command, commandFactory));
      }
    }
  }
}
