'use strict';
const ProjectItem = require('../../project-item').ProjectItem;

module.exports = function(project, model, options) {
project.addToDependencies(
        'font-awesome@4.6.3'
    ).addToAureliaDependencies(
          {
            'name': 'font-awesome',
            'path': '../node_modules/font-awesome/css',
            'main': 'font-awesome.css'
          }
    );
};
