var data = require('./result.js');
var mongoose = require('mongoose');
var fs = require('fs');

var APAModel = mongoose.model('APA'),
    APTPAModel = mongoose.model('APTPA'),
    APVPAModel = mongoose.model('APVPA'),
    AuthorModel = mongoose.model('Author'),
    AuthorIndexModel = mongoose.model('AuthorIndex'),
    PaperModel = mongoose.model('Paper'),
    PaperIndexModel = mongoose.model('PaperIndex'),
    TermModel = mongoose.model('Term'),
    TermIndexModel = mongoose.model('TermIndex'),
    VenueModel = mongoose.model('Venue'),
    VenueIndexModel = mongoose.model('VenueIndex');

var readline = require('readline'),
    stream = require('stream');
var async = require('async');

var A2P = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/A2P.json', 'utf8')),
    P2A = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/P2A.json', 'utf8')),
    P2T = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/P2T.json', 'utf8')),
    T2P = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/T2P.json', 'utf8')),
    P2V = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/P2V.json', 'utf8')),
    V2P = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/V2P.json', 'utf8')),
    aId = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/authorIndex.json', 'utf8')),
    //pId = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/paperIndex.json', 'utf8')),
    //tId = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/termIndex.json', 'utf8')),
    //vId = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/venueIndex.json', 'utf8')),
    authors = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/authors.json', 'utf8')),
    papers = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/papers.json', 'utf8')),
    terms = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/terms.json', 'utf8')),
    venues = JSON.parse(fs.readFileSync('./packages/custom/graph/server/data/venues.json', 'utf8'));

// (name -> 5-digit id -> 0-4999 id)
// reserve for interpreting user's input

// (0-4999 id -> 5-digit id - > name)
var getAuthorName = function (id_, map_, dict_) {
    if (0 <= id_ && id_ < 5000) {
        // 0-4999 id
        if (dict_.hasOwnProperty(map_[id_])) {
            return dict_[map_[id_]];
        }
    } else {
        // 5-digit id
        if (dict_.hasOwnProperty(id_)) {
            return dict_[id_];
        }
    }
};

// (5-digit id -> array of [5-digit ids])
var findAuthorPapers = function(id_) {
    if (0 <= id_ && id_ < 5000) {
        // 0-4999 id
        if (A2P.hasOwnProperty(aId[id_])) {
            return A2P[aId[id_]].map(Number).sort(function(a, b) {
                return a - b;
            });
        }
    } else {
        // 5-digit id
        if (A2P.hasOwnProperty(id_)) {
            return A2P[id_].map(Number).sort(function(a, b) {
                return a - b;
            });
        }
    }
}

// (5-digit id - > item name)
var getItemName = function (id_, dict_) {
    if (dict_.hasOwnProperty(id_)) {
        return dict_[id_];
    }
};

// find intersection of two sorted integer arrays
function intersect_safe(a, b)
{
    var ai=0, bi=0;
    var result = [];

    while( ai < a.length && bi < b.length )
    {
        if      (a[ai] < b[bi] ){ ai++; }
        else if (a[ai] > b[bi] ){ bi++; }
        else /* they're equal */
        {
            result.push(a[ai]);
            ai++;
            bi++;
        }
    }

    return result;
}

