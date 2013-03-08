var express = require('express'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
    mongoose = require('mongoose'),
    simplenote = require('./modules/simplenote'),
    app = express();

app.use(express.static('app')).
    use('/js/lib/', express.static('node_modules/requirejs/')).
    use('/node_modules', express.static('node_modules')).
    use('/test', express.static('test/')).
    use('/test', express.static('app')).
    use('/simplenote', simplenote());

app.listen(8080, function() {
  console.log('Running on http://localhost:8080');
});

/* Heft DB, note reading, writing, cacheing, etc. */

var db = mongoose.connect('localhost', 'heft'),
    Schema = mongoose.Schema;
    NoteSchema = new Schema({
        key     : { type: String, index: true },
        created : Number,
        content : String,
        style   : String
    });

mongoose.model('Note', NoteSchema);
var Note = mongoose.model('Note');

// // deal with DB-related calls
// var heftDb = function(req, res, next) {
//     var urlParts = url.parse(req.url, true);
//         method = urlPart.path.split('/')[1];

//     if (method == 'getAll') {
//         // first get the SimpleNote index
//         doSimpleNoteCall('/api2/index?length=100');
//     }
// };

