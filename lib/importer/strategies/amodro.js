'use strict';

const fs = require('../../file-system');
const logger = require('aurelia-logging').getLogger('Amodro');
const path = require('path');

let AmodroStrategy = class {

  static inject() { return ['package']; }

  constructor(pkg) {
    this.package = pkg;
  }

  applies() {
    return !!(this.findMain());
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
      .then(() => this.package.detectUnminified())
      .then(() => this.package.detectResources())
      .then(() => this.package.detectTracing(this.findMain()))
      .then(() => {
        if (this.package.tracing) {
          logger.debug('Using multi file configuration for this package.');
        } else {
          logger.debug('Using single file configuration for this package.');
          if (this.package.main === this.package.packageJSON.main) {
            this.package.path = path.posix.join('../node_modules/', this.package.name, this.findMain());
          this.package.main = null;
        }
        }
    })
      .then(() => this.package.getConfiguration())
      .then((config) => {
      return {
          dependencies: [config]
      };
    });
  }

  findMain(silent) {
    if (this.package.main) {
      return this.package.main;
    }

    if (!silent) {
      logger.debug('This package did not specify a "main" file in package.json.');
    }

    const names = ['index.js', this.package.name + '.js'];
    for (let name of names) {
      if (this.package.distFolder) {
        name = path.posix.join(this.package.distFolder, name);
      }
      if (fs.existsSync(path.posix.join(this.package.rootPath, name))) {
        if (!silent) {
          logger.debug(`Found file ${name}, using it as "main" file.`);
        }
        return name.substr(0, name.length - 3);
      }
      else if (!silent) {
        logger.debug(`Found no file ${name} to use as "main" file.`);
      }
    }

    if (!silent) {
      logger.debug('Could not find a "main" file. Skipping');
    }
  }

  get name() {
    return 'Amodrotrace Strategy';
  }
};

module.exports = AmodroStrategy;
