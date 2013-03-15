define([],

    function() {

        var defaultTheme = {};

        // a theme is an object full of css definitions
        defaultTheme.getTheme = function(noteModel) {
            var isSlogan = noteModel.get('content').length < 50,
                // fonts = ['"futura-pt"','"ff-meta-serif-web-pro"','Helvetica','"proxima-nova-soft"','"din-condensed-web"','"adobe-caslon-pro"'],
                backgroundImages = ['light_noise_diagonal','cubes','old_mathematics','old_mathematics_invert','graphy','squares','gridme','paper'],
                theme = {
                    fontSize            : (20 + (Math.round(Math.random() * 500) / 10)) + 'px',
                    h1__fontStyle        : Math.random() > 0.7 ? 'italic' : 'normal',
                    h1__textTransform    : Math.random() > 0.9 ? 'uppercase' : (Math.random() > 0.9 ? 'lowercase' : 'none'),
                    h1__fontWeight       : Math.random() < 0.5 ? 'normal' : 'bold',
                    h1__fontSize         : (Math.round(Math.random() * 30 + 20) / 10) + 'em',
                    h1__WebkitHyphens    : Math.random() > 0.5 ? 'auto' : 'none',
                    padding             : (10 + Math.round(Math.random() * 50)) + 'px',
                    marginTop           : 0,
                    h1__lineHeight      : 0.8 + (Math.round(Math.random() * 4) / 10),
                    lineHeight          : Math.round(100 + (Math.random() * 60)) / 100,
                    align               : Math.round(Math.random() * 8),
                    boxShadow           : Math.random > 0.5 ? '' : 'inset 0 0 100px rgba(0,0,0,0.3)',

                    // border width up to 5, > 5 = no border
                    border              : Math.random() > 0.8 ? Math.round(Math.random() * 20) + 'px solid' + (Math.random() > 0.5 ? ' white' : '') : ''
                },
                textAlign = Math.random();

            theme.textAlign = textAlign < 0.5 ? 'left' : (textAlign < 0.8 ? 'center' : (textAlign < 0.9 ? 'justify' : 'right' ));
            if (theme.textAlign !== 'left' && theme.textAlign !== 'justify') {
                theme.ul__listStyleType = 'none';
            }
            theme.p__textAlign = textAlign < 0.8 ? 'left' : (textAlign < 0.95 ? 'justify' : 'right');
            theme.p__marginTop = (Math.round(theme.lineHeight * Number(theme.fontSize.slice(0, -2))))+'px';
            // theme.h1__lineHeight = Math.round((theme.lineHeight * 66) / 100);
            // theme = _.extend(theme, this.makeColors());
            theme = _.extend(theme, this.hslColors());
            theme = _.extend(theme, this.makeFonts());
            return theme;
        };

        defaultTheme.makeFonts = function() {
            var hFontsSans = ['BebasNeueRegular', 'BlackoutMidnight', 'LeagueGothicRegular'],
                hFontsSerif = ['ChunkFiveRegular', 'MuseoSlab'],
                pFontsSans = ['CabinRegular', 'JunctionRegular'],
                pFontsSerif = ['MuseoSlab', 'PTSerifRegular'],
                headingSerif = Math.random() > 0.6,
                bodySerif = Math.random() > 0.8 ? !headingSerif : headingSerif,
                fonts = {};

            if (bodySerif) {
                fonts.fontFamily = pFontsSerif[Math.round(Math.random()*(pFontsSerif.length - 1))];
            } else {
                fonts.fontFamily = pFontsSans[Math.round(Math.random()*(pFontsSans.length - 1))];
            }
            if (headingSerif) {
                fonts.h1__fontFamily = hFontsSerif[Math.round(Math.random()*(hFontsSerif.length - 1))];
            } else {
                fonts.h1__fontFamily = hFontsSans[Math.round(Math.random()*(hFontsSans.length - 1))];
            }

            return fonts;
        };

        defaultTheme.hslColors = function() {
            var colors      = {},
                isBgDark    = Math.random() < 0.3,
                isBgLight   = !isBgDark,
                isBgExtreme = Math.random() < 0.5,
                isWhiteShadow = Math.random() < 0.3,
                isOutline   = !isWhiteShadow && Math.random() < 0.3,
                isInlaid    = !isWhiteShadow && !isOutline && Math.random() < 0.3,
                isComplementary = Math.random() < 0.3,
                hue         = Math.round(Math.random() * 360),
                saturation  = 30,
                lightness   = isBgDark ? 30 : 70,
                bgData      = [hue, saturation],
                fgData      = [hue, saturation],
                hData       = [hue, saturation],
                fgColor;

            if (isBgExtreme) {
                bgData.push(isBgDark ? 5 : 95);
            } else {
                bgData.push(isBgDark ? 30 : 70);
            }

            if (Math.random() < 0.5) {
                fgData.push(50);
            } else {
                fgData.push(isBgDark ? 95 : 5);
            }

            if (isComplementary) {
                hData[0] = hData[0]+180;
            }
            hData.push(isBgDark ? 70 : 30);
            hData[1] = 60;

            if (isWhiteShadow) {
                colors.h1__textShadow = 'white 3px 3px 0';
            } else if (isOutline) {
                colors.h1__textShadow = 'white 3px 3px 0, white -3px -3px 0';
                if (Math.random() > 0.3) {
                    colors.h1__textShadow += ', white 3px 0 0, white -3px 0 0, white 0 3px 0, white 0 -3px 0';
                }
            } else if (isInlaid) {
                colors.h1__textShadow = 'white 1px 0 0';
            }

            colors.backgroundColor = this.arrayToHSL(bgData);
            colors.color = this.arrayToHSL(fgData);
            colors.h1__color = this.arrayToHSL(hData);

            return colors;
        };

        defaultTheme.arrayToHSL = function(colorData) {
            return 'hsl('+colorData[0]+', '+colorData[1]+'%, '+colorData[2]+'%)';
        };

        defaultTheme.makeColors = function() {
            var colors      = {},
                isBgDark    = Math.random() < 0.3,
                isBgLight   = !isBgDark,
                saturation  = isBgDark ? 5 : 10, // tune this, up to around 50 for dull
                darkMixer   = 20,
                lightMixer  = 235,
                multiplier  = Math.round(this.rander(1, 5) * saturation),
                srcColor    = [
                    Math.round(this.rander(255, 10)),
                    Math.round(this.rander(255, 10)),
                    Math.round(this.rander(255, 10))
                ];

            // get rid of half the greens, pinks and turquoises...
            while (/*(Math.random() > 0.5 && srcColor[1] > srcColor[0] && srcColor[1] > srcColor[2]) ||*/
                (Math.random() > 0.5 && srcColor[0] > (3* srcColor[1]) && srcColor[2] > (3 * srcColor[1])) ||
                (Math.random() > 0.5 && srcColor[1] > (3* srcColor[0]) && srcColor[2] > (3 * srcColor[0]))) {
                srcColor    = [
                    Math.round(this.rander(255, 4)),
                    Math.round(this.rander(255, 4)),
                    Math.round(this.rander(255, 4))
                ];
            }

            var bgColor     = [
                    Math.round((srcColor[0] + multiplier*(isBgDark ? darkMixer : lightMixer)) / (multiplier+1)),
                    Math.round((srcColor[1] + multiplier*(isBgDark ? darkMixer : lightMixer)) / (multiplier+1)),
                    Math.round((srcColor[2] + multiplier*(isBgDark ? darkMixer : lightMixer)) / (multiplier+1))
                ],
                fgColor;

            // is the bgColor really dark/light? double check...
            isBgDark    = (bgColor[0]+bgColor[1]+bgColor[2]) / 3 < 128;
            isBgLight   = !isBgDark;

            // and now figure out the fgColor
            var isFgDark    = isBgLight && Math.random() < 0.8,
                isFgBlack   = isBgLight && !isFgDark,
                isFgLight   = isBgDark && Math.random() < 0.5,
                isFgWhite   = isBgDark && !isFgLight,
                darknessFactor = Math.round(Math.random() * 3 + 1);

            if (isFgBlack) {
                fgColor = [0, 0, 0];
            } else if (isFgWhite) {
                fgColor = [255, 255, 255];
            } else {

                fgColor = [
                    Math.round((srcColor[0] + darknessFactor*(isFgDark ? darkMixer : lightMixer)) / (darknessFactor + 1)),
                    Math.round((srcColor[1] + darknessFactor*(isFgDark ? darkMixer : lightMixer)) / (darknessFactor + 1)),
                    Math.round((srcColor[2] + darknessFactor*(isFgDark ? darkMixer : lightMixer)) / (darknessFactor + 1))
                ];
            }

            fgColor = this.arrayToRGB(fgColor);
            bgColor = this.arrayToRGB(bgColor);

            // add background to the first h1?
            if (Math.random() > 0.8) {
                colors['h1_span__color'] = bgColor;
                colors['h1_span__backgroundColor'] = Math.random() < 0.3 ? [255, 255, 255] : fgColor;
            }

            colors.bgColor = bgColor;
            colors.fgColor = fgColor;

            return colors;
        };

        defaultTheme.arrayToRGB  = function(color) {
            return 'rgb('+color[0]+','+color[1]+','+color[2]+')';
        };


        // dynamic pushes the number to the edges (i.e. 0 or max)
        // it should be 0-10
        defaultTheme.rander = function(max, dynamic) {
            var d = dynamic / 4 || 0,
                m = max || 1,
                r = Math.random(),
                t = Math.round(r),
                x = (r + t * d) / (d + 1);
            return Math.round(x * m);
        };

        return defaultTheme;

    }

);