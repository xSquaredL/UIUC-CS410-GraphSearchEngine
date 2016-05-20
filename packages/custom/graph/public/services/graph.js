(function () {
  'use strict';

  angular
    .module('mean.graph')
    .factory('Graph', Graph);

  Graph.$inject = [];

  function Graph() {
    return {
      name: 'graph'
    };
  }
})();
