 
 module.exports = (function() { 

  var Operation = require("./Operation");
  var Kind = require("./Kind");
  var Type = require("./Type");

 var DataTransfer = (window.DataTransfer || window.Clipboard),
     validDrop,
     selectedDropEffect;

 DataTransfer.prototype.getDropEffect = function() {
      if (validDrop) {
         return selectedDropEffect;
      } else {
        return this.dropEffect;
      } 
  };

  function acceptsDrop(dragEvent) {

      // Figure out whether a drop zone (this) accepts a drop of the
      // current drag.
      var accepts = false, // the return value...
          i, l,
          dragItems, // the DataTransferItems on some browsers, or the fake ones for IE
          dragTypes, // the types in the dataTransfer if items is not available
          acceptsEntry, // current entry under consideration for a match
          effect,
          effectAllowed,
          dataTransfer = dragEvent.dataTransfer;

      // TODO: Mac
        if (dragEvent.altKey) {
            effect = Operation.LINK;
        } else if (dragEvent.ctrlKey) {
            effect = Operation.COPY;
        } else {
            effect = this.operation;
        }
        
        try {
          effectAllowed = dataTransfer.effectAllowed;
          if ((effectAllowed === Operation.ALL) 
              || (effectAllowed === Operation.UNINITIALIZED)
              || (effectAllowed.toUpperCase().indexOf(effect.toUpperCase()) > -1)) {
              dataTransfer.dropEffect = effect;
          } else {
              // Chrome and FF will not let us get this far, as they natively implement
              // the logic above, TODO: perhaps we should allow dropzones to indicate they
              // do not accept anything other than the operation ??
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
          dragItems = [].map.call(dragTypes, function(t) {
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

      accepts = dragItems.some(function(item) {
          for (i = 0, l = this.acceptsList.length; i < l; i++) {
              var acceptsEntry = this.acceptsList[i];
              // if we have an exact match on kind, or if we accept anything for kind
              if ((item.kind === acceptsEntry.kind) || (acceptsEntry.kind === "*")) {
                  // then does the type match - or do we accept any type or is the type
                  // "unknown" i.e. the DataTransferItem interface is no implemented...
                  if ((item.type === acceptsEntry.type) || (acceptsEntry.type === "*") || item.type === Type.UNKNOWN) {
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

      if (accepts) {
        if (!this.element.classList.contains(effect)) {
          this.element.classList.remove(Operation.COPY);
          this.element.classList.remove(Operation.MOVE);
          this.element.classList.remove(Operation.LINK);
          this.element.classList.add(effect);
        }
      }

      return accepts;
  }

    function parseDropzone(dropzone) {
        var operation, // unspecified
            accepts = [];

        dropzone = dropzone.split(" ");

        dropzone.forEach(function(value) {

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

        operation = (operation || Operation.COPY);

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

    var DropZone = function(element, options) {
        var accepts = acceptsDrop.bind(this),
            enterLeaveCount = 0,
            cancelEventAndSetDropEffect,
            tidyUpClassesAndResetCounter;

        cancelEventAndSetDropEffect = function(event) {
            if (accepts(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        this.element = element;
        this.dragEnterClass = "drag-matches";
        if (typeof options === "object") {
            this.dragEnterClass = (options.dragEnterClass || this.dragEnterClass);
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

        tidyUpClassesAndResetCounter = function() {
            enterLeaveCount = 0;
            this.element.classList.remove(this.dragEnterClass);
            this.element.classList.remove(Operation.COPY);
            this.element.classList.remove(Operation.MOVE);
            this.element.classList.remove(Operation.LINK);
            setTimeout(function() {
              // give a chance for the _dropEffect to be used
              validDrop = false;
            }, 100);
        }.bind(this);

        
        element.addEventListener("dragenter", function(event) {
           enterLeaveCount++;
            if (enterLeaveCount === 1 && accepts(event)) {
                element.classList.add(this.dragEnterClass);
            }
        }.bind(this));

        element.addEventListener("dragleave", function(event) {
            enterLeaveCount--;

            if (enterLeaveCount === 0) {
                tidyUpClassesAndResetCounter();
            }
        }.bind(this));

        element.addEventListener("dragenter", cancelEventAndSetDropEffect);
        element.addEventListener("dragover", cancelEventAndSetDropEffect);

        document.body.addEventListener("dragend",  function() { 
          setTimeout(tidyUpClassesAndResetCounter); 
        });

        element.addEventListener("drop", function() {
          validDrop = true;
          tidyUpClassesAndResetCounter();
        });
        
    };

    DropZone.prototype = {

        accepts: function(acceptsList) {
            this.acceptsList = Array.isArray(acceptsList) ? acceptsList : [acceptsList];
            this.acceptsList.forEach(function(entry, idx) {
                if ((entry.kind === Kind.STRING) && (entry.type === Type.TEXT_PLAIN)) {
                    this.acceptsList.push({
                        kind: entry.kind,
                        type: Type.TEXT
                    });
                } else if ((entry.kind === Kind.STRING) && (entry.type === Type.TEXT_URI_LIST)) {
                    this.acceptsList.push({
                        kind: entry.kind,
                        type: Type.URL
                    });
                }
                
            }, this);

            return this;
        }
    };

    return DropZone;
  
}());