var cleanup = function (cb) {
    async.parallel([
            function (callback) {
                AuthorModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                AuthorIndexModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                PaperModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                PaperIndexModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                TermModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                TermIndexModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                VenueModel.remove({}, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                VenueIndexModel.remove({}, function (err) {
                    callback(err);
                });
            }
        ],
        function (err, results) {
            if (err) {
                console.log('Finished cleaning up data with error: ' + err);
            } else {
                console.log('Finished cleaning up data with no error');
            }
            if (cb) {
                cb(err)
            }
        });
}

var loadAllData = function (cb) {
    async.parallel([
            function (callback) {
                loadDefinitionData('authors.json', AuthorModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadDefinitionData('papers.json', PaperModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadDefinitionData('terms.json', TermModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadDefinitionData('venues.json', VenueModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadIndexData('authorIndex.json', AuthorIndexModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadIndexData('paperIndex.json', PaperIndexModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadIndexData('termIndex.json', TermIndexModel, function () {
                    callback(null);
                });
            },
            function (callback) {
                loadIndexData('venueIndex.json', VenueIndexModel, function () {
                    callback(null);
                });
            }
        ],
        function (err, results) {
            if (cb) {
                cb(err)
            }
        });
}

var loadDefinitionData = function (fileName, model, cb) {
    fs.readFile('./packages/custom/graph/server/data/' + fileName, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var terms = JSON.parse(data);
        for (var prop in terms) {
            // skip loop if the property is from prototype
            if (!terms.hasOwnProperty(prop)) continue;
            var newItem = new model({
                name: terms[prop],
                id: parseInt(prop)
            });
            newItem.save(function (err, item) {
                if (err) {
                    console.log("Error adding new data: " + err.message);
                }
            });
        }
        console.log("Finished loading " + fileName);
        cb();
    });
};

var loadIndexData = function (fileName, model, cb) {
    fs.readFile('./packages/custom/graph/server/data/' + fileName, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var array = JSON.parse(data);
        for (var i = 0; i < array.length; i++) {
            var id = array[i];
            var newItem = new model({
                index: i,
                id: parseInt(id)
            });
            newItem.save(function (err, item) {
                if (err) {
                    console.log("Error adding new data: " + err.message);
                }
            });
        }
        console.log("Finished loading " + fileName);
        cb();
    });
};
var loadMatrixData = function (fileName, model, cb) {
    async.waterfall([
        function (callback) {
            model.remove({}, function (err) {
                callback(err);
            });
        },
        function (callback) {
            var instream = fs.createReadStream('./packages/custom/graph/server/data/' + fileName),
                outstream = new stream(),
                rl = readline.createInterface(instream, outstream);

            rl.on('line', function (line) {
                var regex = /^([0-9]+)[\t\s]?([0-9]+)[\t\s]?([0-9]+)/g;
                var match = regex.exec(line);
                var row = match[1],
                    col = match[2],
                    value = match[3];
                var newItem = new model({
                    row: row,
                    column: col,
                    value: value
                });
                newItem.save(function (err, item) {
                    if (err) {
                        console.log("Error adding new data: " + err.message);
                    }
                });
            });

            rl.on('close', function (line) {
                callback(null);
                console.log("Finished loading " + fileName);
            });
        },
    ], function (err, result) {
        if (cb) {
            cb(err)
        }
    });


}

module.exports = {
    loadData: function (cb) {
        async.waterfall([
            function (callback) {
                cleanup(function (err) {
                    callback(err);
                })
            },
            function (callback) {
                loadAllData(function (err) {
                    callback(err);
                })
            },
        ], function (err, result) {
            if (cb) {
                cb(err)
            }
        });
    },
    loadAPA: function (cb) {
        loadMatrixData('apa.txt', APAModel, cb);
    },
    loadAPTPA: function (cb) {
        loadMatrixData('aptpa.txt', APTPAModel, cb);
    },
    loadAPVPA: function (cb) {
        loadMatrixData('apvpa.txt', APVPAModel, cb);
    },

    getResult: function (req, res) {
        res.status(200).json(data);
    },
    getAuthors:function(req, res) {
        AuthorModel
            .find()
            .exec(function (err, authors) {
                if (err||authors==null||authors.length==0) {
                    res.status(404).json({'message':'Authors not found'});
                }
                res.status(200).json(authors);
            });
    },

    getTopKSimAuthors: function (req, res) {
        var mongojs = require('mongojs');
        var collections = ['apas', 'find_top_k'];
        var db = mongojs('mean-dev', collections);

        var diagonals = [];
        mapFunc = function () {
            if (this.row == orig_author_id || this.column == orig_author_id) {
                if (orig_author_id == this.column) {
                    f_row = this.column;
                    f_col = orig_author_id;

                    Mii = diags[f_row];
                    Mjj = diags[f_col];
                    Mij = this.value;

                    emit(this.row, 2 * this.value / (Mii + Mjj));
                } else {
                    f_row = orig_author_id;
                    f_col = this.column;

                    Mii = diags[f_row];
                    Mjj = diags[f_col];
                    Mij = this.value;

                    emit(this.column, 2 * this.value / (Mii + Mjj));
                }
            }
        }
        reduceFunc = function (k, v) {
            return {'scores': v};
        }

        var id=req.params.id;

        AuthorIndexModel
            .findOne({id:id})
            .exec(function (err, author) {
                if (err||author==null) {
                    res.status(404).json({'message':'Author index not found'});
                }
                var index=author.index;
                console.log("index="+index)
                db.apas.find({$where: "this.row == this.column"}).sort({row : 1}, function(err, results) {
                    if (err) {
                        console.log('query failed');
                    } else {
                        results.forEach(function(entry) {
                            diagonals.push(entry.value);
                        });

                        db.find_top_k.drop();

                        db.apas.mapReduce(
                            mapFunc,
                            reduceFunc,
                            {
                                "out": "find_top_k",
                                "query": {},
                                // get this input from user (name -> 5-digit id -> 0-4999 id)
                                "scope": {orig_author_id: index, diags: diagonals}
                            }, function(err, results) {
                                if (err) {
                                    console.log('mapReduce failed');
                                    res.status(500).json({'message':'mapReduce failed'});
                                } else {
                                    db.find_top_k.find().sort({value: -1}).limit(11, function (err, results) {
                                        if (err) {
                                            console.log('could not find top k');
                                            res.status(500).json({'message':'could not find top k'});
                                        } else if(results==null||results.length==0) {
                                            console.log('results = ' + results);
                                            res.status(404).json({'message':'No result found'});
                                        } else {
                                            var sims = [], pps = [], edges = [];

                                            var containPaper = function(p, pp) {
                                                pp.forEach(function(paper) {
                                                    if (paper.hasOwnProperty('id')) {
                                                        if (paper.id === p) {
                                                            return true;
                                                        }
                                                    }
                                                });
                                                return false;
                                            }

                                            var containEdge = function(e, edges) {
                                                edges.forEach(function(edge) {
                                                    if (edge.hasOwnProperty('from') &&
                                                        edge.hasOwnProperty('to')) {
                                                        if (e.from === edge.from &&
                                                            e.to === edge.to) {
                                                            return true;
                                                        }
                                                    }
                                                });
                                                return false;
                                            }

                                            orig = {id: results[0]._id,
                                                label: getAuthorName(results[0]._id, aId, authors),
                                                desc: 'original_author'};

                                            for (var i = 1; i < results.length; i++) {
                                                sims.push({id: results[i]._id,
                                                    label: getAuthorName(results[i]._id, aId, authors),
                                                    desc: 'similar_author'});
                                            }

                                            sims.forEach(function (coauthor) { // coauthor.id is 5-digit
                                                // why is A2P containing terms
                                                commonPapers = intersect_safe(findAuthorPapers(orig.id), findAuthorPapers(coauthor.id));

                                                commonPapers.forEach(function(paper) {
                                                    // do a check to make sure no dup paper node
                                                    if (!containPaper(paper, pps)) {
                                                        pps.push({id: paper,
                                                            label: getItemName(paper, papers),
                                                            type: 'paper'});
                                                    }
                                                    // add edge from orig author to paper
                                                    e = {from: orig.id, to: paper};
                                                    if (!containEdge(e, edges)) {
                                                        edges.push(e);
                                                    }
                                                    // add edge from co-author to paper
                                                    e = {from: coauthor.id, to: paper};
                                                    if (!containEdge(e, edges)) {
                                                        edges.push(e);
                                                    }
                                                });
                                            });

                                            var allNodes=[orig].concat(sims).concat(pps);
                                            var nodes=[];
                                            var map={};
                                            allNodes.forEach(function(e){
                                                if(e.desc=="original_author"){
                                                    e.group=1;
                                                } else if(e.desc=="similar_author"){
                                                    e.group=2;
                                                } else {
                                                    e.group=3;
                                                }
                                                map[e.id]=e;
                                            });
                                            for (var key in map) {
                                                nodes.push(map[key]);
                                            }

                                            var data = {nodes: nodes,
                                                edges: edges};
                                            // find common papers for each pair of authors (3536 -> papers <- simAuthor_i)

                                            res.status(200).json(data);
                                        }
                                    });
                                }
                            });
                    }
                });
            });



    }

};