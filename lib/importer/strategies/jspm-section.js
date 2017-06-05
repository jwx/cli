'use strict';

const logger = require('aurelia-logging').getLogger('JSPM');
const path = require('path');

let JSPMSectionStrategy = class {

  static inject() { return ['package']; }

  constructor(pkg) {
    this.package = pkg;
  }

  applies() {
    if (!this.hasJSPMConfig(this.package.packageJSON)) {
      logger.debug(`There is no "jspm" section in the package.json file of the plugin (looked in '${this.package.packageJSONPath}')`);
      return false;
    }

    return true;
  }

  execute() {
    let jspm = this.package.packageJSON.jspm;
    let main = jspm.main || this.package.packageJSON.main;

    this.package.main = main;

    if (jspm.shim && jspm.shim[main]) {
      let shim = jspm.shim[main];
      this.package.deps = shim.deps;
      this.package.exports = shim.exports;
    }

    if (jspm.dependencies) {
      this.package.dependencies = jspm.dependencies;
    }

    if ((!this.package.dependencies || Object.keys(this.package.dependencies).length === 0) && 
      this.package.deps) {
      this.package.dependencies = {};
      for (let dep of (Array.isArray(this.package.deps) ? this.package.deps : [this.package.deps])) {
        this.package.dependencies[dep] = dep;
      }
    }

    let distFolderPromise;
    let directories = jspm.directories;
    if (directories) {
      this.package.distFolder = directories.dist || directories.lib || '';
      distFolderPromise = Promise.resolve();
    }

    if (!this.package.distFolder || !this.package.distFolder.length) {
      distFolderPromise = this.package.detectDistFolder();
    }

    return distFolderPromise.then(() => {
      this.package.path = path.posix.join('../node_modules/', this.package.name, this.package.distFolder);
    })
      .then(() => this.package.detectUnminified())
      .then(() => this.package.detectResources())
      .then(() => this.package.detectTracing())
      .then(() => this.package.getConfiguration())
      .then((config) => {
      return {
          dependencies: [config]
      };
    });
  }

  hasJSPMConfig(packageJSON) {
    return packageJSON.jspm;
  }

  get name() {
    return 'JSPM Section Strategy';
  }
};

module.exports = JSPMSectionStrategy;
