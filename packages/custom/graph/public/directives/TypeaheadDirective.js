angular
    .module('mean.graph')
    .directive('authorTypeahead', ['$http', function($http) {
  return {
    restrict: 'AE', //E = element, A = attribute, C = class, M = comment
    replace: true,
    transclude: true,
    scope: {
      ngModel:"="
    },
    template: 	'<div class="twitter-typeahead"><input class="typeahead form-control" type="text" placeholder="Enter author name to search"></div>',
    link: function ($scope, element, attrs) {
      var authorNames = [];
      var authorMap = {};
      $scope.valid = true;
      var authors = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,

        prefetch: {
          url: '/api/graph/author',
          transform: function(response) {
            for(var i=0;i<response.length;i++){
              var author = response[i];
              authorNames.push(author.name);
            }
            response.forEach(function(e) {
              authorMap[e.name]= e.id;
            });
            return response;
          },
          ttl:1000
        },
        identify: function(obj) {
          return obj.id;
        }
      });
      function authorWithDefaults(q, sync) {
        if (q === '') {
          sync(authors.get(authorNames));
        } else {
          authors.search(q, sync);
        }
      }

      element.find('input.typeahead').typeahead({
        minLength: 0,
        highlight: true
      },{
        name: 'authors',
        display: 'name',
        source: authorWithDefaults,
        highlight:true,
        templates: {
          suggestion: Handlebars.compile('<div><span>{{name}}</span></div>')
        }
      });
      if($scope.ngModel!=null&&$scope.ngModel.name!=null){
        element.find('input.typeahead').typeahead('val', $scope.ngModel.name);
      }
      element.on('typeahead:change', function(ev, val) {
        if(authorNames.indexOf(val)==-1){
          element.find('input.tt-input').addClass('has-error');
          $scope.valid = false;
        } else {
          element.find('input.tt-input').removeClass('has-error');
          $scope.valid = true;
          $scope.ngModel.name = val;
          $scope.ngModel.id=authorMap[val];
        }
        console.log($scope.ngModel)
      });
      //element.on('typeahead:select', function(ev, suggestion) {
      //  $scope.courseId = suggestion.courseId;
      //  $scope.courseName = suggestion.name;
      //});

    }
  };
}]);

