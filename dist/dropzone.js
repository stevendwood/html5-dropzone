"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);throw new Error("Cannot find module '" + o + "'");
            }var f = n[o] = { exports: {} };t[o][0].call(f.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, f, f.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }return s;
})({ 1: [function (require, module, exports) {
        (function () {

            "use strict";

            var Type = require("./Type");
            var Kind = require("./Kind");

            var DataTransfer = window.DataTransfer || window.Clipboard,
                setData,
                getData,
                currentDragData = {};

            if (DataTransfer) {
                setData = DataTransfer.prototype.setData;
                getData = DataTransfer.prototype.getData;
                currentDragData = {};

                DataTransfer.prototype.setData = function (type, value) {

                    try {
                        setData.call(this, type, value);
                    } catch (e) {
                        // IE as of version 11 do not accept any value other than Text and
                        // URL as the type, so handle this by storing the data in an object
                        // we can read from getData.
                        currentDragData[type] = value;
                        // TODO: Put current drag data in local storage
                        // for cross window drag.

                        // translate from text/plain into TEXT - should we also do this for HTML ?
                        if (type === Type.TEXT_PLAIN) {
                            setData.call(this, Type.TEXT, value);
                        } else if (type === Type.TEXT_URI_LIST) {
                            return setData.call(this, Type.URL, value);
                        }

                        // data stored on this.items wont come out on the dragover
                        // however things we add to the prototype appear to work,
                        // since you can only have one drag going on by definition,
                        // we should be OK provided we remember to take down this object
                        // on dragend.
                        DataTransfer.prototype.items = DataTransfer.prototype.items || [];
                        DataTransfer.prototype.items.push({
                            kind: Kind.STRING,
                            type: type,
                            value: value
                        });
                    }
                };

                DataTransfer.prototype.getData = function (type) {
                    try {
                        return getData.call(this, type);
                    } catch (e) {
                        // We got in here probably by attempting to call
                        // with a type e.g. text/my-type, IE will explode
                        // so see if there is anything in the custom data matching
                        // what was asked.

                        // If not, then map any Text data onto text/plain and Url
                        // onto text/uri-list.
                        var retVal = currentDragData[type];
                        if (retVal) {
                            return retVal;
                        } else if (type === Type.TEXT_PLAIN) {
                            return getData.call(this, Type.TEXT);
                        } else if (type === Type.TEXT_URI_LIST) {
                            return getData.call(this, Type.URL);
                        }
                    }
                };

                document.body.addEventListener("dragend", function () {
                    delete DataTransfer.prototype.items;
                    currentDragData = {};
                });
            }
        })();
    }, { "./Kind": 4, "./Type": 6 }], 2: [function (require, module, exports) {
        module.exports = function () {
            "use strict";

            var setDragImage,
                DataTransfer = window.DataTransfer || window.Clipboard;

            if (DataTransfer) {
                setDragImage = typeof DataTransfer.prototype.setDragImage === "function";
            }

            function encodeItems(dragStartEvent) {
                // Stores the supplied data in the data transfer object
                var formats = Object.getOwnPropertyNames(this.items);

                formats.forEach(function (format) {
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

            function _ghost(event) {
                var dragImage,
                    style,
                    x,
                    y,
                    rect = this.element.getBoundingClientRect(),
                    scrollTop = document.documentElement["scrollTop"] || document.body["scrollTop"],
                    scrollLeft = document.documentElement["scrollLeft"] || document.body["scrollLeft"];

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
                style.top = rect.top + scrollTop + "px";
                style.left = rect.left + scrollLeft + "px";
                style.pointerEvents = "none";
                style.position = "absolute";
                style.margin = "0px";
                style.zIndex = "999";

                document.body.appendChild(dragImage);

                requestAnimationFrame(function () {
                    return document.body.removeChild(dragImage);
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
                    dragImage.addEventListener("dragstart", function (ev) {
                        this.dragStartListeners.forEach(function (l) {
                            return l(ev);
                        });
                    }.bind(this));

                    dragImage.addEventListener("dragend", function (ev) {
                        this.dragEndListeners.forEach(function (l) {
                            return l(ev);
                        });
                    }.bind(this));

                    dragImage.addEventListener("dragstart", applyEffectAllowed.bind(this));
                    dragImage.dragDrop();
                }
            }

            var DragSource = function () {
                function DragSource(element) {
                    _classCallCheck(this, DragSource);

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

                    this.dragStartListeners = [];
                    this.dragEndListeners = [];
                }

                _createClass(DragSource, [{
                    key: "setData",
                    value: function setData(format, data) {
                        this.items[format] = data;
                        return this;
                    }
                }, {
                    key: "ghost",
                    value: function ghost(element) {
                        var offsetX = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
                        var offsetY = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

                        // Ghost function
                        this.ghostElementOrFunction = element;
                        this.offsetX = offsetX;
                        this.offsetY = offsetY;

                        var applyGhost = _ghost.bind(this);

                        if (!setDragImage) {
                            this.element.setAttribute("draggable", false);
                            this.element.addEventListener("selectstart", function (ev) {
                                ev.stopPropagation();
                                ev.preventDefault();
                                applyGhost(ev);
                            });
                        } else {
                            this.element.addEventListener("dragstart", applyGhost);
                        }

                        return this;
                    }
                }, {
                    key: "on",
                    value: function on(eventName, fn) {
                        this.element.addEventListener(eventName, fn.bind(this));
                        if (eventName === "dragstart" && !setDragImage) {
                            this.dragStartListeners.push(fn.bind(this));
                        } else if (eventName === "dragend" && !setDragImage) {
                            this.dragEndListeners.push(fn.bind(this));
                        }

                        return this;
                    }
                }, {
                    key: "effectAllowed",
                    value: function effectAllowed(_effectAllowed) {
                        this.effectAllowed = _effectAllowed;
                        return this;
                    }
                }]);

                return DragSource;
            }();

            return DragSource;
        }();
    }, {}], 3: [function (require, module, exports) {
        module.exports = function () {
            "use strict";

            var Operation = require("./Operation");
            var Kind = require("./Kind");
            var Type = require("./Type");
            var isMac = window.navigator.platform.indexOf("Mac") !== -1;

            var DataTransfer = window.DataTransfer || window.Clipboard,
                validDrop,
                selectedDropEffect;

            DataTransfer.prototype.getDropEffect = function () {
                if (validDrop) {
                    return selectedDropEffect;
                } else {
                    return this.dropEffect;
                }
            };

            function removeAllDragClasses(element, dragEnterClass) {
                element.classList.remove(Operation.COPY);
                element.classList.remove(Operation.MOVE);
                element.classList.remove(Operation.LINK);
                element.classList.remove(dragEnterClass);
            }

            function acceptsDrop(dragEvent) {

                // Figure out whether a drop zone (this) accepts a drop of the
                // current drag.
                var accepts = false,
                    // the return value...
                i,
                    l,
                    dragItems,
                    // the DataTransferItems on some browsers, or the fake ones for IE
                dragTypes,
                    // the types in the dataTransfer if items is not available
                effect,
                    effectAllowed,
                    dataTransfer = dragEvent.dataTransfer;

                if (dragEvent.altKey) {
                    if (!isMac) {
                        effect = Operation.LINK;
                    } else {
                        effect = Operation.COPY;
                    }
                } else if (dragEvent.ctrlKey) {
                    if (!isMac) {
                        effect = Operation.COPY;
                    } else {
                        effect = Operation.LINK;
                    }
                } else if (dragEvent.metaKey) {
                    effect = Operation.MOVE;
                } else {
                    effect = this.operation;
                }

                try {
                    effectAllowed = dataTransfer.effectAllowed;
                    if (effectAllowed === Operation.ALL || effectAllowed === Operation.UNINITIALIZED || effectAllowed.toUpperCase().indexOf(effect.toUpperCase()) > -1) {
                        dataTransfer.dropEffect = effect;
                    } else {
                        // Chrome and FF will not let us get this far, as they natively implement
                        // the logic above, TODO: perhaps we should allow dropzones to indicate they
                        // do not accept anything other than the operation ??
                        removeAllDragClasses(this.element, this.dragEnterClass);
                        return false;
                    }
                } catch (e) {
                    dataTransfer.dropEffect = effect;
                    // Internet explorer does not like being asked about effectAllowed if the drag originated from
                    // another application...
                }

                selectedDropEffect = effect;

                dragItems = dataTransfer.items;
                dragTypes = dataTransfer.types;

                // we should always get at least types....
                if (dragTypes && !dragItems) {
                    dragItems = [].map.call(dragTypes, function (t) {
                        // build something that looks a bit like a DataTransferItem out of the
                        // types array.
                        if (t === Type.FILES) {
                            // if we have a type of "Files", then we have no way of knowing
                            // what the actual "type" of the file is, we'll have to accept any
                            // drags that contain this. "Files" is really kind
                            return {
                                kind: Kind.FILE,
                                type: Type.UNKNOWN
                            };
                        } else {
                            // otherwise, we'll suppose it to be a string
                            return {
                                kind: Kind.STRING,
                                type: t
                            };
                        }
                    });
                }

                // make sure that the dragItems is an Array so that we can call
                // the "some" function.
                if (!Array.isArray(dragItems)) {
                    dragItems = [].slice.call(dragItems, 0);
                }

                accepts = dragItems.some(function (item) {
                    for (i = 0, l = this.acceptsList.length; i < l; i++) {
                        var acceptsEntry = this.acceptsList[i];
                        // if we have an exact match on kind, or if we accept anything for kind
                        if (item.kind === acceptsEntry.kind || acceptsEntry.kind === "*") {
                            // then does the type match - or do we accept any type or is the type
                            // "unknown" i.e. the DataTransferItem interface is no implemented...
                            if (item.type === acceptsEntry.type || acceptsEntry.type === "*" || item.type === Type.UNKNOWN) {
                                return true;
                            } else if (acceptsEntry.type.indexOf("/*") > -1) {
                                // check if the type is a wildcard
                                var wildcardType = acceptsEntry.type.substring(0, acceptsEntry.type.indexOf("/*"));
                                if (item.type.substring(0, item.type.indexOf("/")) === wildcardType) {
                                    return true;
                                }
                            }
                        }
                    }
                }, this);
                console.debug(accepts);
                if (accepts) {
                    if (!this.element.classList.contains(effect)) {
                        this.element.classList.remove(Operation.COPY);
                        this.element.classList.remove(Operation.MOVE);
                        this.element.classList.remove(Operation.LINK);
                        this.element.classList.add(effect);
                    }

                    if (!this.element.classList.contains(this.dragEnterClass)) {
                        this.element.classList.add(this.dragEnterClass);
                    }
                } else {
                    removeAllDragClasses(this.element, this.dragEnterClass);
                }

                return accepts;
            }

            function parseDropzone(dropzone) {
                var operation,
                    // unspecified
                accepts = [];

                dropzone = dropzone.split(" ");

                dropzone.forEach(function (value) {

                    if (value.indexOf(":") > -1) {
                        var split = value.split(":"),
                            kind = split[0],
                            type = split[1];

                        if (kind === "f") {
                            kind = Kind.FILE;
                        } else if (kind === "s") {
                            kind = Kind.STRING;
                        }

                        accepts.push({
                            kind: kind,
                            type: type
                        });
                    } else if (!operation) {
                        if ([Operation.COPY, Operation.MOVE, Operation.LINK].indexOf(value) > -1) {
                            operation = value;
                        }
                    }
                });

                operation = operation || Operation.COPY;

                // if we only got an operation and no accepts list, I *think* this means
                // you accept a drop of anything.
                if (accepts.length === 0) {
                    accepts = [{
                        "kind": "*",
                        "type": "*"
                    }];
                }

                return {
                    operation: operation,
                    accepts: accepts
                };
            }

            var DropZone = function () {
                function DropZone(element, options) {
                    _classCallCheck(this, DropZone);

                    var accepts = acceptsDrop.bind(this),
                        enterLeaveCount = 0,
                        cancelEventAndSetDropEffect,
                        tidyUpClassesAndResetCounter;

                    cancelEventAndSetDropEffect = function cancelEventAndSetDropEffect(event) {
                        if (accepts(event)) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    };

                    if (typeof element === "string") {
                        element = document.querySelector(element);
                    }

                    this.element = element;
                    this.dragEnterClass = "drag-matches";
                    if ((typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
                        this.dragEnterClass = options.dragEnterClass || this.dragEnterClass;
                        this.operation = options.operation;
                        this.accepts(options.accepts);
                    } else {
                        var dropzone;
                        if (typeof options === "string") {
                            dropzone = options;
                        } else {
                            dropzone = element.getAttribute("dropzone");
                        }

                        var parsed = parseDropzone(dropzone);
                        this.operation = parsed.operation || Operation.COPY;
                        this.accepts(parsed.accepts);
                    }

                    tidyUpClassesAndResetCounter = function () {
                        enterLeaveCount = 0;
                        removeAllDragClasses(this.element, this.dragEnterClass);
                        setTimeout(function () {
                            // give a chance for the _dropEffect to be used
                            validDrop = false;
                        }, 100);
                    }.bind(this);

                    element.addEventListener("dragenter", function (event) {
                        enterLeaveCount++;
                        if (enterLeaveCount === 1 && accepts(event)) {
                            element.classList.add(this.dragEnterClass);
                        }
                    }.bind(this));

                    element.addEventListener("dragleave", function (event) {
                        enterLeaveCount--;

                        if (enterLeaveCount === 0) {
                            tidyUpClassesAndResetCounter();
                        }
                    }.bind(this));

                    element.addEventListener("dragenter", cancelEventAndSetDropEffect);
                    element.addEventListener("dragover", cancelEventAndSetDropEffect);

                    document.body.addEventListener("dragend", function () {
                        setTimeout(tidyUpClassesAndResetCounter);
                    });

                    element.addEventListener("drop", function () {
                        validDrop = true;
                        tidyUpClassesAndResetCounter();
                    });
                }

                _createClass(DropZone, [{
                    key: "accepts",
                    value: function accepts(acceptsList) {
                        this.acceptsList = Array.isArray(acceptsList) ? acceptsList : [acceptsList];
                        this.acceptsList.forEach(function (entry, idx) {
                            if (entry.kind === Kind.STRING && entry.type === Type.TEXT_PLAIN) {
                                this.acceptsList.push({
                                    kind: entry.kind,
                                    type: Type.TEXT
                                });
                            } else if (entry.kind === Kind.STRING && entry.type === Type.TEXT_URI_LIST) {
                                this.acceptsList.push({
                                    kind: entry.kind,
                                    type: Type.URL
                                });
                            }
                        }, this);

                        return this;
                    }
                }]);

                return DropZone;
            }();

            ;

            return DropZone;
        }();
    }, { "./Kind": 4, "./Operation": 5, "./Type": 6 }], 4: [function (require, module, exports) {

        //
        module.exports = {
            FILE: "file",
            STRING: "string"
        };
    }, {}], 5: [function (require, module, exports) {
        module.exports = {
            COPY: "copy",
            MOVE: "move",
            LINK: "link",
            ALL: "all",
            NONE: "none",
            UNINITIALIZED: "uninitialized"
        };
    }, {}], 6: [function (require, module, exports) {
        module.exports = {
            TEXT: "Text",
            URL: "Url",
            FILES: "Files",
            TEXT_PLAIN: "text/plain",
            TEXT_URI_LIST: "text/uri-list",
            UNKNOWN: "<unavailable>"
        };
    }, {}], 7: [function (require, module, exports) {
        (function () {

            "use strict";

            require("./DataTransfer.js");

            var DragSource = require("./DragSource");
            var DropZone = require("./DropZone");

            window.draggable = function (element) {
                return new DragSource(element);
            };

            window.dropzone = function (element, options) {
                return new DropZone(element, options);
            };

            var Dick = function Dick() {
                _classCallCheck(this, Dick);
            };

            [].forEach.call(document.querySelectorAll("[dropzone]"), dropzone);
        })();
    }, { "./DataTransfer.js": 1, "./DragSource": 2, "./DropZone": 3 }] }, {}, [7]);