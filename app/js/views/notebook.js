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
                    this.getCurrentNoteView().model.setRandomStyle();
                    Backbone.Mediator.pub('note:styleupdated', this.currentPage);
                }, this);
                Backbone.Mediator.sub('notebook:mouselongclick', function() {
                    var nv = this.getCurrentNoteView();
                    if (nv) {
                        nv.showEditView.apply(nv);
                    }
                }, this);
            },

            render      : function() {
                this.$el.html(this.template());
                this.currentPage = this.createPage(this.model.currentNote);
                this.$currentPage = this.currentPage.$el;
                this.currentPage.$el.appendTo(this.$el.children('.book'));
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
                        this.turnForward();
                    } else {
                        this.currentPage = this.getPrevPage();
                        this.turnBack();
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

            turnForward                 : function() {
                this.initialPageRotation = this.currentPageRotation = 0;
                this.turnPage(true);
            },

            turnBack                    : function() {
                this.initialPageRotation = this.currentPageRotation = -180;
                this.turnPage(false);
            },

            initiatePageTurn            : function(isFwd) {
                var pages = this.getAdjacentPages(isFwd),
                    nextPage = pages[0],
                    prevPage = pages[1];

                Backbone.Mediator.pub('notebook:pageturnstart');

                this.isTurning = true;

                this.currentPage.sideCss('box-shadow', '10px 0 5px rgba(0, 0, 0, 0.3)', 'recto');
                this.currentPage.sideCss('box-shadow', '-10px 0 5px rgba(0, 0, 0, 0.3)', 'verso');

                if (isFwd) {
                    this.currentPageRotation = this.initialPageRotation = 0;
                } else if (!this.isDoubleSpread) {
                    this.currentPageRotation = -91;
                    this.initialPageRotation = -180;
                } else {
                    this.currentPageRotation = this.initialPageRotation = -180;
                }

                // make sure next page is visible and immediately below current page
                if (nextPage) {
                    nextPage.$el.remove().insertBefore(this.currentPage.$el).show();
                }
                if (prevPage) {
                    prevPage.$el.remove().insertBefore(this.currentPage.$el).show();
                }
            },

            concludePageTurn            : function(isFwd) {
                var pages = this.getAdjacentPages(isFwd),
                    nextPage = pages[0],
                    prevPage = pages[1],
                    oldCurrentPage;
                this.currentPage.css('-webkit-transition', '-webkit-transform 0.5s ease-in-out'); // TODO
                this.currentPage.sideCss('box-shadow', '');
                if (this.initialPageRotation === this.currentPageRotation) {
                    // put the next page back into the page store
                    if (nextPage && nextPage.length) {
                        nextPage.$el.remove().appendTo('#page-store');
                    }
                } else {

                    oldCurrentPage = isFwd ? this.currentPage : prevPage;

                    // once we've turned the page, the note is no longer stylable
                    oldCurrentPage.getNote().model.set('stylable', false);
                    oldCurrentPage.getNote().model.save();

                    // move nextPage to front, previous previous page to page-store
                    if (prevPage) {
                        prevPage.$el.remove().appendTo('#page-store');
                    }
                    if (nextPage) {
                        if (isFwd) {
                            this.currentPage.$el.remove().insertBefore(nextPage.$el);
                        } else {
                            nextPage.$el.remove().insertAfter(this.currentPage.$el);
                        }
                    }
                    // if we just turned back, the currentPage stays the same
                    // if we turned forward, increment it
                    if (isFwd) {
                        this.currentPage = nextPage;
                    }

                    if (this.currentPage.$el.find('textarea').length > 0) {
                        this.currentPage.$el.find('textarea').focus();
                    }
                }
                this.isTurning = false;
                this.currentPageRotation = 0;
                this.initialPageRotation = '';
                if (this.pagePendingDestruction) {
                    this.pagePendingDestruction.$el.remove();
                    this.pagePendingDestruction = null;
                }
                Backbone.Mediator.pub('notebook:pageturnend');
                Backbone.Mediator.pub('notedeselected', oldCurrentPage);
                Backbone.Mediator.pub('noteselected', this.currentPage);
            },

            turnPage                    : function(isFwd) {
                var that = this;
                this.initiatePageTurn(isFwd);
                this.rotatePage(isFwd ? -180 : (180 + this.currentPageRotation), function() {
                    that.concludePageTurn(isFwd);
                });
            },

            rotatePage                  : function(degrees, callback) {
                var that = this;
                if (degrees === 0) {
                    if (callback) {
                        callback.call();
                    }
                } else {
                    this.currentPageRotation = this.currentPageRotation + degrees;
                    if (callback) {
                        this.currentPage.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
                            that.currentPage.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                            callback.call();
                        });
                    }
                    this.currentPage.css('-webkit-transform', 'rotateY('+this.currentPageRotation+'deg)');
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

                this.longClickTimerId = window.setTimeout(that.handleLongClickEvent, 1000);

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
                if (this.isDragging && this.isTurning) {
                    this.endSwipeEvent();
                } else {
                    this.isDragging = false; // is this line necessary?
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
                    analysed.xCoord = this.normaliseXCoord(touch.pageX);
                    analysed.yCoord = this.normaliseYCoord(touch.pageY);
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
                    if (this.mouseX < 0.2 && !this.isFirst()) {
                        this.currentPage = this.getPrevPage();
                        this.turnBack();
                    } else if (this.mouseX > 0.8) {
                        this.turnForward();
                    } else {
                        Backbone.Mediator.pub('notebook:mouseclick');
                    }
                    // if ((this.mouseX < this.pageWidth / 2) && !this.isFirst(this.$currentPage)) {
                    //     // this is weird, but...
                    //     // when paging back from the end of the book, the order of divs gets reversed
                    //     // so just check that...
                    //     this.$currentPage = this.$currentPage.prev().length === 0 ? this.$currentPage.next() : this.$currentPage.prev();
                    //     this.turnBack();
                    // } else if (!this.isLast(this.$currentPage)) {
                        // this.turnForward();
                    // }
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

            // initiateSwipeEvent  : function(xCoord) {
            //     this.mouseX = xCoord;
            // },

            initiateForwardSwipeEvent   : function(xCoord) {
                if (!this.isLast()) {
                    this.isDragging = true;
                    this.currentPageRotation = this.initialPageRotation = 0;
                    this.mouseX = xCoord;
                }
            },

            initiateBackwardSwipeEvent  : function(xCoord) {
                if (!this.isFirst()) {
                    this.currentPage = this.getPrevPage();
                    this.isDragging = true;
                    this.currentPageRotation = this.initialPageRotation = -180;
                    this.mouseX = xCoord;
                }
            },

            continueSwipeEvent          : function(xCoord) {
                var that = this,
                    isFwd = xCoord < this.mouseX;
                // if (!this.isDragging) {
                //     return;
                // }
                this.isDragging = true;
                if (!this.isTurning) {
                    if (!isFwd) {
                        if (this.isFirst()) {
                            return;
                        }
                        this.currentPage = this.getPrevPage();
                    } else {
                        if (this.isLast()) {
                            return;
                        }
                    }
                    this.initiatePageTurn(isFwd);
                    this.currentPage.css('-webkit-transition', '-webkit-transform 0.2s linear'); // TODO
                }
                var rotationInc = -(Math.round((this.mouseX - xCoord) * 180));
                // console.log(rotationInc);
                if (this.currentPageRotation + rotationInc > 0) {
                    this.rotatePage(-this.currentPageRotation, function() {
                        // that.concludePageTurn(false);
                    });
                } else if (this.currentPageRotation + rotationInc < -180) {
                    this.rotatePage((-180 - this.currentPageRotation), function() {
                        // that.concludePageTurn(isFwd);
                    });
                } else {
                    this.rotatePage(rotationInc);
                }
                this.mouseX = xCoord;
                this.lastDragEvent = Date.now();
            },

            endSwipeEvent               : function() {
                var degrees = this.currentPageRotation > -90 ? (this.currentPageRotation * -1) : (-180 - this.currentPageRotation),
                    isFwd = this.initialPageRotation === 0,
                    that = this;
                this.rotatePage(degrees, function() {
                    that.concludePageTurn(isFwd);
                });
                this.isDragging = false;
            }

        });

        return NotebookView;
    }
);