define(['text!templates/notebook.html', 'views/note', 'views/page'],

    function(template, NoteView, PageView) {


        var NotebookView = Backbone.View.extend({

            el          : $('#book-holder'),

            $el         : this.el,

            template    : _.template(template),

            pages : [],

            // the PageView object that's currently turning
            currentPage : undefined,

            // are we looking at a 4x4 overview?
            isMultipage : false,

            multipages  : [],

            currentMultipage    : undefined,

            initialize  : function(conf) {
                this.app = conf.app;

                Backbone.Mediator.sub('note:predestroy', function(nv) {
                    this.removePage.apply(this, [nv]);
                }, this);

                Backbone.Mediator.sub('note:randomisestyle', function() {
                    var nv = this.getCurrentNoteView(),
                        p = this.currentPage;
                    if (nv.model.get('stylable')) {
                        p.setTransition('-webkit-transform .4s ease-out');
                        p.setTransform('rotateZ(360deg)', function() {
                            var p = this;
                            this.setTransition('none');
                            this.clearTransform();
                            // ahem
                            setTimeout(p.clearTransition, 500);
                        }, p);
                        nv.model.setRandomStyle();
                        Backbone.Mediator.pub('note:styleupdated', this.currentPage);
                    }
                }, this);

                Backbone.Mediator.sub('note:selected', function() {
                    var context = this;
                    _.delay(function() {
                        context.renderCurrent16Block.apply(context);
                    }, 500);
                }, this);


                var context = this;

                this.$el.on('heft:tap', $.proxy(function(e) {
                    if (!context.multipage) {
                        if (e.data.xCoord < 0.2) {
                            context.swipePage(false);
                        } else if (e.data.xCoord > 0.8) {
                            context.swipePage(true);
                        }
                    }
                }, context));
                this.$el.on('heft:dragstart', $.proxy(function(e) {
                    if (!context.multipage) {
                        context.initiatePageSwipe(e.data.direction == 'left');
                    }
                }, context));
                this.$el.on('heft:dragcontinue', $.proxy(function(e) {
                    if (!context.multipage) {
                        context.swipePageIncremental(e.data.direction == 'left', e.data.diff);
                    }
                }, context));
                this.$el.on('heft:dragend', $.proxy(function(e) {
                    if (!context.multipage) {
                        context.concludeIncrementalPageSwipe(e.data.direction == 'left');
                    }
                }, context));
                this.$el.on('heft:longtap', $.proxy(function() {
                    if (!context.multipage) {
                        var nv = context.getCurrentNoteView();
                        if (nv) {
                            nv.showEditView.apply(nv, [true]);
                        }
                    }
                }, context));

                _.delay(function() {
                    $('#multipage').on('heft:tap', $.proxy(function(e) {
                        var note = context.model.getNote($(e.target).parents('.page').attr('id'));
                        context.setCurrentPage(context.getPage(note));
                        $('.book').css('opacity', '1');
                        $('.book').css('pointer-events', 'auto');
                        $('#multipage').css('opacity', '0');
                        context.isMultipage = false;
                    }, context));
                }, 1000);

                this.$el.on('heft:pinchstart', $.proxy(function(e) {
                    if (!this.isMultipage) {
                        this.pinchStart();
                    }
                }, context));

                this.$el.on('heft:pinchchange', $.proxy(function(e) {
                    if (!this.isMultipage) {
                        this.pinchPage(e.data.distance);
                    }
                }, context));

                this.$el.on('heft:pinchend', $.proxy(function(e) {
                    if (!this.isMultipage) {
                        this.pinchEnd();
                    }
                }, context));

                // if ($.os && $.os.ios) {
                //     this.$el.pinchIn(function() {
                //         console.log('pinch me');
                //         context.renderMultiPage();
                //     });
                // }
            },

            render      : function() {
                var pages,
                    nextPage,
                    prevPage,
                    context = this;

                // if (!this.$el.find('#multipage-0').length) {
                //     for (var i = 0; i < this.model.getNum16Blocks(); i++) {
                //         this.$el.append()
                //     };
                // }

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

                _.defer(function() {
                    context.renderCurrent16Block.apply(context);
                });
                return this;
            },

            renderMultiPage : function() {
                $('.book').css('opacity', '0');
                $('.book').css('pointer-events', 'none');
                $('#multipage').css('opacity', '1');
                this.isMultipage = true;
            },

            renderCurrent16Block    : function() {
                var block = this.model.getCurrent16Block(),
                    context = this,
                    $multipages = $('#multipage').children(),
                    note,
                    page;
                if ($multipages.length > 0 && 
                        block[0].cid !== $multipages[0].id && 
                        block[1].cid !== $multipages[1].id) {
                    $multipages.remove().appendTo('#page-store');
                }
                for (var i = 0; i < block.length; i++) {
                    this.addPageToMulti(block[i], i);
                }
            },

            addPageToMulti  : function(note, position) {
                if ($('#multipage').find('#'+note.cid).length > 0) {
                    return;
                }
                var context = this;
                _.defer(function() {
                    page = context.createPage(note);
                    page.setMultiPosition(position);
                    if (page.$el.closest('.book').length === 0) {
                        page.$el.appendTo($('#multipage'));
                    }
                });
            },

            getCurrentNoteView  : function() {
                return this.currentPage.note;
            },

            getCurrentPageView  : function() {
                return this.currentPage;
            },

            // this is called before the note is destroyed
            // it also handles moving to another page if the page to be removed is the current page
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
                        this.swipePage(false);
                    }
                }
            },

            createPage  : function(note) {
                var page = new PageView(new NoteView({model: note}));
                page.render();
                this.pages.push(page);
                return page;
            },

            createNote  : function() {
                var n = this.model.createNote(),
                    p = this.createPage(n);
                this.currentPage = p;
            },

            getNextPage : function(p) {
                var page = p || this.currentPage,
                    note = page.note.model,
                    nextNote = this.model.getNextNote(note),
                    nextPage;
                if (!nextNote) {
                    return null;
                } else {
                    return this.getPage(nextNote);
                }
            },

            getPrevPage : function(p) {
                var page = p || this.currentPage,
                    note = page.note.model,
                    prevNote = this.model.getPrevNote(note),
                    prevPage;
                if (!prevNote) {
                    return null;
                } else {
                    return this.getPage(prevNote);
                }
            },

            getPage     : function(note) {
                var page = _.find(this.pages, function(p) {
                    return p.note.model == note;
                });
                return page || this.createPage(note);
            },

            isLast      : function(p) {
                var page = p || this.currentPage,
                    note = page.model;
                return this.model.isLastNote(note);
                // return this.getNextPage(page) === null;
            },

            isFirst      : function(p) {
                var page = p || this.currentPage,
                    note = page.model;
                return this.model.isFirstNote(note);
            },

            getAdjacentPages            : function(arg1, arg2) {
                var page = _.isArray(arg1) ? arg1 : this.currentPage,
                    isFwd = _.isBoolean(arg1) ? arg1 : (_.isUndefined(arg2) ? true : arg2),
                    nextPage = isFwd ? this.getNextPage(page) : this.getPrevPage(page),
                    prevPage = isFwd ? this.getPrevPage(page) : this.getNextPage(page);
                return [nextPage, prevPage];
            },

            /* Page turning stuff */

            initiatePageSwipe   : function(isFwd) {
                if ((!isFwd && this.isFirst()) || (isFwd && this.isLast())) {
                    return;
                }
                this.movingPage = isFwd ? this.currentPage : this.getPrevPage();
                Backbone.Mediator.pub('notebook:pageturnstart');
            },

            swipePageIncremental    : function(isFwd, diff) {
                var transform;
                if ((!isFwd && this.isFirst()) || (isFwd && this.isLast())) {
                    return;
                }
                this.incrementalDiff = this.incrementalDiff ? this.incrementalDiff + diff : diff;
                if (this.movingPage == this.currentPage) {
                    transform = 'translateX('+Math.round(this.incrementalDiff * 50)+'%)';
                } else {
                    transform = 'translateX('+(-50 + Math.round(this.incrementalDiff * 50))+'%)';
                }
                this.movingPage.setTransform(transform, false);
            },

            swipePage   : function(isFwd) {
                var context = this;
                if ((!isFwd && this.isFirst()) || (isFwd && this.isLast())) {
                    return;
                }
                this.movingPage = isFwd ? this.currentPage : this.getPrevPage();

                this.initiatePageSwipe(isFwd);

                this.movingPage.toggleClass('offscreen', this.concludePageSwipe, this, isFwd);
            },

            concludeIncrementalPageSwipe    : function(isFwd) {
                var transform;
                if ((!isFwd && this.isFirst()) || (isFwd && this.isLast())) {
                    return;
                }
                if (isFwd && this.movingPage == this.currentPage) {
                    transform = 'translateX(-100%)';
                } else if (isFwd) {
                    transform = 'translateX(-100%)';
                } else if (this.movingPage == this.currentPage) {
                    transform = 'translateX(0%)';
                } else {
                    transform = 'translateX(0%)';
                }
                this.movingPage.setTransform(transform, this.concludePageSwipe, this);
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
                    this.movingPage.clearTransform();
                    this.movingPage.clearTransition();
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
                        // this.movingPage.clearTransition();
                        // this.movingPage.clearTransform();
                        // this.movingPage.addClass('offscreen');

                        // if (prevPage) {
                        //     prevPage.$el.remove().appendTo('#page-store');
                        // }

                        this.setCurrentPage(nextPage);
                    } else {
                        // we moved back

                        // move old prevPage to page-store
                        // if (nextPage && nextPage != this.movingPage) {
                        //     nextPage.$el.remove().appendTo('#page-store');
                        // }

                        // set currentPage to movingPage (i.e. prev page)
                        this.setCurrentPage(this.movingPage);
                        // this.currentPage = this.movingPage;
                        // this.movingPage.clearTransition();
                        // this.movingPage.clearTransform();
                        // this.movingPage.removeClass('offscreen');

                        // prevPage = this.getPrevPage();
                        // if (prevPage) {
                        //     prevPage.$el.remove().addClass('offscreen').insertAfter(this.currentPage.$el);
                        // }
                    }

                    if (this.currentPage.$el.find('textarea').length > 0) {
                        this.currentPage.$el.find('textarea').focus();
                    }

                    if (this.pagePendingDestruction) {
                        this.pagePendingDestruction.$el.remove();
                        this.pagePendingDestruction = null;
                    }
                    Backbone.Mediator.pub('notebook:pageturnend');
                    Backbone.Mediator.pub('note:deselected', oldCurrentPage.getNote());
                }
            },

            setCurrentPage  : function(page) {
                var nextPage,
                    prevPage,
                    $siblings,
                    $nextPage,
                    $prevPage;
                this.currentPage = page;

                this.currentPage.clearTransition();
                this.currentPage.clearTransform();
                this.currentPage.removeClass('offscreen');

                if (this.currentPage.$el.parent()[0] != $('.book')[0]) {
                    this.currentPage.$el.remove().appendTo($('.book'));
                }

                $siblings = this.currentPage.$el.siblings();
                prevPage = this.getPrevPage();
                if (prevPage) {
                    prevPage.addClass('offscreen');
                    prevPage.clearTransition();
                    prevPage.clearTransform();
                    $prevPage = prevPage.$el.remove();
                }
                nextPage = this.getNextPage();
                if (nextPage) {
                    nextPage.removeClass('offscreen');
                    nextPage.clearTransition();
                    nextPage.clearTransform();
                    $nextPage = nextPage.$el.remove();
                }

                if ($prevPage) {
                    $prevPage.insertAfter(this.currentPage.$el);
                }
                if ($nextPage) {
                    $nextPage.insertBefore(this.currentPage.$el);
                }

                $siblings.filter(function() {
                    return ($prevPage && this != $prevPage[0]) && ($nextPage && this != $nextPage[0]);
                }).remove().removeClass('offscreen').appendTo('#page-store');

                Backbone.Mediator.pub('note:selected', this.currentPage.getNote());
            },

            pinchStart  : function() {
                this.getNextPage().css('opacity', 0);
            },

            pinchPage   : function(distance) {
                distance = distance < 0 ? 0 : distance; 
                if (distance > 0.5) {
                    this.renderMultiPage();
                    this.currentPage.clearTransform();
                } else {
                    this.currentPage.setScale(1 - distance);
                }
            },

            pinchEnd  : function() {
                var nextPage = this.getNextPage();
                this.currentPage.setScale(1, function() {
                    nextPage.setOpacity(1);
                });
            }

            /* Tap/Mouse event stuff */

            // initTouch   : function() {
            //     var that = this;
            //     this.$el.off('touchstart');
            //     this.$el.off('mousedown');
            //     this.$el.on('touchstart', '.page', function(e) { that.pointerStart(e); });
            //     this.$el.on('touchmove', '.book', function(e) { that.pointerMove(e); });
            //     $(document).on('touchend', function(e) { that.pointerEnd(e); });
            // },

            // initMouse   : function() {
            //     var that = this;
            //     this.$el.off('touchstart');
            //     this.$el.off('mousedown');
            //     this.$el.on('mousedown', '.page', function(e) { that.pointerStart(e); });
            //     this.$el.on('mousemove', '.book', function(e) { that.pointerMove(e); });
            //     this.$el.on('mouseup', function(e) { that.pointerEnd(e); });
            //     // this.$el.on('mouseout', function(e) { that.pointerEnd(e); });
            // },

            // pointerStart    : function(e) {
            //     if (e.touches && e.touches.length > 1) {
            //         this.endLongClickTimer();
            //         return;
            //     }
            //     var a = this.analysePointerEvent(e),
            //         that = this;
            //     if (!a.isTouch) {
            //         this.isMouseDown = true;
            //     }
            //     this.mouseX = a.xCoord;
            //     this.mouseY = a.yCoord;

            //     this.longClickTimerId = window.setTimeout(that.handleLongClickEvent, 500);

            //     Backbone.Mediator.pub('notebook:mousedown');
            // },

            // pointerMove     : function(e) {
            //     if (this.isScrolling) {
            //         return;
            //     }
            //     var a = this.analysePointerEvent(e),
            //         xDistance = Math.abs(a.xCoord - this.mouseX),
            //         yDistance = Math.abs(a.yCoord - this.mouseY),
            //         // minimum x movement in % of page width to count as a swipe
            //         minDistance = 0.05;
            //     if (a.isTouch) {
            //         if (yDistance > minDistance && !this.isDragging) {
            //             this.isScrolling = true;
            //             this.endLongClickTimer();
            //             Backbone.Mediator.pub('notebook:mousescroll');
            //         } else if (xDistance > minDistance) {
            //             e.preventDefault();
            //             this.continueSwipeEvent(a.xCoord);
            //             this.endLongClickTimer();
            //             Backbone.Mediator.pub('notebook:mouseswipe');
            //         }
            //     } else {
            //         if (this.isMouseDown && xDistance > minDistance) {
            //             this.continueSwipeEvent(a.xCoord);
            //             this.endLongClickTimer();
            //             Backbone.Mediator.pub('notebook:mouseswipe');
            //         }
            //     }
            // },

            // pointerEnd      : function(e) {
            //     if (this.isScrolling) {
            //         this.isScrolling = false;
            //         return;
            //     }
            //     this.endLongClickTimer();
            //     var a = this.analysePointerEvent(e),
            //         distance = Math.abs(a.xCoord - this.mouseX),
            //         // minimum x movement in % of page width to count as a swipe
            //         minDistance = 0.05;
            //     if (!a.isTouch) {
            //         this.isMouseDown = false;
            //     }
            //     if (this.isDragging) {
            //         this.endSwipeEvent(a.xCoord);
            //         this.isDragging = false;
            //     } else {
            //         if (distance < minDistance) {
            //             this.handleClickEvent(e);
            //             Backbone.Mediator.pub('notebook:mouseup');
            //         }
            //     }
            // },

            // // returns an object with xCoord and isTouch
            // analysePointerEvent : function(e) {
            //     var analysed = {};
            //     if (e.touches || e.changedTouches) {
            //         analysed.isTouch = true;
            //         var touch = e.touches[0] || e.changedTouches[0];
            //         // analysed.xCoord = this.normaliseXCoord(touch.pageX);
            //         // analysed.yCoord = this.normaliseYCoord(touch.pageY);
            //         analysed.xCoord = touch.pageX / $(window).width();
            //         analysed.yCoord = touch.pageY / $(window).height();
            //     } else {
            //         analysed.isTouch = false;
            //         analysed.xCoord = this.normaliseXCoord(e.pageX);
            //         analysed.yCoord = this.normaliseYCoord(e.pageY);
            //     }
            //     return analysed;
            // },

            // // TODO - verso
            // normaliseXCoord : function(xCoord) {
            //     var offset = this.currentPage.$el.parents('.book').offset(),
            //         width = this.currentPage.$el.parents('.book').width(),
            //         normalised = (xCoord - (offset.left + width / 2)) /  (width / 2);
            //     return normalised;
            // },

            // normaliseYCoord : function(yCoord) {
            //     var offset = this.currentPage.$el.parents('.book').offset(),
            //         height = this.currentPage.$el.parents('.book').height(),
            //         normalised = (yCoord - (offset.top + height / 2)) /  (height / 2);
            //     return normalised;
            // },

            // handleClickEvent    : function(e) {
            //     if (!this.isTurning) {
            //         // TODO page references out of this code
            //         if (this.mouseX < 0.2/* && !this.isFirst()*/) {
            //             // this.currentPage = this.getPrevPage();
            //             this.swipePage(false);
            //         } else if (this.mouseX > 0.8) {
            //             this.swipePage(true);
            //         } else {
            //             Backbone.Mediator.pub('notebook:mouseclick');
            //         }
            //     }
            // },

            // endLongClickTimer   : function() {
            //     if (this.longClickTimerId) {
            //         window.clearTimeout(this.longClickTimerId);
            //         this.longClickTimerId = undefined;
            //     }
            // },

            // handleLongClickEvent    : function() {
            //     this.isMouseDown = false;
            //     Backbone.Mediator.pub('notebook:mouselongclick');
            // },

            // continueSwipeEvent          : function(xCoord) {
            //     var isFwd;

            //     // initiate the drag
            //     if (!this.isDragging) {
            //         isFwd = xCoord < this.mouseX;
            //         this.isDragging = true;
            //         this.initiatePageSwipe(isFwd);
            //     } else {
            //         var diff = xCoord - this.mouseX;
            //         this.swipePageIncremental(xCoord < this.mouseX, diff);
            //         this.isSwipeForward = xCoord < this.mouseX;

            //         this.mouseX = xCoord;
            //         this.lastDragEvent = Date.now();
            //     }
            // },

            // endSwipeEvent               : function(xCoord) {
            //     this.concludeIncrementalPageSwipe(this.isSwipeForward);
            //     this.mouseX = 0;
            //     // var degrees = this.currentPageRotation > -90 ? (this.currentPageRotation * -1) : (-180 - this.currentPageRotation),
            //     //     isFwd = this.initialPageRotation === 0,
            //     //     that = this;
            //     // // this.rotatePage(degrees, function() {
            //     // //     that.concludePageTurn(isFwd);
            //     // // });
            //     this.isDragging = false;
            // }

        });

        return NotebookView;
    }
);