module.exports = (function() {
    "use strict";

    var setDragImage,
        DataTransfer = (window.DataTransfer || window.Clipboard);

    if (DataTransfer) {
        setDragImage = (typeof DataTransfer.prototype.setDragImage === "function");
    }

    function encodeItems(dragStartEvent) {
        // Stores the supplied data in the data transfer object
        var formats = Object.getOwnPropertyNames(this.items);

        formats.forEach(function(format) {
            var value;
            if (this.items.hasOwnProperty(format)) {
                value = this.items[format];
                if (typeof value === "function") {
                    value = value.call(this, this.element);
                }

                dragStartEvent.dataTransfer.setData(format, value);
            }
        }, this);
    }

    function applyEffectAllowed(ev) {
      
        if (this.effectAllowed) {
            if (typeof this.effectAllowed === "function") {
                ev.dataTransfer.effectAllowed = this.effectAllowed();
            } else {
                ev.dataTransfer.effectAllowed = this.effectAllowed;
            }
        }
    }


    function ghost(event) {
        var dragImage,
            style,
            x, y,
            rect = this.element.getBoundingClientRect(),
            scrollTop = (document.documentElement["scrollTop"] || document.body["scrollTop"]),
            scrollLeft = (document.documentElement["scrollLeft"] || document.body["scrollLeft"]);

        if (typeof this.ghostElementOrFunction === "function") {
            dragImage = this.ghostElementOrFunction();
        } else {
            dragImage = this.ghostElementOrFunction;
        }

        x = event.pageX;
        y = event.pageY;

        this.offsetX = x - (rect.left + scrollLeft);
        this.offsetY = y - (rect.top + scrollTop);

        style = dragImage.style;
        style.top = rect.top +  scrollTop  +  "px";
        style.left = rect.left + scrollLeft +"px";
        style.pointerEvents = "none";
        style.position = "absolute";
        style.margin = "0px";
        style.zIndex = "999";

        document.body.appendChild(dragImage);

        requestAnimationFrame(function() {
            document.body.removeChild(dragImage);
        });

        if (event.dataTransfer && typeof event.dataTransfer.setDragImage === "function") {
            event.dataTransfer.setDragImage(dragImage, this.offsetX, this.offsetY);
        } else if (typeof dragImage.dragDrop === "function") {
            // TODO: if we allow drag start notification, need to proxy this.
            // IE as of 11 do not have a setDragImage function which is a major limitation.  We can't simply
            // add one to the prototype as calling it would not have the desired effect.  I went for this 
            // approach which seems to work reasonably well.  IE10 + (although it seems broken for me on 11!!)
            // will provide a ghost of the draggable element when it is being dragged, the trick is to position
            // the supplied custom drag node, and get IE to drag that by calling the IE specific "dragDrop" 
            // function.  
            //
            // This means that draevents will not fire on the element the user actually wanted to make
            // draggable, however the information that they wanted to put into the data store will work
            //
            // 
            dragImage.addEventListener("dragstart", encodeItems.bind(this));
            dragImage.addEventListener("dragstart", function(ev) {
               this.dragStartListeners.forEach(function(l) { l(ev); });
            }.bind(this));
            dragImage.addEventListener("dragstart", applyEffectAllowed.bind(this));
            dragImage.dragDrop();
        }
    }

    var DragSource = function(element) {
        if (typeof element === "string") {
            element = document.querySelector(element);
        }

        // cheap fallible test to see if we found an element
        if (element && element.addEventListener) {
            this.element = element;
            this.items = {};
            element.setAttribute("draggable", true);
            element.addEventListener("dragstart", encodeItems.bind(this));
            element.addEventListener("dragstart", applyEffectAllowed.bind(this));
        } else {
            throw "Invalid element or selector specified as dragsource " + element;
        }
    };

    DragSource.prototype = {

        setData: function(format, data) {
            this.items[format] = data;
            return this;
        },

        ghost: function(element, offsetX, offsetY) {
            this.ghostElementOrFunction = element;
            this.offsetX = offsetX || 0;
            this.offsetY = offsetY || 0;

            var applyGhost = ghost.bind(this);

            if (!setDragImage) {
                this.element.setAttribute("draggable", false);
                this.element.addEventListener("selectstart", function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    applyGhost(ev);
                });
            } else { 
                this.element.addEventListener("dragstart", applyGhost);
            }

            return this;
        },

        on: function(eventName, fn) {
            this.element.addEventListener(eventName, fn.bind(this));
            if (eventName === "dragstart" && !setDragImage) {
                this.dragStartListeners = this.dragStartListeners || [];
                this.dragStartListeners.push(fn.bind(this));
            }
            return this;
        },

        effectAllowed: function(effectAllowed) {
            this.effectAllowed = effectAllowed;
            return this;
        }
    };

    return DragSource;
}());