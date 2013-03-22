define(['text!templates/notebook.html', 'views/note', 'views/page'],

    function(template, NoteView, PageView) {


        var NotebookView = Backbone.View.extend({

            el          : $('#book-holder'),

            $el         : this.el,

            template    : _.template(template),

            // has there been movement since the mousedown/touchstart event?
            isDragging : false,

            // are we in the middle of turning a page?
            isTurning : false,

            isMouseDown : false,

            // measure time between drag events, to improve smoothness
            lastDragEvent : 0,

            // x-coord of mouse/touch clicks/taps/movements
            mouseX: 0,

            // the PageView object that's currently turning
            currentPage: undefined,

            // degrees of turn of the current page
            currentPageRotation : 0,

            // degrees the current page started out with (0|-180)
            initialPageRotation : '',

            // are we showing two pages or one
            isDoubleSpread: false,

            pageWidth : 480,

            pages : [],

            initialize  : function(conf) {
                this.app = conf.app;

                // bind events depending on whether this is a touch device
                if (!!('ontouchstart' in window)) {
                    this.initTouch();
                } else {
                    this.initMouse();
                }

                Backbone.Mediator.sub('note:predestroy', function(nv) {
                    this.removePage.apply(this, [nv]);
                }, this);
                Backbone.Mediator.sub('note:randomisestyle', function() {
                    if (this.getCurrentNoteView().model.get('stylable')) {
                        var $noteEl = this.getCurrentNoteView().$el;
                        $noteEl.css('-webkit-transition', '-webkit-transform .4s ease-out');
                        $noteEl.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
                            $noteEl.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                            $noteEl.css('-webkit-transition', '');
                            $noteEl.css('-webkit-transform', '');
                        });
                        $noteEl.css('-webkit-transform', 'rotateZ(360deg)');
                        this.getCurrentNoteView().model.setRandomStyle();
                        Backbone.Mediator.pub('note:styleupdated', this.currentPage);
                    }
                }, this);
                Backbone.Mediator.sub('notebook:mouselongclick', function() {
                    var nv = this.getCurrentNoteView();
                    if (nv) {
                        nv.showEditView.apply(nv, [true]);
                    }
                }, this);
            },

            render      : function() {
                var pages,
                    nextPage,
                    prevPage;

                this.$el.html(this.template());

                this.currentPage = this.createPage(this.model.currentNote);
                this.$currentPage = this.currentPage.$el;
                this.currentPage.$el.appendTo(this.$el.children('.book'));

                pages = this.getAdjacentPages();
                nextPage = pages[0];
                prevPage = pages[1];

                // make sure next page is visible and immediately below current page
                if (nextPage) {
                    nextPage.$el.remove().insertBefore(this.currentPage.$el).show();
                }
                if (prevPage) {
                    prevPage.$el.remove().addClass('offscreen').insertAfter(this.currentPage.$el).show();
                }

                return this;
            },

            getCurrentNoteView  : function() {
                return this.currentPage.noteRecto;
            },

            getCurrentPageView  : function() {
                return this.currentPage;
            },

            // this is called before the note is destroyed
            // it handles turning to another page
            removePage  : function(noteView) {
                this.pagePendingDestruction = _.find(this.pages, function(p) {
                    return p.getNote() == noteView;
                });
                this.pages = _.reject(this.pages, function(p) {
                   return p == this.pagePendingDestruction;
                });
                if (this.pagePendingDestruction == this.currentPage) {
                    if (this.isFirst()) {
                        this.swipePage(true);
                    } else {
                        // this.currentPage = this.getPrevPage();
                        this.swipePage(false);
                    }
                }
            },

            // TODO - add verso
            createPage  : function(note) {
                var page = new PageView(new NoteView({model: note}));
                page.$el = $('<div></div>').addClass('page').addClass(note.cid);
                page.render();
                this.pages.push(page);
                return page;
            },

            // TODO - verso
            getNextPage : function(p) {
                var page = p || this.currentPage,
                    note = page.noteRecto.model,
                    nextNote = this.model.getNextNote(note),
                    nextPage;
                if (!nextNote) {
                    return null;
                } else {
                    nextPage = _.find(this.pages, function(p) {
                        return p.noteRecto.model == nextNote ||
                                (p.noteVerso && p.noteVerso.model == nextNote);
                    });
                    if (!nextPage) {
                        nextPage = this.createPage(nextNote);
                    }
                    return nextPage;
                }
            },

            // TODO - verso
            getPrevPage : function(p) {
                var page = p || this.currentPage,
                    note = page.noteRecto.model,
                    prevNote = this.model.getPrevNote(note),
                    prevPage;
                if (!prevNote) {
                    return null;
                } else {
                    prevPage = _.find(this.pages, function(p) {
                        return p.noteRecto.model == prevNote ||
                                (p.noteVerso && p.noteVerso.model == prevNote);
                    });
                    if (!prevPage) {
                        prevPage = this.createPage(prevNote);
                    }
                    return prevPage;
                }
            },

            // TODO
            isLast      : function(p) {
                var page = p || this.currentPage,
                    note = page.model;
                return this.model.isLastNote(note);
                // return this.getNextPage(page) === null;
            },

            // TODO
            isFirst      : function(p) {
                var page = p || this.currentPage,
                    note = page.model;
                return this.model.isFirstNote(note);
            },

            // TODO - verso
            getAdjacentPages            : function(arg1, arg2) {
                var page = _.isArray(arg1) ? arg1 : this.currentPage,
                    isFwd = _.isBoolean(arg1) ? arg1 : (_.isUndefined(arg2) ? true : arg2),
                    nextPage = isFwd ? this.getNextPage(page) : this.getPrevPage(page),
                    prevPage = isFwd ? this.getPrevPage(page) : this.getNextPage(page);
                return [nextPage, prevPage];
            },

            /* Page turning stuff */

            initiatePageSwipe   : function(isFwd) {
                if (!isFwd && this.isFirst()) {
                    this.isDragging = false;
                    return;
                }
                this.movingPage = isFwd ? this.currentPage : this.getPrevPage();
                Backbone.Mediator.pub('notebook:pageturnstart');
            },

            swipePageIncremental    : function(isFwd, diff) {
                var transition = this.movingPage.$el.css('-webkit-transition');
                this.movingPage.$el.css('-webkit-transition', '');
                this.incrementalDiff = this.incrementalDiff ? this.incrementalDiff + diff : diff;
                if (this.movingPage == this.currentPage) {
                    this.movingPage.$el.css('-webkit-transform', 'translateX('+Math.round(this.incrementalDiff * 50)+'%)');
                } else {
                    this.movingPage.$el.css('-webkit-transform', 'translateX('+(-50 + Math.round(this.incrementalDiff * 50))+'%)');
                }
                this.movingPage.$el.css('-webkit-transition', transition);
            },

            swipePage   : function(isFwd) {
                var context = this;

                if (!isFwd && this.isFirst()) {
                    return;
                }

                this.movingPage = isFwd ? this.currentPage : this.getPrevPage();

                this.initiatePageSwipe(isFwd);

                this.movingPage.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
                    context.movingPage.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                    context.concludePageSwipe(isFwd);
                });
                this.movingPage.$el.toggleClass('offscreen');
            },

            concludeIncrementalPageSwipe    : function(isFwd) {
                var context = this;
                this.movingPage.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
                    context.movingPage.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                    context.concludePageSwipe();
                });
                if (isFwd && this.movingPage == this.currentPage) {
                    this.movingPage.$el.css('-webkit-transform', 'translateX(-50%)');
                } else if (isFwd) {
                    this.movingPage.$el.css('-webkit-transform', 'translateX(-50%)');
                } else if (this.movingPage == this.currentPage) {
                    this.movingPage.$el.css('-webkit-transform', 'translateX(0%)');
                } else {
                    this.movingPage.$el.css('-webkit-transform', 'translateX(0%)');
                }
            },

            concludePageSwipe   : function(isFwd) {
                var pages = this.getAdjacentPages(this.movingPage),
                    nextPage = pages[0],
                    prevPage = pages[1],
                    oldCurrentPage = this.currentPage;

                this.incrementalDiff = 0;

                // possibilities:
                // 1. we moved forward: movingPage = currentPage; movingPage.positionX < 0
                // 2. we moved backward: movingPage != currentPage; movingPage.positionX == 0
                // 3. we started moving forward, changed our mind: movingPage = currentPage; movingPage.positionX == 0
                // 4. we started moving backward, changed our mind: movingPage != currentPage; movingPage.positionX < 0
                // 1 || 2 : rearrange pages; 3 || 4 : do nothing 
                var movingPageX = this.movingPage.$el.position().left;

                if (this.movingPage == this.currentPage && movingPageX === 0 ||
                        this.movingPage != this.currentPage && movingPageX < 0) {
                    // we moved a page then put it back again
                    this.movingPage.$el.css('-webkit-transform', '');
                    this.movingPage.$el.css('-webkit-transition', '');
                } else {
                    // we've turned a page

                    // once we've turned the page, the note is no longer stylable
                    if (this.currentPage.getNote().model.get('stylable')) {
                        this.currentPage.getNote().model.set('stylable', false);
                        this.currentPage.getNote().model.save();
                    }

                    if (this.movingPage == this.currentPage) {
                        // we moved forward
                        // make sure the movingPage has the right style & class
                        this.movingPage.$el.css('-webkit-transition', 'none');
                        this.movingPage.$el.css('-webkit-transform', '');
                        this.movingPage.$el.addClass('offscreen');
                        this.movingPage.$el.css('-webkit-transition', '');

                        if (prevPage) {
                            prevPage.$el.remove().appendTo('#page-store');
                        }
                        this.currentPage = nextPage;

                        nextPage = this.getNextPage();
                        nextPage.$el.remove().insertBefore(this.currentPage.$el);
                    } else {
                        // we moved back

                        // move old prevPage to page-store
                        if (nextPage && nextPage != this.movingPage) {
                            nextPage.$el.remove().appendTo('#page-store');
                        }

                        // set currentPage to movingPage (i.e. prev page)
                        this.currentPage = this.movingPage;
                        this.movingPage.$el.css('-webkit-transition', 'none');
                        this.movingPage.$el.css('-webkit-transform', '');
                        this.movingPage.$el.removeClass('offscreen');
                        this.movingPage.$el.css('-webkit-transition', '');

                        prevPage = this.getPrevPage();
                        if (prevPage) {
                            prevPage.$el.remove().addClass('offscreen').insertAfter(this.currentPage.$el);
                        }
                    }

                    if (this.currentPage.$el.find('textarea').length > 0) {
                        this.currentPage.$el.find('textarea').focus();
                    }

                    if (this.pagePendingDestruction) {
                        this.pagePendingDestruction.$el.remove();
                        this.pagePendingDestruction = null;
                    }
                    Backbone.Mediator.pub('notebook:pageturnend');
                    Backbone.Mediator.pub('notedeselected', oldCurrentPage);
                    Backbone.Mediator.pub('noteselected', this.currentPage);
                }
            },

            /* Tap/Mouse event stuff */

            initTouch   : function() {
                var that = this;
                this.$el.off('touchstart');
                this.$el.off('mousedown');
                this.$el.on('touchstart', '.recto', function(e) { that.pointerStart(e); });
                this.$el.on('touchmove', '.book', function(e) { that.pointerMove(e); });
                this.$el.on('touchend', function(e) { that.pointerEnd(e); });
            },

            initMouse   : function() {
                var that = this;
                this.$el.off('touchstart');
                this.$el.off('mousedown');
                this.$el.on('mousedown', '.recto', function(e) { that.pointerStart(e); });
                this.$el.on('mousemove', '.book', function(e) { that.pointerMove(e); });
                this.$el.on('mouseup', function(e) { that.pointerEnd(e); });
                // this.$el.on('mouseout', function(e) { that.pointerEnd(e); });
            },

            pointerStart    : function(e) {
                var a = this.analysePointerEvent(e),
                    that = this;
                if (!a.isTouch) {
                    this.isMouseDown = true;
                }
                this.mouseX = a.xCoord;
                this.mouseY = a.yCoord;

                this.longClickTimerId = window.setTimeout(that.handleLongClickEvent, 500);

                Backbone.Mediator.pub('notebook:mousedown');
                // this.initiateSwipeEvent(a.xCoord);
            },

            pointerMove     : function(e) {
                if (this.isScrolling) {
                    return;
                }
                var a = this.analysePointerEvent(e),
                    xDistance = Math.abs(a.xCoord - this.mouseX),
                    yDistance = Math.abs(a.yCoord - this.mouseY),
                    // minimum x movement in % of page width to count as a swipe
                    minDistance = 0.05;
                if (a.isTouch) {
                    if (yDistance > minDistance && !this.isDragging) {
                        this.isScrolling = true;
                        this.endLongClickTimer();
                        Backbone.Mediator.pub('notebook:mousescroll');
                    } else if (xDistance > minDistance) {
                        e.preventDefault();
                        this.continueSwipeEvent(a.xCoord);
                        this.endLongClickTimer();
                        Backbone.Mediator.pub('notebook:mouseswipe');
                    }
                } else {
                    if (this.isMouseDown && xDistance > minDistance) {
                        this.continueSwipeEvent(a.xCoord);
                        this.endLongClickTimer();
                        Backbone.Mediator.pub('notebook:mouseswipe');
                    }
                }
            },

            pointerEnd      : function(e) {
                if (this.isScrolling) {
                    this.isScrolling = false;
                    return;
                }
                this.endLongClickTimer();
                var a = this.analysePointerEvent(e),
                    distance = Math.abs(a.xCoord - this.mouseX),
                    // minimum x movement in % of page width to count as a swipe
                    minDistance = 0.05;
                if (!a.isTouch) {
                    this.isMouseDown = false;
                }
                if (this.isDragging) {
                    this.endSwipeEvent(a.xCoord);
                    this.isDragging = false;
                } else {
                    if (distance < minDistance) {
                        this.handleClickEvent();
                        Backbone.Mediator.pub('notebook:mouseup');
                    }
                }
            },

            // returns an object with xCoord and isTouch
            analysePointerEvent : function(e) {
                var analysed = {};
                if (e.touches || e.changedTouches) {
                    analysed.isTouch = true;
                    var touch = e.touches[0] || e.changedTouches[0];
                    // analysed.xCoord = this.normaliseXCoord(touch.pageX);
                    // analysed.yCoord = this.normaliseYCoord(touch.pageY);
                    analysed.xCoord = touch.pageX / $(window).width();
                    analysed.yCoord = touch.pageY / $(window).height();
                } else {
                    analysed.isTouch = false;
                    analysed.xCoord = this.normaliseXCoord(e.pageX);
                    analysed.yCoord = this.normaliseYCoord(e.pageY);
                }
                return analysed;
            },

            // TODO - verso
            normaliseXCoord : function(xCoord) {
                var offset = this.currentPage.$el.parents('.book').offset(),
                    width = this.currentPage.$el.parents('.book').width(),
                    normalised = (xCoord - (offset.left + width / 2)) /  (width / 2);
                return normalised;
            },

            normaliseYCoord : function(yCoord) {
                var offset = this.currentPage.$el.parents('.book').offset(),
                    height = this.currentPage.$el.parents('.book').height(),
                    normalised = (yCoord - (offset.top + height / 2)) /  (height / 2);
                return normalised;
            },

            handleClickEvent    : function(e) {
                if (!this.isTurning) {
                    // TODO page references out of this code
                    if (this.mouseX < 0.2/* && !this.isFirst()*/) {
                        // this.currentPage = this.getPrevPage();
                        this.swipePage(false);
                    } else if (this.mouseX > 0.8) {
                        this.swipePage(true);
                    } else {
                        Backbone.Mediator.pub('notebook:mouseclick');
                    }
                }
            },

            endLongClickTimer   : function() {
                if (this.longClickTimerId) {
                    window.clearTimeout(this.longClickTimerId);
                    this.longClickTimerId = undefined;
                }
            },

            handleLongClickEvent    : function() {
                this.isMouseDown = false;
                Backbone.Mediator.pub('notebook:mouselongclick');
            },

            continueSwipeEvent          : function(xCoord) {
                var isFwd;

                // initiate the drag
                if (!this.isDragging) {
                    isFwd = xCoord < this.mouseX;
                    this.isDragging = true;
                    this.initiatePageSwipe(isFwd);
                } else {
                    var diff = xCoord - this.mouseX;
                    this.swipePageIncremental(xCoord < this.mouseX, diff);
                    this.isSwipeForward = xCoord < this.mouseX;

                    this.mouseX = xCoord;
                    this.lastDragEvent = Date.now();
                }
            },

            endSwipeEvent               : function(xCoord) {
                this.concludeIncrementalPageSwipe(this.isSwipeForward);
                this.mouseX = 0;
                // var degrees = this.currentPageRotation > -90 ? (this.currentPageRotation * -1) : (-180 - this.currentPageRotation),
                //     isFwd = this.initialPageRotation === 0,
                //     that = this;
                // // this.rotatePage(degrees, function() {
                // //     that.concludePageTurn(isFwd);
                // // });
                this.isDragging = false;
            }

        });

        return NotebookView;
    }
);