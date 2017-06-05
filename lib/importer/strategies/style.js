'use strict';

const fs = require('../../file-system');
const logger = require('aurelia-logging').getLogger('Amodro');
const path = require('path');

let StyleStrategy = class {

  static inject() { return ['package']; }

  constructor(pkg) {
    this.package = pkg;
  }

  applies() {
    return !!(this.package.style);
  }

  execute() {
    let distFolderPromise = Promise.resolve();
    if (!this.package.distFolder || !this.package.distFolder.length) {
      this.package.distFolder = '';
      distFolderPromise = this.package.detectDistFolder();
    }

    return distFolderPromise.then(() => {
      this.package.path = path.posix.join('../node_modules/', this.package.name, this.package.distFolder);
    })
      .then(() => this.package.detectResources())
      .then(() => this.package.getConfiguration())
      .then((config) => {
        return {
          dependencies: [config]
        };
      });
  }

  get name() {
    return 'Style Strategy';
  }
};

module.exports = StyleStrategy;
