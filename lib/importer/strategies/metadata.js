'use strict';

const logger = require('aurelia-logging').getLogger('Metadata');

let MetadataStrategy = class {

  static inject() { return ['package']; }

  constructor(pkg) {
    this.package = pkg;
  }

  applies() {
    if (!this.hasMetadata(this.package.packageJSON)) {
      logger.debug(`There is no "aurelia"."import" section in the package.json file of the plugin (looked in "${this.package.packageJSONPath}")`);
      return false;
    }

    return true;
  }

  execute() {
    // Package dependencies (that's probably missing), NOT the same as
    // package configurations that are in aurelia.import.dependencies 
    if (this.package.packageJSON.aurelia.dependencies) {
      this.package.dependencies = this.package.packageJSON.aurelia.dependencies;
    }

    let metadata = this.getMetadata(this.package.packageJSON);

    return metadata;
  }

  getMetadata(packageJSON) {
    return packageJSON.aurelia.import;
  }

  hasMetadata(packageJSON) {
    if (packageJSON.aurelia !== undefined &&
           packageJSON.aurelia.import !== undefined &&
      typeof packageJSON.aurelia.import === 'object') {
      for (let key of Object.keys(packageJSON.aurelia.import)) {
        if (key !== "tutorial") {
          return true;
        }
      }
    }
  }

  get name() {
    return 'Metadata Strategy';
  }
};

module.exports = MetadataStrategy;
