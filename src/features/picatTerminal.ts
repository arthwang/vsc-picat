"use strict";

import {
  Terminal,
  window,
  workspace,
  TextDocument,
  Disposable,
  OutputChannel,
  TextEditor
} from "vscode";

export default class PicatTerminal {
  private static _terminal: Terminal;
  private static _document: TextDocument;

  constructor() {}

  public static init(): Disposable {
    return (<any>window).onDidCloseTerminal(terminal => {
      PicatTerminal._terminal = null;
      terminal.dispose();
    });
  }

  private static createPicatTerm() {
    if (PicatTerminal._terminal) {
      return;
    }

    let section = workspace.getConfiguration("picat");
    if (section) {
      let executable = section.get<string>("executablePath", "picat");
      let args = section.get<string[]>("terminal.runtimeArgs");
      PicatTerminal._terminal = (<any>window).createTerminal(
        "Picat",
        executable,
        args
      );
    } else {
      throw new Error("configuration settings error: picat");
    }
  }

  public static sendString(text: string) {
    PicatTerminal.createPicatTerm();
    PicatTerminal._terminal.sendText(text);
    PicatTerminal._terminal.show(false);
  }

  public static openPicat() {
    PicatTerminal.createPicatTerm();
    PicatTerminal._terminal.show(true);
  }
  public static runDocument() {
    PicatTerminal._document = window.activeTextEditor.document;
    PicatTerminal.createPicatTerm();
    let goals = "cl('" + PicatTerminal._document.fileName + "'),main.";
    if (PicatTerminal._document.isDirty) {
      PicatTerminal._document.save().then(_ => {
        PicatTerminal.sendString(goals);
      });
    } else {
      PicatTerminal.sendString(goals);
    }
  }
}
