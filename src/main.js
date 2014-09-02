(function() {

    "use strict";
    
    var DragSource = require("./DragSource");
    var DropZone = require("./DropZone");

    //require("./DataTransfer.js");

    window.draggable = function(element) {
        return new DragSource(element);
    };

    window.dropzone = function(element, options) {
        return new DropZone(element, options);
    };

    [].forEach.call(document.querySelectorAll("[dropzone]"), dropzone); 

}());