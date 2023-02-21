#!/usr/bin/env node

const fs = require("fs");
const { spawn } = require("child_process");
const process = require("process");
const { homedir } = require("os");

// ignore path
const ignorePaths = [
  "(",
  "node_modules",
  "|",
  ".git",
  "|",
  "package-lock.json",
  ")",
];

let childProcess;
// getting all file path from parent directory
const fileMap = new Map();
const findFilePath = (moduleObj) => {
  if (!moduleObj.length) {
    return;
  }
  moduleObj.forEach((fileObj) => {
    regexUrl = [];

    const regex = new RegExp(ignorePaths.join(""));
    if (regex.test(fileObj.filename)) {
      return;
    }

    // checking filepath is exits in map
    if (!fileMap.has(fileObj)) {
      modifiedTime = fs.statSync(fileObj.filename).mtime;
      fileMap.set(fileObj.filename, new Date(modifiedTime).getTime());
    }
    findFilePath(fileObj.children);
  });
};

// start node process
const startNodeProcess = (targetFilePath) => {
  childProcess = spawn("node", [targetFilePath]);
  // Listen for data from the new Node process
  childProcess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });
};

// kill node process
const restartNodeProcess = (targetFilePath) => {
  console.log("Restarting server...");
  childProcess.kill();
  startNodeProcess(targetFilePath);
};

const checkFileChanges = (filePaths, targetFilePath) => {
  for (let fileDetails of filePaths) {
    const [filePath, previousModifiedTime] = fileDetails;
    const currentModifiedTime = fs.statSync(filePath).mtime;
    if (previousModifiedTime < currentModifiedTime) {
      fileMap.set(filePath, new Date(currentModifiedTime).getTime());
      //   kill node process
      restartNodeProcess(targetFilePath);
    }
  }
};

function main() {
  const HOME_PATH = process.cwd();
  const targetFilePath = process.argv[2];
  if (!targetFilePath) {
    console.log("please provide valid target file name!");
    return;
  }
  const PARENT_PATH = `${HOME_PATH}/${targetFilePath}`;
  require(PARENT_PATH);
  findFilePath(module.children);
  //   start node process
  console.clear();
  console.log("Starting server...");
  startNodeProcess(targetFilePath);
  setInterval(() => {
    checkFileChanges(fileMap, targetFilePath);
  }, 1000);

  //   signals
  process.stdin.on("data", (data) => {
    const input = data.toString().trim();
    if (input === "rs") {
      findFilePath(module.children);
      restartNodeProcess(targetFilePath);
    }
  });

  process.on("SIGINT", () => {
    console.log("Stopping server...");
    childProcess.kill();
    process.exit(0);
  });
}

main();
