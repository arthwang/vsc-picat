"use strict";

import {
  HoverProvider,
  TextDocument,
  Position,
  CancellationToken,
  Hover,
  Range,
  MarkedString
} from "vscode";
import { Utils } from "../utils/utils";

export default class PicatHoverProvider implements HoverProvider {
  public provideHover(
    doc: TextDocument,
    position: Position,
    token: CancellationToken
  ): Hover {
    let wordRange: Range = doc.getWordRangeAtPosition(position);
    if (!wordRange) {
      return;
    }
    const pi = Utils.getPredicateUnderCursor(doc, position);
    const descs = Utils.getPredDescriptions(pi);
    let contents: MarkedString[] = [];
    contents.push({
      language: "picat",
      value: descs
    });
    return contents === [] ? null : new Hover(contents, wordRange);
  }
}
