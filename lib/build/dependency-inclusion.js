'use strict';
const path = require('path');
const SourceInclusion = require('./source-inclusion').SourceInclusion;

const bundledExtensions = ['css', 'html', 'js'];

exports.DependencyInclusion = class {
  constructor(bundle, description) {
    this.bundle = bundle;
    this.description = description;
    this.items = [];
    if (description.singleFile || description.loaderConfig.main) {
      this.traceDependencies = true;
      bundle.bundler.addFile(new DependencyFile(bundle, description), this);
    }
  }

  traceResources() {
    let loaderConfig = this.description.loaderConfig;
    let resources = loaderConfig.resources;
    let bundle = this.bundle;

    if (resources) {
      let promises = [];

      resources.forEach(x => {
        let pattern = path.join(loaderConfig.path, x);
        let inclusion = new SourceInclusion(bundle, pattern);
        promises.push(inclusion.addAllMatchingResources(loaderConfig));
        bundle.includes.push(inclusion);
      });

      return Promise.all(promises);
    }

    return Promise.resolve();
  }

  bundledResource(resource) {
    return (bundledExtensions.indexOf(path.extname(resource)) >= 0)
  }

  addItem(item) {
    item.includedBy = this;
    item.includedIn = this.bundle;
    this.items.push(item);
  }

  trySubsume(item) {
    return false;
  }

  transform() {
    let index = -1;
    let items = this.items;

    function doTransform() {
      index++;

      if (index < items.length) {
        return items[index].transform().then(doTransform);
      }

      return Promise.resolve();
    }

    return doTransform();
  }

  getAllModuleIds() {
    return this.items.map(x => x.moduleId);
  }

  getAllFiles() {
    return this.items;
  }

  getBundledFiles() {
    return this.items.filter(x => x.isBundleable);
  }

  getCopiedFiles() {
    return this.items.filter(x => !x.isBundleable);
  }
};

class DependencyFile {
  constructor(bundle, description) {
    this.bundle = bundle;
    this.description = description;
    this._contents = null;
    this._path = null;
  }

  get path() {
    return this._path || (this._path = this.description.calculateMainPath(this.bundle.bundler.loaderConfig.baseUrl));
  }

  get contents() {
    return this._contents || (this._contents = this.description.readMainFileSync(this.bundle.bundler.loaderConfig.baseUrl));
  }
}
