<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [html5 [dropzone]
](#html5-dropzone)
  - [Usage](#usage)
  - [Why do i need a library for native drag and drop ?](#why-do-i-need-a-library-for-native-drag-and-drop-)
    - [Lots of events...](#lots-of-events)
    - [So how to I decide whether to cancel the dragenter/dragover events ?](#so-how-to-i-decide-whether-to-cancel-the-dragenterdragover-events-)
    - [<code>event.getDropEffect()</code>](#codeeventgetdropeffectcode)
  - [Using ``dropzone``](#using-dropzone)
      - [Setting up a dropzone](#setting-up-a-dropzone)
    - [Styling the dropzone](#styling-the-dropzone)
    - [Multiple dropzones](#multiple-dropzones)
  - [Drag sources](#drag-sources)
    - [Using ``draggable()``](#using-draggable)
      - [Basic use](#basic-use)
        - [<code>setData</code>](#codesetdatacode)
        - [<code>effectAllowed</code>](#codeeffectallowedcode)
      - [Customising the drag image](#customising-the-drag-image)
      - [<code>ghost</code>](#codeghostcode)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

html5 [dropzone]
========

A JavaScript library that provides a usable implementation of the HTML5 [dropzone](http://www.whatwg.org/specs/web-apps/current-work/multipage/interaction.html#the-dropzone-attribute) attribute, eases implementation of HTML5 drag and drop apps  and gets drag and drop to work in the intended HTML 5 style cross browser.  

```html
<!-- Accept drops of text/x-paper with a default operation of move -->
<div id="paperbin" dropzone="move string:text/x-paper"></div>

<!-- Accept drops of text/x-paper and text/x-apple with a default operation of move -->
<div id="trashbin" dropzone="move s:text/x-paper s:text/x-apple"></div>

<!-- Accept files of text/plain and elements or text from another application that produce text/plain -->
<div dropzone="copy f:text/plain s:text/plain"></div>
```

[Multiple dropzone demo](http://stevendwood.github.io/examples/cards.html) - This demo is based on a JQuery drag and drop example and shows how you can have different dropzones that can be fussy about what they accept even on IE.  

[Custom drag image demo](http://stevendwood.github.io/examples/custom-drag-image.html) - This demo shows a custom drag image or ghost, works on IE as well despite the lack of a setDragImage function.

Supports: IE10+, Chrome, Firefox, Safari

##Usage
Allows you to store any data you like in the data transfer object, getting round the major IE limitation which usually only allows "Text" or "Url" in the set/get Data methods.  By using the dropzone attribute, you don't need to implement dragover and dragenter event handlers in order to accept the drop.  You also get some CSS classes added and removed when a drag is over a valid drop target and a valid drop effect is selected.  The library tries to implement as many of the event handlers for you as possible, so all you have to do is implement what happens on drop.

This example also uses the <code>draggable</code> function which avoids the need to implement a dragstart listener.

```html
<div id="paper" draggable="true"></div>
<div id="apple" draggable="true"></div>
    
<div dropzone="move s:text/x-paper" ondrop="handleDropPaper(event)"></div>
<div dropzone="move s:text/x-apple" ondrop="handleDropApple(event)"></div>

<script src="dropzone.min.js"></script>
<script>
      draggable("#paper")
          .setData("text/x-paper", "Data for the x-paper drag type");
        
      draggable("#apple")
          .setData("text/x-apple", "Data for the x-apple drag type");

      function handleDropPaper(e) {
          e.dataTransfer.getData("x-paper"); // "Data for the x-paper drag type"
       }

      function handleDropApple(e) {
          e.dataTransfer.getData("x-paper"); // "Data for the x-apple drag type"
      }
      
</script>
```

For anyone familiar with the HTML5 drag and drop API, this code is roughly the equivalent of the following code which will not run on IE, and will not handle adding and removing the classes to the drop target elegantly when there are other elements inside the drop target... :

```html
<!-- (FOR ILLUSTRATION ONLY - DOES NOT WORK !!) -->
<div id="paper" draggable="true" ondragstart="startDragPaper(event)"></div>
<div id="apple" draggable="true" ondragstart="startDragApple(event)"></div>
    
<div  ondragover="isPaper(event)" ondragenter="isPaper(event)" ondragleave="removeClass(event)" ondrop="handleDropPaper(event)"></div>
<div  ondragover="isApple(event)" ondragenter="isApple(event)" ondragleave="removeClass(event)" ondrop="handleDropApple(event)"></div>

<script>

      function startDragPaper(e) {
        // This will throw an exception on IE
        e.dataTransfer.setData("text/x-paper", "Data for the x-paper drag type");
      }

      function startDragApple(e) {
        // This will throw an exception on IE
        e.dataTransfer.setData("text/x-apple", "Data for the x-apple type");
      }

      function isPaper(event) {
        if (event.dataTransfer.types.indexOf("x-paper") !== -1) {
          event.target.classList.add("drag-matches");
          event.stopPropagation();
        }
      }
       
      function isApple(event) {
        if (event.dataTransfer.types.indexOf("x-apple") !== -1) {
          event.target.classList.add("drag-matches");
          event.stopPropagation();
        }
      }

      function removeClass(event) {
        event.target.classList.remove("drag-matches");
      }

      function handleDropPaper(e) {
         // will throw an error on IE
         e.dataTransfer.getData("x-paper"); // "Data for the x-paper drag type"
      }

       function handleDropApple(e) {
         // will throw an error on IE
         e.dataTransfer.getData("x-paper"); // "Data for the x-apple drag type"
      }
      
</script>
```

## Why do i need a library for native drag and drop ?

I've spent many months toiling with HTML5 drag and drop on different browsers, this library represents the sum of my knowledge on the subject, hopefully it will save anyone using it a lot of time and hassle.  

###Lots of events...
HTML5 drag and drop does not work cross browser regardless of the dropzone attribute.  It's clumsy and requires working with lots of events.  For example to allow a user to drag one element and drop it on top of another you need to :

1. Implement the dragstart event.
2. Implement dragenter and ...
3. ...dragover handlers on the target, at the very least to cancel the events
4. Implement dragleave if you planned on styling the node on dragover/enter to show it can take the drop.
5. Implement a drop handler.

The deal is that on dragstart - you put data into the [DataTransfer](http://html5index.org/Drag%20and%20Drop%20-%20DataTransfer.html) object, this data is keyed by type - so you can provide a representation in plain text, as HTML or whatever you like.  When a drop happens either in another web page or a native application, the data store will be asked for data according to what the recieving application wants.

dragenter and dragover at least need to be cancelled if you want an element to accept the drop, so you must implement them even if to do nothing other than cancel the drag event.

### So how to I decide whether to cancel the dragenter/dragover events ?
The default action of the browser in this case is not to allow a drop, so we need to cancel the dragenter/dragover events on any drop target it if we want to change that.  In order to decide whether or not you accept a drop - you need to consider a number of things :

__Do I recognise the type of what is being dragged__ ?
During dragover/enter you get access to a list of strings, these being the types of things that are currently being dragged.  Some browsers provide a list of [DataTransferItems](http://html5index.org/Drag%20and%20Drop%20-%20DataTransferItem.html) but some don't.  The data transfer item doesn't help here all that much since you only get told the "kind" of thing in addition to the type - i.e. is it a file or a string.  You cannot see exactly what is being dragged due to security considerations, which is fair enough.  

This is generally workable, __except that in Internet Explorer including version 11 - you cannot store any other information except "Text" and "Url"__.  You therefore have no hope of conditionally accepting a drop if you based your decision solely  on the contents of what is being dragged.  If you try the examples from the spec. IE will throw an exception as soon as you try and store something that is not "Text" or "Url".  

__Does the drag source allow the effect I want to apply ?__

There are two properties of interest here - effectAllowed and dropEffect. The general idea seems to be that the source of a drag indicates (by setting effectAllowed) that it can be (e.g.) moved and copied, or that it can only be copied.  The drop target can specify which action it wants to take on dragover by setting the dropEffect, e.g. if it sets the dropEffect to link and the effectAllowed is "move" - then it would seem reasonable that the drop should not be allowed.  This is how all browsers except IE work.  This library fixes this behaviour on IE.

__ Drop Effect and Effect Allowed__
You can set effectAllowed ondragstart, and dropEffect on dragover.  The information below is regardless
of whether you cancel the appropriate events to indicate you accept the drop.  You must cancel the dropevent in order for the dropEffect to be passed to the dragend function.

There are three things to consider :

__1. Should the drop be accepted only if the dropEffect set to a valid value given the effectAllowed ?__

If the dropEffect is not one of the effectAllowed values, then all browsers except IE do not accept the drop. IE allows any drop regardless of the dropEffect and the effectAllowed (this library fixes this).

```javascript
// implemented on the draggable source
function dragStartHandler(event) {
   event.dataTransfer.effectAllowed = "copyMove"
}

// implemented on the drop target
function dragOverHandler(event) {
   event.dataTransfer.dropEffect = "link";
   ...
}
```

In the above example the drop target cannot accept the drop as it does not specify a valid dropEffect.  This would not normally work on IE but by using this library the above code will result in the drop not being allowed on any browser.

__2. Does the cursor update to give the user feedback on what will happen if they drop ?__

Chrome & Safari will change the mouse cursor to fit the dropEffect. So does Mozilla on mac. Mozilla on windows and IE both look at the first effect they come across in the effectAllowed and set the cursor on any valid drop target to be that. Except IE who seem to always use "link" if that is in the effectAllowed e.g. if effectAllowed is "copyLink" and we set dropEffect to "link" on dragover - Mozilla will set the
cursor to "copy" but IE set it to "link".  IE seems to have "link" as always winning. When you press ctrl, mozilla update the cursor in response. So it seems you cannot programatically affect the cursor in Mozilla by changing the drop effect in dragover.

__3. Is the dropEffect reported at the source element on dragend ?__

The spec shows that the source can listen for the dragend event to see what happened.  It should look at the dropEffect within this event. Chrome, Mozilla and Safari work as you would hope here, the drop effect appears in the dragend event. In IE if the effect allowed is a simple value e.g. "copy" then any successful drop results in this value  appearing as the dropEffect on dragend.  If the effectAllowed was a compound value like "copyMove" and the drop target tried to select "move" on dragover by setting the dropEffect, you're out of luck, that will come through as  dropEffect = "none" at the source on dragend.   

```javascript
// implemented on the draggable source
function dragStartHandler(event) {
   event.dataTransfer.effectAllowed = "move"
}

// implemented on the drop target
function dragOverHandler(event) {
   event.dataTransfer.dropEffect = "move";
   ...
}

function dragEndHandler(event) {
  // following a successful drop...
    event.dataTransfer.dropEffect; // "move" on all browsers
}

```

But, supposing we tried this

```javascript
// implemented on the draggable source
function dragStartHandler(event) {
   event.dataTransfer.effectAllowed = "copyMove"
}

// implemented on the drop target
function dragOverHandler(event) {
   event.dataTransfer.dropEffect = "move";
   ...
}

function dragEndHandler(event) {
  // following a successful drop...
    event.dataTransfer.dropEffect; // "move" on all browsers except IE which reports "none"
}

```
Then the dropEffect is reported as "none" on IE, but is correctly reported on the other browsers. To fix this I introduced a new method you can call called getDropEffect() :

```javascript
function dragEndHandler(event) {
  // following a successful drop...with effectAllowed set to copyMove
    event.dataTransfer.dropEffect; // "move" on all browsers except IE which reports "none"
    event.dataTransfer.getDropEffect(); // "move" on all browsers.
}
```

__ Other notes __

On Safari on a mac - effectAllowed cannot be set programatically, therefore any dropEffect that gets set is valid. When you press the cmd key the effectAllowed becomes "move" and when you press the alt key the effectAllowed becomes "copy".  Thereafter it works as you would hope, if the dropEffect is not one of these effectAlloweds the drop is not allowed by the browser.  

__ What does all this mean ?__

Should the "operation" part of the dropzone be used to set the drop effect ?  My conclusion was probably yes, provided that keyboard shortcuts can change it - i.e. if you do nothing you get the operation, otherwise you get the operation as specified by the keyboard. So for a drop zone with "move" then if you do not use the keyboard, you get a dropEffect of move, otherwise the dropEffect is selected based on the keyboard modifiers.  If this produces a disallowed effectAllowed the drop will not be acceptable.

###<code>event.getDropEffect()</code>
If you want to use the browsers native dropEffect property reliably to do something to the source element based on dropEffect - then you must allow only one effectAllowed copy, move or link if you do not set it it will become "copy".  Otherwise you should use the getDropEvent function in the dragend handler which reliably works in IE for compund values of the effectAllowed property.

```html

<ol dropzone="move string:text/x-example" ondragstart="dragStartHandler(event)" ondragend="dragEndHandler(event)">

<script>
   /*
       On drag start we allow the element to be moved or copied, on drag end we want to
       remove the element if the selected dropEffect was "move". Because we used a 
       'compound' effectAllowed (copyMove), Internet Explorer unforunately reports that
       the dropEffect was "none" on the dragend no matter what we set it to on dragover.
       The effect will be set on the dropzone based on the keyboard modifiers, if none
       were used, we get the default for the dropzone which was "move" in the markup above.
    */
   function dragStartHandler(event) {
      if (event.target instanceof HTMLLIElement) {

       event.dataTransfer.setData("text/x-my-type", event.target.dataset.value);
     event.dataTransfer.effectAllowed = 'copyMove'; // only allow copies or moves
    } 
    }

  function dragEndHandler(event) {
        // use this instead of event.datatTransfer.dropEffect
    var dropEffect = event.dataTransfer.getDropEffect();

    if (dropEffect === "move") {
         event.target.parentElement.removeChild(event.target);
      }

    }
</script>

```

You also get a class added ondragover reflecting the dropEffect -  drag-matches.copy  drag-matches.move or drag-matches.link. 


## Using ``dropzone``

The dropzone attribute makes an element able to accept drops. If an element has a dropzone attribute, this will be parsed and used to decide whether or not to cancel the drag events required to tell the browser a drop is accepted.

```html
<div dropzone="copy s:text/plain s:text/x-my-custom-type" ondrop="handleDrop(event)"></div>
```
This example will make the element accept any drag that contains data text/plain or text/x-my-custom-type. 



#### Setting up a dropzone

This simple example allows the user to drag the element with id "paper" and drop it on the div with id "trashcan".  Using this library (and the dropzone attribute), there is no need to cancel the dragenter and dragover events and provide styling in the dragenter/dragleave events.

```html
<div id="paper" draggable="true" ondragstart="startDrag(event)">I'm a bit of paper</div>
<div id="trashcan" dropzone="move string:text/x-paper" ondrop="handleDrop(event)"></div>

<script>
  function startDrag(e) {
      e.dataTransfer.setData("text/x-paper", "put whatever you like in here");
  }
    
  function handleDrop(e) {
      var paper = document.querySelector("#paper")
      paper.parentElement.removeChild(paper);
  }
</script>
```
Using the dropzone attribute on an element passed to the dropzone function will automatically cancel any dragover events where the data being dragged matches the dropzone specification.  The above example will work on Internet Explorer as well despite the custom type used in the setData call.

If you don't like the dropzone attribute or prefer to use unobtrusive JavaScript :

```javascript
dropzone(document.querySelector("#trashcan"), "move s:text/x-paper");

// or....

dropzone(document.querySelector("#trashcan"), {
    operation: "copy",
    accepts: [{
        kind: "string",
        type: "text/x-paper"
    }]  
}).on("drop", handleDrop);

function handleDrop(e) {
    var paper = document.querySelector("#paper");
    paper.parentElement.removeChild(paper);
}

```

### Styling the dropzone
Whenever the user drags something that matches over the dropzone, the class <code>drag-matches</code> is added to the target.  One (of many) annoying issue(s) when using drag and drop is that if the drop target contains other child elements, [the dragleave event will fire when you go over the child](http://stackoverflow.com/questions/7110353/html5-dragleave-fired-when-hovering-a-child-element), however the <code>drag-matches</code> class is only added or removed when you enter or leave the drop target, much the same as mousenter/works. 

### Multiple dropzones
Now we can setup a 2nd dragsource and dropzone.  The 2nd dragsource is an apple, and since apples cannot go into a trashcan for paper, we need a 2nd dropzone.  This example demonstrates how dropzones can selectively accept or reject based on what is being dragged. Note that the recycle bin can accept either the paper or the apple but the paper bin can only accept the paper. 

```html
<div id="paper" draggable="true" ondragstart="startDragPaper(event)">I'm a bit of paper, drag me to the bin</div>
<div id="apple" draggable="true" ondragstart="startDragApple(event)"></div>

<div id="paperbin" dropzone="move string:text/x-paper" ondrop="handleDropPaper(event)"></div>
<div id="recyclebin" dropzone="move s:text/x-apple s:text/x-paper" ondrop="handleDropApple(event)"></div>

<script>

  function startDragPaper(e) {
    e.dataTransfer.setData("text/x-paper", "put whatever you like in here");
  }

  function startDragApple(e) {
    e.dataTransfer.setData("text/x-apple", "put whatever you like in here");
  }
        
  // drop handlers not shown
</script>
```

## Drag sources



### Using ``draggable()``

Depending on what you want to do, you don't have to use this function at all, however, if you want a customised drag image to work cross browser (read on IE) then you do need to use it.

The draggable function lets you specify nodes that can be dragged, what gets put into the data transfer, what the allowed effects are and a way to customise the drag image.  

#### Basic use

```html
<div id="draggable"></div>
<script>
    draggable(document.getElementById("draggable"))
       .setData("text/x-my-type", "Some text")
       .setData("text/html", function() { return "some <b>HTML</b> content"; })
       .effectAllowed("copyMove");
</script>
```

The above is equivalent to :

```javascript
document.getElementById("draggable").addEventListener("dragstart", function(e) {
  e.dataTransfer.setData("text/x-my-type", "Some text");
  e.dataTransfer.setData("text/html", "some <b>HTML</b> content");
  e.dataTransfer.effectAllowed = "copyMove";
});
```
The above sample will not work cross browser without this library but it will once you use it so you don't have to use draggable for the above if you don't want to.  One other thing is that the value you provide for a type can be a string value or a function that produces a string.  if it's a function, it gets called when the drag starts.

##### <code>setData</code>
Equivalent to the DataTransfer.setData function, but saves you having to implement dragstart.  The 2nd param can be a string or a function that produces a string, gets called on drag start.

##### <code>effectAllowed</code>
Equivalent to setting the DataTransfer.effectAllowed property, but saves you having to implement dragstart.  The 2nd param can be a string or a function that produces a string, gets called on drag start.

#### Customising the drag image

One of the major holes of the IE implementation is the inability to provide a custom drag image.  The spec actually allows you to use a DOM element as the custom drag image, the trick being that it has to be visible.  To provide a custom drag image use the "ghost" function.  e.g consider a multi-select list.  If the user selects more than one thing, then we need to be able to indicate in the drag that more than one thing is being dragged.  In this example we provide a custom ghost image that addes into a UL a clone of all the list items having the "selected" class.

####<code>ghost</code>

[Custom drag image demo](http://stevendwood.github.io/examples/custom-drag-image.html)

The ghost function takes as an argument either a DOM node or a function that produces a DOM node and is called at drag start.  Typically this will be used in setDragImage for browsers that support.  Using this function allows you to supply any DOM node (doesn't have to be on the page).  e.g. :


```javascript
var listItems = [].slice.call(document.querySelectorAll("li"), 0);

    listItems.forEach(function(li) {

      li.addEventListener("click", function() {
        li.classList.toggle("selected");
      });

      
      draggable(li)
        .setData("fruits", function() {
          return [].map.call(document.querySelectorAll(".fruits li.selected"), function(e) { 
            return e.innerHTML; 
          });
        })
        .ghost(function() {
          var dragImg = document.createElement("ul");
          [].forEach.call(document.querySelectorAll(".fruits li.selected"), function(li) {
            dragImg.appendChild(li.cloneNode(true));
          });

          return dragImg;
        });
      });


      document.getElementById("dropZone")
        .addEventListener("drop", function(ev) { 
          this.innerHTML = ev.dataTransfer.getData("fruits");
        });

```

This produces the following :

[Custom drag image demo](http://stevendwood.github.io/examples/multi-select.html)
