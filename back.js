/*
 * Lampa: кнопка «Назад» в MSX
 *
 * В MSX Lampa открыта как веб-страница, и кнопка «Назад» на пульте делает шаг назад
 * по истории браузера. Lampa держит в истории один запасной шаг. Если он
 * кончается (быстрые нажатия, первые секунды после запуска, закрытие плеера),
 * следующий шаг уходит со страницы Lampa обратно в меню MSX.
 *
 * Плагин держит в истории несколько запасных шагов, поэтому «Назад» всегда остаётся
 * внутри Lampa: закрывает плеер, карточку, меню. Чтобы выйти в MSX, нажмите «Назад»
 * дважды на главном экране.
 */
(function () {
    'use strict';

    if (window.__lampa_back_guard) return;
    window.__lampa_back_guard = true;

    var GUARDS = 4;          // сколько запасных шагов держать в истории
    var EXIT_TIMEOUT = 2500; // окно для второго нажатия «Назад» на главном экране

    var leaving = false;
    var lastRootBack = 0;

    function pushGuard() {
        try { window.history.pushState({ lampa_back_guard: true }, '', window.location.href); } catch (e) {}
    }

    function atRoot() {
        try {
            var activities = Lampa.Activity.all();
            var name = Lampa.Controller.enabled().name;
            var body = document.body.classList;

            return activities.length <= 1 && name === 'content' &&
                !body.contains('menu--open') && !body.contains('settings--open');
        } catch (e) {
            return false;
        }
    }

    function notify(text) {
        try { Lampa.Noty.show(text); } catch (e) {}
    }

    // Слушатель в фазе перехвата: срабатывает раньше обработчика Lampa
    window.addEventListener('popstate', function (event) {
        if (leaving) {
            // Идём назад по истории, пока не уйдём со страницы Lampa в MSX
            event.stopImmediatePropagation();
            window.history.back();
            return;
        }

        if (atRoot()) {
            var now = Date.now();

            if (now - lastRootBack < EXIT_TIMEOUT) {
                leaving = true;
                event.stopImmediatePropagation();
                window.history.back();
                return;
            }

            lastRootBack = now;
            notify('Нажмите «Назад» ещё раз, чтобы выйти');
        }

        // Восполняем запас после того, как Lampa обработает шаг назад
        setTimeout(pushGuard, 0);
    }, true);

    for (var i = 0; i < GUARDS; i++) pushGuard();

    console.log('BackGuard', 'ready, guards:', GUARDS);
})();
