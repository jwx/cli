'use strict';

const Container = require('aurelia-dependency-injection').Container;
const StrategyLoader = require('./strategy-loader');
const Tutorial = require('./services/tutorial');
const MetadataService = require('./services/metadata-service');
const logger = require('aurelia-logging').getLogger('Importer');
const ArgumentParser = require('../commands/install/package-argument-parser');
const CLIOptions = require('../cli-options').CLIOptions;

module.exports = class {
  static inject() { return [Container, 'package', StrategyLoader, Tutorial, MetadataService, ArgumentParser, CLIOptions]; }

  constructor(container, pkg, strategyLoader, tutorial, metadataService, argumentParser, cliOptions) {
    this.container = container;
    this.package = pkg;
    this.strategies = strategyLoader.getStrategies();
    this.tutorial = tutorial;
    this.metadataService = metadataService;
    this.argumentParser = argumentParser;
    this.cliOptions = cliOptions;
    this.project = container.get('project');
  }

  import(importEngine, alreadyProcessed, packageInstaller) {
    const dependencyPackage = !!alreadyProcessed;
    if (!this.package.isInstalled()) {
      if (!packageInstaller) {
        logger.error(`Necessary package '${this.package.name}' has not been installed! Aborting all imports.`);
        logger.error(`Install '${this.package.name}' with command "au install ${this.package.name}" and retry.`);
        return Promise.reject("");
      }
      logger.info(`Package '${this.package.name}' has not been installed! Installing it.`);
      return packageInstaller
              .install(this.argumentParser.parse([ this.package.name ]))
              .then(() => logger.info(`The package '${this.package.name}' was successfully installed. Going to import it now.`))
              .then(() => importEngine.import(this.argumentParser.parse([this.package.name]), (alreadyProcessed || []).concat([this.package.name]), packageInstaller))
              .catch(e => console.log(e));
    }

    logger.info('---------------------------------------------------------');
    logger.info(`*********** Configuring ${this.package.name} ***********`);

    return this.package.fetchPackageJSON().parsePackageJSON().then((doStrategies) => {
      return (doStrategies ? this.findStrategy() : Promise.resolve())
    .then(strategy => {
          let strategyPromise = Promise.resolve();
          if (doStrategies) {
      if (!strategy) {
        throw new Error('No strategies were able to configure this package. Please let us know.');
      }

      logger.info(`[OK] Going to execute the "${strategy.name}" strategy`);

            strategyPromise = Promise.resolve(strategy.execute())
      .catch(err => {
        logger.error(`An error occurred during the exection of the "${strategy.name}" importer strategy`);
        logger.error(err);
        logger.error(err.stack);

        throw err;
              });
          }

          return strategyPromise
      .then(instructions => {
        logger.info(`*********** Finished configuring ${this.package.name} ***********`);

        if (instructions) {
          logger.debug('Applying the following configuration: ', instructions);

                return this.getDependencies(importEngine, alreadyProcessed, packageInstaller)
                  .then(() => { this.metadataService.execute(instructions, dependencyPackage) })
                  .then(() => { if (!dependencyPackage) { this.tutorial.start(instructions) } });
              }
              else {
                return this.getDependencies(importEngine, alreadyProcessed, packageInstaller)
                  .then(() => { if (!dependencyPackage) { this.tutorial.start() } });
              }
            });
        }).catch(err => {
          logger.error(err);
          logger.error(err.stack);
        })
    })
      .catch(err => {
        logger.error(`An error occurred during the patching of package.json`);
        logger.error(err);
        logger.error(err.stack);
      })
      .then(() => logger.info('---------------------------------------------------------'));
  }

  getDependencies(importEngine, alreadyProcessed, packageInstaller) {
          let dependenciesPromise = Promise.resolve();
          if (this.package.dependencies) {
            const dependencies = this.project.getMissingDependencies("vendor-bundle", this.package.dependencies, alreadyProcessed);
            if (dependencies) {
              for (let dependency of dependencies) {
                logger.info(`Package '${this.package.name}' has dependency to '${dependency}', configuring '${dependency}' too.`);
              }
              dependenciesPromise = importEngine.import(this.argumentParser.parse(dependencies), (alreadyProcessed || []).concat(dependencies), packageInstaller);
            }
          }

    return dependenciesPromise;
  }

  findStrategy() {
    let index = 0;

    function _findStrategy() {
      if (index === this.strategies.length) {
        return;
      }

      let strategy = this.strategies[index++];

      return Promise.resolve(strategy.applies())
      .then(canExecute => {
        if (!canExecute) {
          logger.debug(`[SKIP] The "${strategy.name}" strategy declined configuration`);

          return _findStrategy.call(this);
        }

        return strategy;
      });
    }

    return _findStrategy.call(this);
  }
};
