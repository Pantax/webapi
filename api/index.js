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


function tokenProcessor(req, res, next) {
    debugger;
    if(req.url.indexOf('/login') != 0) {
        var token = req.query.t;
        if(!token) {
            res.send(403, "Access denied");
            res.end();
        }
        else {
            dbmanager.userbytoken(token, function(err, result){
                if(err) {
                    sendServerError(res, 'token error');
                } else if(result && result.result && result.result == 'OK') {
                    req.user_id = result.user_id;
                    req.entity_type = result.entity_type;
                    req.entity_id = result.entity_id;
                    next();
                } else {
                    res.send(403, 'Access denied');
                    res.end();
                }
            });
        }
    }
    else {
        next();
    }
};

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
server.use(tokenProcessor);


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
    if(!body.user || !body.password) {
        sendBadRequest(res);
    }  else {
        debugger;
        dbmanager.login(body.user, body.password, function(err, result) {
            if(err) {
                sendBadRequest(res);
            } else {
                res.send(200, {token : result});
                res.end();
            }
        });
    }
});

server.get('/test', function(req, res) {
    res.send(200, "User:" + req.user_id + " All work fine");
    res.end();
});

server.get('/status', function(req, res, next) {
    dbmanager.getuserstatus(req.user_id, function(err, result) {
        if(err) {
            sendServerError(res, "status error");
        } else {
            res.send(200, {"status" : (result? result : 'unknow') });
            res.end();
        }
    });
});

server.get('/updatestatus', function(req, res, next) {
    dbmanager.updateuserstatus(req.user_id, function(err, result) {
        if(err) {
            sendServerError(res, "status error");
        } else {
            res.send(202);
            res.end();
        }
    });
})

server.get('/finddoctor', function(req, res, next) {

});


server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);
});

