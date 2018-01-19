'use strict';
const ProjectItem = require('../../project-item').ProjectItem;

module.exports = function (project, model, options) {
    project.addToSource(
        ProjectItem.resource('blur-image.ext', 'features/navigation/blur-image.ext', model.transpiler),
        ProjectItem.resource('child-router.html', 'features/navigation/child-router.html', model.transpiler),
        ProjectItem.resource('child-router.ext', 'features/navigation/child-router.ext', model.transpiler),
        ProjectItem.resource('nav-bar.html', 'features/navigation/nav-bar.html', model.transpiler),
        ProjectItem.resource('users.html', 'features/navigation/users.html', model.transpiler),
        ProjectItem.resource('users.ext', 'features/navigation/users.ext', model.transpiler),
        ProjectItem.resource('welcome.html', 'features/navigation/welcome.html', model.transpiler),
        ProjectItem.resource('welcome.ext', 'features/navigation/welcome.ext', model.transpiler),
    ).addToDependencies(
        'whatwg-fetch@^2.0.3',
        'aurelia-fetch-client@^1.0.0'
    ).addToAureliaDependencies(
        'aurelia-fetch-client',
        'whatwg-fetch'
    ).addToAureliaPrepend(
        'node_modules/whatwg-fetch/fetch.js'
    );
};
