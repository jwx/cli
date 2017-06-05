'use strict';

const UI = require('../../ui').UI;
const fs = require('../../file-system');
const path = require('path');
const glob = require('glob');

const distNames = [ 'dist', 'build' ];

let ResourceInclusion = class {

  static inject() { return [UI, 'package']; }

  constructor(ui, pkg) {
    this.ui = ui;
    this.package = pkg;
  }

  getDistFolder() {
    for (let distName of distNames) {
      if (this.package.main && this.package.main.startsWith(distName)) {
        this.package.main = this.package.main.substring(distName.length + 1);
        return Promise.resolve(distName);
      }
    }
    const folders = this.getDistFolders();

    if (!folders || !folders.length) {
      return Promise.resolve();
    }

    let question = `The package didn't specify a distribution folder, but the importer has found ${folders.length} candidate(s). Which one, if any, do you want to use?`;
    let options = [];
    for (let folder of folders) {
      options.push({ displayName: folder, description: `The ${folder} folder` });
    }
    options.push({ displayName: 'None', description: "Don't use a specific distribution folder" });

    return this.ui.question(question, options)
      .then(answer => {
        return (answer.displayName === 'None' ? '' : answer.displayName);
      });
  }

  getDistFolders() {
    let foundDist = undefined;
    for (let distName of distNames) {
      if (fs.existsSync(fs.join(this.package.rootPath, distName))) {
        foundDist = distName;
        break;
      }
    }
    if (!foundDist) {
      return '';
    }
    
    let folders = fs.readdirSync(fs.join(this.package.rootPath, foundDist)) || [];
    folders = folders.filter((folder) => ['amd', 'umd', 'commonjs'].indexOf(folder) >= 0);

    if (!folders.length) {
      folders.push(foundDist);
    }

    return folders;
  }

  getUnminified() {
    let main = this.package.main;
    if (main && main.endsWith(".js")) {
      main = main.substring(0, main.length - 3);
    }
    if (!main || !main.endsWith(".min")) {
      return Promise.resolve();
    }
    main = main.substring(0, main.length - 4) + ".js";

    if (!fs.existsSync(fs.join(this.package.rootPath, this.package.distFolder, main))) {
      return Promise.resolve();
    }

    const question = `The package specified a minified source file, but the importer has found an unminified ` +
    `version in ${main}. Do you want to use this instead? (It will improve debugging possibilites when developing. ` +
    `It will be minified again when you build for production.)`;
    const options = [
      { displayName: 'Yes', description: `Use the unminified ${main}` },
      { displayName: 'No', description: "Use the original source file" }
    ];

    return this.ui.question(question, options)
      .then(answer => {
        return (answer.displayName === 'Yes' ? main : undefined);
      });
  }

  getCSS() {
    let subdirs = '?(css|style|styles|theme|themes)/**/*.css';
    let curDir = '*.css';

    return Promise.all([
      this.getResources(subdirs),
      this.getResources(curDir)
    ])
    .then(cssFiles => cssFiles[0].concat(cssFiles[1]))
    .then(cssFiles => {
      if (cssFiles.length === 0) {
        return [];
      }

      let question = `The importer has found ${cssFiles.length} css file(s). Do you want to include some?`;
      let options = [
        {
          displayName: 'Yes',
          description: 'I want to choose which css files I need'
        },
        {
          displayName: 'No',
          description: 'I do not need css files'
        }
      ];
      return this.ui.question(question, options)
      .then(answer => {
        if (answer.displayName === 'Yes') {
          let optionList = cssFiles.map(x => {
            return {
              displayName: x
            };
          });

          return this.ui.multiselect('What files do you need?', optionList)
          .then(answers => answers.map(x => x.displayName));
        }

        return [];
      });
    });
  }

  getFonts() {
    let subdirs = '**/*.?(woff|woff2|ttf)';
    let curDir = '*.?(woff|woff2|ttf)';

    return Promise.all([
      this.getResources(subdirs),
      this.getResources(curDir)
    ])
      .then(fontFiles => fontFiles[0].concat(fontFiles[1]))
      .then(fontFiles => {
        if (fontFiles.length === 0) {
          return [];
        }

        let question = `The importer has found ${fontFiles.length} font file(s). Do you want to include some?`;
        let options = [
          {
            displayName: 'All',
            description: 'I need all the font files'
          },
          {
            displayName: 'Choose',
            description: 'I want to choose which font files I need'
          },
          {
            displayName: 'No',
            description: 'I do not need font files'
          }
        ];
        return this.ui.question(question, options)
          .then(answer => {
            if (answer.displayName === 'All') {
              return fontFiles;
            }
            if (answer.displayName === 'Choose') {
              let optionList = fontFiles.map(x => {
                return {
                  displayName: x
                };
              });

              return this.ui.multiselect('What files do you need?', optionList)
                .then(answers => answers.map(x => x.displayName));
            }

            return [];
          });
      });
  }

  getResources(globExpr) {
    return this.glob(globExpr, { cwd: path.posix.join(this.package.rootPath, this.package.distFolder) })
    .then(files => files.map(file => path.posix.join(file)));
  }

  glob(globExpr, options) {
    return new Promise((resolve, reject) => {
      glob(globExpr, options, function(er, files) {
        if (er) {
          reject(er);
        }
        resolve(files);
      });
    });
  }
};

module.exports = ResourceInclusion;
