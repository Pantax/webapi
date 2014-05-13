/**
 * Created by ozlevka on 3/18/14.
 */
var restify = require('restify');
var dbmanager = require('pantax-dbaccess');


var Responder = function(options)
{
    this.options = options || {};
}

Responder.prototype.login = function(loginObject, callback) {
    dbmanager.getEntityByCode(loginObject.code, loginObject.isDoctor, function(err, results){
        if(err) callback(err);
        else {
            callback(null, results);
        }
    });
}


var responder = new Responder({});

var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser({ mapParams: false }));
server.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

function processBadLogin(res){
    res.setHeader('Location', 'http://localhost/login.html')
    res.setHeader('Set-Cookie', 'badrequest=true');
    res.send(302, '{"error" : "bad login"}');
    res.end();
}


function sendBadRequest(response) {
    response.send(400, '{"error":"Bad request"}');
    response.end();
}


function sendServerError(response, message) {
    response.send(500, message? message : 'Server error');
    response.end();
}

server.post('/login', function(req, res, next) {
    var body = req.body;

    if(body.code) {
        var loginObject = {
            code : body.code,
            isDoctor : body.isdoctor? true : false
        }
    } else {
        var loginObject = null;
    }

    if(!loginObject) {
       processBadLogin(res);
    } else {
        responder.login(loginObject,function(err, results){
            if(err || !results) { processBadLogin(res); }
            else {
                res.setHeader('Set-Cookie', 'entityId=' + results[0].ID + ';Path=/;,badrequest=false;Path=/;');
                res.setHeader('Location', 'http://localhost');
                res.send(302);
                res.end();
            }
        });
    }
});


server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);
});

