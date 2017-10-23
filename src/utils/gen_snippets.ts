import * as fse from "fs-extra-plus";

let path = "/home/laowang/tmp/picatdoc/";
let guideTxt: string;

interface ISnippet {
  prefix: string;
  body: string;
  description: string;
}
interface ISnippets {
  [key: string]: ISnippet;
}
interface IPredDocs {
  [key: string]: string;
}
let snippets: ISnippets = {};
let predDocs: IPredDocs = {};
function getPI(head: string): { name: string; arity: number; pi: string } {
  let params = head.match(/\(([^\)]+)\)/);
  let arity: number = 0;

  if (params) {
    if (/\.\.\./.test(params[1])) {
      arity = 100;
    } else {
      arity = params[1].split(",").length;
    }
  }
  let name = head.split("(")[0];

  return { name: name, arity: arity, pi: name + "/" + arity };
}
function digoutDoc() {
  let regex = /\*\s*[a-z].+:[\s\S]+?\n\n/g;
  let docs = guideTxt.match(regex);
  docs.forEach(doc => {
    doc = doc.replace(/^\s*\*\s*/, "");
    let [head, desc] = doc.split(/:\s*/);
    predDocs[getPI(head).pi] = doc
      .replace(/\n\s*(?=\w)/g, " ")
      .replace(/\n\s*(?=\W)/g, "")
      .replace(":", "\n");
  });
  //   console.log(docs.length);
}
async function moduleToSnippets(module: string) {
  let modname = module.replace(/^.+\//, "").replace(/\.pi\.txt/, "");
  let txt = await fse.readFile(module, "utf8");
  let heads = txt.match(/^[a-z].+(?= =)/gm);
  let docs = heads.map(head => {
    let doc: string = head;
    let pi = getPI(head);
    if (predDocs[pi.pi]) {
      doc = predDocs[pi.pi];
    } else if (predDocs[pi.name + "/100"]) {
      doc = predDocs[pi.name + "/100"];
    }
    let snippet: ISnippet = {
      prefix: pi.name,
      description: doc,
      body: convertToBody(head)
    };
    snippets[`${modname}:${pi.pi}`] = snippet;
  });
}

function convertToBody(head: string): string {
  let body = head;
  let params = head.match(/\(([^\)]+)\)/);
  if (params) {
    body = head.split("(")[0] + "(";
    let stops = params[1].split(/,\s*/).map((param, i) => {
      return "${" + (i + 1) + ":" + param + "}";
    });
    body += stops.join(", ") + ")$0";
  }
  return body;
}
function initSnippets() {
  snippets["ifthen"] = {
    prefix: "ifel",
    description: "if then else control",
    body: `
if ($1) then
    $2
else
    $3
end$0`
  };
  snippets["ifelif"] = {
    prefix: "ifelif",
    description: "if else then control",
    body: `
if ($1) then
    $2
elseif ($3)
    $4
else
    $5
end$0`
  };
  snippets["elif"] = {
    prefix: "elseif",
    description: "elseif control",
    body: `
elseif ($1)
    $0`
  };
  snippets["while"] = {
    prefix: "while",
    description: "while loop",
    body: `
while ($1)
    $2
end$0`
  };
  snippets["dowhile"] = {
    prefix: "do",
    description: "do-while loop",
    body: `
do
    $2
while($1)
$0`
  };

  snippets["foreach"] = {
    prefix: "foreach",
    description: "foreach block",
    body: `
foreach ($1)
    $2
end$0`
  };
}
(async () => {
  initSnippets();
  guideTxt = await fse.readFile(path + "guide.txt", "utf8");
  digoutDoc();
  await moduleToSnippets(path + "basic.pi.txt");
  await moduleToSnippets(path + "cp.pi.txt");
  await moduleToSnippets(path + "io.pi.txt");
  await moduleToSnippets(path + "math.pi.txt");
  await moduleToSnippets(path + "mip.pi.txt");
  await moduleToSnippets(path + "ordset.pi.txt");
  await moduleToSnippets(path + "os.pi.txt");
  await moduleToSnippets(path + "planner.pi.txt");
  await moduleToSnippets(path + "sat.pi.txt");
  await moduleToSnippets(path + "sys.pi.txt");
  await moduleToSnippets(path + "util.pi.txt");
  await fse.writeJSON("../../snippets/picat.json", snippets);
})();
