'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Graph = new Module('graph');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Graph.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Graph.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Graph.menus.add({
    title: 'graph example page',
    link: 'graph example page',
    roles: ['authenticated'],
    menu: 'main'
  });


  Graph.aggregateAsset('css', 'graph.css');
  Graph.aggregateAsset('js', '../lib/vis/dist/vis.js');
  Graph.aggregateAsset('js', '../lib/angular-visjs/angular-vis.js');

  Graph.aggregateAsset('css', 'typeahead.css');
  Graph.aggregateAsset('js', '../lib/typeahead.js/dist/typeahead.bundle.min.js');
  Graph.aggregateAsset('js', '../lib/handlebars/handlebars.min.js');

  Graph.aggregateAsset('js', '../lib/angular-file-upload/dist/angular-file-upload.min.js');
  Graph.angularDependencies(['ngVis','angularFileUpload']);

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Graph.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Graph.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Graph.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Graph;
});
