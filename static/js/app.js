(function($){
    var Page = function(options) {
        this.options = options || {};
        this.doctors = [];
        this.doctorMode = 'data';
    }

    $.extend(Page.prototype, {
        init : function() {
            $('#btnDoctors').click(function(){
                $('#mainDataContainer').empty();
                $('#sideMenuContainer').empty().load('/templates/doctor_menu.html', function(){
                    $('#btnCategory').click(pageInstance.categoryInit);
                    pageInstance.doctorMenuInit();
                });
            });


            $('#btnPatients').click(function(){
                $('#mainDataContainer').empty();
                $('#sideMenuContainer').empty().load('templates/patient_menu.html', function(){

                });
            });
        },

        categoryInit : function() {
            $('#mainDataContainer').empty().load('templates/category_form.html', function(){
                wait(true);
                runGetAjaxQuery(pageInstance.options.apiurl + '/getAllCategories', function(err, result){
                    if(err) {
                        wait(false);
                    }
                    else {
                        var results = $.parseJSON(result);
                        async.each(results, function(category,callback){
                            $('#cntCategories').append('<li>' + category.category_name + '</li>');
                            callback(null);
                        }, function(err){
                            wait(false);
                        });
                    }
                });

                $('#frmCategory').submit(function() {
                    //todo check category name  to not empty
                    wait(true);
                    var category = {
                        category_name : $('#txtCategoryName').val()
                    };

                    runPostAjaxQuery(pageInstance.options.apiurl + '/saveCategory', category, function(err, result){
                        if(err) {}
                        else {
                            //todo check results
                            $('#cntCategories').append('<li>' + category.category_name + '</li>');
                            wait(false);
                        }
                    });
                    return false;
                });
            });
        },

        doctorMenuInit : function() {
            $('#btnDoctorEdit').click(function(){
                wait(true);
                pageInstance.doctorMode = 'data';
                $('#mainDataContainer').empty().load('/templates/doctor_form.html',function(){
                    wait(false);
                    pageInstance.initDoctorSearch();
                    $('#frmDoctor').submit(pageInstance.saveDoctor);
                });
            });
            $('#btnDoctorCat').click(function(){
                wait(true);
                pageInstance.doctorMode = 'category';
                $('#mainDataContainer').empty().load('/templates/doctor_category.html',function(){
                        wait(false);
                        runGetAjaxQuery(pageInstance.options.apiurl + '/getAllCategories', function(err, result){
                            if(err) {
                                wait(false);
                            }
                            else {
                                var results = $.parseJSON(result);
                                async.each(results, function(category,callback){
                                    $('#slktCategories').append('<option value="'+ category.id + '">' + category.category_name + '</optton>');
                                    callback(null);
                                }, function(err){
                                    $('#slktCategories').change(function(e){
                                       pageInstance.getDoctorsByCategory(this.value);
                                    })
                                    wait(false);
                                });
                            }
                        });
                });
            });
        },

        getDoctorsByCategory : function(categoryId) {
            runGetAjaxQuery(pageInstance.options.apiurl + '/getDoctorsCategory?categoryId=' + categoryId, function(err, results){
                if(err) alert(err);
                else {
                    runGetAjaxQuery('/templates/doctor_searchresult.html', function(err, html){
                        if(err) {alert(err);}
                        else
                            $('#cntSearchResult').empty();
                            async.each(results, function(doctor, callback){
                                var dHtml = html.replace(/doctorPicture/g, doctor.picture_url);
                                dHtml = dHtml.replace(/doctorId/g,doctor.id);
                                dHtml = dHtml.replace(/doctorName/g,doctor.name);
                                $('#cntSearchResult').append(dHtml);
                                callback(null);
                            },function(err) {
                                wait(false);
                            });
                    });
                }
            })
        },

        initDoctorSearch : function() {
            $('#btnSearch').click(pageInstance.searchDoctor);
            $('#txtSearchTerm').keyup(function(e){
                if(e.keyCode == 13) {
                    event.preventDefault();
                    pageInstance.searchDoctor();
                }
            });
        },

        searchDoctor : function() {
            var term = $('#txtSearchTerm').val();
            if(term) {
                wait(true);
                runGetAjaxQuery(pageInstance.options.apiurl + '/findDoctorByName?q=' + term, function(err, results) {
                    if(err) {
                        //todo error handling
                    }
                    else {
                        if(results) {
                            pageInstance.doctors = results;
                            $('#cntSearchResult').empty();
                            runGetAjaxQuery('/templates/doctor_searchresult.html', function(err, html){
                                if(err) {/*todo process errors*/}
                                else
                                    async.each(pageInstance.doctors, function(doctor, callback){
                                        var dHtml = html.replace(/doctorPicture/g, doctor.picture_url);
                                        dHtml = dHtml.replace(/doctorId/g,doctor.id);
                                        dHtml = dHtml.replace(/doctorName/g,doctor.name);
                                        $('#cntSearchResult').append(dHtml);
                                        callback(null);
                                    },function(err) {
                                        wait(false);
                                    });
                            });
                        }
                    }
                });
            }
        },

        editDoctor : function(doctorId) {
            var res = $.grep(pageInstance.doctors, function(doctor){
                return doctor.id == doctorId;
            });

            if(res.length > 0) {
                switch(pageInstance.doctorMode) {
                    case 'data':
                        pageInstance.editDoctorData(res[0]);
                        break;
                    case 'category':
                        pageInstance.editDoctorCategory(res[0]);
                        break;
                    default:
                        alert('no mode found');
                        break;
                }

            }
        },

        editDoctorData : function(doctor) {
            $('#txtDoctorName').val(doctor.name);
            $('#txtPractName').val(doctor.pract_name);
            $('#txtPictureUrl').val(doctor.picture_url);
            $('#txtProfStat').val(doctor.prof_stat);
            $('#txtDoctorId').val(doctor.id);
        },

        editDoctorCategory : function(doctor) {
            alert(doctor.name)
        },

        saveDoctor : function() {
            wait(true);
            var doctor = {
                name : $('#txtDoctorName').val(),
                pract_name : $('#txtPractName').val(),
                picture_url : $('#txtPictureUrl').val(),
                prof_stat : $('#txtProfStat').val()
            };

            if($('#txtDoctorId').val()) doctor.id = $('#txtDoctorId').val();

            runPostAjaxQuery(pageInstance.options.apiurl + '/saveDoctor', doctor, function(err, reslut){
                if(err) {
                    alert(err);
                } else {
                    wait(false);
                }
            });

            return false;
        }
    });

    function runGetAjaxQuery(url, callback) {
        $.ajax({
            url : url,
            method : 'GET',
            success : function(result, status) {
                callback(null, result);
            },
            error : function(err) {
                callback(err);
            }
        });
    };

    function runPostAjaxQuery(url, data, callback) {
        $.ajax({
            url : url,
            method : 'POST',
            data : data,
            success : function(result, status) {
                callback(null, result);
            },
            error : function(err) {
                callback(err);
            }
        });
    }

    function wait(show) {
        if(show)
            $('#imgWait').show();
        else
            $('#imgWait').hide();
    }

    var pageInstance = null;


    $.extend($, {
        initPage : function(options) {
            if (!pageInstance) {
                pageInstance = new Page(options);
                pageInstance.init();
            }
        },

        editObject : function(element, type, objectId) {
            switch(type) {
                case 'doctor' :
                    pageInstance.editDoctor(objectId);
                    break;
                default:
                    alert('undefined type');
            }
        }
    });

}) (jQuery);



$(document).ready(function(){
    $.get('/config/config.json', function(result){
        $.initPage(result);
    })
})