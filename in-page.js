'use strict';

let DaoInPagePush = function( params )
{
    this.config = {
        debug          : false,
        sourceId       : 101,
        startDelay     : 5,
        maxCount       : 2,
        showInterval   : 15,
        renewInterval  : 90,
        version        : 2,
        positionY      : 'top',
        positionX      : 'right',
        storagePrefix  : 'd-ipp-',
        wrapperId      : 'd-ipp-box',
        itemClass      : 'd-ipp-item',
        itemPrefix     : 'd-ipp-',
        bgColor        : '#5a5a5ae9',
        borderColor    : '#e2e2e2',
        font           : {
            size      :  'normal', // normal|small|large
            color     : '#fafafa'
        },
        adMarkType     : 'image',
        largeImage     : 'no', // no|yes|hover
        animation      : {
            create        : 'bounceInDown',   // no|bounceInRight|fadeInDownBig|flipInX
            remove        : 'fadeOutUpBig',  // no|bounceOutRight|flipOutX|lightSpeedOut
            pulse         : 'shake',          // no|tada|flip|slideOutSlideInLeft|slideOutSlideInRight
            pulseInterval : 10               // no
        },
        defaultIcon    : 'https://notifypicture.info/p/creative-icon/68.png?b=1',
        notSupported   : function () { log('Not supported'); },
        addVars        : {},
        sound          : {
            enable : true,
            url    : getSound(),
            volume : 50,
        },
        marks          : {
            utm_source   : null,
            utm_medium   : null,
            utm_campaign : null,
            utm_term     : null,
            utm_content  : null
        }
    };

    this.apiBaseUrl = getApiBaseUrl();
    this.status     = 'started';
    this.audio      = null;

    this.stop  = showPushStop;
    this.start = showPushStart;

    let self = this;

    extend(this.config, params, {
       // storagePrefix : 'd-ipp-'
    });

    this.config.maxCount = Math.min(this.config.maxCount, 2);

    function getApiBaseUrl()
    {
        if( window.location.host === 'localhost' || window.location.host === '127.0.0.1' || window.location.host === 'push.xcube.loc'|| window.location.host === 'dao.local' )
            return 'http://'+window.location.host+'/api/';

        return 'https://burningpushing.info/api/';
    }

    function init()
    {
        try{
            if( isSupportFetch() === false )
                throw 'Fetch API are not supported in this browser; '+navigator.userAgent;

            addAnimationStyles();
            self.box = getWrapper();

            log('start delay:'+self.config.startDelay);
            setTimeout(showPushStart, self.config.startDelay*1000);
            return true;
        }
        catch(e) {
            error(e);

            self.config.notSupported();
            return false;
        }
    }

    function showPushStop()
    {
        self.status = 'stopped';
    }

    function showPushStart()
    {
        if( self.status !== 'started' )
        {
            log('Message: '+self.config.maxCount+'; Wait')
            setTimeout(showPushStart, self.config.showInterval*1000);
            return;
        }

        if( getMessageCount() >= self.config.maxCount )
        {
            log('Max ad count: '+self.config.maxCount+'; Wait '+self.config.renewInterval+' sec to renew items')
            setTimeout(renewPush, self.config.renewInterval*1000);
            return;
        }

        let userId = storage().getItem(self.config.storagePrefix+'uid');

        let addUriVars = self.config.debug ? '&connect=production&dbg_ip=random' : '';

        fetch(self.apiBaseUrl+'message-in-page/item?sourceId='+encodeURIComponent(self.config.sourceId)+addUriVars, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: "include",
            body: JSON.stringify({
                page     : window.location.href,
                tz       : getTimeZone(),
                tzOffset : -(new Date()['getTimezoneOffset']()),
                userId   : userId,
                //sourceId : self.config.sourceId,
                version  : self.config.version,
                marks    : self.config.marks,
                addVars  : self.config.addVars
            })
        })
        .then(function(response)
        {
            if(response.ok)
                return response.json();

            throw new Error('Response was not ok; Status:'+response.status+' '+response.statusText);
        })
        .then(messageResponse)
        .catch(errorResponse);
    }

    function renewPush()
    {
        removeFirstMessage();
        setTimeout(showPushStart, 1000); // set timeout to avoid animation delay
    }

    function errorResponse(err)
    {
        error('Error on get request:'+err+';');
        if(err instanceof TypeError)
            error(err.name+':'+err.message+'; Line:'+err.fileName+':'+err.lineNumber+':'+err.columnNumber+'; stack:'+err.stack);

        setTimeout(showPushStart, self.config.showInterval*1000);
    }

    function messageResponse(data)
    {
        if(data.status === 'ok')
        {
            if(data.userId)
                storage().setItem(self.config.storagePrefix+'uid', data.userId);

            if( data.message )
            {
                log('Success get ad #'+data.message.id);

                createPushMessage(data.message)
                if(data.pixels && data.pixels.length > 0)
                {
                    data.pixels.forEach(function(pixel)
                    {
                        fetch(pixel, {method: 'GET', mode: 'no-cors', credentials: 'include'});
                    });
                }
            }
            else
                log('No new ad to show');
        }
        else if(data.status === 'error')
            error('Response error on get ad:'+data.message);
        else
            error('Undefined status on response');

        setTimeout(showPushStart, self.config.showInterval*1000);
    }

    /******************************/

    function createPushMessage(messageItem)
    {
        let advItem = createAdvItem(messageItem);

        self.box.appendChild(advItem);

        setTimeout(function (){
            advItem.style.display = 'block';
            playSound();
        }, 300);

        startPulseAnimation(advItem);
    }

    function startPulseAnimation(advItem)
    {
        if(self.config.animation.pulse === 'no')
            return ;

        setTimeout(function (){animateCSS(advItem, self.config.animation.pulse).then(function(){startPulseAnimation(advItem)});}, self.config.animation.pulseInterval*1000);
    }

    function playSound()
    {
        if( self.config.sound.enable !== true )
            return;

        if( isAudioSupport() === false )
        {
            error('Audio is not support');
            return;
        }

        if( self.audio === null )
            self.audio = new Audio(self.config.sound.url);

        self.audio.volume = Math.max(0, Math.min(self.config.sound.volume/100, 1));

        self.audio.play();
    }

    function createAdvItem(messageItem)
    {
        //let isHoverClose = isTouchScreenDevice() === false;
        let isHoverClose = false;

        let mark  = createMessageMark();
        let item  = createMessageItem(messageItem);
        let icon  = createMessageIcon(messageItem);
        let image = createMessageImage(messageItem);
        let title = createMessageTitle(messageItem);
        let close = createMessageClose(isHoverClose);

        let text = document.createElement("div");
        text.style.paddingLeft = '7px';
        text.innerText  = truncateString(messageItem.body, getByFontSize(80, 96, 86));

        let clear = document.createElement("div");
        clear.style.clear = 'both';

        mark.addEventListener('click',      function(e){e.stopPropagation();});
        item.addEventListener('click',      function(e){window.open(messageItem.url); this.closest('.'+self.config.itemClass).remove(); });
        item.addEventListener('mouseenter', function(e){
            if(isHoverClose)
                this.querySelector('.'+self.config.itemPrefix+'close').style.display = 'block';

            let imageBoxList = this.getElementsByClassName(self.config.itemPrefix+'image-box');
            Array.from(imageBoxList).forEach(function callback(imageBox) {
                let imageList = imageBox.getElementsByClassName(self.config.itemPrefix+'image');
                Array.from(imageList).forEach(function callback(image) {
                    imageBox.style.height = image.height+'px';
                });
            });

            this.getAnimations().forEach(function(animation, index){
                log("Paused animation:"+animation.animationName);
                animation.pause();
            });
        });

        item.addEventListener('mouseleave', function(){
            if(isHoverClose)
                this.querySelector('.'+self.config.itemPrefix+'close').style.display = 'none';

            this.getAnimations().forEach(function(animation, index){
                log("Resume animation:"+animation.animationName);
                animation.play();
            });
        });

        close.addEventListener('click',function(e){
            e.stopPropagation();
            let removeItem = this.closest('.'+self.config.itemClass);
            let removeMessageItem = function()
            {
                let isMaxCount = getMessageCount() >= self.config.maxCount;
                log("Remove item by click 'close'");
                removeItem.remove();

                if( isMaxCount ) // start showing on remove item
                    setTimeout(showPushStart, self.config.renewInterval*1000);

                return true;
            };

            if(self.config.animation.remove !== 'no')
                animateCSS(removeItem, self.config.animation.remove).then(removeMessageItem);
            else
                removeMessageItem();
        });

        item.appendChild(icon);
        item.appendChild(title);
        item.appendChild(text);
        item.appendChild(clear);
        if(image)
            item.appendChild(image);
        item.appendChild(mark);
        item.appendChild(close);

        return item;
    }

    function createMessageItem(messageItem)
    {
        let item = document.createElement("div");
        item.id                    = self.config.itemPrefix+messageItem.id;
        item.style.fontFamily      = 'Tahoma';
        item.style.fontSize        = getByFontSize('11px', '12px', '14px');
        item.style.lineHeight      = getByFontSize('1.6', '1.5', '1.5');
        item.style.border          = '1px solid '+self.config.borderColor; //#e2e2e2
        //item.style.backgroundColor = "rgba(90,90,90,0.85)";
        item.style.backgroundColor = self.config.bgColor;
        item.style.color           = self.config.font.color;
        item.style.borderRadius    = '4px';
        item.style.padding         = '7px 0 0 0';
        item.style.margin          = '10px 0px';
        item.style.width           = '100%';
        item.style.minHeight       = getByFontSize('78px', '80px', '88px');
        //item.style.maxHeight       = '150px';
        item.style.display         = 'none';
        item.style.cursor          = 'pointer';
        item.style.position        = 'relative';

        item.classList.add(self.config.itemClass);
        item.classList.add('animated');
        if(self.config.animation.create !== 'no')
            animateCSS(item, self.config.animation.create);

        return item;
    }

    function createMessageClose(isHoverClose)
    {
        let close = document.createElement("div");
        close.title            = 'Close ad';
        close.innerHTML        = '&#x2716;';
        close.style.position   = 'absolute';
        close.style.top        = '0';
        close.style.right      = '0';
        close.style.lineHeight = isHoverClose ? '1.3'   : '1.3';
        close.style.width      = isHoverClose ? '35px'  : '60px';
        close.style.height     = isHoverClose ? '35px'  : '60px';
        close.style.display    = isHoverClose ? 'none'  : 'block';
        close.style.fontSize   = '20px';
        close.style.textAlign  = 'right'; // center
        close.style.padding    = '3px 10px';

        close.classList.add(self.config.itemPrefix+'close');

        return close;
    }

    function createMessageTitle(messageItem)
    {
        let title = document.createElement("div");
        title.style.fontFamily   = 'San-serif';
        title.style.fontSize     = getByFontSize('14px', '14px', '18px');
        title.style.fontWeight   = '600';
        title.style.paddingRight = '25px';

        let isLongBody = messageItem.body && messageItem.body.length > 36;

        title.innerText = truncateString(messageItem.title, isLongBody ? getByFontSize(30, 38, 32) : 72);

        return title;
    }

    function createMessageMark()
    {
        let mark = document.createElement("a");
        mark.href               = 'https://dao.ad';
        mark.title              = 'Ad network';
        mark.target             = '_blank';
        mark.style.fontFamily   = 'San-serif';
        mark.style.fontSize     = '14px';
        mark.style.position     = 'absolute';
        mark.style.lineHeight   = '1';
        mark.style.padding      = '3px 3px';
        mark.style.color        = self.config.font.color;
        mark.style.borderRadius = '4px';
        //mark.style.boxShadow    = "-2px 2px 3px rgba(92,92,92,0.5)"; // disable by white background

        if( self.config.adMarkType === 'image' )// start background image
        {
            mark.style.bottom     = '5px';
            mark.style.right      = '5px';
            mark.style.width      = '22px';
            mark.style.height     = '11px';
            mark.style.backgroundImage  = getMarkBackgroundImg();
            mark.style.backgroundSize   = "22px 11px";
            mark.style.backgroundRepeat = "no-repeat";
        }
        else// start left ad mark
        {
            mark.innerText        = 'Ad';
            mark.style.backgroundColor = "#fb5f49";
            mark.style.top        = '15px';
            mark.style.left       = '-20px';
        }

        return mark;
    }

    function createMessageIcon(messageItem)
    {
        let icon = document.createElement("img");
        icon.onerror = function(){this.src = self.config.defaultIcon;};
        icon.classList.add(self.config.itemPrefix+'icon');
        icon.src = messageItem.icon;
        icon.style.border        = '0px';
        icon.style.borderRadius  = '3px';
        icon.style.marginRight   = '5px';
        icon.style.marginLeft    = '7px';
        icon.style.width         = getByFontSize('62px', '64px', '72px');
        icon.style.height        = getByFontSize('62px', '64px', '72px');
        icon.style.float         = 'left';

        return icon;
    }

    function createMessageImage(messageItem)
    {
        if( self.config.largeImage === 'no' )
            return null;

        if(messageItem.image == null)
            return null;

        if(isMobile(window.navigator.userAgent))
            return null;

        let image = document.createElement("img");
        image.onload = function() {this.style.display = 'block';};
        image.classList.add(self.config.itemPrefix+'image');
        image.src = messageItem.image;
        image.style.border        = '0px';
        //image.style.marginTop     = '5px'; // use padding to avoid wrong height image block
        image.style.paddingTop    = '5px';
        image.style.width         = '100%';
        image.style.display       = 'none';

        if( self.config.largeImage === 'hover' )
        {
            let imageBox = document.createElement("div");
            imageBox.classList.add(self.config.itemPrefix+'image-box');
            imageBox.style.height           = '0';
            imageBox.style.overflowY        = 'hidden';
            imageBox.style.transition       = 'height 900ms ease-in 100ms';

            imageBox.appendChild(image);
            return imageBox;
        }

        return image;
    }

    function animateCSS(node, animation, prefix = '')
    {
        return new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;

            node.classList.add(animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                if(animationName !== event.animationName)
                {
                    //ended other animation => ignore it callback now
                    //console.error(animationName);
                    //console.error(event);

                    log('Animation end '+event.animationName+'; Expected: '+animationName );
                    return;
                }

                node.classList.remove(animationName);

                log('Animation ended '+animationName );
                resolve('Animation ended '+animation);
            }

            node.addEventListener('animationend', handleAnimationEnd /*, {once: true}*/);
        });
    }

    function truncateString(text, length)
    {
        if( text === null )
            return '';

        if( typeof(text) == "undefined" )
            return '';

        if( text.length <= length )
            return text;

        return text.substring(0, length).trim()+'...';
    }

    function getByFontSize(small, normal, large)
    {
        if( self.config.font.size === 'small' )
            return small;

        if( self.config.font.size === 'large' )
            return large;

        return normal;
    }

    function createWrapper()
    {
        let wrapper = document.createElement("div");
        wrapper.style.id              = self.config.wrapperId;
        wrapper.style.zIndex          = '100000000';
        wrapper.style.position        = 'fixed';
        wrapper.style.width           = Math.min(document.body.clientWidth-28, getByFontSize(320, 380, 400))+'px';
        wrapper.style[self.config.positionY] = '50px';
        wrapper.style[self.config.positionX] = '10px';

        Math.max(document.body.clientWidth, 400);

        document.body.appendChild(wrapper);

        return wrapper;
    }

    function getMessageCount()
    {
        return self.box.getElementsByClassName(self.config.itemClass).length;
    }

    function removeFirstMessage()
    {
        let listItems = self.box.getElementsByClassName(self.config.itemClass);

        if( listItems.length === 0 )
            return true;

        let firstItem = listItems[0];

        log('Lets remove oldest item');

        if(self.config.animation.remove !== 'no')
            animateCSS(firstItem, self.config.animation.remove).then(() => {log('Remove oldest item'); firstItem.remove();});
        else
        {
            log('Remove oldest item');
            firstItem.remove();
        }
    }

    function getWrapper()
    {
        let box = document.getElementById(self.config.wrapperId);
        if(box === null)
            box = createWrapper();

        return box;
    }

    function addAnimationStyles()
    {
        let animateStyles = document.createElement('style');
        animateStyles.innerHTML = getAnimateCss();
        animateStyles.id = self.config.itemPrefix+'animate-style';
        document.body.appendChild(animateStyles);

        log('Append animations styles');
    }

    /******************************/

    function getMarkBackgroundImg()
    {
        return "url('data:image/png;base64,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dXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTA3LTEwVDE3OjM0OjU2KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA3LTEwVDE3OjM0OjU2KzAzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wNy0xMFQxNzozNDo1NiswMzowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmODU2ODhkNC1jNThjLTQyYmItYjA2Ny05NGNhMjg4YjlhMTIiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjZGMwNGRiNi1jYzI2LTI3NDQtYjQzNy04YTkyOTkyNGE2YjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozZmUzN2M4ZC1hNWQyLTQxNjEtOTUzNi1iMTVmMWY5MDkwYjAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0iRGlzcGxheSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6M2ZlMzdjOGQtYTVkMi00MTYxLTk1MzYtYjE1ZjFmOTA5MGIwIiBzdEV2dDp3aGVuPSIyMDIwLTA3LTEwVDE3OjM0OjU2KzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Zjg1Njg4ZDQtYzU4Yy00MmJiLWIwNjctOTRjYTI4OGI5YTEyIiBzdEV2dDp3aGVuPSIyMDIwLTA3LTEwVDE3OjM0OjU2KzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4jzYHPAAACjklEQVRIx9WXS0hVURSGr5hBkYFgFD2cZEkUZal4NSV6QDPtMSkqSaHXyInCNRobFRFoNVEkH1kJPTQapAVlRfRwEARODFEJGmQPH5FUHv8N69DfYp9zryev1IKPe89ee+3933XXWWefkOM4oTiwAqyNx9qhOAk+Dl6Cwv9F8Cvnt5XOtOB5IBtsipEwWEyLrKb4NeCQ86fdAukyZyNIUiIWgPkgDeRa9ssWkl3Bhc707bBsthAMxzB/Uj57QaLERkAXGAQXQE+UNQbAOhN4JIDgEtk0PM2455TZtwH2bTKBlwMEHpBNd8n1L/BDPr2ya6yBBHcG2LfRbUFtNPhYamkzKAB5YAv4YBG8CKwHK6XOJiybmB+yTepxqYfgblAkCdgtFIM9oI/m1bnB1TR4zeMOHbAIZnJ9MhO2zGfBF306Q5dNcA0N3rYEzQFDUQTf9RF8M4rgRh/Bz4IITlQZPqj8piWNq97LN/MISA0o+GkQwSngM83Zp/ynyfeTfiRbZDYFp6vNi1Xj/0K+G+R7RONvZlNwvhKcQ779ypfv49swU4Lr1aNUB7WQ/x09rfSCbhbLwTH5/on8ZzwEN/gIfmITXCK1Z+yqCoioLJ0kX6by7QCr6HorOEvXRvxci+A6H8HdWvB2cI6afj84D2rBayXInAUSaDEupe/gBPhGY+afyVBr7LT01/fS+jqkPRra5fqrFnwlxsfimKrBFBlzrVUOMq59BMstf2uzpZRiteu6Pr3shTxavVrZqIwtowxn0twytd4ScCqA4Gqz2FFwT242wx05W7TIwWivR21V0dGyncbDlphU2tScDbJk/BJ4KOXR6cEDcF/KNvlv3wBMpirlkBRtboVk+p98RYobUwlVAdcUAMs7AAAAAElFTkSuQmCC')";
    }

    function getSound(){
        return 'data:@file/mpeg;base64,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';
    }

    function getAnimateCss(){
        return '.animated{-webkit-animation-duration:1s;animation-duration:0.85s;-webkit-animation-fill-mode:both;animation-fill-mode:both}.animated.infinite{-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite}.animated.hinge{-webkit-animation-duration:2s;animation-duration:2s}.animated.bounceIn,.animated.bounceOut,.animated.flipOutX,.animated.flipOutY{-webkit-animation-duration:.75s;animation-duration:.75s}@-webkit-keyframes bounce{100%,20%,53%,80%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1);-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}40%,43%{-webkit-animation-timing-function:cubic-bezier(0.755,.050,.855,.060);animation-timing-function:cubic-bezier(0.755,.050,.855,.060);-webkit-transform:translate3d(0,-30px,0);transform:translate3d(0,-30px,0)}70%{-webkit-animation-timing-function:cubic-bezier(0.755,.050,.855,.060);animation-timing-function:cubic-bezier(0.755,.050,.855,.060);-webkit-transform:translate3d(0,-15px,0);transform:translate3d(0,-15px,0)}90%{-webkit-transform:translate3d(0,-4px,0);transform:translate3d(0,-4px,0)}}@keyframes bounce{100%,20%,53%,80%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1);-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}40%,43%{-webkit-animation-timing-function:cubic-bezier(0.755,.050,.855,.060);animation-timing-function:cubic-bezier(0.755,.050,.855,.060);-webkit-transform:translate3d(0,-30px,0);transform:translate3d(0,-30px,0)}70%{-webkit-animation-timing-function:cubic-bezier(0.755,.050,.855,.060);animation-timing-function:cubic-bezier(0.755,.050,.855,.060);-webkit-transform:translate3d(0,-15px,0);transform:translate3d(0,-15px,0)}90%{-webkit-transform:translate3d(0,-4px,0);transform:translate3d(0,-4px,0)}}.bounce{-webkit-animation-name:bounce;animation-name:bounce;-webkit-transform-origin:center bottom;transform-origin:center bottom}@-webkit-keyframes flash{100%,50%,from{opacity:1}25%,75%{opacity:0}}@keyframes flash{100%,50%,from{opacity:1}25%,75%{opacity:0}}.flash{-webkit-animation-name:flash;animation-name:flash}@-webkit-keyframes pulse{from{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}50%{-webkit-transform:scale3d(1.05,1.05,1.05);transform:scale3d(1.05,1.05,1.05)}100%{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}@keyframes pulse{from{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}50%{-webkit-transform:scale3d(1.05,1.05,1.05);transform:scale3d(1.05,1.05,1.05)}100%{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}.pulse{-webkit-animation-name:pulse;animation-name:pulse}@-webkit-keyframes rubberBand{from{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}30%{-webkit-transform:scale3d(1.25,.75,1);transform:scale3d(1.25,.75,1)}40%{-webkit-transform:scale3d(0.75,1.25,1);transform:scale3d(0.75,1.25,1)}50%{-webkit-transform:scale3d(1.15,.85,1);transform:scale3d(1.15,.85,1)}65%{-webkit-transform:scale3d(.95,1.05,1);transform:scale3d(.95,1.05,1)}75%{-webkit-transform:scale3d(1.05,.95,1);transform:scale3d(1.05,.95,1)}100%{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}@keyframes rubberBand{from{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}30%{-webkit-transform:scale3d(1.25,.75,1);transform:scale3d(1.25,.75,1)}40%{-webkit-transform:scale3d(0.75,1.25,1);transform:scale3d(0.75,1.25,1)}50%{-webkit-transform:scale3d(1.15,.85,1);transform:scale3d(1.15,.85,1)}65%{-webkit-transform:scale3d(.95,1.05,1);transform:scale3d(.95,1.05,1)}75%{-webkit-transform:scale3d(1.05,.95,1);transform:scale3d(1.05,.95,1)}100%{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}.rubberBand{-webkit-animation-name:rubberBand;animation-name:rubberBand}@-webkit-keyframes shake{100%,from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}10%,30%,50%,70%,90%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}20%,40%,60%,80%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}}@keyframes shake{100%,from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}10%,30%,50%,70%,90%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}20%,40%,60%,80%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}}.shake{-webkit-animation-name:shake;animation-name:shake}@-webkit-keyframes swing{20%{-webkit-transform:rotate3d(0,0,1,15deg);transform:rotate3d(0,0,1,15deg)}40%{-webkit-transform:rotate3d(0,0,1,-10deg);transform:rotate3d(0,0,1,-10deg)}60%{-webkit-transform:rotate3d(0,0,1,5deg);transform:rotate3d(0,0,1,5deg)}80%{-webkit-transform:rotate3d(0,0,1,-5deg);transform:rotate3d(0,0,1,-5deg)}100%{-webkit-transform:rotate3d(0,0,1,0deg);transform:rotate3d(0,0,1,0deg)}}@keyframes swing{20%{-webkit-transform:rotate3d(0,0,1,15deg);transform:rotate3d(0,0,1,15deg)}40%{-webkit-transform:rotate3d(0,0,1,-10deg);transform:rotate3d(0,0,1,-10deg)}60%{-webkit-transform:rotate3d(0,0,1,5deg);transform:rotate3d(0,0,1,5deg)}80%{-webkit-transform:rotate3d(0,0,1,-5deg);transform:rotate3d(0,0,1,-5deg)}100%{-webkit-transform:rotate3d(0,0,1,0deg);transform:rotate3d(0,0,1,0deg)}}.swing{-webkit-transform-origin:top center;transform-origin:top center;-webkit-animation-name:swing;animation-name:swing}@-webkit-keyframes tada{from{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}10%,20%{-webkit-transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg);transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg)}30%,50%,70%,90%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg)}40%,60%,80%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg)}100%{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}@keyframes tada{from{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}10%,20%{-webkit-transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg);transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg)}30%,50%,70%,90%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg)}40%,60%,80%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg)}100%{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}.tada{-webkit-animation-name:tada;animation-name:tada}@-webkit-keyframes wobble{from{-webkit-transform:none;transform:none}15%{-webkit-transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg);transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg)}30%{-webkit-transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg);transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg)}45%{-webkit-transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg);transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg)}60%{-webkit-transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg);transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg)}75%{-webkit-transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg);transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg)}100%{-webkit-transform:none;transform:none}}@keyframes wobble{from{-webkit-transform:none;transform:none}15%{-webkit-transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg);transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg)}30%{-webkit-transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg);transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg)}45%{-webkit-transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg);transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg)}60%{-webkit-transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg);transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg)}75%{-webkit-transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg);transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg)}100%{-webkit-transform:none;transform:none}}.wobble{-webkit-animation-name:wobble;animation-name:wobble}@-webkit-keyframes jello{100%,11.1%,from{-webkit-transform:none;transform:none}22.2%{-webkit-transform:skewX(-12.5deg) skewY(-12.5deg);transform:skewX(-12.5deg) skewY(-12.5deg)}33.3%{-webkit-transform:skewX(6.25deg) skewY(6.25deg);transform:skewX(6.25deg) skewY(6.25deg)}44.4%{-webkit-transform:skewX(-3.125deg) skewY(-3.125deg);transform:skewX(-3.125deg) skewY(-3.125deg)}55.5%{-webkit-transform:skewX(1.5625deg) skewY(1.5625deg);transform:skewX(1.5625deg) skewY(1.5625deg)}66.6%{-webkit-transform:skewX(-.78125deg) skewY(-.78125deg);transform:skewX(-.78125deg) skewY(-.78125deg)}77.7%{-webkit-transform:skewX(0.390625deg) skewY(0.390625deg);transform:skewX(0.390625deg) skewY(0.390625deg)}88.8%{-webkit-transform:skewX(-.1953125deg) skewY(-.1953125deg);transform:skewX(-.1953125deg) skewY(-.1953125deg)}}@keyframes jello{100%,11.1%,from{-webkit-transform:none;transform:none}22.2%{-webkit-transform:skewX(-12.5deg) skewY(-12.5deg);transform:skewX(-12.5deg) skewY(-12.5deg)}33.3%{-webkit-transform:skewX(6.25deg) skewY(6.25deg);transform:skewX(6.25deg) skewY(6.25deg)}44.4%{-webkit-transform:skewX(-3.125deg) skewY(-3.125deg);transform:skewX(-3.125deg) skewY(-3.125deg)}55.5%{-webkit-transform:skewX(1.5625deg) skewY(1.5625deg);transform:skewX(1.5625deg) skewY(1.5625deg)}66.6%{-webkit-transform:skewX(-.78125deg) skewY(-.78125deg);transform:skewX(-.78125deg) skewY(-.78125deg)}77.7%{-webkit-transform:skewX(0.390625deg) skewY(0.390625deg);transform:skewX(0.390625deg) skewY(0.390625deg)}88.8%{-webkit-transform:skewX(-.1953125deg) skewY(-.1953125deg);transform:skewX(-.1953125deg) skewY(-.1953125deg)}}.jello{-webkit-animation-name:jello;animation-name:jello;-webkit-transform-origin:center;transform-origin:center}@-webkit-keyframes bounceIn{100%,20%,40%,60%,80%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}0%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}20%{-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}40%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}60%{opacity:1;-webkit-transform:scale3d(1.03,1.03,1.03);transform:scale3d(1.03,1.03,1.03)}80%{-webkit-transform:scale3d(.97,.97,.97);transform:scale3d(.97,.97,.97)}100%{opacity:1;-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}@keyframes bounceIn{100%,20%,40%,60%,80%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}0%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}20%{-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}40%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}60%{opacity:1;-webkit-transform:scale3d(1.03,1.03,1.03);transform:scale3d(1.03,1.03,1.03)}80%{-webkit-transform:scale3d(.97,.97,.97);transform:scale3d(.97,.97,.97)}100%{opacity:1;-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}.bounceIn{-webkit-animation-name:bounceIn;animation-name:bounceIn}@-webkit-keyframes bounceInDown{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(0,-3000px,0);transform:translate3d(0,-3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,25px,0);transform:translate3d(0,25px,0)}75%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}90%{-webkit-transform:translate3d(0,5px,0);transform:translate3d(0,5px,0)}100%{-webkit-transform:none;transform:none}}@keyframes bounceInDown{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(0,-3000px,0);transform:translate3d(0,-3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,25px,0);transform:translate3d(0,25px,0)}75%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}90%{-webkit-transform:translate3d(0,5px,0);transform:translate3d(0,5px,0)}100%{-webkit-transform:none;transform:none}}.bounceInDown{-webkit-animation-name:bounceInDown;animation-name:bounceInDown}@-webkit-keyframes bounceInLeft{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(-3000px,0,0);transform:translate3d(-3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(25px,0,0);transform:translate3d(25px,0,0)}75%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}90%{-webkit-transform:translate3d(5px,0,0);transform:translate3d(5px,0,0)}100%{-webkit-transform:none;transform:none}}@keyframes bounceInLeft{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(-3000px,0,0);transform:translate3d(-3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(25px,0,0);transform:translate3d(25px,0,0)}75%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}90%{-webkit-transform:translate3d(5px,0,0);transform:translate3d(5px,0,0)}100%{-webkit-transform:none;transform:none}}.bounceInLeft{-webkit-animation-name:bounceInLeft;animation-name:bounceInLeft}@-webkit-keyframes bounceInRight{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(3000px,0,0);transform:translate3d(3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(-25px,0,0);transform:translate3d(-25px,0,0)}75%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}90%{-webkit-transform:translate3d(-5px,0,0);transform:translate3d(-5px,0,0)}100%{-webkit-transform:none;transform:none}}@keyframes bounceInRight{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(3000px,0,0);transform:translate3d(3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(-25px,0,0);transform:translate3d(-25px,0,0)}75%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}90%{-webkit-transform:translate3d(-5px,0,0);transform:translate3d(-5px,0,0)}100%{-webkit-transform:none;transform:none}}.bounceInRight{-webkit-animation-name:bounceInRight;animation-name:bounceInRight}@-webkit-keyframes bounceInUp{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(0,3000px,0);transform:translate3d(0,3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}75%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}90%{-webkit-transform:translate3d(0,-5px,0);transform:translate3d(0,-5px,0)}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes bounceInUp{100%,60%,75%,90%,from{-webkit-animation-timing-function:cubic-bezier(0.215,.61,.355,1);animation-timing-function:cubic-bezier(0.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(0,3000px,0);transform:translate3d(0,3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}75%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}90%{-webkit-transform:translate3d(0,-5px,0);transform:translate3d(0,-5px,0)}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.bounceInUp{-webkit-animation-name:bounceInUp;animation-name:bounceInUp}@-webkit-keyframes bounceOut{20%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}50%,55%{opacity:1;-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}100%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}}@keyframes bounceOut{20%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}50%,55%{opacity:1;-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}100%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}}.bounceOut{-webkit-animation-name:bounceOut;animation-name:bounceOut}@-webkit-keyframes bounceOutDown{20%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}100%{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}@keyframes bounceOutDown{20%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}100%{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}.bounceOutDown{-webkit-animation-name:bounceOutDown;animation-name:bounceOutDown}@-webkit-keyframes bounceOutLeft{20%{opacity:1;-webkit-transform:translate3d(20px,0,0);transform:translate3d(20px,0,0)}100%{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}@keyframes bounceOutLeft{20%{opacity:1;-webkit-transform:translate3d(20px,0,0);transform:translate3d(20px,0,0)}100%{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}.bounceOutLeft{-webkit-animation-name:bounceOutLeft;animation-name:bounceOutLeft}@-webkit-keyframes bounceOutRight{20%{opacity:1;-webkit-transform:translate3d(-20px,0,0);transform:translate3d(-20px,0,0)}100%{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}@keyframes bounceOutRight{20%{opacity:1;-webkit-transform:translate3d(-20px,0,0);transform:translate3d(-20px,0,0)}100%{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}.bounceOutRight{-webkit-animation-name:bounceOutRight;animation-name:bounceOutRight}@-webkit-keyframes bounceOutUp{20%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,20px,0);transform:translate3d(0,20px,0)}100%{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}@keyframes bounceOutUp{20%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,20px,0);transform:translate3d(0,20px,0)}100%{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}.bounceOutUp{-webkit-animation-name:bounceOutUp;animation-name:bounceOutUp}@-webkit-keyframes fadeIn{from{opacity:0}100%{opacity:1}}@keyframes fadeIn{from{opacity:0}100%{opacity:1}}.fadeIn{-webkit-animation-name:fadeIn;animation-name:fadeIn}@-webkit-keyframes fadeInDown{from{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInDown{from{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInDown{-webkit-animation-name:fadeInDown;animation-name:fadeInDown}@-webkit-keyframes fadeInDownBig{from{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInDownBig{from{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInDownBig{-webkit-animation-name:fadeInDownBig;animation-name:fadeInDownBig}@-webkit-keyframes fadeInLeft{from{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInLeft{from{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInLeft{-webkit-animation-name:fadeInLeft;animation-name:fadeInLeft}@-webkit-keyframes fadeInLeftBig{from{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInLeftBig{from{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInLeftBig{-webkit-animation-name:fadeInLeftBig;animation-name:fadeInLeftBig}@-webkit-keyframes fadeInRight{from{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInRight{from{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInRight{-webkit-animation-name:fadeInRight;animation-name:fadeInRight}@-webkit-keyframes fadeInRightBig{from{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInRightBig{from{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInRightBig{-webkit-animation-name:fadeInRightBig;animation-name:fadeInRightBig}@-webkit-keyframes fadeInUp{from{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInUp{from{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInUp{-webkit-animation-name:fadeInUp;animation-name:fadeInUp}@-webkit-keyframes fadeInUpBig{from{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInUpBig{from{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}100%{opacity:1;-webkit-transform:none;transform:none}}.fadeInUpBig{-webkit-animation-name:fadeInUpBig;animation-name:fadeInUpBig}@-webkit-keyframes fadeOut{from{opacity:1}100%{opacity:0}}@keyframes fadeOut{from{opacity:1}100%{opacity:0}}.fadeOut{-webkit-animation-name:fadeOut;animation-name:fadeOut}@-webkit-keyframes fadeOutDown{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}@keyframes fadeOutDown{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}.fadeOutDown{-webkit-animation-name:fadeOutDown;animation-name:fadeOutDown}@-webkit-keyframes fadeOutDownBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}@keyframes fadeOutDownBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}.fadeOutDownBig{-webkit-animation-name:fadeOutDownBig;animation-name:fadeOutDownBig}@-webkit-keyframes fadeOutLeft{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}@keyframes fadeOutLeft{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}.fadeOutLeft{-webkit-animation-name:fadeOutLeft;animation-name:fadeOutLeft}@-webkit-keyframes fadeOutLeftBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}@keyframes fadeOutLeftBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}.fadeOutLeftBig{-webkit-animation-name:fadeOutLeftBig;animation-name:fadeOutLeftBig}@-webkit-keyframes fadeOutRight{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}@keyframes fadeOutRight{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}.fadeOutRight{-webkit-animation-name:fadeOutRight;animation-name:fadeOutRight}@-webkit-keyframes fadeOutRightBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}@keyframes fadeOutRightBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}.fadeOutRightBig{-webkit-animation-name:fadeOutRightBig;animation-name:fadeOutRightBig}@-webkit-keyframes fadeOutUp{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}@keyframes fadeOutUp{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}.fadeOutUp{-webkit-animation-name:fadeOutUp;animation-name:fadeOutUp}@-webkit-keyframes fadeOutUpBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}@keyframes fadeOutUpBig{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}.fadeOutUpBig{-webkit-animation-name:fadeOutUpBig;animation-name:fadeOutUpBig}@-webkit-keyframes flip{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,-360deg);transform:perspective(400px) rotate3d(0,1,0,-360deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}40%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}50%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}80%{-webkit-transform:perspective(400px) scale3d(.95,.95,.95);transform:perspective(400px) scale3d(.95,.95,.95);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}100%{-webkit-transform:perspective(400px);transform:perspective(400px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}}@keyframes flip{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,-360deg);transform:perspective(400px) rotate3d(0,1,0,-360deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}40%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}50%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}80%{-webkit-transform:perspective(400px) scale3d(.95,.95,.95);transform:perspective(400px) scale3d(.95,.95,.95);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}100%{-webkit-transform:perspective(400px);transform:perspective(400px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}}.animated.flip{-webkit-backface-visibility:visible;backface-visibility:visible;-webkit-animation-name:flip;animation-name:flip}@-webkit-keyframes flipInX{from{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(1,0,0,10deg);transform:perspective(400px) rotate3d(1,0,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-5deg);transform:perspective(400px) rotate3d(1,0,0,-5deg)}100%{-webkit-transform:perspective(400px);transform:perspective(400px)}}@keyframes flipInX{from{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(1,0,0,10deg);transform:perspective(400px) rotate3d(1,0,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-5deg);transform:perspective(400px) rotate3d(1,0,0,-5deg)}100%{-webkit-transform:perspective(400px);transform:perspective(400px)}}.flipInX{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;-webkit-animation-name:flipInX;animation-name:flipInX}@-webkit-keyframes flipInY{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-20deg);transform:perspective(400px) rotate3d(0,1,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(0,1,0,10deg);transform:perspective(400px) rotate3d(0,1,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-5deg);transform:perspective(400px) rotate3d(0,1,0,-5deg)}100%{-webkit-transform:perspective(400px);transform:perspective(400px)}}@keyframes flipInY{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-20deg);transform:perspective(400px) rotate3d(0,1,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(0,1,0,10deg);transform:perspective(400px) rotate3d(0,1,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-5deg);transform:perspective(400px) rotate3d(0,1,0,-5deg)}100%{-webkit-transform:perspective(400px);transform:perspective(400px)}}.flipInY{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;-webkit-animation-name:flipInY;animation-name:flipInY}@-webkit-keyframes flipOutX{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);opacity:1}100%{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);opacity:0}}@keyframes flipOutX{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);opacity:1}100%{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);opacity:0}}.flipOutX{-webkit-animation-name:flipOutX;animation-name:flipOutX;-webkit-backface-visibility:visible!important;backface-visibility:visible!important}@-webkit-keyframes flipOutY{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-15deg);transform:perspective(400px) rotate3d(0,1,0,-15deg);opacity:1}100%{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);opacity:0}}@keyframes flipOutY{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-15deg);transform:perspective(400px) rotate3d(0,1,0,-15deg);opacity:1}100%{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);opacity:0}}.flipOutY{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;-webkit-animation-name:flipOutY;animation-name:flipOutY}@-webkit-keyframes lightSpeedIn{from{-webkit-transform:translate3d(100%,0,0) skewX(-30deg);transform:translate3d(100%,0,0) skewX(-30deg);opacity:0}60%{-webkit-transform:skewX(20deg);transform:skewX(20deg);opacity:1}80%{-webkit-transform:skewX(-5deg);transform:skewX(-5deg);opacity:1}100%{-webkit-transform:none;transform:none;opacity:1}}@keyframes lightSpeedIn{from{-webkit-transform:translate3d(100%,0,0) skewX(-30deg);transform:translate3d(100%,0,0) skewX(-30deg);opacity:0}60%{-webkit-transform:skewX(20deg);transform:skewX(20deg);opacity:1}80%{-webkit-transform:skewX(-5deg);transform:skewX(-5deg);opacity:1}100%{-webkit-transform:none;transform:none;opacity:1}}.lightSpeedIn{-webkit-animation-name:lightSpeedIn;animation-name:lightSpeedIn;-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}@-webkit-keyframes lightSpeedOut{from{opacity:1}100%{-webkit-transform:translate3d(100%,0,0) skewX(30deg);transform:translate3d(100%,0,0) skewX(30deg);opacity:0}}@keyframes lightSpeedOut{from{opacity:1}100%{-webkit-transform:translate3d(100%,0,0) skewX(30deg);transform:translate3d(100%,0,0) skewX(30deg);opacity:0}}.lightSpeedOut{-webkit-animation-name:lightSpeedOut;animation-name:lightSpeedOut;-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}@-webkit-keyframes rotateIn{from{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,-200deg);transform:rotate3d(0,0,1,-200deg);opacity:0}100%{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateIn{from{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,-200deg);transform:rotate3d(0,0,1,-200deg);opacity:0}100%{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:none;transform:none;opacity:1}}.rotateIn{-webkit-animation-name:rotateIn;animation-name:rotateIn}@-webkit-keyframes rotateInDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInDownLeft{-webkit-animation-name:rotateInDownLeft;animation-name:rotateInDownLeft}@-webkit-keyframes rotateInDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInDownRight{-webkit-animation-name:rotateInDownRight;animation-name:rotateInDownRight}@-webkit-keyframes rotateInUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInUpLeft{-webkit-animation-name:rotateInUpLeft;animation-name:rotateInUpLeft}@-webkit-keyframes rotateInUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-90deg);transform:rotate3d(0,0,1,-90deg);opacity:0}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-90deg);transform:rotate3d(0,0,1,-90deg);opacity:0}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInUpRight{-webkit-animation-name:rotateInUpRight;animation-name:rotateInUpRight}@-webkit-keyframes rotateOut{from{-webkit-transform-origin:center;transform-origin:center;opacity:1}100%{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,200deg);transform:rotate3d(0,0,1,200deg);opacity:0}}@keyframes rotateOut{from{-webkit-transform-origin:center;transform-origin:center;opacity:1}100%{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,200deg);transform:rotate3d(0,0,1,200deg);opacity:0}}.rotateOut{-webkit-animation-name:rotateOut;animation-name:rotateOut}@-webkit-keyframes rotateOutDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}}@keyframes rotateOutDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}}.rotateOutDownLeft{-webkit-animation-name:rotateOutDownLeft;animation-name:rotateOutDownLeft}@-webkit-keyframes rotateOutDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}@keyframes rotateOutDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}.rotateOutDownRight{-webkit-animation-name:rotateOutDownRight;animation-name:rotateOutDownRight}@-webkit-keyframes rotateOutUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}@keyframes rotateOutUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}100%{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}.rotateOutUpLeft{-webkit-animation-name:rotateOutUpLeft;animation-name:rotateOutUpLeft}@-webkit-keyframes rotateOutUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,90deg);transform:rotate3d(0,0,1,90deg);opacity:0}}@keyframes rotateOutUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}100%{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,90deg);transform:rotate3d(0,0,1,90deg);opacity:0}}.rotateOutUpRight{-webkit-animation-name:rotateOutUpRight;animation-name:rotateOutUpRight}@-webkit-keyframes hinge{0%{-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}20%,60%{-webkit-transform:rotate3d(0,0,1,80deg);transform:rotate3d(0,0,1,80deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}40%,80%{-webkit-transform:rotate3d(0,0,1,60deg);transform:rotate3d(0,0,1,60deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;opacity:1}100%{-webkit-transform:translate3d(0,700px,0);transform:translate3d(0,700px,0);opacity:0}}@keyframes hinge{0%{-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}20%,60%{-webkit-transform:rotate3d(0,0,1,80deg);transform:rotate3d(0,0,1,80deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}40%,80%{-webkit-transform:rotate3d(0,0,1,60deg);transform:rotate3d(0,0,1,60deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;opacity:1}100%{-webkit-transform:translate3d(0,700px,0);transform:translate3d(0,700px,0);opacity:0}}.hinge{-webkit-animation-name:hinge;animation-name:hinge}@-webkit-keyframes rollIn{from{opacity:0;-webkit-transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg)}100%{opacity:1;-webkit-transform:none;transform:none}}@keyframes rollIn{from{opacity:0;-webkit-transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg)}100%{opacity:1;-webkit-transform:none;transform:none}}.rollIn{-webkit-animation-name:rollIn;animation-name:rollIn}@-webkit-keyframes rollOut{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg);transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg)}}@keyframes rollOut{from{opacity:1}100%{opacity:0;-webkit-transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg);transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg)}}.rollOut{-webkit-animation-name:rollOut;animation-name:rollOut}@-webkit-keyframes zoomIn{from{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}50%{opacity:1}}@keyframes zoomIn{from{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}50%{opacity:1}}.zoomIn{-webkit-animation-name:zoomIn;animation-name:zoomIn}@-webkit-keyframes zoomInDown{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}@keyframes zoomInDown{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}.zoomInDown{-webkit-animation-name:zoomInDown;animation-name:zoomInDown}@-webkit-keyframes zoomInLeft{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(10px,0,0);transform:scale3d(.475,.475,.475) translate3d(10px,0,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}@keyframes zoomInLeft{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(10px,0,0);transform:scale3d(.475,.475,.475) translate3d(10px,0,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}.zoomInLeft{-webkit-animation-name:zoomInLeft;animation-name:zoomInLeft}@-webkit-keyframes zoomInRight{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}@keyframes zoomInRight{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}.zoomInRight{-webkit-animation-name:zoomInRight;animation-name:zoomInRight}@-webkit-keyframes zoomInUp{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}@keyframes zoomInUp{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}.zoomInUp{-webkit-animation-name:zoomInUp;animation-name:zoomInUp}@-webkit-keyframes zoomOut{from{opacity:1}50%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}100%{opacity:0}}@keyframes zoomOut{from{opacity:1}50%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}100%{opacity:0}}.zoomOut{-webkit-animation-name:zoomOut;animation-name:zoomOut}@-webkit-keyframes zoomOutDown{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}100%{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}@keyframes zoomOutDown{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}100%{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}.zoomOutDown{-webkit-animation-name:zoomOutDown;animation-name:zoomOutDown}@-webkit-keyframes zoomOutLeft{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(42px,0,0);transform:scale3d(.475,.475,.475) translate3d(42px,0,0)}100%{opacity:0;-webkit-transform:scale(.1) translate3d(-2000px,0,0);transform:scale(.1) translate3d(-2000px,0,0);-webkit-transform-origin:left center;transform-origin:left center}}@keyframes zoomOutLeft{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(42px,0,0);transform:scale3d(.475,.475,.475) translate3d(42px,0,0)}100%{opacity:0;-webkit-transform:scale(.1) translate3d(-2000px,0,0);transform:scale(.1) translate3d(-2000px,0,0);-webkit-transform-origin:left center;transform-origin:left center}}.zoomOutLeft{-webkit-animation-name:zoomOutLeft;animation-name:zoomOutLeft}@-webkit-keyframes zoomOutRight{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-42px,0,0);transform:scale3d(.475,.475,.475) translate3d(-42px,0,0)}100%{opacity:0;-webkit-transform:scale(.1) translate3d(2000px,0,0);transform:scale(.1) translate3d(2000px,0,0);-webkit-transform-origin:right center;transform-origin:right center}}@keyframes zoomOutRight{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-42px,0,0);transform:scale3d(.475,.475,.475) translate3d(-42px,0,0)}100%{opacity:0;-webkit-transform:scale(.1) translate3d(2000px,0,0);transform:scale(.1) translate3d(2000px,0,0);-webkit-transform-origin:right center;transform-origin:right center}}.zoomOutRight{-webkit-animation-name:zoomOutRight;animation-name:zoomOutRight}@-webkit-keyframes zoomOutUp{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}100%{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}@keyframes zoomOutUp{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(0.55,.055,.675,.19);animation-timing-function:cubic-bezier(0.55,.055,.675,.19)}100%{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(0.175,.885,.32,1);animation-timing-function:cubic-bezier(0.175,.885,.32,1)}}.zoomOutUp{-webkit-animation-name:zoomOutUp;animation-name:zoomOutUp}@-webkit-keyframes slideInDown{from{-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInDown{from{-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInDown{-webkit-animation-name:slideInDown;animation-name:slideInDown}@-webkit-keyframes slideInLeft{from{-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInLeft{from{-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInLeft{-webkit-animation-name:slideInLeft;animation-name:slideInLeft}@-webkit-keyframes slideInRight{from{-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInRight{from{-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInRight{-webkit-animation-name:slideInRight;animation-name:slideInRight}@-webkit-keyframes slideInUp{from{-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInUp{from{-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0);visibility:visible}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInUp{-webkit-animation-name:slideInUp;animation-name:slideInUp}@-webkit-keyframes slideOutDown{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}@keyframes slideOutDown{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}.slideOutDown{-webkit-animation-name:slideOutDown;animation-name:slideOutDown}@-webkit-keyframes slideOutLeft{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}@keyframes slideOutLeft{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}.slideOutLeft{-webkit-animation-name:slideOutLeft;animation-name:slideOutLeft}@-webkit-keyframes slideOutRight{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}@keyframes slideOutRight{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}.slideOutRight{-webkit-animation-name:slideOutRight;animation-name:slideOutRight}@-webkit-keyframes slideOutUp{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}@keyframes slideOutUp{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}100%{visibility:hidden;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}.slideOutUp{-webkit-animation-name:slideOutUp;animation-name:slideOutUp}' +
            ' @keyframes slideOutSlideInRight{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}20%,80%{visibility:hidden;-webkit-transform:translate3d(120%,0,0);transform:translate3d(120%,0,0)}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideOutSlideInRight{-webkit-animation-name:slideOutSlideInRight;animation-name:slideOutSlideInRight;-webkit-animation-duration:8s;animation-duration:8s;}@keyframes slideOutSlideInLeft{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}20%,80%{visibility:hidden;-webkit-transform:translate3d(-120%,0,0);transform:translate3d(-120%,0,0)}100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideOutSlideInLeft{-webkit-animation-name:slideOutSlideInLeft;animation-name:slideOutSlideInLeft;-webkit-animation-duration:8s;animation-duration:8s;}';
    }

    /******************************/

    function getTimeZone()
    {
        try{
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        catch(e) {
            error(e);
            return null;
        }
    }

    function isMobile(userAgent)
    {
        if(    userAgent.match(/Android/i)
            || userAgent.match(/webOS/i)
            || userAgent.match(/iPhone/i)
            || userAgent.match(/iPad/i)
            || userAgent.match(/iPod/i)
            || userAgent.match(/BlackBerry/i)
            || userAgent.match(/IEMobile/i)
            || userAgent.match(/Fennec/i)
            || userAgent.match(/Windows Phone/i)
            || userAgent.match(/IEMobile/i)
            || userAgent.match(/Opera Mini/i) )
        return true;

        return /Mobile|Opera Mobi/i.test(userAgent);
    }

    function isTouchScreenDevice()
    {
        return (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
    }

    function isAudioSupport()
    {
        return ('Audio' in window);
    }

    function isMobileByScreenWidth() {
        return ( ( window.innerWidth <= 800 ) && ( window.innerHeight <= 600 ) );
    }

    function getBrowser(userAgent)
    {
        if( /firefox/i.test(userAgent) )
            return 'firefox';

        if( /YaBrowser/i.test(userAgent) )
            return 'yandex';

        if( /Opera|OPR\/[0-9.]+/i.test(userAgent) )
            return 'opera';

        if( /Chrome/i.test(userAgent) )
            return 'chrome';

        if( /Safari/i.test(userAgent) )
            return 'safari';

        return false;
    }

    function heightEl(el)
    {
        console.log({
            height       : el.height,
            innerHeight  : el.innerHeight,
            offsetTop    : el.offsetTop,
            offsetHeight : el.offsetHeight,
            availHeight  : el.availHeight
        });
    }

    /******************************/

    function isSupportPromise()
    {
        return ('Promise' in window);
    }

    function isSupportFetch()
    {
        return ('fetch' in window) && isSupportPromise();
    }

    function error(msg)
    {
        if( isDebugMode() )
            alert("Error:"+msg);

        console.error(msg);
    }

    function log(msg)
    {
        if( isDebugMode() )
            console.log(msg);
            //alert(msg);
    }

    function isDebugMode()
    {
        return self.config.debug === true;
    }

    function extend(target)
    {
        if(!arguments[1])
            return;

        for(let i=1; i < arguments.length; i++)
        {
            let source = arguments[i];

            for(var prop in source)
            {
                if(source.hasOwnProperty(prop) === false)
                    continue;

                if( target[prop] !== null && typeof target[prop] === 'object' )
                    extend(target[prop], source[prop]);
                else
                    target[prop] = source[prop];
            }
        }
    }

    function storage()
    {
        return window.localStorage;
    }

    init();
};