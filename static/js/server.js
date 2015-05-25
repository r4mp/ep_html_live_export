var marked = require('marked');
var async = require('async');
var pad_manager = require('ep_etherpad-lite/node/db/PadManager');
var ERR = require('async-stacktrace');
var eejs = require('ep_etherpad-lite/node/eejs');

getMdPadHtmlDocument = function (pad_id, rev, cb) {
    pad_manager.getPad(pad_id, function (err, pad) {
        if(ERR(err, cb)) return;

        //var head = eejs.require(__dirname+"/templates/header.html");
        var head = '<html>\n<head></head>\n<body>\n<link href="//totalism.org/E2H/font-ubuntu-mono" rel="stylesheet" type="text/css">\n<link rel="stylesheet" type="text/css" href="//totalism.org/E2H/css-normality2.css">'; // TODO: read from template file
        var foot = '<div id="main_container">\n<div id="transclude" class="etherpad_container"></div>\n</div>\n</body>\n</html>';

        getMdPadHtml(pad, rev, function (err, html) {
            if(ERR(err, cb)) return;
            cb(null, head + html + foot);
        });
    });
};

getMdPadHtml = function(pad, rev, cb) {
    var atext = pad.atext;

    async.waterfall([
            function(cb) {
                if(rev != undefined) {
                    pad.getInternalRevisionAText(rev, function (err, rev_atext) {
                        if(ERR(err, cb)) return;

                        atext = rev_atext;
                        cb();
                    });
                } else {
                    cb(null);
                }
            },

            function(cb) {
                html = getText(atext);
                cb(null);
            }],

            function (err) {
                if(ERR(err, cb)) return;
                cb(null, html);
            });

};

getText = function(atext) {
    var lines = atext.text.slice(0, -1).split('\n'); 
    var headerRx = /(^[#]+[:space:]?.*)/;
    var toc = new Array();
    var toc_str = "";
    var text_new = "";
    var link = "";

    for(i=0; i < lines.length; i++) {
        if(headerRx.test(lines[i])) {
            toc.push(lines[i]);
        }

        text_new += lines[i] + '\n';
    }
    
    for(i=0; i < toc.length; i++) {
        link = toc[i].replace(/\ /g,'').replace(/#/g, '');  
        toc_str += '[' + link + '](#' + link + ')  \n';
    }

    return marked(text_new.replace('[TOC]', toc_str));
};

exports.expressCreateServer = function(hook_name, args, cb) {
    args.app.get('/p/:pad/:rev?/export/html', function(req, res) {
        var pad_id = req.params.pad;
        var rev = req.params.rev ? req.params.rev : null;

        getMdPadHtmlDocument(pad_id, rev, function(err, res2) {
            res.contentType('text/html');
            res.send(res2);
        });        

    });
};

