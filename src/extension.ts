"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  commands,
  DocumentFilter,
  ExtensionContext,
  Terminal,
  TextDocument,
  window,
  languages,
  DocumentHighlightProvider,
  Location,
  workspace
} from "vscode";

import { loadEditHelpers } from "./features/editHelpers";
import PicatDocumentHighlightProvider from "./features/documentHighlightProvider";
import PicatTerminal from "./features/picatTerminal";
import PicatLinter from "./features/picatLinter";

export function activate(context: ExtensionContext) {
  console.log('Congratulations, your extension "vsc-picat" is now active!');

  const PICAT_MODE: DocumentFilter = { language: "picat", scheme: "file" };

  loadEditHelpers(context.subscriptions);

  let linter = new PicatLinter(context);
  linter.activate();

  let myCommands = [
    {
      command: "picat.run.document",
      callback: () => {
        PicatTerminal.runDocument();
      }
    },
    {
      command: "picat.open",
      callback: () => {
        PicatTerminal.openPicat();
      }
    }
  ];
  myCommands.map(command => {
    context.subscriptions.push(
      commands.registerCommand(command.command, command.callback)
    );
  });

  context.subscriptions.push(
    languages.registerDocumentHighlightProvider(
      PICAT_MODE,
      new PicatDocumentHighlightProvider()
    )
  );
  context.subscriptions.push(PicatTerminal.init());
}
// this method is called when your extension is deactivated
export function deactivate() {}
