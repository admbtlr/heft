define(['text!templates/note.html', 'text!templates/note-edit.html'],

    function(template, editTemplate) {

        // get Markdown working
        var converter = new Showdown.converter();

        var NoteView = Backbone.View.extend({
            // tagName     : "a",
            className   : "note",
            template    : _.template(template),
            editTemplate: _.template(editTemplate),
            events      : {},

            initialize  : function() {
                // listen to the model, re-render on changes
                this.model.bind('change:style change:content', this.render, this);
            },

            render      : function() {
                var html;
                if (this.model.get('content').length === 0) {
                    this.showEditView();
                } else {
                    html = this.renderContent();
                    this.$el.html(html);
                    this.renderStyle();
                }
                return this;
            },

            renderContent   : function() {
                return this.makeLinks(converter.makeHtml('#'+this.smarten(this.model.get('content'))));
            },

            hide    : function() {
                this.$el.css('display', 'none');
            },

            show    : function() {
                this.$el.css('display', '');
            },

            showEditView    : function(focus) {
                var html = this.editTemplate(this.toJSON(true)),
                    $editView = $(html),
                    $textArea;
                this.$el.append($editView);
                $editView.on('mousedown mouseup mousemove touchstart touchend touchmove', function(e) {
                    e.stopPropagation();
                });

                $textArea = this.$el.find('textarea');

                if (focus) {
                    // wait till $el has been added to the page so there's something to focus on...
                    window.setTimeout(function() {
                        $textArea.focus();
                    }, 550);
                }
                $textArea.one('blur', $.proxy(this.hideEditView, this));
            },

            hideEditView    : function() {
                var $editView = this.$el.find('.note-edit'),
                    $textArea = $editView.find('textarea'),
                    val = $textArea.val();

                if (val.length === 0) {
                    Backbone.Mediator.pub('note:predestroy', this);
                    this.model.destroy();
                } else {
                    this.model.set('stylable', true);
                    this.model.set('content', val);
                    this.model.save();
                    $editView.remove();
                }
            },

            renderStyle     : function() {
                var content = this.renderContent(),
                    style = this.model.get('style'),
                    styleMap = {},
                    classesToAdd = [],
                    classesToRemove = [],
                    slabText = false,
                    deviceMultiplier = 0.666; // TODO

                // no style? deal with it!
                if (!style) {
                    this.model.setRandomStyle();
                    return;
                }

                // clear all existing css
                this.$el.html(content);

                // to get bg colors on the main h1, there might be (or need to be) a span inserted
                this.addOrRemoveSpans(this.$el, style);

                // variables in style object are either:
                // - straight css values (padding: 10px)
                // - classes to be added ($first_line_bold: true)
                // - settings for children (h1_span__border: 10px or )

                var context = this;
                _.each(_.keys(style), function(key) {
                    var value = style[key];

                    // apply the device multiplier
                    if (_.isString(value) && value.indexOf('px') != -1) {
                        value = context.applyMultiplier(value, deviceMultiplier);
                    }

                    if (key.substring(0, 1) === '$') {
                        if (style[key]) {
                            classesToAdd.push(context.styleHyphenFormat(key.substring(1)));
                            // $page.addClass(context.styleHyphenFormat(key.substring(1)));
                        } else {
                            classesToRemove.push(context.styleHyphenFormat(key.substring(1)));
                            // $page.removeClass(context.styleHyphenFormat(key.substring(1)));
                        }
                    } else if (key.indexOf('__') !== -1) {
                        var pieces = key.split('__'),
                            selectors = pieces[0].split('_'),
                            selector = '';
                        // build selector
                        _.each(selectors, function(s) { selector += s+' '; });
                        // $page.find(selector).css(context.styleHyphenFormat(pieces[1]), (_.isArray(style[key]) ? context.arrayToRGB(style[key]) : style[key]));
                        context.$el.find(selector).css(context.styleHyphenFormat(pieces[1]), value);
                    } else if (key == 'slabText') {
                        slabText = style[key];
                    } else if (key == 'slabStyle') {
                        // a 2d array of definition object, for breaking headings into spans with custom style:
                        // first h1 - [{numletters:...,trim:(true|false),css: {rule:value,rule:value}}, {numletters:...,trim:(true|false),css: {rule:value,rule:value}}, ... ]
                        // second h1 - [{numletters:...,trim:(true|false),css: {rule:value,rule:value}}, {numletters:...,trim:(true|false),css: {rule:value,rule:value}}, ... ]
                        // ... etc
                        context.$el.find('h1').each(function(index, item) {
                            var $heading = $(item),
                                text = $heading.html(),
                                defs = style.slabStyle[index],
                                def,
                                total = 0,
                                $slabbedText,
                                $span,
                                sliced;

                            for (var i = 0; i < defs.length; i++) {
                                def = defs[i];
                                if (def.trim) {
                                    text = text.trim();
                                }
                                sliced = text.slice(0, total + def.numLetters);
                                text = text.slice(total + def.numLetters);
                                $span = $('<span></span').html(sliced);
                                _.each(def.css, function(val, key) {
                                    $span.css(context.styleHyphenFormat(key), val);
                                });
                                if ($slabbedText) {
                                    $slabbedText = $slabbedText.add($span);
                                } else {
                                    $slabbedText = $span;
                                }
                            }
                            $heading.html('').append($slabbedText);
                        });
                    } else {
                        styleMap[key] = value;
                        // $page.css(context.styleHyphenFormat(key), style[key]);
                    }
                });

                this.$el.css(styleMap);
                this.$el.addClass(_.reduce(classesToAdd, function(memo, klass) { return memo+klass+' '; }, ''));
                this.$el.removeClass(_.reduce(classesToRemove, function(memo, klass) { return memo+klass+' '; }, ''));

                if (this.$el.height() > 0 && !this.model.get('pageFitted')) {
                    this.fitToPage();
                }

                _.delay(function() {
                    var changed = false;
                    if (slabText) {
                        style = context.doSlabText(style);
                        changed = true;
                    }
                    if (typeof style.paddingTop == 'undefined') {
                        style = context.verticalPadding(style);
                        changed = true;
                    }
                    if (changed) {
                        context.model.set({'style': style}, {'silent': true});
                        context.model.save();
                    }
                }, 700);

            },

            doSlabText   : function(style) {
                var length,
                    wordSpacing,
                    fontSize,
                    $item,
                    slabStyle = [],
                    headingArray;
                this.$el.find('h1').slabText();
                // serialize the slabtexting & store in the style object
                this.$el.find('h1').each(function(index, item) {
                    headingArray = [];
                    $(item).children().each(function(index, item) {
                        $item = $(item);
                        def = {
                            'numLetters': $item.html().length,
                            'trim': true,
                            'css': {
                                'wordSpacing'   : $item.css('word-spacing'),
                                'letterSpacing' : $item.css('letter-spacing'),
                                'fontSize'      : $item.css('font-size'),
                                'whiteSpace'    : 'nowrap',
                                'display'       : 'block'
                            }
                        };
                        headingArray.push(def);
                    });
                    slabStyle.push(headingArray);
                });
                style.slabStyle = slabStyle;
                delete style.slabText;
                return style;
            },

            verticalPadding : function(style) {
                var contentHeight,
                    pageHeight = this.$el.height(),
                    paddingTop = Number(this.$el.css('padding-top').slice(0, -2)),
                    deviceMultiplier = 0.666; // TODO
                contentHeight = this.outerHeight(this.$el);
                if (contentHeight + paddingTop < pageHeight  && this.model.get('stylable')) {
                    if (contentHeight > pageHeight || Math.random() > 0.5) {
                        paddingTop = this.$el.css('padding-left');
                    } else if (Math.random() > 0.5) {
                        paddingTop = Math.round((pageHeight - contentHeight) / 2);
                    } else {
                        paddingTop = pageHeight - contentHeight;
                    }
                    this.$el.css('padding-top', paddingTop+'px');
                    style.paddingTop = (paddingTop / deviceMultiplier) + 'px';
                }
                return style;
            },


            applyMultiplier     : function(declaration, multiplier) {
                var pieces = declaration.split(' '),
                    multiplied = '';
                _.each(pieces, function(p) {
                    if (p.indexOf('px') != -1) {
                        p = Math.round(Number(p.slice(0, -2)) * multiplier) + 'px';
                    }
                    multiplied = multiplied+p+' ';
                });
                return multiplied.slice(0, -1);
            },

            addOrRemoveSpans    : function($page, styleMap) {
                var $firstH1 = $page.children('h1').first(),
                    $span,
                    txt;
                if (styleMap['h1_span__color']) {
                    // insert spans into the first <h1>
                    txt = $firstH1.html();
                    $span = $('<span></span>').html(txt);
                    $firstH1.html('').append($span);
                } else if ($firstH1.children('span').length > 0) {
                    // remove any spans left hanging around from a previous skin
                    $span = $('h1').children('span');
                    txt = $span.html();
                    $firstH1.html(txt);
                    $span.remove();
                }
            },

            styleHyphenFormat   : function(propertyName) {
                function upperToHyphenLower(match) {
                    return '-' + match.toLowerCase();
                }
                return propertyName.replace(/[A-Z]/g, upperToHyphenLower);
            },

            // fitToPage   : function() {
            //     var $page = this.$el.find('.note'),
            //         fontSizeNum = Number(this.model.get('style').fontSize.slice(0, -2)),
            //         h1FontSizeNum = Number(this.model.get('style').h1__fontSize.slice(0, -2)),
            //         pMarginTopNum = Number(this.model.get('style').p__marginTop.slice(0, -2)),
            //         lineHeight = this.model.get('style').lineHeight,
            //         h1LineHeight = this.model.get('style').h1__lineHeight,
            //         paddingNum = Number(this.model.get('style').padding.slice(0, -2)),
            //         height = this.outerHeight($page),
            //         width = this.outerWidth($page);
            //     console.log($page.height()+'::'+height+'::'+$page.width()+'::'+width+'::'+fontSizeNum);
            //     while ((height > $page.height() || width > $page.width()) && fontSizeNum > 27) {
            //         console.log($page.height()+'::'+height+'::'+$page.width()+'::'+width+'::'+fontSizeNum+'::'+h1FontSizeNum);

            //         if (fontSizeNum <= 28 && h1FontSizeNum <= 1.6) {
            //             break;
            //         }

            //         height = 0;
            //         fontSizeNum = Math.round(fontSizeNum * 0.9) > 28 ? Math.round(fontSizeNum * 0.9) : 28;
            //         h1FontSizeNum = h1FontSizeNum < 1.6 ? h1FontSizeNum : parseFloat(h1FontSizeNum * 0.95).toFixed(1);
            //         h1ineHeight = Math.round(h1LineHeight * 0.9);
            //         pMarginTopNum = pMarginTopNum > 10 ? Math.round(pMarginTopNum * 0.9) : 10;
            //         paddingNum = paddingNum > 4 ? Math.round(paddingNum * 0.8) : paddingNum;
            //         $page.css('font-size', fontSizeNum + 'px');
            //         $page.css('padding', paddingNum + 'px');
            //         $page.children('h1').css('font-size', h1FontSizeNum+'em');
            //         $page.children('h1').css('line-height', h1LineHeight);
            //         height = this.outerHeight($page);
            //         width = this.outerWidth($page);
            //     }
            //     console.log($page.height()+'::'+height+'::'+$page.width()+'::'+width+'::'+fontSizeNum+'::'+h1FontSizeNum);
            //     var remainder = $page.height() - height,
            //         paddingTop = remainder > 0 ? [paddingNum, remainder / 2.0, remainder-paddingNum][Math.round(Math.random() * 2)] : Math.round(Math.random() * 30);
            //     // $($page.children()[0]).css('margin-top', marginTop);
            //     // this.model.get('style').p_marginTop = marginTop;
            //     this.model.get('style').fontSize = fontSizeNum + 'px';
            //     this.model.get('style').padding = paddingTop + 'px ' + paddingNum + 'px ' + paddingNum + 'px';
            //     this.model.get('style').h1__fontSize = h1FontSizeNum+'em';
            //     this.model.get('style').h1__lineHeight = h1LineHeight;
            //     this.model.get('style').p__marginTop = pMarginTopNum+'px';
            //     this.model.set('pageFitted', true);
            //     this.renderStyle();
            // },

            fitToPage   : function() {
                var style = this.model.get('style'),
                    h1FontSizeNum = Number(style.h1__fontSize.slice(0, -2)),
                    paddingNum = Number(style.padding.slice(0, -2)),
                    width = this.outerWidth(this.$el);
                while (width > this.$el.width() && h1FontSizeNum > 1.6) {
                    h1FontSizeNum = h1FontSizeNum < 1.6 ? h1FontSizeNum : parseFloat(h1FontSizeNum * 0.95).toFixed(1);
                    paddingNum = paddingNum > 4 ? Math.round(paddingNum * 0.8) : paddingNum;
                    this.$el.css('padding', paddingNum + 'px');
                    this.$el.children('h1').css('font-size', h1FontSizeNum+'em');
                    width = this.outerWidth(this.$el);
                }
                // var remainder = $page.height() - height,
                //     paddingTop = remainder > 0 ? [paddingNum, remainder / 2.0, remainder-paddingNum][Math.round(Math.random() * 2)] : Math.round(Math.random() * 30);
                // $($page.children()[0]).css('margin-top', marginTop);
                // style.p_marginTop = marginTop;
                style.padding = paddingNum + 'px';
                style.h1__fontSize = h1FontSizeNum+'em';
                this.model.set('pageFitted', true);
                this.model.set('style', style);
            },

            outerHeight : function($el) {
                var height = Number($el.css('padding').slice(0, -2)) * 2,
                    prevMarginBottom = 0,
                    marginTop,
                    marginBottom;
                $el.children().each(function() {
                    // height += $(this).outerHeight(true);
                    marginTop = Number($(this).css('margin-top').slice(0, -2));
                    marginBottom = Number($(this).css('margin-bottom').slice(0, -2));
                    height += $(this).height();
                    height += (marginTop > prevMarginBottom ? marginTop : prevMarginBottom);
                    prevMarginBottom = marginBottom;
                });
                height += prevMarginBottom;
                return height;
            },

            outerWidth  : function($el) {
                var width = 0,
                    padding = Number($el.css('padding-left').slice(0, -2)) * 2,
                    borderWidth = Number($el.css('border-width').slice(0, -2)) * 2;
                $el.children().each(function() {
                    var w = this.scrollWidth;
                    if (w > width) {
                        width = w;
                    }
                });
                return width + padding + borderWidth;
            },

            toJSON    : function(noMarkdown) {
                if (noMarkdown) {
                    return {
                        'content'   : this.model.get('content')
                    };
                } else {
                    return {
                        'title'     : this.smarten(this.model.get('content').split('\n')[0].substr(0, 30)),
                        'content'   : this.makeLinks(converter.makeHtml('#'+this.smarten(this.model.get('content')))),
                        'modifyDate': this.model.getModifyDateAsString(),
                        'id'        : this.model.cid
                    };
                }
            },

            makeLinks   : function(string) {
                return string.replace(/http.*/gi, '[<a href="$1" target="_blank">...</a>]');
            },

            // Change straight quotes to curly and double hyphens to em-dashes.
            smarten     :  function(a) {
                a = a.replace(/(^|[-\u2014\s(\["])'/g, "$1\u2018");       // opening singles
                a = a.replace(/'/g, "\u2019");                            // closing singles & apostrophes
                a = a.replace(/(^|[-\u2014/\[(\u2018\s])"/g, "$1\u201c"); // opening doubles
                a = a.replace(/"/g, "\u201d");                            // closing doubles
                a = a.replace(/--/g, "\u2014");                           // em-dashes
                return a;
            }

        });

        return NoteView;
    }
);