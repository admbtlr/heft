define(['text!templates/note.html'],

    function(template) {

        // get Markdown working
        var converter = new Showdown.converter();

        var NoteView = Backbone.View.extend({
            tagName     : "a",
            className   : "tile",
            template    : _.template(template),
            events      : {
                // 'click'     : function() {
                //     this.trigger('selected', this.model);
                // },
                'dblclick'  : function() {
                    this.trigger('doubleclicked', this.model);
                }
            },

            initialize  : function() {
                // listen to the model, re-render on changes
                this.model.bind('change:style change:content', this.render, this);

                // no style? deal with it!
                if (!this.model.get('style')) {
                    this.model.setRandomStyle();
                }
            },

            render      : function() {
                var html = this.template(this.toJSON());
                if (this.$el.children('.note').length > 0) {
                    this.$el.children('.note').replaceWith($(html));
                } else {
                    this.$el.html(html);
                }
                this.renderStyle();
                return this;
            },

            hide    : function() {
                this.$el.css('display', 'none');
            },

            show    : function() {
                this.$el.css('display', '');
            },
            
            renderStyle     : function() {
                var $page = this.$el.find('.note'),
                    style = this.model.get('style'),
                    styleMap = {},
                    classesToAdd = [],
                    classesToRemove = [];

                // clear all existing css
                $page.attr('style', '');
                $page.children().attr('style', '');

                // to get bg colors on the main h1, there might be (or need to be) a span inserted
                this.addOrRemoveSpans($page, style);

                // variables in style object are either:
                // - straight css values (padding: 10px)
                // - classes to be added ($first_line_bold: true)
                // - settings for children (h1_span__border: 10px or )

                var context = this;
                _.each(_.keys(style), function(key) {
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
                        $page.find(selector).css(context.styleHyphenFormat(pieces[1]), (_.isArray(style[key]) ? context.arrayToRGB(style[key]) : style[key]));
                    } else {
                        styleMap[key] = style[key];
                        // $page.css(context.styleHyphenFormat(key), style[key]);
                    }
                });

                styleMap.backgroundColor = this.arrayToRGB(style.bgColor);
                styleMap.color = this.arrayToRGB(style.fgColor);
                $page.css(styleMap);
                $page.addClass(_.reduce(classesToAdd, function(memo, klass) { return memo+klass+' '; }, ''));
                $page.removeClass(_.reduce(classesToRemove, function(memo, klass) { return memo+klass+' '; }, ''));

                // hmmm...
                if ($page.height() > 0 && !this.model.get('pageFitted')) {
                    this.fitToPage();
                }

            },

            arrayToRGB  : function(color) {
                return 'rgb('+color[0]+','+color[1]+','+color[2]+')';
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

            fitToPage   : function() {
                var $page = this.$el.find('.note'),
                    fontSizeNum = Number(this.model.get('style').fontSize.slice(0, -2)),
                    h1FontSizeNum = Number(this.model.get('style').h1__fontSize.slice(0, -2)),
                    pMarginTopNum = Number(this.model.get('style').p__marginTop.slice(0, -2)),
                    lineHeight = this.model.get('style').lineHeight,
                    paddingNum = Number(this.model.get('style').padding.slice(0, -2)),
                    height = this.outerHeight($page);
                console.log($page.css('font-size')+'::'+$page.css('line-height')+'::'+height);
                while (height > ($page.height()) && fontSizeNum > 24) {
                    console.log($page.css('font-size')+'::'+$page.css('line-height')+'::'+height);
                    height = 0;
                    fontSizeNum = Math.round(fontSizeNum * 0.9);
                    h1FontSizeNum = Math.round(h1FontSizeNum * 0.8);
                    pMarginTopNum = Math.round(pMarginTopNum * 0.9);
                    paddingNum = Math.round(paddingNum * 0.8);
                    $page.css('font-size', fontSizeNum + 'px');
                    $page.css('padding', paddingNum + 'px');
                    $page.children('h1').css('font-size', h1FontSizeNum+'em');
                    height = this.outerHeight($page);
                }
                console.log($page.css('font-size')+'::'+$page.css('line-height')+'::'+height);
                var remainder = $page.height() - height,
                    paddingTop = remainder > 0 ? [paddingNum, remainder / 2.0, remainder-paddingNum][Math.round(Math.random() * 2)] : Math.round(Math.random() * 30);
                // $($page.children()[0]).css('margin-top', marginTop);
                // this.model.get('style').p_marginTop = marginTop;
                this.model.get('style').fontSize = fontSizeNum + 'px';
                this.model.get('style').padding = paddingTop + 'px ' + paddingNum + 'px ' + paddingNum + 'px';
                this.model.get('style').h1__fontSize = h1FontSizeNum+'em';
                this.model.get('style').p__marginTop = pMarginTopNum+'px';
                this.model.set('pageFitted', true);
                this.renderStyle();
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

            toJSON    : function() {
                return {
                    'title'     : this.smarten(this.model.get('content').split('\n')[0].substr(0, 30)),
                    'content'   : this.makeLinks(converter.makeHtml('#'+this.smarten(this.model.get('content')))),
                    'modifyDate': this.model.getModifyDateAsString()
                };
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