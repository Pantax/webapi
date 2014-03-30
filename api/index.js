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

server.get('/getAllCategories', function(req, res, next){
    dbmanager.getAllCategories({}, function(err,results){
        if(err) {
            res.send(500,"Server Error");
            res.end();
        } else {
            res.send(200,JSON.stringify(results));
            res.end();
        }
    });
});

server.post('/saveCategory', function(req, res, next){
    var category = req.body;
    console.log(category);
    if(!category) {
        sendBadRequest(res);
    } else {
        if(!category.category_name) {
            res.send(400, '{"error":"bad request"}');
            res.end();
        } else {
            dbmanager.insertCategory(category.category_name, function(err, result){
                if(err) {
                    res.send(500, '{"error":"Server error"}');
                    res.end();
                } else {
                    res.send(204);
                    res.end();
                }
            })
        }
    }

});

server.get('/findDoctorByName', function(req, res, next){
    var query = req.query;
    dbmanager.findDoctorBy('name', query.q, function(err, results){
        if(err) {
            res.send(500, 'Server error');
            res.end();
        }
        else {
            res.send(200, results);
            res.end();
        }
    })
});

server.post('/saveDoctor', function(req, res, next){
    var doctor = req.body;
    console.log(doctor);
    if(!doctor) {
        sendBadRequest(res);
    } else {
        dbmanager.saveDoctor(doctor, function(err, result) {
            if(err) {
                res.send(500, '{"error": "server error"}');
                res.end();
            }
            else {
                res.send(202, result);
                res.end();
            }
        });
    }
});

server.post('/addDoctorCategory', function(req, res, next){
    var reqObject = req.body;
    if(!reqObject || !reqObject.doctor_id || !reqObject.categories) {
        sendBadRequest(res);
    } else {
        dbmanager.associateDoctorCategories(reqObject.doctor_id, reqObject.categories, function(err, results){
            if(err) sendServerError(res);
            else {
                res.send(202);
                res.end();
            }
        })
    }
});

server.get('/getDoctorsCategory', function(req, res, next){
    var query = req.query;
    if(!query || !query.categoryId) {
        sendBadRequest(res);
    } else {
        dbmanager.findDoctorByCategory(query.categoryId, function(err, results){
            if(err) sendServerError(res);
            else {
                res.send(200, results);
                res.end();
            }
        })
    }
});

server.get('/getAppointmentOptions', function(req, res, next){
    var query = req.query;
    if(!query || !query.doctorId) {
        sendBadRequest(res);
    } else {
        dbmanager.getDoctorAppointmentsOptions(query.doctorId, function(err, results){
            if(err) sendServerError(res);
            else {
                res.send(200,results);
                res.end();
            }
        });
    }
});

server.post('/saveAppointmentOptions', function(req, res, next){
    var body = req.body;
    if(!body || !body.doctor_id || !body.options || !body.options.length) {
        sendBadRequest(res);
    } else {
        dbmanager.saveDoctorAppointmentOptions(body.doctor_id, body.options, function(err, results){
            if(err) sendServerError(res);
            else {
                res.send(202);
                res.end();
            }
        });
    }
});

server.del('/appointmentOptions', function(req, res, next){
    var query = req.query;
    if(!query || !query.optionId) {
        sendBadRequest(res);
    } else {
        dbmanager.deleteDoctorAppointmentsOptions([query.optionId], function(err, results) {
            if(err) sendServerError(res);
            else {
                res.send(202);
                res.end();
            }
        })
    }
});

server.post('/savePatient', function(req, res, next){
    var patient = req.body;
    if(!patient) sendBadRequest(res);
    else {
        dbmanager.savePatient(patient,function(err, results){
            if(err) sendServerError(res);
            else {
                res.send(202);
                res.end();
            }
        });
    }
});

server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);
});

