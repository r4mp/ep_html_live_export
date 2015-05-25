var eejs = require('ep_etherpad-lite/node/eejs');
var settings = require('ep_etherpad-lite/node/utils/Settings');

// hide all formating buttons
exports.eejsBlock_editbarMenuLeft = function(hook_name, args, cb) {

    //delete args.renderContext.toolbar.availableButtons.bold;
    return cb();
}
