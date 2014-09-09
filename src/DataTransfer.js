 (function() {
    
    "use strict";

     var Type = require("./Type");
     var Kind = require("./Kind");

     var DataTransfer = (window.DataTransfer || window.Clipboard),
         setData,
         getData,
         currentDragData = {};

     if (DataTransfer) {
         setData = DataTransfer.prototype.setData;
         getData = DataTransfer.prototype.getData;
         currentDragData = {};

         DataTransfer.prototype.setData = function(type, value) {

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

         DataTransfer.prototype.getData = function(type) {
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

         document.body.addEventListener("dragend", function() {
             delete DataTransfer.prototype.items;
             currentDragData = {};
         });
     }

 }());