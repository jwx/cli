'use strict';

const ProjectItem = require('../../../../../project-item').ProjectItem;

module.exports = function(project) {
  project.configureVisualStudioStructure();
  project.configureDist(ProjectItem.directory('scripts'));
  project.projectOutput.add(
    ProjectItem.resource('index.html', `content/index.template.html`)
    .asTemplate(project.model, { type: project.model.markupProcessor })
    .askUserIfExists()
  );
  project.configureDefaultSetup();
};
