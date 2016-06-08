(function() {

    "use strict";

    require("./DataTransfer.js");
    
    var DragSource = require("./DragSource");
    var DropZone = require("./DropZone");

    window.draggable = (element) => new DragSource(element);

    window.dropzone = (element, options) => new DropZone(element, options);

    [].forEach.call(document.querySelectorAll("[dropzone]"), dropzone); 

}());