/**
 * Created by ozlevka on 3/18/14.
 */
var restify = require('restify');
var dbmanager = require('pantax-dbaccess');
var async = require('async');


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
    var query = req.query.q;
    if(query) {
        var terms = query.split(' ');
        if(terms && terms.length > 0) {
            dbmanager.doctorsearch(terms, function(err, results) {
                if(err) sendServerError(res, 'search error');
                else {
                   var returnResult = [];
                   var doctorData;
                   for(var i = 0; i < results.length; i++) {
                        var dd = results[i];
                       if(!doctorData || doctorData.doctor_id != dd.doctor_id) {
                           if(i > 0) returnResult.push(doctorData);
                           doctorData = {
                                doctor_id : dd.doctor_id,
                                name : dd.name,
                                degree : dd.degree,
                                appointments : []
                            };
                       }

                       var app = {
                           app_id : dd.app_id,
                           from_date : dd.from_date,
                           to_date : dd.to_date
                       };

                        doctorData.appointments.push(app);
                   }

                   if(doctorData && doctorData.doctor_id)
                        returnResult.push(doctorData);

                   res.send(200, returnResult);
                   res.end();
                }
            });
        }
        else {
            res.send(204);
            res.end();
        }
    }
    else {
        sendBadRequest(res);
    }
});

server.get('/getdoctor', function(req, res, next) {
    var doctor_id = req.query.did;
    if(!doctor_id) {
        sendBadRequest(res);
    } else {
        dbmanager.getdoctor(doctor_id, function(err, results) {
            if(err) {
                sendServerError(res, err.message);
            } else {
                if(!results || results.length == 0) {
                    sendServerError(res, "doctor not found");
                } else {
                    res.send(200, results[0]);
                    res.end();
                }
            }
        });
    }
});

server.get('/page', function(req, res, next) {
    if(req.entity_type != 'patient') {
        sendBadRequest(res);
    } else {
        var patient_id = req.entity_id;
        if(!patient_id) {
            sendBadRequest(res);
        } else {
            async.parallel([
                function(cb) {
                    dbmanager.getpatient(patient_id, function(err, results) {
                        if(err) cb(err, null);
                        else cb(null, {patient: (results.length > 0? results[0] : null)});
                    });
                },
                function(cb) {
                    dbmanager.getpatientappointments(patient_id, function(err, results) {
                        if(err) cb(err, null);
                        else cb(null, {appointments: results});
                    });
                }
            ], function(err, results) {
                if(err) {
                    sendServerError(res, "error fetch patient");
                } else {
                    if(!results || results.length == 0) {
                        sendServerError(res, "patient not found");
                    } else {
                        var result_object = {};
                        for(var i = 0; i < results.length; i++) {
                            for(var key in results[i]) {
                                if(key === 'patient') {
                                    if(results[i].patient) {
                                        result_object.user_id = req.user_id;
                                        result_object.birthday = results[i].patient.birthday;
                                        result_object.balance = results[i].patient.balance;
                                        result_object.profile_picture_URL = results[i].patient.picture_url;
                                        result_object.name = results[i].patient.name;
                                    } else {
                                        sendServerError(res, "patient not found");
                                    }
                                } else if (key === 'appointments') {
                                    result_object.booked_appointments = results[i].appointments;
                                }
                            }
                        }
                        res.send(200, result_object);
                        res.end();
                    }
                }
            });


        }
    }
});

server.get('/addetails', function(req, res, next) {
    var app_id = req.query.aid;
    if(!app_id) {
        sendBadRequest(res);
    } else {
        dbmanager.getappointmentinfo(1,function(err, results) {
            if(err) sendServerError(res, err.message);
            else {
                if(!results || results.length == 0) {
                    sendServerError(res, "appointment not found")
                } else {
                    res.send(200, results[0]);
                    res.end();
                }
            }
        });
    }
});

server.get('/patinfo', function(req, res, next) {
    var page_number = req.query.pn? (req.query.pn * 1) : 0;
    var size = req.query.s? (req.query.s * 1) : 10;

    var pNumber = page_number * size;
    if(req.entity_type != 'patient') {
        sendServerError(res, "wrong entity");
    } else dbmanager.getpatientapphistory(req.entity_id,pNumber, size,function(err, results) {
        if(err) sendServerError(res, err);
        else {
            res.send(200, {
                appointments : results
            });
            res.end();
        }
    });
});


server.get('/personalinfo', function(req, res, next) {
    if(req.entity_type != 'patient') {
        sendServerError(res, "wrong entity");
    } else dbmanager.getpatientpersonalinfo(req.entity_id, function(err, results) {
        if(err) sendServerError(res, err);
        else {
            if(!results || results.length == 0) {
                sendServerError(res, "patient not found");
            } else {
                res.send(200, results[0]);
                res.end();
            }
        }
    });
});


server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);
});

