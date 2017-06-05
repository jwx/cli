'use strict';

const Container = require('aurelia-dependency-injection').Container;
const fs = require('../file-system');
const path = require('path');
const semver = require('semver');
const logger = require('aurelia-logging').getLogger('Package');

const PackageAnalyzer = require('../build/package-analyzer').PackageAnalyzer;
const project = require('../../../../aurelia_project/aurelia.json');
// const project = require(path.join(process.cwd(), 'aurelia_project', 'aurelia.json');

module.exports = class {
  constructor(pkg, container) {
    this.container = container;
    this.name = pkg.name;
    this.path = path.posix.join('../node_modules/', this.name);
    this.rootPath = fs.resolve(fs.join('node_modules', this.name));
    this.distFolder = undefined;
    this.packageJSONPath = fs.join(this.rootPath, 'package.json');
    this.resources = [];
    // this.dependencies = {};

    this.tracing = false;
    this.packageAnalyzer = new PackageAnalyzer(project);
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

  detectDistFolder() {
    return this.resourceInclusion.getDistFolder()
      .then(folder => {
        if (folder) {
          this.distFolder = folder;
        }
      });
  }

  detectUnminified() {
    return this.resourceInclusion.getUnminified()
      .then(main => {
        if (main) {
          this.main = main;
        }
      });
  }

  detectResources() {
    return this.resourceInclusion.getCSS()
    .then(resources => {
      for (let resource of resources) {
        this.resources.push(resource);
          this.tracing = true;
        }
      })
      .then(() => this.resourceInclusion.getFonts())
      .then(resources => {
        for (let resource of resources) {
          this.resources.push(resource);
          this.tracing = true;
        }
      });
  }

  detectTracing(main) {
    return this.tracer.getTracedFiles(this, main)
      .then(tracedFiles => {
          if (tracedFiles && tracedFiles.length > 1) {
            this.tracing = true;
      }
    });
  }

  parsePackageJSON() {
    if (this.packageJSON.main && this.packageJSON.main.startsWith('./')) {
      this.packageJSON.main = this.packageJSON.main.substring(2);
    }
    return Promise.resolve()
      .then(() => this.applyBrowserSection())
      .then(() => this.applyAureliaRegistry())
      .then(() => this.applyCustomImporter())
      .then((done) => {
        if (done) {
          return false;
        }

    this.name = this.packageJSON.name;
    this.version = this.packageJSON.version;

        if (this.packageJSON.main && !this.main) {
          this.main = this.packageJSON.main;
        }

        this.dependencies = this.packageJSON.dependencies;

        let directories = this.packageJSON.directories;

        if (directories) {
          this.distFolder = directories.dist || directories.lib || '';
          this.path = fs.join('../node_modules/', this.name, this.distFolder);
        }

        this.style = this.packageJSON.style;

        return true;
      });
    }

  applyBrowserSection() {
    if (this.packageJSON.browser) {
      const browser = this.packageJSON.browser;
      if (typeof browser === 'string') {
        logger.debug(`Found browser section for main: ${browser}. Replacing old (${this.packageJSON.main}).`);
        this.packageJSON.main = browser;

        // Shouldn't be here since JSPM main overrides package (NPM) main
        // if (this.packageJSON.jspm) {
        //   this.packageJSON.jspm.main = browser;
        // }
      }
      else {
        logger.debug(`Found browser section for files. Mapping file replacements:`);
        this.browser = {};
        for (let file of Object.keys(browser)) {
          this.browser[path.join(this.rootPath, file).split('\\').join('/')] = path.join(this.rootPath, browser[file]).split('\\').join('/');
          logger.debug(path.join(this.rootPath, file).split('\\').join('/') + " => " + path.join(this.rootPath, browser[file]).split('\\').join('/'));
        }
      }
    }
    return this;
  }

  applyAureliaRegistry() {
    let version = semver.clean(this.packageJSON.version);

    return this.container.get("registry").getPackageConfig(this, version)
      .then(config => {
        if (config) {
          logger.debug("Found registry configuration:", config, ". Merging onto package.json.");
          this.packageJSON = this.merge(this.packageJSON, config);
        }
      });
  }

  applyCustomImporter() {
    let location = this.getCustomImporterLocation();

    return fs.exists(location)
      .then(available => {
        if (available) {
          logger.debug(`Found custom importer: ${location}.`);
          const customImporter = this.getCustomImporter();
          const result = customImporter.execute(this);

          if (this.isObject(result)) {
            logger.debug("Got custom importer configuration:", result, ". Merging onto package.json.");
            this.packageJSON = this.merge(this.packageJSON, result);
            return false; // Continue with import process
          }

          if (result) {
            logger.debug("Custom importer handled configuration. Skipping strategies.");
          }

          return result;
        }

        logger.debug(`The plugin does not have a custom importer module. Looked for "${location}"`);

        return false;
      });
  }

  getCustomImporter() {
    let ctor = require(this.getCustomImporterLocation());
    return this.container.get(ctor);
  }

  getCustomImporterLocation() {
    if (this.packageJSON.aurelia && (typeof this.packageJSON.aurelia.import === 'string')) {
      return fs.resolve(fs.join(this.rootPath, this.packageJSON.aurelia.import));
    }

    return fs.resolve(fs.join(this.rootPath, 'install', 'importer-callbacks.js'));
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  merge(target, source) {
    let output = Object.assign({}, target);
    if (this.isObject(source)) {
      for (let key of Object.keys(source)) {
        if (this.isObject(source[key]) && this.isObject(target) && (key in target)) {
          output[key] = this.merge(target[key], source[key]);
        }
        else {
          Object.assign(output, { [key]: source[key] });
        }
      }
    }
    return output;
  }

  // compare(oldValue, newValue) {
  //   let output = Object.assign({}, newValue);
  //   if (this.isObject(oldValue) && this.isObject(newValue)) {
  //     let comp = this.compare(oldValue, newValue);
  //     for (let key of Object.keys(source)) {
  //       if (this.isObject(source[key]) && this.isObject(target) && (key in target)) {
  //         output[key] = this.merge(target[key], source[key]);
  //       }
  //       else {
  //         Object.assign(output, { [key]: source[key] });
  //       }
  //     }
  //   }
  //   return output;
  // }

  getConfiguration() {
    let config = { 
      name: this.name,
      path: this.path
    };

    if (this.main) {
      config.main = this.main;
    }
    if (this.resources && this.resources.length) {
      config.resources = this.resources;
    }
      if (this.deps) {
        config.deps = (Array.isArray(this.deps) ? this.deps : [ this.deps ]);
      }
      if (this.exports) {
        config.exports = this.exports;
      }

    if (!this.main && (!this.resources || !this.resources.length)) {
      return Promise.resolve(this.name);
    }

    if (config.main && config.main.endsWith(".js") && config.name !== config.main) {
      config.main = config.main.substr(0, config.main.length - 3);
    }

    if (this.tracing || Object.keys(config).length > 3) {
      return Promise.resolve(config);
  }

    return this.packageAnalyzer.analyze(this.name).then((pkg) => {
      let loaderConfig = pkg.loaderConfig;

      if (loaderConfig.name === config.name &&
        (loaderConfig.path === config.path || loaderConfig.path === path.join(config.path, config.main))) {
        logger.info("Import's package configuration matches bundler's analyzer, simplifying configuration to package name.");
        return this.name;
    }

      return config;
    });
  }
};