(function () {
  'use strict';

  angular
    .module('mean.graph')
    .config(graph);

  graph.$inject = ['$stateProvider'];

  function graph($stateProvider) {
    $stateProvider
        .state('graph example page', {
          url: '/graph/example',
          templateUrl: 'graph/views/index.html',
          controller:'VisController'
        })
        .state('project page', {
          url: '/graph/project',
          templateUrl: 'graph/views/project.html',
          controller:'ProjectController'
        });
  }

})();
