'use strict';

const fs = require('../file-system');
const path = require('path');

module.exports = class {
  constructor(pkg) {
    this.name = pkg.name;
    this.path = path.posix.join('../node_modules/', this.name);
    this.rootPath = fs.resolve(fs.join('node_modules', this.name));
    this.distFolder = '';
    this.packageJSONPath = fs.join(this.rootPath, 'package.json');
    this.resources = [];
    // this.dependencies = {};
  }

  isInstalled(pkg) {
    return fs.existsSync(this.packageJSONPath);
  }

  fetchPackageJSON() {
    this.packageJSON = JSON.parse(fs.readFileSync(this.packageJSONPath, 'utf8'));
    return this;
  }

  getModuleId(fileName) {
    let moduleId = fileName.replace(/\\/g, '/');
    let ext = path.extname(moduleId);
    moduleId = moduleId.substring(0, moduleId.length - ext.length);

    return moduleId;
  }

  detectResources() {
    return this.resourceInclusion.getCSS()
    .then(resources => {
      for (let resource of resources) {
        this.resources.push(resource);
      }
    });
  }

  parsePackageJSON() {
    this.name = this.packageJSON.name;
    this.version = this.packageJSON.version;

    if (this.packageJSON.main && !this.main) {
      this.main = this.packageJSON.main;
    }

    return this;
  }

  getConfiguration() {
    let config;

    if (this.main) {
      config = {
        name: this.name,
        main: this.main,
        path: this.path,
        resources: this.resources
      };
      if (this.deps) {
        config.deps = (Array.isArray(this.deps) ? this.deps : [ this.deps ]);
      }
      if (this.exports) {
        config.exports = this.exports;
      }
    } else {
      config = this.name;
    }

    return config;
  }

  getDistFolder() {
    if (fs.existsSync(fs.join(this.rootPath, 'dist'))) {
      return 'dist';
    }
    return '';
  }
};