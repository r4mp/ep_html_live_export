var marked = require('marked');
var async = require('async');
var pad_manager = require('ep_etherpad-lite/node/db/PadManager');
var ERR = require('async-stacktrace');
var eejs = require('ep_etherpad-lite/node/eejs');
var express = require('ep_etherpad-lite/node_modules/express');

getMdPadHtmlDocument = function (pad_id, rev, cb) {
    pad_manager.getPad(pad_id, function (err, pad) {
        if(ERR(err, cb)) return;

        var render_args = {
            pad_id: pad_id,
            last_modified: new Date(pad.savedRevisions[0].timestamp)
        };

        var header = eejs.require("ep_html_live_export/templates/header.html");
        var footer = eejs.require("ep_html_live_export/templates/footer.html", render_args);

        getMdPadHtml(pad, rev, function (err, html) {
            if(ERR(err, cb)) return;
            cb(null, header + html + footer);
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
    var headerRx = /(^[#]+[\ ]*.*)/;
    var toc = new Array();
    var toc_str = "*Table of Contents*  \n  \n";
    var text_new = "";
    var link = "";
    var linktext = "";

    for(i=0; i < lines.length; i++) {
        if(headerRx.test(lines[i])) {
            toc.push(lines[i]);
        }

        text_new += lines[i].replace(/^[\ ]*/g, '') + '\n';
    }

    for(i=0; i < toc.length; i++) {
        linktext = toc[i].replace(/(^[#]+[\ ]*)/, '').trim();
        link = linktext.toLowerCase().replace(/^[\ ]*/, '').replace(/[^0-9|^a-z|^\ ]*/g, '').replace(/[\ ]{2,}/g, ' ').replace(/\ /g, '-').toLowerCase();  
        toc_str += i+1 + '. [' + linktext + '](#' + link + ')  \n';
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

    args.app.use('/export/html/static', express.static(__dirname + '/..'))
};

