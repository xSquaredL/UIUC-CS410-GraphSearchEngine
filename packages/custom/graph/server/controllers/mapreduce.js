// matrix = path user chose (APA, APTPA, or APVPA)
// orig_author_id is input

// orig = 2
// col = 3
// 1 0 0 0
// 1 1 0 0
// 1 1 1 0
// 1 1 1 1

// sim(row, col) = sim(col, row)
// sim(2, 3) = sim(3, 2)

// all diagonal cells
// var diags = db.apas.find({ $where: "this.row == this.column" }).sort({row: 1});

//matrix is lower triangular -> row >= col
mapFunc = function() {
    if (this.row == orig_author_id || this.column == orig_author_id) {
        if (orig_author_id == this.column) {
            // switch i j if needed since matrix is triangular
            f_row = this.column;
            f_col = orig_author_id;
            
            Mii = diags[f_row];
            Mjj = diags[f_col];
            Mij = this.value;
            
            emit(this.row, 2 * this.value/(Mii + Mjj));
        } else {
            f_row = orig_author_id;
            f_col = this.column;
            
            Mii = diags[f_row];
            Mjj = diags[f_col];
            Mij = this.value;
            
            emit(this.column, 2 * this.value/(Mii + Mjj));
        } 
    }
}

// sort and return top 20
reduceFunc = function(k, v) {
    // are v's elements numeric?
    // need to return indices rather than actual value
    
    return { //'co_author' : k,
             'scores' : v };
    //return v.sort().reverse().slice(0, 10); // set k here
}
/*
finalizeFunc = function(k, v) {
    return { 'author' : orig_author_id,
             'scores' : v };
}
*/
getDiags = function() {
    var diags = db.apas.find({ $where: "this.row == this.column" }, { value : 1 }).sort({row: 1}).toArray();
    var res = [];
    
    for (var i = 0; i < diags.length; i++) {
        res.push(diags[i].value);
    }
    
    return res;
}

var diags = getDiags();
db.find_top_k.drop();
db.apas.mapReduce(mapFunc, 
                    reduceFunc, 
                    {
                    "out" : "find_top_k", 
                    "query" : {}, 
                    // get this input from user
                    "scope" : { orig_author_id : 3536 , diags : diags } 
                    //"finalize" : finalizeFunc
                });
db.find_top_k.find({}).sort({value:-1})

// we found list of k co-authors

// back-end

// find common papers between each of the k pairs (orignal author --- co-author i)
// pNodes = [[papers by pair orig - co-author 1], [papers by pair orig - co-author 2], ..., [papers by pair orig - co-author k]]
// coNodes = [coauthor 1, ..., coauthor k]
// edges = [orig -> pNodes[0], orig -> pNodes[1]...]
// moreEdges = [pNodes[0] -> coauthor1, pNodes[1] -> coauthor2...] 


// orig_autho ---- 1, 3, 5 ---- co_author_1
//            \--- .... ---- co_author_2
//                 ....

