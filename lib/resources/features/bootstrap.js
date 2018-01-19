'use strict';
const ProjectItem = require('../../project-item').ProjectItem;

module.exports = function(project, model, options) {
project.addToDependencies(
        'jquery@^2.2.4',
        'bootstrap@^3.3.6'
    ).addToAureliaDependencies(
        'jquery',
        {
            'name': 'bootstrap',
            'path': '../node_modules/bootstrap/dist',
            'main': 'js/bootstrap.min',
            'deps': [
              'jquery'
            ],
            'exports': '$',
            'resources': [
              'css/bootstrap.css'
            ]
          }
    );
};
