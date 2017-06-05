'use strict';

const fs = require('../../file-system');
const logger = require('aurelia-logging').getLogger('Tracer');
const path = require('path');
const amodroTrace = require('../../build/amodro-trace');
const cjsTransform = require('../../build/amodro-trace/read/cjs');

let Tracer = class {
  getTracedFiles(pkg, main) {
    if (!main) {
      main = pkg.main;
    }

    if (!main) {
      logger.debug('This package did not specify a "main" file in package.json.');

      const names = ['index.js', pkg.name + '.js'];
      for (let name of names) {
        if (fs.existsSync(path.posix.join(pkg.rootPath, name))) {
          logger.debug(`Found file ${name}, using it as "main" file.`);
          main = name;
          break;
        }
        else {
          logger.debug(`Found no file ${name} to use as "main" file.`);
        }
      }
    }

    if (!main) {
      logger.debug('Could not find a "main" file. Skipping');
      return ;
    }

    const moduleId = pkg.getModuleId(main);
    return this.trace(pkg, moduleId)
      .then(tracedFiles => {
        logger.debug(`The package has ${tracedFiles.length} dependency file(s).`);

        if (tracedFiles.length === 0) {
          throw new Error(`Could not trace '${main}' of the '${pkg.name}' package. There were 0 traced files`);
        }

        if (tracedFiles.length > 1) {
          pkg.tracing = true;
          logger.debug('Tracer found more than one file for this package.');
        }
        else {
          logger.debug('Tracer found only one file for this package.');
        }

        return tracedFiles;
      });
  }

  trace(pkg, moduleId) {
    const rootDir = path.join(process.cwd(), 'node_modules', pkg.name, pkg.distFolder || '');
    let existingFilesMap = {};
    return amodroTrace(
      {
        rootDir: rootDir,
        id: moduleId,
        fileRead: function (defaultRead, id, filePath) {
          console.log("filePath", path.posix.normalize(filePath));
          if (pkg.browser && pkg.browser[filePath]) {
            logger.debug("Replacing: " + filePath + " => " + pkg.browser[filePath]);
            filePath = pkg.browser[filePath];
          }
          if (fs.existsSync(filePath)) {
            existingFilesMap[filePath] = true;
            let contents = fs.readFileSync(filePath).toString();

            return contents;
          }

          existingFilesMap[filePath] = false;
console.log("not existing");
          return '';
        },
        readTransform: function (id, url, contents) {
          return cjsTransform(url, contents);
        }
      }
    ).then(traceResult => {
      const traced = traceResult.traced;
      const found = traced.filter(x => existingFilesMap[x.path]);
    console.log("found", found);
      return found;
    });
  }
};

module.exports = Tracer;
