'use strict';
const path = require('path');
const fs = require('../file-system');

exports.CopiedSource = class {
  constructor(bundler, file, loaderConfig) {
    this.bundler = bundler;
    this.file = file;
    this.includedIn = null;
    this.includedBy = null;
    this.moduleId = null;
    this._contents = null;
    this._deps = null;
    this.requiresTransform = false;
    this.requiresSourcemap = false;
    this.isBundleable = false;
    this.loaderConfig = loaderConfig;
  }

  static applies(file) {
    return true;
  }

  get path() {
    return this.file.path;
  }

  update(file) {
    this.file = file;
    this._contents = null;
    this.requiresTransform = false;
    this.includedIn.requiresBuild = true;
  }

  transform() {
    if (!this.requiresTransform) {
      return Promise.resolve();
    }
  }

  getInclusion(filePath) {
    let dir = path.dirname(path.posix.normalize(filePath).replace(/\\/g, '\/'));
    let dependencyLocations = this.bundler.getAllDependencyLocations();
    let dependencyLocation = dependencyLocations.find(x => dir.indexOf(x.location) === 0);

    if (dependencyLocation) {
      return dependencyLocation.inclusion;
    }

    return this.includedBy;
  }

  calculateModuleId(rootDir, loaderConfig) {
    if (this.file.description) {
      return this.file.description.name;
    }

    let baseUrl = loaderConfig.baseUrl;
    let modulePath = path.relative(baseUrl, this.path);

    return path.normalize(modulePath.replace(path.extname(modulePath), '')).replace(/\\/g, '\/');
  }
};

function calculateFileName(filePath) {
  if (filePath.indexOf('.') === -1) {
    return filePath + '.js';
  }

  return filePath;
}
