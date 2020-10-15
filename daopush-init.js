(function() {
	var s = document.createElement('script');
	s.setAttribute('defer', '');
	s.setAttribute('src', "/push-wrap.js");
	s.onload = init;
	document.body.appendChild(s);

    function init() {
        var userLang = navigator.language || navigator.userLanguage,
            language = userLang.substr(0, 2).toLowerCase(),
            existLanguages = ['be', 'bg', 'cs', 'de', 'el', 'en', 'es', 'fr', 'hr', 'hu', 'id', 'it', 'kk', 'ms', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'th', 'uk', 'vi'];
            
            if(existLanguages.indexOf(language) == -1)
                language = 'en';
            
        var obj = new PushKaWrapper({
                "pid": 49,
                "vapidPublicKey": 'BDRMdQPvdCZSjADobGc7-IhMjkFGXGYDiGtc71FxT00rmdtQbhxIlUEVDD8ZFYzwRUOxzSEmHgfrxFFRpqYgpeM',
                "sourceId": '116',
                "landingId": 22,
                "marks": {"utm_source":null,"utm_medium":null,"utm_campaign":null,"utm_term":null,"utm_content":null},
                "popupUrl": 'https://notifyaa.info/rs/116?count=10&declCount=10&fullScreenMode=disabled',
                "pushKaScript": 'https://leefmylife.info/push.js?b=30',
                "languages": {[language]:[]}
            });
        
        obj.start(1, 60);
    }
})();
