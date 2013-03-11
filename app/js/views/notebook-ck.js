define(["text!templates/notebook.html","views/note","views/page"],function(e,t,n){var r=Backbone.View.extend({el:$("#book-holder"),$el:this.el,template:_.template(e),isDragging:!1,isTurning:!1,isMouseDown:!1,lastDragEvent:0,mouseX:0,currentPage:undefined,currentPageRotation:0,initialPageRotation:"",isDoubleSpread:!1,pageWidth:480,pages:[],initialize:function(e){this.app=e.app;this.$el.on("touchstart",".recto",$.proxy(this.initTouch,this));this.$el.on("mousedown",".recto",$.proxy(this.initMouse,this));Backbone.Mediator.sub("note:randomisestyle",function(){this.getCurrentNoteView().model.setRandomStyle();Backbone.Mediator.pub("note:styleupdated",this.currentPage)},this);Backbone.Mediator.sub("notebook:mouselongclick",function(){var e=this.getCurrentNoteView();e&&e.showEditView.apply(e)},this)},render:function(){this.$el.html(this.template());this.currentPage=this.createPage(this.model.currentNote);this.$currentPage=this.currentPage.$el;this.currentPage.$el.appendTo(this.$el.children(".book"));return this},getCurrentNoteView:function(){return this.currentPage.noteRecto},getCurrentPageView:function(){return this.currentPage},createPage:function(e){var r=new n(new t({model:e}));r.$el=$("<div></div>").addClass("page");r.render();this.pages.push(r);return r},getNextPage:function(e){var t=e||this.currentPage,n=t.noteRecto.model,r=this.model.getNextNote(n),i;if(!r)return null;i=_.find(this.pages,function(e){return e.noteRecto.model.get("key")==r.get("key")||e.noteVerso&&e.noteVerso.model.get("key")==r.get("key")});i||(i=this.createPage(r));return i},getPrevPage:function(e){var t=e||this.currentPage,n=t.noteRecto.model,r=this.model.getPrevNote(n),i;if(!r)return null;i=_.find(this.pages,function(e){return e.noteRecto.model.get("key")==r.get("key")||e.noteVerso&&e.noteVerso.model.get("key")==r.get("key")});i||(i=this.createPage(r));return i},initTouch:function(e){var t=this;this.$el.off("touchstart");this.$el.off("mousedown");this.$el.on("touchstart",".recto",function(e){t.pointerStart(e)});this.$el.on("touchmove",".book",function(e){t.pointerMove(e)});this.$el.on("touchend",function(e){t.pointerEnd(e)});this.fireEvent(e)},initMouse:function(e){var t=this;this.$el.off("touchstart");this.$el.off("mousedown");this.$el.on("mousedown",".recto",function(e){t.pointerStart(e)});this.$el.on("mousemove",".book",function(e){t.pointerMove(e)});this.$el.on("mouseup",function(e){t.pointerEnd(e)});this.fireEvent(e)},fireEvent:function(e){var t=document.createEvent("HTMLEvents");t.initEvent(e.type,!1,!0);e.currentTarget.dispatchEvent(t)},pointerStart:function(e){console.log("start");var t=this.analysePointerEvent(e);t.isTouch||(this.isMouseDown=!0);this.mouseX=t.xCoord;this.mouseY=t.yCoord;this.downTime=Date.now();Backbone.Mediator.pub("notebook:mousedown")},pointerMove:function(e){console.log("move");if(this.isScrolling)return;var t=this.analysePointerEvent(e),n=Math.abs(t.xCoord-this.mouseX),r=Math.abs(t.yCoord-this.mouseY),i=.05;if(t.isTouch){if(r>i&&!this.isDragging){this.isScrolling=!0;Backbone.Mediator.pub("notebook:mousescroll")}else if(n>i){e.preventDefault();this.continueSwipeEvent(t.xCoord);Backbone.Mediator.pub("notebook:mouseswipe")}}else if(this.isMouseDown&&n>i){this.continueSwipeEvent(t.xCoord);Backbone.Mediator.pub("notebook:mouseswipe")}},pointerEnd:function(e){console.log("end");if(this.isScrolling){this.isScrolling=!1;return}var t=this.analysePointerEvent(e),n=Math.abs(t.xCoord-this.mouseX),r=.05;t.isTouch||(this.isMouseDown=!1);if(this.isDragging&&this.isTurning)this.endSwipeEvent();else{this.isDragging=!1;if(n<r){this.handleClickEvent();Backbone.Mediator.pub("notebook:mouseup")}}},analysePointerEvent:function(e){var t={};if(e.touches||e.changedTouches){t.isTouch=!0;var n=e.touches[0]||e.changedTouches[0];t.xCoord=this.normaliseXCoord(n.pageX);t.yCoord=this.normaliseYCoord(n.pageY)}else{t.isTouch=!1;t.xCoord=this.normaliseXCoord(e.pageX);t.yCoord=this.normaliseYCoord(e.pageY)}return t},normaliseXCoord:function(e){var t=this.currentPage.$el.parents(".book").offset(),n=this.currentPage.$el.parents(".book").width(),r=(e-(t.left+n/2))/(n/2);return r},normaliseYCoord:function(e){var t=this.currentPage.$el.parents(".book").offset(),n=this.currentPage.$el.parents(".book").height(),r=(e-(t.top+n/2))/(n/2);return r},isLast:function(e){var t=e||this.currentPage;return this.getNextPage()===null},isFirst:function(e){var t=e||this.currentPage;return this.getPrevPage()===null},handleClickEvent:function(e){if(!this.isTurning)if(this.mouseX<.2){this.currentPage=this.getPrevPage();this.turnBack()}else this.mouseX>.8?this.turnForward():Date.now()-this.downTime>3e3?Backbone.Mediator.pub("notebook:mouselongclick"):Backbone.Mediator.pub("notebook:mouseclick")},initiateForwardSwipeEvent:function(e){if(!this.isLast()){this.isDragging=!0;this.currentPageRotation=this.initialPageRotation=0;this.mouseX=e}},initiateBackwardSwipeEvent:function(e){if(!this.isFirst()){this.currentPage=this.getPrevPage();this.isDragging=!0;this.currentPageRotation=this.initialPageRotation=-180;this.mouseX=e}},continueSwipeEvent:function(e){var t=this,n=e<this.mouseX;this.isDragging=!0;if(!this.isTurning){if(!n){if(this.isFirst())return;this.currentPage=this.getPrevPage()}else if(this.isLast())return;this.initiatePageTurn(n);this.currentPage.css("-webkit-transition","-webkit-transform 0.2s linear")}var r=-Math.round((this.mouseX-e)*180);this.currentPageRotation+r>0?this.rotatePage(-this.currentPageRotation,function(){}):this.currentPageRotation+r<-180?this.rotatePage(-180-this.currentPageRotation,function(){}):this.rotatePage(r);this.mouseX=e;this.lastDragEvent=Date.now()},endSwipeEvent:function(){var e=this.currentPageRotation>-90?this.currentPageRotation*-1:-180-this.currentPageRotation,t=this.initialPageRotation===0,n=this;this.rotatePage(e,function(){n.concludePageTurn(t)});this.isDragging=!1},getAdjacentPages:function(e,t){var n=_.isArray(e)?e:this.currentPage,r=_.isBoolean(e)?e:_.isUndefined(t)?!0:t,i=r?this.getNextPage(n):this.getPrevPage(n),s=r?this.getPrevPage(n):this.getNextPage(n);return[i,s]},turnForward:function(){this.initialPageRotation=this.currentPageRotation=0;this.turnPage(!0)},turnBack:function(){this.initialPageRotation=this.currentPageRotation=-180;this.turnPage(!1)},initiatePageTurn:function(e){var t=this.getAdjacentPages(e),n=t[0],r=t[1];Backbone.Mediator.pub("notebook:pageturnstart");this.isTurning=!0;this.currentPage.sideCss("box-shadow","10px 0 5px rgba(0, 0, 0, 0.3)","recto");this.currentPage.sideCss("box-shadow","-10px 0 5px rgba(0, 0, 0, 0.3)","verso");if(e)this.currentPageRotation=this.initialPageRotation=0;else if(!this.isDoubleSpread){this.currentPageRotation=-91;this.initialPageRotation=-180}else this.currentPageRotation=this.initialPageRotation=-180;n&&n.$el.remove().insertBefore(this.currentPage.$el).show();r&&r.$el.remove().insertBefore(this.currentPage.$el).show()},concludePageTurn:function(e){var t=this.getAdjacentPages(e),n=t[0],r=t[1];this.currentPage.css("-webkit-transition","-webkit-transform 0.5s ease-in-out");this.currentPage.sideCss("box-shadow","");if(this.initialPageRotation===this.currentPageRotation)n.length&&n.$el.remove().appendTo("#page-store");else{r&&r.$el.remove().appendTo("#page-store");n&&(e?this.currentPage.$el.remove().insertBefore(n.$el):this.currentPage.$el.remove().insertAfter(n.$el));e&&(this.currentPage=n)}this.isTurning=!1;this.currentPageRotation=0;this.initialPageRotation="";Backbone.Mediator.pub("notebook:pageturnend");Backbone.Mediator.pub("noteselected",this.currentPage)},turnPage:function(e){var t=this;this.initiatePageTurn(e);this.rotatePage(e?-180:180+this.currentPageRotation,function(){t.concludePageTurn(e)})},rotatePage:function(e,t){var n=this;if(e===0)t&&t.call();else{this.currentPageRotation=this.currentPageRotation+e;t&&this.currentPage.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",function(){n.currentPage.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");t.call()});this.currentPage.css("-webkit-transform","rotateY("+this.currentPageRotation+"deg)")}}});return r});