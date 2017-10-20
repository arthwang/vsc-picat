"use strict";

import {
  CodeActionProvider,
  TextDocument,
  Range,
  CodeActionContext,
  CancellationToken,
  Command,
  workspace,
  Disposable,
  OutputChannel,
  ExtensionContext,
  window
} from "vscode";
import { spawn } from "process-promises";

export default class PicatLinter implements CodeActionProvider {
  private _executable: string;
  private _documentListener: Disposable;
  private _openDocumentListener: Disposable;
  private _outputChannel: OutputChannel = null;
  constructor(private context: ExtensionContext) {
    this._executable = null;
  }
  public activate(): void {
    let subscriptions: Disposable[] = this.context.subscriptions;
    // this.diagnosticCollection = languages.createDiagnosticCollection();

    workspace.onDidChangeConfiguration(
      this.loadConfiguration,
      this,
      subscriptions
    );
    this.loadConfiguration();
    if (this._outputChannel === null) {
      this._outputChannel = window.createOutputChannel("PicatLinter");
      this._outputChannel.clear();
    }
  }

  private outputMsg(msg: string) {
    this._outputChannel.append(msg + "\n");
    this._outputChannel.show(true);
  }
  private loadConfiguration(): void {
    let section = workspace.getConfiguration("picat");
    if (section) {
      this._executable = section.get<string>("executablePath", "picat");
      if (this._documentListener) {
        this._documentListener.dispose();
      }
      if (this._openDocumentListener) {
        this._openDocumentListener.dispose();
      }
    }

    this._documentListener = workspace.onDidSaveTextDocument(
      this.doPlint,
      this
    );
    this._openDocumentListener = workspace.onDidOpenTextDocument(e => {
      this.doPlint(e);
    });

    workspace.textDocuments.forEach(this.doPlint, this);
  }

  private doPlint(doc: TextDocument) {
    if (doc.languageId != "picat") {
      return;
    }

    let options = workspace.rootPath
      ? {
          cwd: workspace.rootPath,
          encoding: "utf8"
        }
      : undefined;

    let args: string[] = ["-g", `cl('${doc.fileName}')`];
    let goals: string = "";

    let child = spawn(this._executable, args, options)
      .on("process", proc => {
        if (proc.pid) {
          this._outputChannel.clear();
        }
      })
      .on("stderr", err => {
        if (/^\s*\*\*\*/.test(err)) {
          this.outputMsg(err + "\n");
        }
      })
      .catch(error => {
        let message: string = null;
        if ((<any>error).code === "ENOENT") {
          message = `Cannot lint the Picat file. The Picat executable was not found. Use the 'picat.executablePath' setting to configure`;
        } else {
          message = error.message
            ? error.message
            : `Failed to run picat executable using path: ${this
                ._executable}. Reason is unknown.`;
        }
        this.outputMsg(message);
      });
  }
  provideCodeActions(
    document: TextDocument,
    range: Range,
    context: CodeActionContext,
    token: CancellationToken
  ): Command[] | Thenable<Command[]> {
    let codeActions: Command[] = [];

    return codeActions;
  }
  public dispose(): void {
    this._documentListener.dispose();
    this._openDocumentListener.dispose();
  }
}
