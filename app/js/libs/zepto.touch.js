;(function($){

    var touch = {},
        gesture = {},
        isMouseDown,
        isScrolling,
        isDragging,
        lastDragEvent,
        longClickTimerId;

    // bind events depending on whether this is a touch device
    $(document).ready(function() {
        if (!!('ontouchstart' in window)) {
            initTouch();
        } else {
            initMouse();
        }
        if ($.os && $.os.ios) {
            initPinch();
        }
        $(window).on('scroll', cancelAll);
    });

    function initTouch() {
        $(window)
            .on('touchstart', function(e) { pointerStart(e); })
            .on('touchmove', function(e) { pointerMove(e); })
            .on('touchend', function(e) { pointerEnd(e); })
            .on('touchcancel', function(e) { cancelAll(); });
    }

    function initMouse() {
        $(window)
            .on('mousedown', function(e) { pointerStart(e); })
            .on('mousemove', function(e) { pointerMove(e); })
            .on('mouseup', function(e) { pointerEnd(e); });
    }

    function cancelAll() {
        isMouseDown = isScrolling = isDragging = false;
        lastDragEvent = longClickTimerId = null;
        touch = {};
        endLongClickTimer();
    }

    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode;
    }

    function pointerStart(e) {
        var a;
        console.log('Pointer start!');
        if (e.touches && e.touches.length > 1) {
            endLongClickTimer();
            return;
        }
        a = analysePointerEvent(e);
        if (!a.isTouch) {
            isMouseDown = true;
        }
        touch.mouseX = a.xCoord;
        touch.mouseY = a.yCoord;
        touch.$el = $(parentIfText(e.touches ? e.touches[0].target : e.target));

        longClickTimerId = window.setTimeout(handleLongClickEvent, 500);

        // Backbone.Mediator.pub('notebook:mousedown');
    }

    function pointerMove(e) {
        var a,
            xDistance,
            yDistance,
            // minimum x movement in % of page width to count as a swipe
            minDistance = 0.05;
        if (isScrolling || (e.touches && e.touches.length > 1)) {
            return;
        }
        a = analysePointerEvent(e);
        xDistance = Math.abs(a.xCoord - touch.mouseX);
        yDistance = Math.abs(a.yCoord - touch.mouseY);
        if (a.isTouch) {
            if (yDistance > minDistance && !isDragging) {
                isScrolling = true;
                endLongClickTimer();
            } else if (xDistance > minDistance) {
                e.preventDefault();
                endLongClickTimer();
                // isDragging = true;
                continueDragEvent(a.xCoord);
            }
        } else {
            if (isMouseDown && xDistance > minDistance) {
                endLongClickTimer();
                continueDragEvent(a.xCoord);
            }
        }
    }

    function continueDragEvent(xCoord) {
        touch.swipeDirection = xCoord < touch.mouseX ? 'left' : 'right';

        // initiate the drag
        if (!isDragging) {
            isDragging = true;

            touch.$el.trigger('heft:dragstart', {xCoord: touch.mouseX, direction: touch.swipeDirection});
            
            // //#
            // this.initiatePageSwipe(isFwd);
        } else {
            var diff = xCoord - touch.mouseX;
            touch.mouseX = xCoord;
            lastDragEvent = Date.now();

            touch.$el.trigger('heft:dragcontinue', {xCoord: touch.mouseX, diff: diff, direction: touch.swipeDirection});

            // //#
            // this.swipePageIncremental(xCoord < this.mouseX, diff);
        }
    }

    function pointerEnd(e) {
        if (isScrolling) {
            isScrolling = false;
            return;
        }
        endLongClickTimer();
        var a = analysePointerEvent(e),
            distance = Math.abs(a.xCoord - touch.mouseX),
            // minimum x movement in % of page width to count as a swipe
            minDistance = 0.05;
        touch.mouseX = a.xCoord;
        if (!a.isTouch) {
            isMouseDown = false;
        }
        if (isDragging) {
            touch.$el.trigger('heft:dragend', {xCoord: touch.mouseX, direction: touch.swipeDirection});
        } else {
            if (distance < minDistance) {
                touch.$el.trigger('heft:tap', { xCoord: touch.mouseX });
            }
        }
        cancelAll();
    }

    // returns an object with xCoord and isTouch
    function analysePointerEvent(e) {
        var analysed = {};
        if (e.touches || e.changedTouches) {
            analysed.isTouch = true;
            var touch = e.touches[0] || e.changedTouches[0];
            analysed.xCoord = touch.pageX / $(window).width();
            analysed.yCoord = touch.pageY / $(window).height();
        } else {
            analysed.isTouch = false;
            _.extend(analysed, normaliseCoords(e));
        }
        return analysed;
    }

    // hmmm.... is this the element that's bound to the event?
    // let's hope so
    function normaliseCoords(e) {
        var $book = $(e.target).parents('.book'),
            offset,
            width,
            height,
            normalisedX,
            normalisedY;
        if ($book.length === 0) {
            return {};
        }
        width = $book.width();
        offset = $book.offset();
        height = $book.height();
        normalisedX = (e.pageX - (offset.left + width / 2)) /  (width / 2);
        normalisedY = (e.pageY - (offset.top + height / 2)) /  (height / 2);
        return {'xCoord': normalisedX, 'yCoord': normalisedY};
    }

    function endLongClickTimer() {
        if (longClickTimerId) {
            window.clearTimeout(longClickTimerId);
            longClickTimerId = undefined;
        }
    }

    function handleLongClickEvent() {
        isMouseDown = false;
        touch.$el.trigger('heft:longtap', { xCoord: touch.mouseX });

        //#
        Backbone.Mediator.pub('notebook:mouselongclick');
    }

    function initPinch() {
        $(document).bind('gesturestart', function(e) {
          var now = Date.now(), delta = now - (gesture.last || now);
          gesture.target = parentIfText(e.target);
          $(gesture.target).trigger('heft:pinchstart');
          gesture.e1 = e.scale;
          gesture.last = now;
        }).bind('gesturechange', function(e){
          gesture.e2 = e.scale;
          if (Math.abs(gesture.e1 - gesture.e2) > 0.05) {
            $(gesture.target).trigger('heft:pinchchange', { 'distance': gesture.e1 - gesture.e2 });
          }
        }).bind('gestureend', function(e){
          if (gesture.e2 > 0) {
            if (Math.abs(gesture.e1 - gesture.e2) !== 0) {
                $(gesture.target).trigger('heft:pinch');
                $(gesture.target).trigger('heft:pinch' + (gesture.e1 - gesture.e2 > 0 ? 'in' : 'out'));
            }
            gesture.e1 = gesture.e2 = gesture.last = 0;
            $(gesture.target).trigger('heft:pinchend');
          } else if ('last' in gesture) {
            gesture = {};
          }
        });
    }

})(Zepto);


  // if ($.os.ios) {
  //   var gesture = {} gestureTimeout

  //   function parentIfText(node){
  //     return 'tagName' in node ? node : node.parentNode
  //   }

  //   $(document).bind('gesturestart', function(e){
  //     var now = Date.now(), delta = now - (gesture.last || now)
  //     gesture.target = parentIfText(e.target)
  //     gestureTimeout && clearTimeout(gestureTimeout)
  //     gesture.e1 = e.scale
  //     gesture.last = now
  //   }).bind('gesturechange', function(e){
  //     gesture.e2 = e.scale
  //   }).bind('gestureend', function(e){
  //     if (gesture.e2 > 0) {
  //       Math.abs(gesture.e1 - gesture.e2) != 0 && $(gesture.target).trigger('pinch') &&
  //         $(gesture.target).trigger('pinch' + (gesture.e1 - gesture.e2 > 0 ? 'In' : 'Out'))
  //       gesture.e1 = gesture.e2 = gesture.last = 0
  //     } else if ('last' in gesture) {
  //       gesture = {}
  //     }
  //   })

  //   ;['pinch', 'pinchIn', 'pinchOut'].forEach(function(m){
  //     $.fn[m] = function(callback){ return this.bind(m, callback) }
  //   })
  // }
