(function () {
    'use strict';

    var PLUGIN_ID = 'ui_tweaks';
    var STYLE_ID = 'ui-tweaks-style';

    // Разделы настроек — отдельные страницы внутри «Настройка интерфейса»
    var PAGE_MENU = PLUGIN_ID + '_menu';
    var PAGE_FULL = PLUGIN_ID + '_full';
    var PAGE_SETTINGS = PLUGIN_ID + '_settings';
    var PAGE_ONLINE = PLUGIN_ID + '_online';
    var PAGE_CARDS = PLUGIN_ID + '_cards';

    // Известные кнопки шапки Lampa: класс кнопки → подпись в настройках.
    // Кнопки, которые добавляют другие плагины, находятся автоматически (см. discoverHeadButtons)
    var HEAD_BUTTONS = {
        'open--search':    'Поиск',
        'open--broadcast': 'Трансляция',
        'notice--icon':    'Уведомления',
        'open--settings':  'Настройки',
        'open--profile':   'Профиль',
        'full--screen':    'Полный экран',
        'open--premium':   'Премиум'
    };

    // Служебные классы, по которым кнопку не опознать
    var SERVICE_CLASSES = ['head__action', 'selector', 'focus', 'hover', 'hide', 'active'];

    var MENU_ACTIVE_CLASS = 'ui-tweaks-menu-active';

    // В объекте активности запоминаем, из какого пункта меню она открыта
    var MENU_TAG = PLUGIN_ID + '_menu_action';

    // Пункт меню, который только что нажали: его получит следующая созданная активность
    var pendingMenuAction = null;

    var MENU_GROUP_CLASS = 'ui-tweaks-menu-group';
    var MENU_IN_MORE_CLASS = 'ui-tweaks-menu-in-more';
    var MENU_HIDDEN_CLASS = 'ui-tweaks-menu-hidden';
    var MENU_MORE_CASE_CLASS = 'ui-tweaks-menu-more';
    var MENU_MORE_ACTION = PLUGIN_ID + '_more';

    var FULL_SPLIT_CLASS = 'ui-tweaks-full-split';
    var FULL_SOURCE_CLASS = 'ui-tweaks-full-source';

    // У копии кнопки источника снимаем классы, по которым её нашли бы вместо оригинала
    // (например, Lampac вставляет свою кнопку после .view--torrent)
    var FULL_SOURCE_STRIP = 'focus hide view--torrent view--online view--trailer lampac--button';
    var FULL_HINT_CLASS = 'ui-tweaks-full-hint';

    // Кнопка карточки убрана: скрыта совсем или перенесена в «⋯»
    var FULL_OFF_CLASS = 'ui-tweaks-full-off';

    // На кнопке — её описание для редактора, на карточке — кнопки, перенесённые в «⋯»
    var FULL_INFO_DATA = PLUGIN_ID + '_full_info';
    var FULL_MORE_DATA = PLUGIN_ID + '_full_more';
    var FULL_SELECTOR_DATA = PLUGIN_ID + '_full_selector';

    // Классы, по которым кнопку карточки не опознать
    var FULL_SERVICE_CLASSES = ['full-start__button', 'selector', 'focus', 'hover', 'hide', 'active', 'button--priority',
        FULL_SOURCE_CLASS, FULL_OFF_CLASS];

    // Общие классы источников: если у кнопки есть класс поточнее (lampac--button), ключом будет он
    var FULL_GENERIC_CLASSES = ['view--online', 'view--torrent', 'view--trailer'];

    var AI_RECOMMENDATIONS_ICON = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M10 2l2.1 5.9L18 10l-5.9 2.1L10 18l-2.1-5.9L2 10l5.9-2.1zM18.5 13l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z"/></svg>';
    var AI_FACTS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>';

    // Известные кнопки карточки. group: source — источник (на карточке, только когда источники вынесены),
    // play — штатная «Смотреть» (только когда не вынесены), ai — наши копии пунктов AI-ассистента из «⋯»,
    // row — остальные кнопки ряда. place — где кнопка по умолчанию, если не на карточке
    var FULL_BUTTONS = {
        'continue':          { label: 'Продолжить', group: 'source', icon: '<svg><use xlink:href="#sprite-play"></use></svg>' },
        'button--play':      { label: 'Смотреть', group: 'play', icon: '<svg><use xlink:href="#sprite-play"></use></svg>' },
        'view--torrent':     { label: 'Торренты', group: 'source', icon: '<svg><use xlink:href="#sprite-torrent"></use></svg>' },
        'view--trailer':     { label: 'Трейлеры', group: 'source', icon: '<svg><use xlink:href="#sprite-trailer"></use></svg>' },
        'button--book':      { label: 'Избранное', group: 'row', icon: '' },
        'button--reaction':  { label: 'Реакции', group: 'row', icon: '<svg><use xlink:href="#sprite-reaction"></use></svg>' },
        'button--subscribe': { label: 'Подписка', group: 'row', icon: '' },
        'button--options':   { label: 'Ещё (⋯)', group: 'row', icon: '<svg><use xlink:href="#sprite-dots"></use></svg>' },
        'button--ai-recommendations': { label: 'Рекомендации', group: 'ai', place: 'more', icon: AI_RECOMMENDATIONS_ICON },
        'button--ai-facts':           { label: 'Интересные факты', group: 'ai', place: 'more', icon: AI_FACTS_ICON }
    };

    // Пункты AI-ассистента Lampa добавляет в «⋯» сама, после плагинов. Делаем вместо них кнопки,
    // которые открывают то же самое, — их можно вынести на карточку
    var FULL_AI_BUTTONS = [
        { key: 'button--ai-recommendations', component: 'ai_recommendations', lang: 'title_recomendations' },
        { key: 'button--ai-facts',           component: 'ai_facts',           lang: 'title_facts' }
    ];

    // Порядок по умолчанию; @группа — место для кнопок группы, которых нет в списке
    var FULL_DEFAULT_ORDER = ['continue', 'button--play', '@online', 'view--torrent', '@source',
        'button--book', 'button--reaction', 'button--subscribe', '@row',
        'button--ai-recommendations', 'button--ai-facts'];

    // Сама «⋯» всегда на карточке и всегда последняя: через неё открываются перенесённые кнопки.
    // В редакторе её нет
    var FULL_LOCKED = ['button--options'];

    // Открытые карточки: { activity, start }. Настройки открываются поверх карточки —
    // после сохранения редактора её кнопки раскладываются заново
    var fullStarts = [];

    // С какого процента серия считается досмотренной: «Продолжить» включит следующую
    var CONTINUE_DONE_PERCENT = 99;

    // Сколько ждём список серий от Lampac, мс
    var AUTOPLAY_TIMEOUT = 20000;

    // Пункты фильтра онлайн-источника (Lampac и похожие), которые выносим отдельными кнопками, — в этом порядке
    var ONLINE_FILTER_TYPES = ['season', 'voice'];
    var ONLINE_FILTER_CLASS = 'ui-tweaks-online-filter';
    var ONLINE_FILTER_DATA = PLUGIN_ID + '_online_filter';
    // У «Фильтра» остаётся только сброс — выбранное и так видно на кнопках
    var ONLINE_FILTER_SHORT_CLASS = 'ui-tweaks-online-filter-short';
    // На «Фильтре» источника — сам фильтр и все его пункты: по ним переключаем сезон без меню
    var ONLINE_FILTER_SOURCE_DATA = PLUGIN_ID + '_online_filter_source';

    // Кнопка сезона/перевода, на которую вернуть фокус, пока источник заново грузит список: { btn, until }
    var onlineFilterFocus = null;

    // Постеры в списках: своя полоска прогресса, панель при фокусе, строка под названием и цвет рейтинга
    var CARD_PROGRESS_CLASS = 'ui-tweaks-card-progress';
    var CARD_PROGRESSED_CLASS = 'ui-tweaks-card-progressed';
    // Панель прогресса при фокусе — вместо штатной плашки, которую Lampa рисует с задержкой
    var CARD_PANEL_CLASS = 'ui-tweaks-card-panel';
    var CARD_PANELED_CLASS = 'ui-tweaks-card-paneled';
    var CARD_META_CLASS = 'ui-tweaks-card-meta';
    var CARD_AGE_CLASS = 'ui-tweaks-card-age';
    var CARD_VOTE_CLASS = 'ui-tweaks-card-vote';
    // Части рейтинга для видов «кольцо», «ярлык», «шкала», «точка»; рейтинг справа от года
    var CARD_VOTE_NUM_CLASS = 'ui-tweaks-card-vote-num';
    var CARD_VOTE_SRC_CLASS = 'ui-tweaks-card-vote-src';
    var CARD_VOTE_SCALE_CLASS = 'ui-tweaks-card-vote-scale';
    var CARD_VOTE_ON_CLASS = 'ui-tweaks-card-vote-on';
    var CARD_VOTE_DOT_CLASS = 'ui-tweaks-card-vote-dot';
    var CARD_YEAR_VOTE_CLASS = 'ui-tweaks-card-year-vote';
    // Исходный текст рейтинга: вид меняет его содержимое, а Lampa сама его больше не пишет
    var CARD_VOTE_TEXT = PLUGIN_ID + '_vote_text';
    var CARD_VOTE_COLORS = { high: '#4cd17f', mid: '#ffc93c', low: '#ff6b6b' };

    var LIST_ICON ='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zm-4 6h2v2H3zm4 0h14v2H7z"/></svg>';

    var EDIT_SECTION_CLASS = 'ui-tweaks-edit-section';
    var EDIT_OFF_CLASS = 'ui-tweaks-edit-off';

    // Группы левого меню в порядке показа; top — пункты над первой группой, без заголовка
    var MENU_GROUPS = [
        { id: 'top',     title: '' },
        { id: 'watch',   title: 'Смотреть' },
        { id: 'my',      title: 'Моё' },
        { id: 'find',    title: 'Найти' },
        { id: 'service', title: 'Сервисы' }
    ];


    // Кнопку редактора Lampa прячем: меню теперь редактируется в настройках плагина
    var MENU_BOTTOM_HIDDEN_DEFAULT = ['edit'];

    // Куда по умолчанию попадают встроенные пункты; остальные (обычно от плагинов) — в «Ещё»
    var MENU_DEFAULT_GROUP = {
        main:       'top',
        movie:      'watch',
        tv:         'watch',
        cartoon:    'watch',
        anime:      'watch',
        favorite:   'my',
        history:    'my',
        subscribes: 'my',
        timetable:  'my',
        catalog:    'find',
        filter:     'find',
        relise:     'find',
        feed:       'find',
        myperson:   'more',
        mytorrents: 'service'
    };

    var SETTINGS_GROUP_CLASS = 'ui-tweaks-settings-group';
    var SETTINGS_HIDDEN_CLASS = 'ui-tweaks-settings-hidden';

    // Группы главного экрана настроек в порядке показа
    var SETTINGS_GROUPS = [
        { id: 'main',    title: 'Основное' },
        { id: 'sources', title: 'Источники' },
        { id: 'account', title: 'Аккаунт' },
        { id: 'plugins', title: 'Плагины' },
        { id: 'system',  title: 'Система' }
    ];

    // Куда по умолчанию попадают встроенные разделы; остальные (от плагинов) — в «Плагины»
    var SETTINGS_DEFAULT_GROUP = {
        interface:            'main',
        content_rows:         'main',
        player:               'main',
        parental_control:     'main',
        appletv:              'main',
        parser:               'sources',
        server:               'sources',
        tmdb:                 'sources',
        account:              'account',
        remote_configuration: 'account',
        plugins:              'system',
        data:                 'system',
        more:                 'system',
        developer:            'system'
    };

    // Эти разделы не скрываем: без них не вернуть скрытое и не поставить плагины
    var SETTINGS_LOCKED = [PLUGIN_ID, 'plugins'];

    // Пункт «Ещё» живёт в отдельном блоке меню, чтобы редактор меню Lampa его не трогал
    var moreCase;

    // Пункты, убранные в «Ещё», в порядке показа
    var moreItems = [];

    // Если кнопку редактора Lampa вернули и открыли его, группы на это время сняты:
    // иначе стрелки «вверх/вниз» спотыкаются о заголовки
    var editingMenu = false;

    // Все известные кнопки шапки: класс → подпись. Встроенные и найденные у других плагинов
    var headButtons = {};

    function get(name, def) {
        return Lampa.Storage.get(PLUGIN_ID + '_' + name, def);
    }

    // Группы в сохранённом порядке; группы, которых в нём нет, — в конце, в исходном порядке
    function orderedGroups(groups, name) {
        var order = get(name, []);
        function rank(g, i) {
            var r = order.indexOf(g.id);
            return r >= 0 ? r : 100 + i;
        }
        return groups.map(function (g, i) {
            return { group: g, rank: rank(g, i) };
        }).sort(function (a, b) { return a.rank - b.rank; }).map(function (x) { return x.group; });
    }

    // Группы меню: «Вверху» всегда первая, остальные — в порядке из настроек
    function menuGroups() {
        return [MENU_GROUPS[0]].concat(orderedGroups(MENU_GROUPS.slice(1), 'menu_group_order'));
    }

    // Секции редактора меню. Нижний блок (под чертой) — отдельные списки Lampa,
    // туда попадают только его собственные пункты; «Ещё» — общая для всех
    function editSections() {
        return menuGroups().map(function (g) {
            return { id: g.id, title: g.title || 'Вверху' };
        }).concat([
            { id: 'bottom', title: 'Нижний блок' },
            { id: 'more',   title: 'Ещё' }
        ]);
    }

    function isOn(name, def) {
        var v = get(name, def || false);
        return v === true || v === 'true';
    }

    function headKey(cls) {
        return 'head_hide_' + cls.replace(/[^a-z0-9]+/gi, '_');
    }

    // Собираем CSS из текущих настроек и подменяем <style> целиком
    function buildCss() {
        var css = '';

        Object.keys(headButtons).forEach(function (cls) {
            if (isOn(headKey(cls))) css += '.head .head__action.' + cls + ' { display: none !important; }\n';
        });

        if (isOn('head_hide_time')) css += '.head .head__time { display: none !important; }\n';

        // Стрелка и ☰ появляются только при управлении мышью (браузер, указка LG)
        if (isOn('head_hide_backward')) css += '.head .head__backward { display: none !important; }\n';
        if (isOn('head_hide_menu_icon')) css += '.head .head__menu-icon { display: none !important; }\n';

        // Подсветка не должна перебивать белый фон пункта под фокусом
        var active = '.menu .menu__item.' + MENU_ACTIVE_CLASS + ':not(.focus):not(.hover):not(.traverse)';
        var style = get('menu_active_style', 'none');
        if (style === 'bg') css += active + ' { background-color: rgba(255, 255, 255, 0.15); }\n';
        if (style === 'line') css += active + ' { box-shadow: inset 0.25em 0 0 #fff; }\n';
        if (style === 'outline') css += active + ' { box-shadow: inset 0 0 0 0.15em rgba(255, 255, 255, 0.5); }\n';
        if (style === 'dot') {
            css += active + '::before { content: ""; position: absolute; left: 0.3em; top: 50%; ' +
                'width: 0.4em; height: 0.4em; margin-top: -0.2em; border-radius: 50%; background: #fff; }\n';
        }
        // Толщина шрифта пунктов. На телевизорах штатный шрифт часто выглядит слишком тонким
        var weight = parseInt(get('menu_font_weight', 'default'), 10) || 0;
        if (weight) css += '.menu .menu__text { font-weight: ' + weight + '; }\n';
        // Тёмный текст на белом фоне выделенного пункта выглядит тоньше светлого на чёрном — ему своя толщина
        var focusWeight = parseInt(get('menu_focus_font_weight', 'default'), 10) || 0;
        if (focusWeight) {
            css += ['focus', 'hover', 'traverse'].map(function (cls) {
                return '.menu .menu__item.' + cls + ' .menu__text';
            }).join(', ') + ' { font-weight: ' + focusWeight + '; }\n';
        }
        // «Жирный текст» должен быть заметно толще остальных пунктов, какую бы толщину ни выбрали
        if (style === 'bold') css += active + ' .menu__text { font-weight: ' + Math.min(900, Math.max(600, weight + 200)) + '; }\n';
        // Остальные пункты приглушаются, текущий остаётся ярким — заметно и в меню-полоске
        if (style === 'dim') {
            css += '.menu .menu__item:not(.' + MENU_ACTIVE_CLASS + '):not(.focus):not(.hover):not(.traverse) { opacity: 0.5; }\n';
        }

        // Группы меню. Черта повторяет штатный .menu__split
        var group = '.menu .' + MENU_GROUP_CLASS;
        var line = 'width: 2.3em; margin: 0.8em 0 0.8em 1.1em; padding: 0; border-top: 2px solid rgba(255, 255, 255, 0.1);';
        var strip = 'body.menu--always:not(.menu--open) ' + group;
        css += '.menu .menu__item.' + MENU_IN_MORE_CLASS + ' { display: none !important; }\n';
        css += group + ' { ' + line + ' }\n';
        css += group + '--title { width: auto; border-top: 0; margin: 1.2em 0 0.3em; padding-left: 1.5em; }\n';
        css += group + '--title.' + MENU_GROUP_CLASS + '--first { margin-top: 0; }\n';
        css += group + '__title { font-size: 0.9em; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }\n';
        // В меню-полоске подписей нет: заголовок превращается в черту, а над первой группой черта не нужна
        css += strip + '--title { ' + line + ' }\n';
        css += strip + '__title { display: none; }\n';
        css += strip + '--first { display: none; }\n';
        css += '.menu .' + MENU_HIDDEN_CLASS + ' { display: none !important; }\n';

        // Редактор меню: строки — штатные .menu-edit-list__item, добавлены только заголовки секций
        css += '.' + EDIT_SECTION_CLASS + ' { padding: 1em 0.3em 0.4em; font-size: 0.9em; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; }\n';
        css += '.' + EDIT_SECTION_CLASS + ':first-child { padding-top: 0; }\n';
        css += '.' + EDIT_OFF_CLASS + ' .menu-edit-list__icon, .' + EDIT_OFF_CLASS + ' .menu-edit-list__title { opacity: 0.4; }\n';

        // Группы главного экрана настроек. Отступ заголовка совпадает с отступом .settings-folder
        var sgroup = '.settings .' + SETTINGS_GROUP_CLASS;
        css += '.settings .' + SETTINGS_HIDDEN_CLASS + ' { display: none !important; }\n';
        css += sgroup + ' { margin: 0.5em 2em; border-top: 2px solid rgba(255, 255, 255, 0.1); }\n';
        css += sgroup + '--title { border-top: 0; margin: 1.2em 0 0; padding: 0 2em; }\n';
        css += sgroup + '--first { margin-top: 0.5em; }\n';
        css += sgroup + '__title { font-size: 0.9em; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }\n';

        // Кнопки источников вынесены на карточку: закреплённая долгим нажатием копия Lampa их дублирует
        css += '.' + FULL_SPLIT_CLASS + ' .button--priority { display: none !important; }\n';
        css += '.full-start-new__buttons .' + FULL_OFF_CLASS + ' { display: none !important; }\n';
        // Кнопка при фокусе сжимается и разжимается (animation-button-focus). Если часто двигать фокус,
        // браузер не всегда дорисовывает фон вокруг неё — остаются полоски. Отдельный слой у каждой кнопки это лечит
        css += '.full-start-new__buttons .full-start__button { will-change: transform; backface-visibility: hidden; }\n';
        // Lampa прижимает описание к низу постера — без реакций оно сползает вниз.
        // Поэтому либо выравниваем по верху, либо прячем реакции, сохраняя их место
        var reactions = get('full_reactions', 'show');
        if (reactions === 'top') {
            css += '.full-start-new__reactions { display: none !important; }\n';
            css += '.full-start-new__body { align-items: flex-start; }\n';
        }
        if (reactions === 'space') css += '.full-start-new__reactions { visibility: hidden; }\n';
        // Lampa обрезает описание в «Подробно» по высоте 41vh и гасит низ маской — показываем текст целиком
        if (isOn('full_descr_full', true)) {
            css += '.full-descr__text { max-height: none; overflow: visible; -webkit-mask-image: none; mask-image: none; }\n';
        }
        css += '.' + ONLINE_FILTER_SHORT_CLASS + ' > div { display: none !important; }\n';
        css += '.' + FULL_HINT_CLASS + ' { margin-top: 0.8em; font-size: 1.1em; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n';

        // Постеры в списках, обычные и широкие (.card--wide)
        css += cardCss();

        // Плотное меню: меньше воздуха между пунктами, чтобы список чаще помещался на экран
        if (isOn('menu_compact')) {
            css += '.menu .menu__item { padding-top: 0.6em; padding-bottom: 0.6em; }\n';
            css += '.menu .menu__item + li { margin-top: 0; }\n';
            css += '.menu .menu__text { font-size: 1.3em; }\n';
            css += '.menu .menu__split, ' + group + ' { margin-top: 0.5em; margin-bottom: 0.5em; }\n';
            css += group + '--title { margin-top: 0.8em; margin-bottom: 0.2em; }\n';
            css += group + '--title.' + MENU_GROUP_CLASS + '--first { margin-top: 0; }\n';
        }

        return css;
    }

    // Постеры в списках: рейтинг, качество, TV, отметки (.card__icons) и прогресс просмотра — каждое по своей настройке
    function cardCss() {
        var css = '';
        var poster = '.card > .card__view';
        // У широкой карточки названия и года под постером нет, а внизу постера — название и описание
        var narrow = '.card:not(.card--wide)';
        var vote = poster + ' > .card__vote';
        var icons = poster + ' > .card__icons';
        var bar = '.' + CARD_PROGRESS_CLASS;
        var panel = '.' + CARD_PANEL_CLASS;
        var progressed = '.card > .' + CARD_PROGRESSED_CLASS;
        var focused = '.card.focus > .card__view > ';
        var hovered = '.card.hover > .card__view > ';

        var votePos = get('card_vote_pos', 'default');
        var voteLook = get('card_vote_look', 'default');
        var voteColor = get('card_vote_color', 'none');
        // Тёмная подложка рейтинга и отметок — насколько непрозрачная
        var badgeBg = 'rgba(0, 0, 0, ' + get('card_vote_bg', '0.7') + ')';
        var qualityPos = get('card_quality_pos', 'default');
        var typePos = get('card_type_pos', 'default');
        var iconsPos = get('card_icons_pos', 'default');
        var progress = get('card_progress', 'default');

        // Цвет по оценке: фоном или текстом. % в селекторе — место для уровня (--high, --mid, --low)
        function colors(sel, prop) {
            var list = prop === 'background'
                ? { high: 'rgba(33, 150, 83, 0.9)', mid: 'rgba(200, 140, 0, 0.9)', low: 'rgba(210, 60, 60, 0.9)' }
                : CARD_VOTE_COLORS;
            Object.keys(list).forEach(function (level) {
                css += sel.replace(/%/g, '--' + level) + ' { ' + prop + ': ' + list[level] + ' !important; }\n';
            });
        }

        // Качество (TS, BD) — штатно торчит за левый край на 3em от низа
        if (qualityPos === 'inside') css += poster + ' > .card__quality { left: 0.5em; }\n';
        if (qualityPos === 'top') css += poster + ' > .card__quality { left: 0.5em; top: 0.5em; bottom: auto; }\n';
        if (qualityPos === 'off') css += poster + ' > .card__quality { display: none; }\n';

        // TV — штатно торчит за левый край сверху. Качество бывает только у фильмов, TV — у сериалов, место у них общее
        if (typePos === 'inside') css += poster + ' > .card__type { left: 0.5em; top: 0.5em; }\n';
        if (typePos === 'off') css += poster + ' > .card__type { display: none; }\n';

        // Рейтинг: положение
        // Под названием и справа от года — только у обычных: у широких рейтинг остаётся на штатном месте
        if (votePos === 'off') css += vote + ' { display: none; }\n';
        if (votePos === 'title' || votePos === 'year') css += narrow + ' > .card__view > .card__vote { display: none; }\n';
        css += '.' + CARD_YEAR_VOTE_CLASS + ' { float: right; margin-left: 0.5em; }\n';
        if (votePos === 'top') css += vote + ' { top: ' + (iconsPos === 'corner' ? '2.4em' : '0.5em') + '; right: 0.5em; bottom: auto; }\n';
        if (votePos === 'bottom') css += vote + ' { top: auto; right: 0.5em; bottom: 0.5em; }\n';
        // Напротив TS/BD, за правым краем
        if (votePos === 'edge') css += vote + ' { top: auto; right: -0.8em; bottom: 3em; }\n';

        // Рейтинг: вид
        if (voteLook === 'badge') {
            css += vote + ' { padding: 0.4em; font-size: 0.8em; font-weight: normal; line-height: normal; border-radius: 0.3em; ' +
                'background: ' + badgeBg + ' !important; }\n';
        }
        if (voteLook === 'text') {
            css += vote + ' { display: flex; align-items: center; padding: 0.25em 0.45em; font-size: 1.1em; line-height: 1; border-radius: 0.4em; ' +
                'background: ' + badgeBg + ' !important; text-shadow: none; }\n';
            // Звёздочка только у оценки: у «огоньков» CUB нет нашего класса. Отдельным блоком — чтобы встала по центру цифр
            css += vote + '.' + CARD_VOTE_CLASS + '::before { content: "★"; margin-right: 0.2em; font-size: 0.85em; line-height: 1; }\n';
        }

        var num = vote + ' .' + CARD_VOTE_NUM_CLASS;
        var leveled = vote + '.' + CARD_VOTE_CLASS + '%';
        var shadow = 'text-shadow: 0 0 0.4em rgba(0, 0, 0, 0.9), 0 0.05em 0.15em #000;';

        // Кольцо: обод — шкала от 0 до 100, закрашивается по оценке (conic-gradient ставится на месте, в decorateCard).
        // Где conic-gradient не поддерживается, остаётся сплошной светлый обод
        if (voteLook === 'ring') {
            css += vote + ' { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 2.4em; height: 2.4em; ' +
                'padding: 0.2em; font-size: 1em; border-radius: 50%; background-color: rgba(255, 255, 255, 0.3); }\n';
            css += num + ' { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 50%; ' +
                'background: rgba(0, 0, 0, 0.85); font-size: 0.8em; font-weight: 600; }\n';
        }

        // Ярлык: слева серый источник, справа число
        if (voteLook === 'label') {
            css += vote + ' { display: flex; padding: 0; font-size: 0.8em; font-weight: normal; line-height: normal; border-radius: 0.3em; ' +
                'overflow: hidden; background: none !important; }\n';
            css += vote + ' .' + CARD_VOTE_SRC_CLASS + ' { display: flex; align-items: center; padding: 0 0.45em; font-size: 0.75em; ' +
                'color: rgba(255, 255, 255, 0.7); background: rgba(45, 45, 45, 0.92); }\n';
            css += num + ' { padding: 0.4em 0.45em; font-weight: 600; background: ' + badgeBg + '; }\n';
        }

        // Лента: свисает с верхнего края, низ вырезан «ласточкиным хвостом»
        if (voteLook === 'ribbon') {
            css += vote + ' { top: 0; bottom: auto !important; padding: 0.45em 0.4em 0.85em; font-size: 0.85em; font-weight: 600; line-height: 1; ' +
                'border-radius: 0; background: ' + badgeBg + ' !important; ' +
                '-webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%); }\n';
        }

        // Мини-шкала: число и 10 делений, закрашенных по оценке
        if (voteLook === 'scale') {
            css += vote + ' { display: flex; align-items: center; padding: 0.3em 0.45em; font-size: 0.8em; font-weight: 600; line-height: 1; ' +
                'border-radius: 0.3em; background: ' + badgeBg + ' !important; }\n';
            css += vote + ' .' + CARD_VOTE_SCALE_CLASS + ' { display: flex; margin-left: 0.4em; }\n';
            css += vote + ' .' + CARD_VOTE_SCALE_CLASS + ' > i { width: 0.3em; height: 0.65em; margin-left: 0.1em; border-radius: 0.05em; background: rgba(255, 255, 255, 0.25); }\n';
            css += vote + ' .' + CARD_VOTE_SCALE_CLASS + ' > i.' + CARD_VOTE_ON_CLASS + ' { background: #fff; }\n';
        }

        // Точка: цвет несёт маленькая точка, текст без плашки
        if (voteLook === 'dot') {
            css += vote + ' { display: flex; align-items: center; padding: 0.2em 0.3em; font-size: 1em; font-weight: 600; background: none !important; ' + shadow + ' }\n';
            css += vote + ' .' + CARD_VOTE_DOT_CLASS + ' { width: 0.45em; height: 0.45em; margin-right: 0.35em; border-radius: 50%; background: #fff; ' +
                'box-shadow: 0 0 0.3em rgba(0, 0, 0, 0.8); }\n';
        }

        // Рейтинг: цвет. У ярлыка красится число; у шкалы и точки — деления и точка, фон или цифра — неважно;
        // у кольца — обод (ставится в renderVote)
        if (voteColor !== 'none') {
            var prop = voteColor === 'bg' ? 'background' : 'color';
            if (voteLook === 'label') colors(leveled + ' .' + CARD_VOTE_NUM_CLASS, prop);
            else if (voteLook === 'scale') colors(leveled + ' .' + CARD_VOTE_SCALE_CLASS + ' > i.' + CARD_VOTE_ON_CLASS, 'background');
            else if (voteLook === 'dot') colors(leveled + ' .' + CARD_VOTE_DOT_CLASS, 'background');
            else if (voteLook !== 'ring') colors(leveled, prop);
            colors('.' + CARD_META_CLASS + ' .' + CARD_VOTE_CLASS + '%', 'color');
        }

        if (isOn('card_vote_focus')) css += '.card:not(.focus):not(.hover) > .card__view > .card__vote { display: none; }\n';

        // Отметки (история, закладка, лайк, «позже») — штатно таблетка сверху по центру
        if (iconsPos === 'off') css += icons + ' { display: none; }\n';
        if (iconsPos === 'default') css += icons + ' .card__icons-inner { background: ' + badgeBg + ' !important; }\n';
        // Вкладка в правом верхнем углу
        if (iconsPos === 'corner') {
            css += icons + ' { top: 0; left: auto; right: 0; justify-content: flex-end; }\n';
            css += icons + ' .card__icons-inner { padding: 0.15em 0.3em; border-radius: 0 1em 0 0.8em; background: ' + badgeBg + ' !important; }\n';
            css += icons + ' .card__icons-inner:empty { display: none; }\n';
        }
        // Бейдж за левым краем, как TV: под TV, а у фильма — на его месте
        if (iconsPos === 'edge') {
            css += icons + ' { top: 1.4em; left: -0.8em; right: auto; justify-content: flex-start; }\n';
            if (typePos === 'default') css += '.card--tv' + icons + ' { top: 3.4em; }\n';
            css += icons + ' .card__icons-inner { border-radius: 0.3em; background: ' + badgeBg + ' !important; }\n';
            css += icons + ' .card__icon { width: 1.4em; height: 1.4em; }\n';
        }

        // Прогресс: штатную плашку заменяют своя полоска и (или) панель при фокусе
        if (progress !== 'default') css += poster + ' > .card-watched { display: none !important; }\n';

        if (progress === 'bar' || progress === 'both') {
            css += bar + ' { position: absolute; left: 0.6em; right: 0.6em; bottom: 0.6em; z-index: 1; pointer-events: none; }\n';
            css += bar + ' .time-line { margin: 0; background-color: rgba(0, 0, 0, 0.6); }\n';
            css += bar + ' .time-line > div { height: 0.25em; }\n';
            // Отметка закладки («Смотрю», «Просмотрено») и рейтинг внизу — над полоской
            css += progressed + ' > .card__marker { bottom: 1.2em; }\n';
            if (votePos === 'default' || votePos === 'bottom') css += progressed + ' > .card__vote { bottom: 1.2em; }\n';
        }
        // В фокусе полоску заменяет панель
        if (progress === 'both') css += focused + bar + ', ' + hovered + bar + ' { display: none; }\n';

        if (progress === 'panel' || progress === 'both') {
            css += panel + ' { display: none; position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; padding: 2.5em 0.8em 0.7em; ' +
                'border-radius: 0 0 1em 1em; pointer-events: none; background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.85)); }\n';
            css += focused + panel + ', ' + hovered + panel + ' { display: block; }\n';
            css += panel + ' > span { display: block; font-size: 0.75em; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n';
            css += panel + ' .time-line { margin-top: 0.3em; }\n';
            // У широкой карточки низ занят названием и описанием — панель на месте штатной плашки, слева сверху
            css += '.card--wide > .card__view > ' + panel + ' { top: 1em; left: 1.4em; right: 62%; bottom: auto; padding: 0.8em 1em; ' +
                'border-radius: 1em; background: rgba(0, 0, 0, 0.85); }\n';
            css += '.card--wide > .card__view > ' + panel + ' > span { font-size: 0.8em; }\n';
            // Рейтинг в нижнем углу в фокусе поднимается над полоской панели, на уровень текста, —
            // полоска идёт во всю ширину, а текст не заходит под рейтинг
            var paneled = '.' + CARD_PANELED_CLASS;
            // Центр строки текста — 1.75em от низа: отступ панели 0.7em, полоска с отступом 0.6em, половина строки 0.45em.
            // translateY(50%) ставит на эту линию центр рейтинга, какой бы высоты он ни был
            if ((votePos === 'default' || votePos === 'bottom') && voteLook !== 'ribbon') {
                css += narrow + '.focus > ' + paneled + ' > .card__vote, ' + narrow + '.hover > ' + paneled + ' > .card__vote { bottom: 1.75em; transform: translateY(50%); }\n';
                css += vote + ' { transition: bottom 0.15s, transform 0.15s; }\n';
                // Справа у текста — место под рейтинг (ширина в em постера, у текста шрифт 0.75em); не влезает — многоточие
                var width = { badge: 3, ring: 3, label: 4.5, scale: 5.5 }[voteLook] || 4;
                css += narrow + ' > .card__view > ' + panel + ' > span { padding-right: ' + (width / 0.75).toFixed(2) + 'em; }\n';
            }
            // Отметка закладки слева легла бы на текст панели, а выше — бейдж качества: на время фокуса прячем
            css += narrow + '.focus > ' + paneled + ' > .card__marker, ' + narrow + '.hover > ' + paneled + ' > .card__marker { display: none; }\n';
            // Бейджи — поверх градиента панели, иначе он их притеняет
            css += vote + ', ' + poster + ' > .card__quality, ' + poster + ' > .card__type { z-index: 2; }\n';
        }

        return css;
    }

    function applyStyles() {
        var el = document.getElementById(STYLE_ID);
        if (!el) {
            el = document.createElement('style');
            el.id = STYLE_ID;
            document.head.appendChild(el);
        }
        el.textContent = buildCss();
    }

    function makeParam(page, name, type, def, title, descr) {
        return {
            component: page,
            param: { name: PLUGIN_ID + '_' + name, type: type, default: def },
            field: { name: title, description: descr || '' },
            onChange: applyStyles
        };
    }

    function param(page, name, type, def, title, descr) {
        Lampa.SettingsApi.addParam(makeParam(page, name, type, def, title, descr));
    }

    function title(page, name, text) {
        Lampa.SettingsApi.addParam({
            component: page,
            param: { name: PLUGIN_ID + '_' + name, type: 'title' },
            field: { name: text }
        });
    }

    // Пункт, открывающий вложенную страницу; «назад» возвращает в корень плагина на тот же пункт
    function pageLink(index, page, text, descr) {
        Lampa.Template.add('settings_' + page, '<div></div>');
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: page, type: 'button' },
            field: { name: text, description: descr },
            onChange: function () {
                Lampa.Settings.create(page, {
                    onBack: function () {
                        Lampa.Settings.create(PLUGIN_ID, { last_index: index });
                    }
                });
            }
        });
    }

    // Найденные кнопки хранятся как { класс: подпись }; раньше хранился просто список классов
    function loadHeadButtons() {
        Object.keys(HEAD_BUTTONS).forEach(function (cls) {
            headButtons[cls] = HEAD_BUTTONS[cls];
        });

        var found = Lampa.Storage.get(PLUGIN_ID + '_head_found', {});
        if (Array.isArray(found)) {
            found.forEach(function (cls) { headButtons[cls] = cls; });
        } else {
            Object.keys(found).forEach(function (cls) { headButtons[cls] = found[cls]; });
        }
    }

    // Ищем в шапке кнопки, которых нет в списке (например, от других плагинов).
    // Запоминаем их, чтобы после перезапуска скрывать сразу, ещё до появления в шапке
    function discoverHeadButtons() {
        var changed = false;

        $('.head .head__action').each(function () {
            var cls = (this.className || '').split(/\s+/).filter(function (c) {
                return c && SERVICE_CLASSES.indexOf(c) === -1;
            })[0];
            if (!cls || HEAD_BUTTONS[cls]) return;

            // Подпись могла сохраниться классом — заменяем её на title, как только он есть
            var label = this.getAttribute('title') || headButtons[cls] || cls;
            if (headButtons[cls] !== label) {
                headButtons[cls] = label;
                changed = true;
            }
        });

        if (changed) {
            var found = {};
            Object.keys(headButtons).forEach(function (cls) {
                if (!HEAD_BUTTONS[cls]) found[cls] = headButtons[cls];
            });
            Lampa.Storage.set(PLUGIN_ID + '_head_found', found);
            applyStyles();
        }
    }

    // Пункт меню для активности: метка, поставленная при открытии, иначе — по компоненту
    // (нужно для первой активности после запуска, она открывается не из меню)
    function menuActionOf(object) {
        if (!object) return null;
        if (object[MENU_TAG]) return object[MENU_TAG];
        if (object.component === 'category') return object.url;
        return object.component;
    }

    function highlightMenu() {
        var action = menuActionOf(Lampa.Activity.active());
        $('.menu .menu__item').each(function () {
            $(this).toggleClass(MENU_ACTIVE_CLASS, !!action && $(this).data('action') === action);
        });

        // Раздел из «Ещё» отмечаем на самом «Ещё»
        if (moreCase) {
            var inMore = $('.menu .menu__item.' + MENU_IN_MORE_CLASS + '.' + MENU_ACTIVE_CLASS).length > 0;
            moreCase.find('.menu__item').toggleClass(MENU_ACTIVE_CLASS, inMore);
        }
    }

    function trackMenu() {
        Lampa.Listener.follow('menu', function (e) {
            if (e.type !== 'action') return;
            // Активность создаётся синхронно в том же обработчике. Если пункт ничего не открыл
            // (поиск, настройки), метка не должна достаться следующему переходу
            pendingMenuAction = e.action;
            setTimeout(function () { pendingMenuAction = null; }, 0);
        });

        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'init') {
                // На init текущей ещё считается предыдущая активность: карточка фильма,
                // открытая из «Фильмов», остаётся в разделе «Фильмы»
                e.object[MENU_TAG] = pendingMenuAction || menuActionOf(Lampa.Activity.active());
                pendingMenuAction = null;
            }
            if (e.type === 'start') highlightMenu();
        });

        highlightMenu();
    }

    // Пункт определяем по data-action, у пунктов без него — по подписи (как это делает редактор меню Lampa)
    function menuKey(el) {
        return String($(el).data('action') || $(el).find('.menu__text').text().trim());
    }

    function menuList() {
        return $('.menu .menu__list').eq(0);
    }

    // Блоки под чертой («Настройки», «О приложении»…), кроме нашего «Ещё»
    function bottomCases() {
        return $('.menu .menu__case.nosort').not('.' + MENU_MORE_CASE_CLASS);
    }

    // Все пункты меню. Основные (верхний список) хранят порядок и скрытие в настройках Lampa
    // (menu_sort / menu_hide, по подписи), пункты нижнего блока — у нас (по ключу)
    function collectMenuItems() {
        var items = [];
        function add(el, bottom) {
            items.push({
                el: el,
                key: menuKey(el),
                label: $(el).find('.menu__text').text().trim(),
                icon: $(el).find('.menu__ico').html(),
                bottom: bottom,
                index: items.length
            });
        }
        menuList().children('.menu__item').each(function () { add(this, false); });
        bottomCases().find('.menu__item').each(function () { add(this, true); });

        var sort = Lampa.Storage.get('menu_sort', '[]');
        var bottomOrder = get('menu_bottom_order', []);
        function rank(item) {
            var i = item.bottom ? bottomOrder.indexOf(item.key) : sort.indexOf(item.label);
            // Основные пункты всегда раньше пунктов нижнего блока — так они идут и в «Ещё»
            return (item.bottom ? 20000 : 0) + (i >= 0 ? i : 10000 + item.index);
        }
        return items.sort(function (a, b) { return rank(a) - rank(b); });
    }

    function canPlace(item, section) {
        if (section === 'more') return true;
        return item.bottom ? section === 'bottom' : section !== 'bottom';
    }

    function placeOf(item) {
        var place = get('menu_place', {})[item.key];
        if (place && canPlace(item, place)) return place;
        return item.bottom ? 'bottom' : MENU_DEFAULT_GROUP[item.key] || 'more';
    }

    function isHidden(item) {
        // Настройки не скрываем совсем: шестерёнку в шапке плагин тоже умеет прятать
        if (item.key === 'settings') return false;
        if (item.bottom) return get('menu_bottom_hidden', MENU_BOTTOM_HIDDEN_DEFAULT).indexOf(item.key) >= 0;
        return Lampa.Storage.get('menu_hide', '[]').indexOf(item.label) >= 0;
    }

    function groupHeader(title, mode, first) {
        var el = $('<li class="' + MENU_GROUP_CLASS + '"></li>');
        if (first) el.addClass(MENU_GROUP_CLASS + '--first');
        if (mode === 'titles') {
            el.addClass(MENU_GROUP_CLASS + '--title');
            el.append($('<div class="' + MENU_GROUP_CLASS + '__title"></div>').text(title));
        }
        return el;
    }

    // Раскладываем меню по секциям из редактора. «Группы» в настройках отвечают только за то,
    // как выглядит граница между группами. Lampa переставляет пункты при каждом появлении новых,
    // поэтому раскладка вызывается заново после неё
    function layoutMenu() {
        var list = menuList();
        if (!list.length) return;

        list.children('.' + MENU_GROUP_CLASS).remove();

        if (editingMenu) {
            list.children('.menu__item').removeClass(MENU_IN_MORE_CLASS);
            setMoreButton(false);
            return;
        }

        var items = collectMenuItems();
        var buckets = {};
        editSections().forEach(function (s) { buckets[s.id] = []; });
        items.forEach(function (item) {
            $(item.el).toggleClass('hidden', isHidden(item)).removeClass(MENU_IN_MORE_CLASS);
            buckets[placeOf(item)].push(item);
        });

        function visible(item) { return !$(item.el).hasClass('hidden'); }
        function els(arr) { return arr.map(function (item) { return item.el; }); }

        var mode = get('menu_groups', 'off');
        var empty = true;
        menuGroups().forEach(function (g) {
            var shown = buckets[g.id].some(visible);
            // Черта над самой первой группой не нужна, а заголовок — нужен
            if (mode !== 'off' && g.title && shown && (mode === 'titles' || !empty)) list.append(groupHeader(g.title, mode, empty));
            list.append(els(buckets[g.id]));
            if (shown) empty = false;
        });

        // Нижний блок собираем в первом из его списков; опустевшие списки прячем вместе с чертой над ними
        var bottomList = bottomCases().first().find('.menu__list');
        bottomList.append(els(buckets.bottom));

        moreItems = buckets.more;
        moreItems.forEach(function (item) {
            $(item.el).addClass(MENU_IN_MORE_CLASS).appendTo(item.bottom ? bottomList : list);
        });

        bottomCases().each(function () {
            var shown = $(this).find('.menu__item').not('.hidden').not('.' + MENU_IN_MORE_CLASS).length > 0;
            $(this).toggleClass(MENU_HIDDEN_CLASS, !shown);
            $(this).prev('.menu__split').toggleClass(MENU_HIDDEN_CLASS, !shown);
        });

        setMoreButton(moreItems.some(visible));
        highlightMenu();
    }

    function setMoreButton(show) {
        if (!moreCase) {
            moreCase = $('<div class="menu__case nosort ' + MENU_MORE_CASE_CLASS + '"><ul class="menu__list">' +
                '<li class="menu__item selector" data-action="' + MENU_MORE_ACTION + '">' +
                '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor">' +
                '<circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg></div>' +
                '<div class="menu__text">Ещё</div></li></ul></div>');
            moreCase.find('.menu__item').on('hover:enter', openMore);
        }

        // detach, а не remove: обработчики пункта нужны при следующем показе
        if (show && !moreCase.parent().length) moreCase.insertAfter($('.menu .menu__case').eq(0));
        if (!show) moreCase.detach();
    }

    function openMore() {
        var items = moreItems.filter(function (item) {
            return !$(item.el).hasClass('hidden');
        }).map(function (item) {
            return { title: item.label, element: item.el, selected: $(item.el).hasClass(MENU_ACTIVE_CLASS) };
        });

        Lampa.Select.show({
            title: 'Ещё',
            items: items,
            onSelect: function (a) {
                // Нажимаем на спрятанный пункт так, будто его выбрали в меню
                Lampa.Controller.toggle('menu');
                $(a.element).trigger('hover:enter');
                // Lampa запомнила спрятанный пункт как последний и при возврате в меню не смогла бы
                // на него встать — ушла бы на первый. Пусть последним будет «Ещё»
                moreCase.find('.menu__item').trigger('hover:hover');
            },
            onBack: function () {
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function trackMenuLayout() {
        var timer;
        function schedule() {
            clearTimeout(timer);
            timer = setTimeout(layoutMenu, 0);
        }

        // Lampa сохраняет порядок в menu_sort и сразу переставляет пункты — раскладываем после неё.
        // Сохранение при закрытии редактора Lampa означает и конец редактирования
        Lampa.Storage.listener.follow('change', function (e) {
            if (e.name !== 'menu_sort' && e.name !== 'menu_hide') return;
            editingMenu = false;
            schedule();
        });

        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'action' && e.action === 'edit') {
                editingMenu = true;
                layoutMenu();
            }
        });

        layoutMenu();
    }

    var EDIT_ARROW_UP = '<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
    var EDIT_ARROW_DOWN = '<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
    var EDIT_CHECK = '<svg width="26" height="26" viewBox="0 0 26 26" fill="none">' +
        '<rect x="1.89" y="1.78" width="21.79" height="21.79" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
        '<path d="M7.45 12.97L10.82 16.33L18.13 9.03" stroke="currentColor" stroke-width="3" class="dot" stroke-linecap="round"/></svg>';

    // Строка редактора — та же разметка, что у редактора меню Lampa, чтобы подхватились его стили.
    // item: key, label, icon (html), off — скрыт ли сейчас, locked — без флажка
    function editRow(item) {
        var row = $('<div class="menu-edit-list__item">' +
            '<div class="menu-edit-list__icon"></div>' +
            '<div class="menu-edit-list__title"></div>' +
            '<div class="menu-edit-list__move move-up selector">' + EDIT_ARROW_UP + '</div>' +
            '<div class="menu-edit-list__move move-down selector">' + EDIT_ARROW_DOWN + '</div>' +
            '<div class="menu-edit-list__toggle"></div>' +
            '</div>');
        row.data('item', item);
        row.find('.menu-edit-list__icon').append(item.icon);
        row.find('.menu-edit-list__title').text(item.label);

        row.find('.move-up').on('hover:enter', function () { moveRow(row, -1); });
        row.find('.move-down').on('hover:enter', function () { moveRow(row, 1); });

        // У неотключаемых пунктов флажка нет: пустой блок держит выравнивание
        if (!item.locked) {
            var toggle = row.find('.menu-edit-list__toggle').addClass('selector').html(EDIT_CHECK);
            var update = function () {
                toggle.find('.dot').attr('opacity', row.hasClass(EDIT_OFF_CLASS) ? 0 : 1);
            };
            toggle.on('hover:enter', function () {
                row.toggleClass(EDIT_OFF_CLASS);
                update();
            });
            row.toggleClass(EDIT_OFF_CLASS, !!item.off);
            update();
        }

        return row;
    }

    function isMainRow(row) {
        return !row.data('item').bottom;
    }

    // Ставим строку в другую секцию: сверху, если пришли сверху, иначе — в конец.
    // В «Ещё» основные пункты идут раньше пунктов нижнего блока
    function placeInSection(row, header, atEnd) {
        var main = isMainRow(row);
        var rows = header.nextUntil('.' + EDIT_SECTION_CLASS).not(row);
        var same = rows.filter(function () { return isMainRow($(this)) === main; });

        if (same.length) {
            if (atEnd) row.insertAfter(same.last());
            else row.insertBefore(same.first());
        } else if (main || !rows.length) {
            row.insertAfter(header);
        } else {
            row.insertAfter(rows.last());
        }
    }

    function moveRow(row, dir) {
        var item = row.data('item');
        function step(el) { return dir < 0 ? el.prev() : el.next(); }

        // Внутри «Ещё» основные пункты и пункты нижнего блока не перемешиваются — перескакиваем через чужие
        var sib = step(row);
        while (sib.length && !sib.hasClass(EDIT_SECTION_CLASS) && isMainRow(sib) !== !item.bottom) sib = step(sib);

        if (sib.length && !sib.hasClass(EDIT_SECTION_CLASS)) {
            if (dir < 0) row.insertBefore(sib);
            else row.insertAfter(sib);
            return;
        }

        // Край секции: переходим в ближайшую соседнюю, куда этому пункту можно
        var allowed = row.parent().data('canPlace');
        var header = row.prevAll('.' + EDIT_SECTION_CLASS).first();
        var next = (dir < 0 ? header.prevAll('.' + EDIT_SECTION_CLASS) : header.nextAll('.' + EDIT_SECTION_CLASS)).filter(function () {
            return allowed(item, $(this).data('section'));
        }).first();

        if (next.length) placeInSection(row, next, dir < 0);
    }

    // Обходим строки редактора по порядку: fn(item, секция, скрыт ли)
    function eachEditRow(list, fn) {
        var section;
        list.children().each(function () {
            var row = $(this);
            if (row.hasClass(EDIT_SECTION_CLASS)) section = row.data('section');
            else fn(row.data('item'), section, row.hasClass(EDIT_OFF_CLASS));
        });
    }

    // Общий редактор: секции с заголовками, строки со стрелками и флажком. Сохраняется при закрытии
    function openEditor(opts) {
        var list = $('<div class="menu-edit-list"></div>').data('canPlace', opts.canPlace);

        opts.sections.forEach(function (s) {
            list.append($('<div class="' + EDIT_SECTION_CLASS + '"></div>').text(s.title).data('section', s.id));
            opts.items.forEach(function (item) {
                if (opts.placeOf(item) === s.id) list.append(editRow(item));
            });
        });

        Lampa.Modal.open({
            title: opts.title,
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function () {
                Lampa.Modal.close();
                opts.onSave(list);
                Lampa.Controller.toggle('settings_component');
            }
        });
    }

    function saveMenuEditor(list) {
        var place = {};
        var bottomOrder = [];
        var bottomHidden = [];
        var sort = [];
        var hide = [];

        eachEditRow(list, function (item, section, off) {
            place[item.key] = section;

            if (item.bottom) {
                bottomOrder.push(item.key);
                if (off) bottomHidden.push(item.key);
            } else {
                sort.push(item.label);
                if (off) hide.push(item.label);
            }
        });

        // Пункты, которых сейчас нет в меню (например, отключённого плагина), оставляем в порядке Lampa
        Lampa.Storage.get('menu_sort', '[]').forEach(function (name) {
            if (sort.indexOf(name) === -1) sort.push(name);
        });

        Lampa.Storage.set(PLUGIN_ID + '_menu_place', place);
        Lampa.Storage.set(PLUGIN_ID + '_menu_bottom_order', bottomOrder);
        Lampa.Storage.set(PLUGIN_ID + '_menu_bottom_hidden', bottomHidden);
        // Порядок и скрытие основных пунктов — в настройках Lampa: без плагина меню останется таким же
        Lampa.Storage.set('menu_sort', sort);
        Lampa.Storage.set('menu_hide', hide);

        layoutMenu();
    }

    function openMenuEditor() {
        var items = collectMenuItems();
        items.forEach(function (item) {
            item.off = isHidden(item);
            item.locked = item.key === 'settings';
        });

        openEditor({
            title: 'Редактировать меню',
            sections: editSections(),
            items: items,
            placeOf: placeOf,
            canPlace: canPlace,
            onSave: saveMenuEditor
        });
    }

    // Последний показанный главный экран настроек: по нему строится редактор разделов
    var settingsBody;

    function settingsContainer() {
        return settingsBody ? settingsBody.find('.settings-folder').first().parent() : $();
    }

    // Разделы главного экрана настроек в сохранённом порядке; новые — в конце, в порядке Lampa
    function collectSettingsItems() {
        var items = [];
        settingsContainer().children('.settings-folder').each(function () {
            var key = String($(this).data('component'));
            items.push({
                el: this,
                key: key,
                label: $(this).find('.settings-folder__name').text().trim(),
                icon: $(this).find('.settings-folder__icon').html(),
                locked: SETTINGS_LOCKED.indexOf(key) >= 0,
                index: items.length
            });
        });

        var order = get('settings_order', []);
        function rank(item) {
            var i = order.indexOf(item.key);
            return i >= 0 ? i : 10000 + item.index;
        }
        return items.sort(function (a, b) { return rank(a) - rank(b); });
    }

    function settingsPlaceOf(item) {
        var place = get('settings_place', {})[item.key];
        var known = SETTINGS_GROUPS.some(function (g) { return g.id === place; });
        return known ? place : SETTINGS_DEFAULT_GROUP[item.key] || 'plugins';
    }

    function settingsGroups() {
        return orderedGroups(SETTINGS_GROUPS, 'settings_group_order');
    }

    function isSettingsHidden(item) {
        return !item.locked && get('settings_hidden', []).indexOf(item.key) >= 0;
    }

    function settingsHeader(title, mode, first) {
        var el = $('<div class="' + SETTINGS_GROUP_CLASS + '"></div>');
        if (first) el.addClass(SETTINGS_GROUP_CLASS + '--first');
        if (mode === 'titles') {
            el.addClass(SETTINGS_GROUP_CLASS + '--title');
            el.append($('<div class="' + SETTINGS_GROUP_CLASS + '__title"></div>').text(title));
        }
        return el;
    }

    // Lampa собирает список заново при каждом открытии настроек: разделы плагинов дописываются в конец.
    // Скрытые лишаются .selector, чтобы на них не попадал фокус
    function layoutSettings() {
        var container = settingsContainer();
        if (!container.length) return;

        container.children('.' + SETTINGS_GROUP_CLASS).remove();

        var items = collectSettingsItems();
        var buckets = {};
        SETTINGS_GROUPS.forEach(function (g) { buckets[g.id] = []; });
        items.forEach(function (item) {
            var hidden = isSettingsHidden(item);
            $(item.el).toggleClass(SETTINGS_HIDDEN_CLASS, hidden).toggleClass('selector', !hidden);
            buckets[settingsPlaceOf(item)].push(item);
        });

        var mode = get('settings_groups', 'titles');
        var empty = true;
        settingsGroups().forEach(function (g) {
            var shown = buckets[g.id].some(function (item) { return !$(item.el).hasClass(SETTINGS_HIDDEN_CLASS); });
            if (mode !== 'off' && shown && (mode === 'titles' || !empty)) container.append(settingsHeader(g.title, mode, empty));
            container.append(buckets[g.id].map(function (item) { return item.el; }));
            if (shown) empty = false;
        });
    }

    function trackSettingsLayout() {
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name !== 'main') return;
            settingsBody = e.body;

            // Раскладываем сразу, до того как Lampa соберёт список для фокуса
            layoutSettings();

            // Некоторые плагины вставляют разделы сами в этом же событии — если после нас, раскладываем ещё раз
            var count = settingsContainer().children('.settings-folder').length;
            setTimeout(function () {
                var container = settingsContainer();
                if (container.children('.settings-folder').length === count) return;

                layoutSettings();
                if (Lampa.Controller.enabled().name === 'settings') {
                    Lampa.Controller.collectionSet(container);
                    Lampa.Controller.collectionFocus(container.find('.selector.focus')[0] || false, container);
                }
            }, 0);
        });
    }

    function saveSettingsEditor(list) {
        var place = {};
        var order = [];
        var hidden = [];

        eachEditRow(list, function (item, section, off) {
            place[item.key] = section;
            order.push(item.key);
            if (off) hidden.push(item.key);
        });

        // Разделы, которых сейчас нет (отключённый плагин), сохраняют место, порядок и скрытие
        var present = order.slice();
        function absent(key) { return present.indexOf(key) === -1; }

        var oldPlace = get('settings_place', {});
        Object.keys(oldPlace).filter(absent).forEach(function (key) { place[key] = oldPlace[key]; });
        get('settings_order', []).filter(absent).forEach(function (key) { order.push(key); });
        get('settings_hidden', []).filter(absent).forEach(function (key) { hidden.push(key); });

        Lampa.Storage.set(PLUGIN_ID + '_settings_place', place);
        Lampa.Storage.set(PLUGIN_ID + '_settings_order', order);
        Lampa.Storage.set(PLUGIN_ID + '_settings_hidden', hidden);
    }

    // Порядок групп — отдельный список: только названия и стрелки, сохраняется в name при закрытии
    function openGroupsEditor(groups, name, onSave) {
        var list = $('<div class="menu-edit-list"></div>');

        groups.forEach(function (g) {
            var row = $('<div class="menu-edit-list__item">' +
                '<div class="menu-edit-list__title"></div>' +
                '<div class="menu-edit-list__move move-up selector">' + EDIT_ARROW_UP + '</div>' +
                '<div class="menu-edit-list__move move-down selector">' + EDIT_ARROW_DOWN + '</div>' +
                '</div>');
            row.data('group', g.id);
            row.find('.menu-edit-list__title').text(g.title);
            row.find('.move-up').on('hover:enter', function () { row.insertBefore(row.prev()); });
            row.find('.move-down').on('hover:enter', function () { row.insertAfter(row.next()); });
            list.append(row);
        });

        Lampa.Modal.open({
            title: 'Порядок групп',
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Storage.set(PLUGIN_ID + '_' + name, list.children().map(function () {
                    return $(this).data('group');
                }).get());
                if (onSave) onSave();
                Lampa.Controller.toggle('settings_component');
            }
        });
    }

    function openSettingsEditor() {
        var items = collectSettingsItems();
        items.forEach(function (item) { item.off = isSettingsHidden(item); });

        openEditor({
            title: 'Разделы настроек',
            sections: settingsGroups(),
            items: items,
            placeOf: settingsPlaceOf,
            canPlace: function () { return true; },
            onSave: saveSettingsEditor
        });
    }

    var HEAD_CLOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

    // Строка редактора шапки: иконка, подпись и флажок «показывать». Переключение применяется сразу
    function headRow(el, label, key, icon) {
        var row = $('<div class="menu-edit-list__item">' +
            '<div class="menu-edit-list__icon"></div>' +
            '<div class="menu-edit-list__title"></div>' +
            '<div class="menu-edit-list__toggle selector">' + EDIT_CHECK + '</div>' +
            '</div>');
        if (!icon) icon = $(el).is('svg') ? $(el).clone() : $(el).find('svg').first().clone();
        row.find('.menu-edit-list__icon').append(icon);
        row.find('.menu-edit-list__title').text(label);

        var toggle = row.find('.menu-edit-list__toggle');
        function update() {
            var off = isOn(key);
            row.toggleClass(EDIT_OFF_CLASS, off);
            toggle.find('.dot').attr('opacity', off ? 0 : 1);
        }
        toggle.on('hover:enter', function () {
            Lampa.Storage.set(PLUGIN_ID + '_' + key, !isOn(key));
            update();
            applyStyles();
        });
        update();

        return row;
    }

    // Показываем только то, что есть в шапке сейчас: у кнопок отключённых плагинов не взять иконку,
    // их настройка просто сохраняется
    function openHeadEditor() {
        discoverHeadButtons();

        var list = $('<div class="menu-edit-list"></div>');
        function section(text) {
            list.append($('<div class="' + EDIT_SECTION_CLASS + '"></div>').text(text));
        }

        section('Кнопки');
        $('.head .head__action').each(function () {
            var el = this;
            var cls = Object.keys(headButtons).filter(function (c) { return $(el).hasClass(c); })[0];
            if (cls) list.append(headRow(el, headButtons[cls], headKey(cls)));
        });

        // Стрелка и ☰ появляются только при управлении мышью (браузер, указка LG)
        section('Навигация');
        var back = $('.head .head__backward');
        var menuIcon = $('.head .head__menu-icon');
        if (back.length) list.append(headRow(back, 'Стрелка назад', 'head_hide_backward'));
        if (menuIcon.length) list.append(headRow(menuIcon, 'Кнопка меню', 'head_hide_menu_icon'));

        section('Прочее');
        list.append(headRow(null, 'Часы', 'head_hide_time', HEAD_CLOCK_ICON));

        Lampa.Modal.open({
            title: 'Кнопки шапки',
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('settings_component');
            }
        });
    }

    // Кнопки для редактора: известные и те, что попадались на карточках. Источники на карточке только
    // в режиме «отдельными кнопками», штатная «Смотреть» — только без него
    function collectFullItems() {
        var split = isOn('full_split', true);
        var found = get('full_btn_found', {});
        var all = {};
        Object.keys(FULL_BUTTONS).concat(Object.keys(found)).forEach(function (key) {
            var known = FULL_BUTTONS[key];
            var seen = found[key] || {};
            all[key] = {
                label: known ? known.label : seen.label || key,
                icon: seen.icon || known && known.icon || '',
                group: known ? known.group : seen.group || 'row'
            };
        });

        var items = Object.keys(all).filter(function (key) {
            var group = all[key].group;
            if (FULL_LOCKED.indexOf(key) >= 0 || group === 'ai' && !aiEnabled()) return false;
            return split ? group !== 'play' : group !== 'source' && group !== 'online';
        }).map(function (key, i) {
            return $.extend({ key: key, index: i }, all[key]);
        });
        return sortFullItems(items);
    }

    function saveFullEditor(list) {
        var place = {};
        var order = [];
        var hidden = [];

        eachEditRow(list, function (item, section, off) {
            place[item.key] = section;
            order.push(item.key);
            if (off) hidden.push(item.key);
        });

        // Кнопки, которых в редакторе не было (источники при выключенном режиме), сохраняют настройки
        var present = order.slice();
        function absent(key) { return present.indexOf(key) === -1; }

        var oldPlace = get('full_btn_place', {});
        Object.keys(oldPlace).filter(absent).forEach(function (key) { place[key] = oldPlace[key]; });
        get('full_btn_order', []).filter(absent).forEach(function (key) { order.push(key); });
        get('full_btn_hidden', []).filter(absent).forEach(function (key) { hidden.push(key); });

        Lampa.Storage.set(PLUGIN_ID + '_full_btn_place', place);
        Lampa.Storage.set(PLUGIN_ID + '_full_btn_order', order);
        Lampa.Storage.set(PLUGIN_ID + '_full_btn_hidden', hidden);

        relayoutActiveFull();
    }

    // Фокус Lampa соберёт сама, когда вернётся из настроек на карточку
    function relayoutActiveFull() {
        var active = Lampa.Activity.active();
        var found = active && fullStarts.filter(function (f) { return f.activity === active.activity; })[0];
        if (!found) return;

        var start = found.start;
        arrangeFullButtons(start);
        if (!start.last || !$(start.last).hasClass('selector')) start.last = firstFullButton(start);
    }

    function openFullEditor() {
        var items = collectFullItems();
        items.forEach(function (item) { item.off = isFullHidden(item); });

        openEditor({
            title: 'Кнопки карточки',
            sections: [
                { id: 'row',  title: 'На карточке' },
                { id: 'more', title: 'В меню «⋯»' }
            ],
            items: items,
            placeOf: fullPlaceOf,
            canPlace: function () { return true; },
            onSave: saveFullEditor
        });
    }

    // Онлайн — первой, торренты — второй, остальные источники (трейлеры, другие плагины) — следом
    function sourceRank(btn) {
        if (btn.hasClass('view--online')) return 0;
        if (btn.hasClass('view--torrent')) return 1;
        return 2;
    }

    // Источники Lampa держит в скрытом .buttons--container, а «Смотреть» показывает их списком.
    // Выносим копии кнопок в ряд и убираем «Смотреть». Оригиналы остаются на месте:
    // через них работает выбор серии из списка эпизодов
    function splitSourceButtons(start) {
        var row = start.html.find('.full-start-new__buttons');
        if (!row.length) return [];

        start.html.addClass(FULL_SPLIT_CLASS);
        start.html.find('.button--play').remove();

        var added = [];
        start.html.find('.buttons--container > .full-start__button').not('.hide').each(function () {
            var src = $(this);
            if (src.data(FULL_SOURCE_CLASS)) return;

            // Ключ и подпись берём у оригинала: у копии классы источника сняты, а подпись главной кнопки заменится
            var clon = src.clone().removeClass(FULL_SOURCE_STRIP).addClass(FULL_SOURCE_CLASS + ' selector');
            clon.data('rank', sourceRank(src));
            clon.data(FULL_INFO_DATA, describeFullButton(this, sourceRank(src) === 0 ? 'online' : 'source'));
            clon.on('hover:enter', function () {
                src.trigger('hover:enter');
            }).on('hover:focus', function () {
                start.last = clon[0];
            });
            src.data(FULL_SOURCE_CLASS, clon);
            added.push(clon);
        });

        row.append(added.map(function (b) { return b[0]; }));

        // Главная кнопка — первый онлайн-источник: ей достаются подпись и значок «Смотреть»,
        // а под кнопками — с каким источником и озвучкой откроется онлайн. Где она встанет, решает layoutFullButtons
        var main = row.children('.' + FULL_SOURCE_CLASS).filter(function () {
            return $(this).data('rank') === 0;
        }).first();
        if (main.length && !main.data('main')) {
            main.data('main', true);
            var cont = watchButtons(start, main);
            if (cont) {
                row.append(cont);
                added.push(cont);
            }
        }

        return added;
    }

    // Подпись главной кнопки, подсказка под кнопками и «Продолжить» (её вернём, если есть что продолжать)
    function watchButtons(start, main) {
        main.find('svg').replaceWith('<svg><use xlink:href="#sprite-play"></use></svg>');
        main.find('span').text(Lampa.Lang.translate('title_watch'));
        showLampacHint(start);
        return continueButton(start, main);
    }

    // Карточка не перерисовывается, когда к ней возвращаются из списка серий: «Продолжить» и подсказку
    // собираем заново — серия, сезон и озвучка могли смениться
    function refreshWatchButtons(start, activity) {
        var row = start.html.find('.full-start-new__buttons');
        var main = row.children('.' + FULL_SOURCE_CLASS).filter(function () {
            return $(this).data('main');
        }).first();
        if (!main.length) return;

        var old = row.children().filter(function () {
            var info = $(this).data(FULL_INFO_DATA);
            return info && info.key === 'continue';
        });
        var wasLast = old.length && start.last === old[0];
        old.remove();

        var cont = watchButtons(start, main);
        if (cont) row.append(cont);
        layoutFullButtons(start);

        if (wasLast) start.last = cont && cont.hasClass('selector') ? cont[0] : firstFullButton(start);

        var active = Lampa.Activity.active();
        if (!active || active.activity !== activity) return;
        if (Lampa.Controller.enabled().name !== 'full_start') return;

        Lampa.Controller.collectionSet(start.html);
        Lampa.Controller.collectionFocus(start.last || false, start.html);
    }

    // Ключ кнопки — её самый точный класс; у кнопок без классов — подпись
    function fullButtonKey(el) {
        var classes = (el.className || '').split(/\s+/).filter(function (c) {
            return c && FULL_SERVICE_CLASSES.indexOf(c) === -1;
        });
        var specific = classes.filter(function (c) { return FULL_GENERIC_CLASSES.indexOf(c) === -1; })[0];
        return specific || classes[0] || $(el).text().trim();
    }

    function describeFullButton(el, group) {
        var key = fullButtonKey(el);
        var known = FULL_BUTTONS[key];
        return {
            key: key,
            label: known ? known.label : el.getAttribute('title') || $(el).text().trim() || key,
            icon: $(el).find('svg').first().prop('outerHTML') || known && known.icon || '',
            group: known ? known.group : group
        };
    }

    function fullButtonInfo(el) {
        return $(el).data(FULL_INFO_DATA) || describeFullButton(el, 'row');
    }

    function defaultFullRank(item) {
        var i = FULL_DEFAULT_ORDER.indexOf(item.key);
        return i >= 0 ? i : FULL_DEFAULT_ORDER.indexOf('@' + item.group);
    }

    // Кнопки в сохранённом порядке; новые — в конце, в порядке по умолчанию
    function sortFullItems(items) {
        var order = get('full_btn_order', []);
        function rank(item) {
            if (FULL_LOCKED.indexOf(item.key) >= 0) return Infinity;
            var i = order.indexOf(item.key);
            return i >= 0 ? i : 10000 + defaultFullRank(item) * 100 + item.index;
        }
        return items.sort(function (a, b) { return rank(a) - rank(b); });
    }

    function fullPlaceOf(item) {
        if (FULL_LOCKED.indexOf(item.key) >= 0) return 'row';
        var place = get('full_btn_place', {})[item.key];
        if (place === 'row' || place === 'more') return place;
        var known = FULL_BUTTONS[item.key];
        return known && known.place || 'row';
    }

    function isFullHidden(item) {
        return FULL_LOCKED.indexOf(item.key) === -1 && get('full_btn_hidden', []).indexOf(item.key) >= 0;
    }

    // Запоминаем кнопки, которые видели на карточках: редактор в настройках строится по ним
    function rememberFullButtons(items) {
        var found = get('full_btn_found', {});
        var changed = false;
        items.forEach(function (item) {
            var saved = found[item.key];
            if (saved && saved.label === item.label && saved.icon === item.icon && saved.group === item.group) return;
            found[item.key] = { label: item.label, icon: item.icon, group: item.group };
            changed = true;
        });
        if (changed) Lampa.Storage.set(PLUGIN_ID + '_full_btn_found', found);
    }

    // Расставляем кнопки ряда по настройкам. Убранные лишаются .selector — фокус собирается по нему,
    // невидимость Lampa не проверяет
    function layoutFullButtons(start) {
        var row = start.html.find('.full-start-new__buttons');
        var items = row.children('.full-start__button').not('.button--priority').toArray().map(function (el, i) {
            var item = $.extend({}, fullButtonInfo(el));
            item.el = el;
            item.index = i;
            return item;
        }).filter(function (item) { return item.key; });

        rememberFullButtons(items);
        sortFullItems(items);

        var more = [];
        items.forEach(function (item) {
            var inMore = fullPlaceOf(item) === 'more';
            var off = inMore || isFullHidden(item);
            var el = $(item.el).toggleClass(FULL_OFF_CLASS, off);
            if (off && el.hasClass('selector')) el.data(FULL_SELECTOR_DATA, true).removeClass('selector');
            if (!off && el.data(FULL_SELECTOR_DATA)) el.removeData(FULL_SELECTOR_DATA).addClass('selector');
            if (inMore && !isFullHidden(item)) more.push(item.el);
        });

        row.append(items.map(function (item) { return item.el; }));
        start.html.data(FULL_MORE_DATA, more);
    }

    function firstFullButton(start) {
        return start.html.find('.full-start-new__buttons').children('.selector').not('.button--priority')[0];
    }

    function arrangeFullButtons(start) {
        if (isOn('full_split', true)) splitSourceButtons(start);
        addAiButtons(start);
        layoutFullButtons(start);
    }

    function aiEnabled() {
        var features = window.lampa_settings && window.lampa_settings.disable_features;
        return !(features && features.ai);
    }

    function addAiButtons(start) {
        if (!aiEnabled()) return;

        var row = start.html.find('.full-start-new__buttons');
        FULL_AI_BUTTONS.forEach(function (ai) {
            if (row.children('.' + ai.key).length) return;

            var btn = $('<div class="full-start__button selector ' + ai.key + '">' + FULL_BUTTONS[ai.key].icon + '<span></span></div>');
            btn.find('span').text(Lampa.Lang.translate(ai.lang));
            btn.on('hover:enter', function () {
                Lampa.Activity.push({ url: '', title: Lampa.Lang.translate(ai.lang), component: ai.component, card: start.card });
            }).on('hover:focus', function () {
                start.last = btn[0];
            });
            row.append(btn);
        });
    }

    // Перенесённые кнопки — первыми пунктами в меню «⋯». Нажатие передаём спрятанной кнопке
    function addFullOptions(e) {
        var html = e.link && e.link.html;
        var more = html && html.data(FULL_MORE_DATA);
        if (!more || !e.options) return;

        // Свои пункты AI-ассистента Lampa проверяет сразу после этого события: на этот момент
        // выключаем их, наши кнопки их заменяют. Заодно пропадает заголовок «AI-ассистент»
        var features = window.lampa_settings && window.lampa_settings.disable_features;
        if (features && !features.ai && html.find('.full-start-new__buttons > .button--ai-facts').length) {
            features.ai = true;
            setTimeout(function () { features.ai = false; }, 0);
        }

        var items = more.filter(function (el) {
            return !$(el).hasClass('hide');
        }).map(function (el) {
            // Без иконок: штатные пункты меню «⋯» тоже без них
            return {
                title: $(el).text().trim() || fullButtonInfo(el).label,
                onSelect: function () {
                    Lampa.Controller.toggle('content');
                    $(el).trigger('hover:enter');
                }
            };
        });

        e.options.unshift.apply(e.options, items);
    }

    // У сериала с историей перед «Смотреть» встаёт «Продолжить»: открывает Lampac и сам включает серию.
    // «Смотреть» тогда открывает список серий как обычно
    function continueButton(start, main) {
        var target = continueTarget(start.card);
        if (!target) return null;

        var src = start.html.find('.buttons--container > .view--online').first();
        var cont = $('<div class="full-start__button selector ' + FULL_SOURCE_CLASS + '">' +
            '<svg><use xlink:href="#sprite-play"></use></svg><span></span></div>');
        cont.find('span').text('Продолжить · S' + target.season + ' E' + target.episode);
        cont.data('rank', -1);
        cont.data(FULL_INFO_DATA, $.extend({ key: 'continue' }, FULL_BUTTONS['continue']));
        cont.on('hover:enter', function () {
            src.trigger('hover:enter');
            var active = Lampa.Activity.active();
            if (active && active.component === 'lampac') watchLampac(active.activity, target);
        }).on('hover:focus', function () {
            start.last = cont[0];
        });

        main.find('svg').replaceWith(LIST_ICON);
        main.find('span').text('Все серии');
        return cont;
    }

    // Какую серию включить: последнюю включённую, а если она досмотрена — следующую
    function continueTarget(card) {
        if (!card.number_of_seasons) return null;

        var own = isOn('full_continue_track', true) && get('continue_last', {})[continueKey(card)];
        var watched = own || lampacWatched(card);
        if (!watched) return null;

        var season = parseInt(watched.season, 10);
        var episode = parseInt(watched.episode, 10);
        if (!season || !episode) return null;

        // Своей записи нет (серии смотрели до плагина) — запись Lampac. Её он обновляет, только когда
        // серию включили из списка, а «следующая» в плеере её не трогает: досчитываем по прогрессу
        var count = seasonEpisodes(card, season);
        if (!own) {
            for (var ep = episode + 1; ep <= count; ep++) {
                if (Lampa.Timeline.view(episodeHash(card, season, ep)).percent > 0) episode = ep;
            }
        }

        if (Lampa.Timeline.view(episodeHash(card, season, episode)).percent >= CONTINUE_DONE_PERCENT) episode++;

        // Сезон досмотрен — первая серия следующего
        if (episode > count) {
            if (!isOn('full_continue_next_season', true) || season >= card.number_of_seasons) return null;
            season++;
            episode = 1;
        }

        return { season: season, episode: episode, hash: episodeHash(card, season, episode) };
    }

    // Ключ карточки — как у записи Lampac
    function continueKey(card) {
        return Lampa.Utils.hash(card.number_of_seasons ? card.original_name : card.original_title);
    }

    // Запоминаем серию, которую включили последней: и из списка, и «следующей» в плеере, и назад к старой
    function rememberEpisode(card, season, episode) {
        season = parseInt(season, 10);
        episode = parseInt(episode, 10);
        if (!card || !card.number_of_seasons || !season || !episode) return;
        if (!isOn('full_continue_track', true)) return;

        // Как Lampac со своей записью: cache сам оставляет последние 3000 сериалов
        var all = Lampa.Storage.cache(PLUGIN_ID + '_continue_last', 3000, {});
        all[continueKey(card)] = { season: season, episode: episode, time: Date.now() };
        Lampa.Storage.set(PLUGIN_ID + '_continue_last', all);
    }

    function trackContinue() {
        // Синхронизация между устройствами — та же, что у записи Lampac (аккаунт CUB)
        if (Lampa.Storage.sync) Lampa.Storage.sync(PLUGIN_ID + '_continue_last', 'object_object');

        // Плеер Lampa: любая серия из онлайна
        Lampa.Player.listener.follow('start', function (data) {
            var active = Lampa.Activity.active();
            if (!data || !data.isonline || !active || active.component !== 'lampac') return;
            rememberEpisode(active.movie, data.season, data.episode);
        });

        // Внешний плеер до start не доходит — берём запись, которую Lampac делает при выборе серии
        Lampa.Storage.listener.follow('change', function (e) {
            if (e.name !== 'online_watched_last') return;
            var active = Lampa.Activity.active();
            if (!active || active.component !== 'lampac' || !active.movie) return;
            var watched = lampacWatched(active.movie);
            if (watched) rememberEpisode(active.movie, watched.season, watched.episode);
        });
    }

    // Хэш прогресса серии — как hash_timeline в Lampac; он же стоит в data-hash полоски прогресса
    function episodeHash(card, season, episode) {
        return Lampa.Utils.hash([season, season > 10 ? ':' : '', episode, card.original_title].join(''));
    }

    // Сколько серий в сезоне по данным TMDB; если не знаем — ищем с запасом
    function seasonEpisodes(card, season) {
        var found = (card.seasons || []).filter(function (s) { return s.season_number === season; })[0];
        return found && found.episode_count ? found.episode_count : 100;
    }

    // Прогресс карточки из списка: у фильма — сам фильм, у сериала — последняя включённая серия
    function cardProgress(data) {
        if (!data.original_name) {
            if (!data.original_title) return null;
            var movie = Lampa.Utils.hash(data.original_title);
            var view = Lampa.Timeline.view(movie, timelineLink(data));
            view.hash = movie;
            return view.percent ? { view: view } : null;
        }

        var key = Lampa.Utils.hash(data.original_name);
        var last = isOn('full_continue_track', true) && get('continue_last', {})[key] ||
            Lampa.Storage.get('online_watched_last', {})[key];
        var season = last && parseInt(last.season, 10);
        var episode = last && parseInt(last.episode, 10);
        if (!season || !episode) return null;

        var hash = episodeHash(data, season, episode);
        var ep = Lampa.Timeline.view(hash, timelineLink(data, season, episode));
        ep.hash = hash;
        return { view: ep, season: season, episode: episode };
    }

    // Привязка к карточке находит прогресс, если сменилось название. В старых версиях Lampa её нет
    function timelineLink(data, season, episode) {
        return Lampa.Timeline.link ? Lampa.Timeline.link(data, season, episode) : undefined;
    }

    function cardProgressText(progress) {
        if (progress.season) return 'С' + progress.season + ' Э' + progress.episode;
        var view = progress.view;
        if (view.percent >= CONTINUE_DONE_PERCENT) return 'Просмотрено';
        if (view.duration > view.time && Lampa.Utils.secondsToTimeHuman) {
            return 'Осталось ' + Lampa.Utils.secondsToTimeHuman(view.duration - view.time).trim();
        }
        return view.percent + '%';
    }

    // Рейтинг как у Lampa; у рейтинга CUB вместо оценки — число «огоньков», его не красим
    function cardVoteLevel(data) {
        if (data.cub_hundred_fire) return '';
        var vote = parseFloat(data.cub_hundred_rating || data.vote_average || 0);
        if (!(vote > 0)) return '';
        return vote >= 7 ? 'high' : vote >= 5 ? 'mid' : 'low';
    }

    // Дорисовываем постер по настройкам. Вызывается при каждом показе и фокусе — заодно обновляет время
    function decorateCard(el) {
        var data = el.card_data;
        var view = el.querySelector('.card__view');
        if (!data || !view) return;

        var vote = view.querySelector('.card__vote');
        if (vote) {
            if (vote[CARD_VOTE_TEXT] === undefined) vote[CARD_VOTE_TEXT] = vote.textContent;
            vote.className = 'card__vote';
            vote.removeAttribute('style');
            vote.textContent = vote[CARD_VOTE_TEXT];
        }
        $(el).find('.' + [CARD_PROGRESS_CLASS, CARD_PANEL_CLASS, CARD_META_CLASS, CARD_AGE_CLASS].join(', .')).remove();
        view.classList.remove(CARD_PROGRESSED_CLASS);
        view.classList.remove(CARD_PANELED_CLASS);
        // У широкой карточки строки под постером нет — туда ничего не пишем
        var wide = el.classList.contains('card--wide');

        var level = cardVoteLevel(data);
        if (vote && level) {
            vote.classList.add(CARD_VOTE_CLASS);
            vote.classList.add(CARD_VOTE_CLASS + '--' + level);
        }
        if (vote) renderVote(vote, data, level);

        var mode = get('card_progress', 'default');
        var bar = mode === 'bar' || mode === 'both';
        var panel = mode === 'panel' || mode === 'both';
        var votePos = get('card_vote_pos', 'default');
        var voteTitle = !wide && votePos === 'title';
        var voteYear = !wide && votePos === 'year' && vote;
        var timeTitle = !wide && isOn('card_progress_title');
        var progress = bar || panel || timeTitle ? cardProgress(data) : null;

        if (progress && progress.view.percent && bar) {
            view.appendChild($('<div>').addClass(CARD_PROGRESS_CLASS).append(Lampa.Timeline.render(progress.view))[0]);
            view.classList.add(CARD_PROGRESSED_CLASS);
        }
        if (progress && panel) {
            var box = $('<div>').addClass(CARD_PANEL_CLASS).append($('<span>').text(cardProgressText(progress)));
            if (progress.view.percent) box.append(Lampa.Timeline.render(progress.view));
            view.appendChild(box[0]);
            view.classList.add(CARD_PANELED_CLASS);
        }

        var parts = [];
        if (voteTitle && vote) {
            parts.push(voteSpan(vote, level));
        }
        if (timeTitle && progress) parts.push($('<span>').text(cardProgressText(progress)));
        if (!parts.length && !voteYear) return;

        // Строку года Lampa убирает, если год неизвестен, — тогда добавляем свою
        var age = $(el).find('.card__age');
        if (!age.length) {
            age = $('<div class="card__age">').addClass(CARD_AGE_CLASS);
            $(el).find('.card__title').after(age);
        }

        var meta = $('<span>').addClass(CARD_META_CLASS);
        parts.forEach(function (part) {
            if (meta.children().length || $.trim(age.text())) meta.append(' · ');
            meta.append(part);
        });
        age.append(meta);
        // Справа от года — в начало строки: так float встаёт на ту же строку
        if (voteYear) age.prepend($('<span>').addClass(CARD_META_CLASS + ' ' + CARD_YEAR_VOTE_CLASS).append(voteSpan(vote, level)));
    }

    function voteSpan(vote, level) {
        return $('<span>').addClass(level ? CARD_VOTE_CLASS + ' ' + CARD_VOTE_CLASS + '--' + level : '').text('★ ' + vote[CARD_VOTE_TEXT]);
    }

    // Содержимое рейтинга под выбранный вид. «Огоньки» CUB (без уровня) кольцом и шкалой не показать — остаются текстом
    function renderVote(vote, data, level) {
        var look = get('card_vote_look', 'default');
        var text = vote[CARD_VOTE_TEXT];
        var value = parseFloat(text);
        var el = $(vote);

        if (look === 'ring' && level) {
            var percent = Math.round(value * 10);
            el.empty().append($('<span>').addClass(CARD_VOTE_NUM_CLASS).text(percent));
            var color = get('card_vote_color', 'none') === 'none' ? '#fff' : CARD_VOTE_COLORS[level];
            vote.style.backgroundImage = 'conic-gradient(' + color + ' ' + percent + '%, rgba(255, 255, 255, 0.2) 0)';
        }
        if (look === 'label') {
            var source = data.cub_hundred_rating || data.cub_hundred_fire ? 'CUB' : 'TMDB';
            el.empty().append($('<span>').addClass(CARD_VOTE_SRC_CLASS).text(source), $('<span>').addClass(CARD_VOTE_NUM_CLASS).text(text));
        }
        if (look === 'scale' && level) {
            var scale = $('<span>').addClass(CARD_VOTE_SCALE_CLASS);
            for (var i = 0; i < 10; i++) scale.append($('<i>').toggleClass(CARD_VOTE_ON_CLASS, i < Math.round(value)));
            el.empty().append($('<span>').text(text), scale);
        }
        if (look === 'dot') el.empty().append($('<i>').addClass(CARD_VOTE_DOT_CLASS), $('<span>').text(text));
    }

    // Карточки, которые уже показаны, — после смены стиля в настройках
    function decorateCards() {
        $('.card').each(function () {
            if (this.called_visible) safeDecorateCard(this);
        });
    }

    // Ошибка в оформлении не должна ломать саму карточку Lampa
    function safeDecorateCard(el) {
        try {
            decorateCard(el);
        } catch (err) {
            console.error('[ui-tweaks] постер:', err);
        }
    }

    function trackCards() {
        // Lampa шлёт visible и hover:focus прямо карточке, без всплытия, — ловим на перехвате
        function handle(e) {
            var el = e.target;
            if (el && el.classList && el.classList.contains('card') && el.card_data) safeDecorateCard(el);
        }
        document.addEventListener('visible', handle, true);
        document.addEventListener('hover:focus', handle, true);
        decorateCards();
    }

    // Ждём, пока Lampac покажет список серий, и жмём нужную
    function watchLampac(activity, target) {
        var root = activity.render();
        // Отмечаем на цели, что сезон уже переключали, — копия, чтобы повторное нажатие начинало заново
        target = $.extend({}, target);
        var timer;
        var observer = new MutationObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(check, 400);
        });
        var giveUp = setTimeout(stop, AUTOPLAY_TIMEOUT);

        function stop() {
            clearTimeout(timer);
            clearTimeout(giveUp);
            observer.disconnect();
        }

        function check() {
            var active = Lampa.Activity.active();
            if (!active || active.activity !== activity) return stop();
            if (playEpisode(root, target)) stop();
        }

        observer.observe(root[0], { childList: true, subtree: true });
        // Список может быть уже на месте (например, после закрытия плеера) — тогда мутаций не будет
        timer = setTimeout(check, 400);
    }

    // true — дело сделано (запустили или поняли, что запускать нечего); false — список ещё грузится
    function playEpisode(root, target) {
        // Заглушка загрузки и «источник не отвечает» — обе .online-empty
        if (root.find('.online-empty').length) return false;

        var items = root.find('.online-prestige--full');
        if (!items.length) return false;

        // Серию находим по хэшу в полоске прогресса
        var item = target.hash ? root.find('.time-line[data-hash="' + target.hash + '"]').closest('.online-prestige--full') : $();

        // Сезон уже переключили — список новый (старый источник убирает сразу при выборе).
        // Нужной серии нет — берём крайнюю, если цель это разрешает (первая/последняя серия сезона)
        if (!item.length && target.switched) {
            if (target.fallback === 'first') item = items.first();
            if (target.fallback === 'last') item = items.last();
            item.trigger('hover:enter');
            return true;
        }

        if (item.length) {
            item.trigger('hover:enter');
            return true;
        }

        // Нет её в списке — открыт другой сезон. Переключаем один раз и ждём новый список;
        // переключить не на что — ничего не запускаем, пусть выбирают сами
        target.switched = true;
        return !switchLampacSeason(root, target.season);
    }

    // Сезоны в фильтре источника: { filter, group }. null — источник не наш или сезонов в фильтре нет
    function lampacSeasons(root) {
        var source = root.find('.filter--filter').first().data(ONLINE_FILTER_SOURCE_DATA);
        if (!source || !source.filter.onSelect) return null;

        var group = source.items.filter(function (a) { return a.stype === 'season' && a.items; })[0];
        if (!group) return null;

        return { filter: source.filter, group: group };
    }

    // Номер сезона по подписи пункта: у балансеров они разные («1 сезон», «Сезон 1») — берём первое число
    function seasonNumber(item) {
        var num = String(item.title).match(/\d+/);
        return num ? parseInt(num[0], 10) : 0;
    }

    // Пункт сезона в фильтре источника: { filter, group, item }. null — такого сезона нет или он уже выбран
    function lampacSeason(root, season) {
        var found = lampacSeasons(root);
        if (!found) return null;

        var item = found.group.items.filter(function (b) { return seasonNumber(b) === season; })[0];
        if (!item || item.selected) return null;

        return { filter: found.filter, group: found.group, item: item };
    }

    // Выбираем сезон, как из меню фильтра: источник сохранит выбор и загрузит серии
    function switchLampacSeason(root, season) {
        var found = lampacSeason(root, season);
        if (!found) return false;

        // Источник после выбора закрывает меню через setTimeout(Lampa.Select.close) — а меню не открыто,
        // и close вызвал бы onBack давно закрытого меню. Функцию он берёт сразу, так что подменяем на время вызова
        var close = Lampa.Select.close;
        Lampa.Select.close = function () {};
        try {
            found.filter.selected(found.group.items, found.item);
            found.filter.onSelect('filter', found.group, found.item);
        } finally {
            Lampa.Select.close = close;
        }
        return true;
    }

    // Крайние серии сезона: «Далее» и «Назад» в плеере ведут в соседний сезон, конец последней серии —
    // в следующий, а конец сериала закрывает плеер. Плейлист у Lampac — только серии открытого сезона, поэтому закрываем плеер,
    // переключаем сезон в списке Lampac и включаем первую серию следующего (последнюю — предыдущего)
    function trackNextSeason() {
        var video = Lampa.PlayerVideo;
        var playlist = Lampa.PlayerPlaylist;
        var panel = Lampa.PlayerPanel;
        if (!video || !video.listener || !playlist || !playlist.listener || !panel || !panel.listener) return;

        // В панели Lampa есть только «Далее» — «Назад» делаем из неё
        var next = panel.render().find('.player-panel__next');
        var prev = next.clone().removeClass('player-panel__next').addClass('player-panel__prev hide');
        prev.find('svg').replaceWith('<svg><use xlink:href="#sprite-player-prev"></use></svg>');
        prev.find('.tooltip').text('Назад');
        prev.on('hover:enter', function () {
            if (playlist.position() > 0) panel.listener.send('prev', {});
            else if (isOn('online_next_season', true)) jumpSeason(-1);
        });
        next.before(prev);

        // Плеер прячет «Далее», когда в плейлисте серий дальше нет. Слушаем после него — и показываем снова
        playlist.listener.follow('set', function (e) {
            var jump = isOn('online_next_season', true);
            if (jump && seasonJump(1)) next.removeClass('hide');
            prev.toggleClass('hide', !isOn('online_prev_button', true) || !(e.position > 0 || jump && seasonJump(-1)));
        });

        panel.listener.follow('next', function () {
            if (!playlist.canNext() && isOn('online_next_season', true)) jumpSeason(1);
        });

        video.listener.follow('ended', function () {
            if (Lampa.Select.opened() || playlist.canNext()) return;

            if (seasonJump(1)) {
                if (isOn('online_auto_season', true) && Lampa.Storage.field('playlist_next')) jumpSeason(1);
                return;
            }

            // Последняя серия последнего сезона — смотреть дальше нечего, выходим из плеера к списку серий
            var data = Lampa.Player.playdata();
            if (isOn('online_close_end', true) && data && data.isonline && data.season) Lampa.Player.close();
        });
    }

    // Куда переходить из плеера на соседний сезон (step: 1 или -1): { activity, target }.
    // null — серия не из Lampac, не крайняя или такого сезона нет
    function seasonJump(step) {
        var playlist = Lampa.PlayerPlaylist;
        if (step > 0 ? playlist.canNext() : playlist.position() > 0) return null;

        var data = Lampa.Player.playdata();
        var active = Lampa.Activity.active();
        if (!data || !data.isonline || !data.season) return null;
        if (!active || active.component !== 'lampac' || !active.movie) return null;

        var season = parseInt(data.season, 10) + step;
        if (!lampacSeason(active.activity.render(), season)) return null;

        // Номер последней серии заранее не знаем — её возьмём из списка
        var target = step > 0
            ? { season: season, hash: episodeHash(active.movie, season, 1), fallback: 'first' }
            : { season: season, fallback: 'last' };
        return { activity: active.activity, target: target };
    }

    function jumpSeason(step) {
        var jump = seasonJump(step);
        if (!jump) return;

        Lampa.Player.close();
        watchLampac(jump.activity, jump.target);
    }

    var SEASONS_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h12v2H4zm0 5h12v2H4zm0 5h8v2H4zm14-6v8l5-4z"/></svg>';

    // Сезоны сериала, который сейчас играет из Lampac: { activity, movie, items }. null — серия не из Lampac
    // или выбирать не из чего
    function playerSeasons() {
        if (!isOn('online_player_seasons', true)) return null;

        var data = Lampa.Player.playdata();
        var active = Lampa.Activity.active();
        if (!data || !data.isonline || !data.season) return null;
        if (!active || active.component !== 'lampac' || !active.movie) return null;

        var found = lampacSeasons(active.activity.render());
        if (!found || found.group.items.length < 2) return null;

        return { activity: active.activity, movie: active.movie, items: found.group.items };
    }

    // На какой серии остановились в сезоне: недосмотренная последняя из начатых, после досмотренной — следующая,
    // в несмотренном сезоне — первая
    function seasonEpisode(card, season, count) {
        var last = 0;
        for (var ep = 1; ep <= count; ep++) {
            if (Lampa.Timeline.view(episodeHash(card, season, ep)).percent > 0) last = ep;
        }

        var episode = last || 1;
        if (last && last < count && Lampa.Timeline.view(episodeHash(card, season, last)).percent >= CONTINUE_DONE_PERCENT) episode++;
        return episode;
    }

    // Меню сезонов поверх плеера, после выбора — меню серий. back — контроллер, к которому вернуться
    function showPlayerSeasons(seasons, back) {
        Lampa.Select.show({
            title: 'Сезон',
            items: seasons.items.map(function (b) {
                return { title: b.title, selected: b.selected, season: seasonNumber(b) };
            }),
            onSelect: function (a) {
                if (!a.season) return Lampa.Controller.toggle(back);
                if (a.selected) showCurrentEpisodes(seasons, back);
                else showSeasonEpisodes(seasons, a, back);
            },
            onBack: function () {
                Lampa.Controller.toggle(back);
            }
        });
    }

    // Серии открытого сезона уже в плейлисте плеера — включаем как из него
    function showCurrentEpisodes(seasons, back) {
        var playlist = Lampa.PlayerPlaylist;
        playlist.active();
        var items = playlist.get();

        Lampa.Select.show({
            title: 'Серия',
            items: items,
            onSelect: function (a) {
                Lampa.Controller.toggle(back);
                playlist.listener.send('select', { playlist: items, item: a, position: items.indexOf(a) });
            },
            onBack: function () {
                showPlayerSeasons(seasons, back);
            }
        });
    }

    // Серии другого сезона Lampac покажет, только когда переключится на него, — названия берём из TMDB,
    // а включаем, как и при переходе «Далее»: закрываем плеер, переключаем сезон в списке Lampac и жмём серию
    function showSeasonEpisodes(seasons, season, back) {
        var card = seasons.movie;
        var num = season.season;

        Lampa.Api.seasons(card, [num], function (data) {
            var info = data && data[String(num)];
            var episodes = info && info.episodes && info.episodes.length ? info.episodes.map(function (e) {
                return { number: e.episode_number, name: e.name };
            }) : [];

            // TMDB не ответил — серии по номерам, сколько их в сезоне по данным карточки
            if (!episodes.length) {
                for (var ep = 1, count = seasonEpisodes(card, num); ep <= Math.min(count, 50); ep++) {
                    episodes.push({ number: ep });
                }
            }

            var current = seasonEpisode(card, num, episodes.length);
            Lampa.Select.show({
                title: season.title,
                items: episodes.map(function (e) {
                    var percent = Lampa.Timeline.view(episodeHash(card, num, e.number)).percent;
                    return {
                        title: e.number + '. ' + (e.name || 'Серия ' + e.number),
                        subtitle: percent ? 'Просмотрено ' + percent + '%' : '',
                        selected: e.number === current,
                        episode: e.number
                    };
                }),
                onSelect: function (a) {
                    Lampa.Controller.toggle(back);
                    Lampa.Player.close();
                    watchLampac(seasons.activity, { season: num, hash: episodeHash(card, num, a.episode), fallback: 'first' });
                },
                onBack: function () {
                    showPlayerSeasons(seasons, back);
                }
            });
        });
    }

    // Кнопка «Сезоны» на панели плеера: сезон, затем серия. Плейлист у Lampac — только серии открытого сезона
    function trackPlayerSeasons() {
        var playlist = Lampa.PlayerPlaylist;
        var panel = Lampa.PlayerPanel;
        if (!playlist || !playlist.listener || !panel || !panel.listener) return;

        var btn = $('<div class="player-panel__seasons button selector hide">' + SEASONS_ICON +
            '<div class="tooltip">Сезоны</div></div>');
        btn.on('hover:enter', function () {
            var seasons = playerSeasons();
            if (seasons) showPlayerSeasons(seasons, Lampa.Controller.enabled().name);
        });
        panel.render().find('.player-panel__next').after(btn);

        playlist.listener.follow('set', function () {
            btn.toggleClass('hide', !playerSeasons());
        });
    }

    // Что Lampac запомнил по карточке. Ключи и хэши — как в его коде (Online/plugin.js)
    function lampacWatched(card) {
        var all = Lampa.Storage.get('online_watched_last', {});
        return all[continueKey(card)];
    }

    function lampacBalanser(card) {
        var last = Lampa.Storage.get('online_last_balanser', {});
        return last[card.id] || Lampa.Storage.get('online_balanser', '');
    }

    function lampacHint(card) {
        var balanser = lampacBalanser(card);
        if (!balanser) return '';

        var watched = lampacWatched(card);
        var same = watched && watched.balanser === balanser;
        var choice = Lampa.Storage.get('online_choice_' + balanser, {})[card.id] || {};
        var parts = [same && watched.balanser_name || Lampa.Utils.capitalizeFirstLetter(balanser)];
        var voice = choice.voice_name || (same && watched.voice_name);
        if (voice) parts.push(voice);
        return parts.join(' · ');
    }

    function showLampacHint(start) {
        var hint = lampacHint(start.card);
        if (!hint) return;
        start.html.find('.' + FULL_HINT_CLASS).remove();
        $('<div class="' + FULL_HINT_CLASS + '"></div>').text('Онлайн: ' + hint)
            .insertAfter(start.html.find('.full-start-new__buttons'));
    }

    function trackFullButtons() {
        Lampa.Listener.follow('activity', function (e) {
            if (e.type !== 'start' || !e.object) return;
            var found = fullStarts.filter(function (f) { return f.activity === e.object.activity; })[0];
            if (found) refreshWatchButtons(found.start, found.activity);
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'options') return addFullOptions(e);
            if (e.type !== 'complite') return;

            var start = e.link && e.link.items && e.link.items[0];
            if (!start || !start.html) return;

            fullStarts.push({ activity: e.object.activity, start: start });
            if (fullStarts.length > 20) fullStarts.shift();

            // Событие приходит до первого показа карточки: фокус встанет на первую кнопку
            arrangeFullButtons(start);
            var first = firstFullButton(start);
            if (first) start.last = first;

            var row = start.html.find('.full-start-new__buttons');
            var count = row.children().length;

            // Плагины добавляют свои кнопки в этом же событии — возможно, уже после нас
            setTimeout(function () {
                arrangeFullButtons(start);
                if (row.children().length === count) return;

                // Фокус ещё на первой кнопке, а первой стала новая — переводим на неё
                var newFirst = firstFullButton(start);
                if (start.last === first) start.last = newFirst;

                // Карточка уже показана: собираем кнопки для фокуса заново, как это делает сама Lampa
                var active = Lampa.Activity.active();
                if (!active || active.activity !== e.object.activity) return;
                if (Lampa.Controller.enabled().name !== 'full_start') return;

                Lampa.Controller.collectionSet(start.html);
                Lampa.Controller.collectionFocus(start.last || false, start.html);
            }, 0);
        });
    }

    // Сезон и перевод онлайн-источник прячет в «Фильтр» — выносим их кнопками рядом с «Источником».
    // Lampac создаёт фильтр через new Lampa.Filter, поэтому подменяем конструктор и следим за set('filter')
    function trackOnlineFilter() {
        var Filter = Lampa.Filter;
        if (typeof Filter !== 'function') return;

        Lampa.Filter = function (params) {
            var filter = new Filter(params);
            var set = filter.set;
            var show = filter.show;
            var loaded = false;

            // В шаблоне «Фильтр» виден, а прячет его только set — пока источник грузится, его ещё не звали
            filter.render().find('.filter--filter').removeClass('selector').addClass('hide');

            filter.set = function (type, items) {
                if (type !== 'filter') return set.apply(this, arguments);

                filter.render().find('.filter--filter').first().data(ONLINE_FILTER_SOURCE_DATA, { filter: filter, items: items || [] });

                // Вынесенное из «Фильтра» убираем. Остался один «Сбросить» — фильтр пуст, и его кнопку
                // Lampa.Filter спрячет сама
                var groups = onlineFilterGroups(items);
                var rest = (items || []).filter(function (a) { return groups.indexOf(a) === -1; });
                // Первый раз источник заполняет фильтр до загрузки списка — там тоже один «Сбросить»
                var loading = !loaded;
                loaded = true;
                if ((loading || groups.length) && !rest.some(function (a) { return !a.reset; })) rest = [];

                set.call(this, type, rest);
                layoutOnlineFilter(filter, groups);
            };

            // Lampac открывает фильтр и стрелкой вправо с края списка — пустое меню не показываем
            filter.show = function (title, type) {
                if (!this.get(type).length) return;
                show.apply(this, arguments);
            };
            return filter;
        };

        if (Lampa.Controller.listener) Lampa.Controller.listener.follow('toggle', restoreOnlineFilterFocus);
    }

    // Источник по каждому toggle('content') ставит фокус на серию — возвращаем его на кнопку,
    // пока список не загрузится (заглушка загрузки — .online-empty)
    function restoreOnlineFilterFocus(e) {
        if (!onlineFilterFocus || e.name !== 'content') return;

        var btn = onlineFilterFocus.btn;
        var active = Lampa.Activity.active();
        var root = active && active.activity && active.activity.render();
        if (Date.now() > onlineFilterFocus.until || !root || !$.contains(root[0], btn[0])) {
            onlineFilterFocus = null;
            return;
        }

        Lampa.Controller.collectionFocus(btn, root);
        if (!root.find('.online-empty').length) onlineFilterFocus = null;
    }

    function onlineFilterGroups(items) {
        if (!isOn('online_filter_split', true)) return [];
        return (items || []).filter(function (a) {
            return a.items && a.items.length && ONLINE_FILTER_TYPES.indexOf(a.stype) !== -1;
        }).sort(function (a, b) {
            return ONLINE_FILTER_TYPES.indexOf(a.stype) - ONLINE_FILTER_TYPES.indexOf(b.stype);
        });
    }

    function layoutOnlineFilter(filter, groups) {
        var main = filter.render().find('.filter--filter').first();
        if (!main.length) return;

        var line = main.parent();
        var types = groups.map(function (a) { return a.stype; });

        line.children('.' + ONLINE_FILTER_CLASS).each(function () {
            if (types.indexOf($(this).attr('data-stype')) === -1) $(this).remove();
        });

        groups.forEach(function (group) {
            var btn = line.children('.' + ONLINE_FILTER_CLASS + '[data-stype="' + group.stype + '"]');
            if (!btn.length) btn = onlineFilterButton(filter, main, group.stype);

            btn.data(ONLINE_FILTER_DATA, group);
            btn.find('span').text(group.title);
            btn.find('div').text(Lampa.Utils.shortText(group.subtitle || '', 25)).toggleClass('hide', !group.subtitle);
            btn.insertBefore(main);
        });

        main.toggleClass(ONLINE_FILTER_SHORT_CLASS, groups.length > 0);
    }

    // Кнопка — копия «Фильтра», но сразу открывает список одного пункта
    function onlineFilterButton(filter, main, stype) {
        // Сам «Фильтр» может быть уже спрятан, если в нём ничего не осталось
        var btn = main.clone().removeClass('filter--filter focus hover hide ' + ONLINE_FILTER_SHORT_CLASS)
            .addClass('selector ' + ONLINE_FILTER_CLASS).attr('data-stype', stype);

        btn.on('hover:enter', function () {
            var group = btn.data(ONLINE_FILTER_DATA);
            onlineFilterFocus = isOn('online_filter_focus', true) ? { btn: btn, until: Date.now() + AUTOPLAY_TIMEOUT } : null;
            Lampa.Select.show({
                title: group.title,
                items: group.items,
                onBack: function () {
                    if (filter.onBack) filter.onBack();
                },
                // Как в Lampa.Filter: источник сам сохраняет выбор, перезапрашивает список и закрывает меню
                onSelect: function (b) {
                    filter.selected(group.items, b);
                    if (filter.onSelect) filter.onSelect('filter', group, b);
                }
            });
        });

        // Фильтр заполняется после загрузки, когда список уже под управлением: добавляем кнопку к фокусу
        btn.insertBefore(main);
        var enabled = Lampa.Controller.enabled();
        if (enabled && enabled.name === 'content' && $.contains(document.body, btn[0]) && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend(btn);
        }
        return btn;
    }

    function addMenuPage() {
        title(PAGE_MENU, 'menu_title_items', 'Пункты');

        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: { name: PLUGIN_ID + '_menu_edit', type: 'button' },
            field: { name: 'Редактировать меню', description: 'Порядок, группы, «Ещё» и скрытые пункты' },
            onChange: openMenuEditor
        });

        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: { name: PLUGIN_ID + '_menu_group_edit', type: 'button' },
            field: { name: 'Порядок групп', description: 'В каком порядке идут группы меню' },
            onChange: function () {
                openGroupsEditor(menuGroups().slice(1), 'menu_group_order', layoutMenu);
            }
        });

        title(PAGE_MENU, 'menu_title_view', 'Вид');

        // Это встроенная настройка Lampa (Интерфейс → «Всегда показывать левое меню»), здесь — ярлык на неё
        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: { name: 'menu_always', type: 'trigger', default: false },
            field: {
                name: 'Меню полоской',
                description: 'Слева всегда видны иконки меню. То же, что «Всегда показывать левое меню» в разделе «Интерфейс»'
            }
        });

        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: {
                name: PLUGIN_ID + '_menu_active_style',
                type: 'select',
                values: {
                    none: 'Нет',
                    bg: 'Фон',
                    line: 'Полоска слева',
                    outline: 'Рамка',
                    dot: 'Точка слева',
                    bold: 'Жирный текст',
                    dim: 'Приглушить остальные'
                },
                default: 'none'
            },
            field: { name: 'Подсветка текущего раздела', description: 'Как отмечать пункт меню, раздел которого сейчас открыт' },
            onChange: applyStyles
        });

        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: {
                name: PLUGIN_ID + '_menu_groups',
                type: 'select',
                values: {
                    off: 'Нет',
                    lines: 'Черта',
                    titles: 'Заголовок'
                },
                default: 'off'
            },
            field: { name: 'Граница между группами', description: 'Как отделять группы друг от друга. Сами группы задаются в редакторе меню' },
            onChange: layoutMenu
        });

        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: {
                name: PLUGIN_ID + '_menu_font_weight',
                type: 'select',
                values: {
                    'default': 'Как в Lampa',
                    '400': 'Обычный',
                    '500': 'Средний',
                    '600': 'Полужирный',
                    '700': 'Жирный'
                },
                default: 'default'
            },
            field: { name: 'Толщина шрифта', description: 'Если на телевизоре подписи пунктов выглядят слишком тонкими' },
            onChange: applyStyles
        });

        Lampa.SettingsApi.addParam({
            component: PAGE_MENU,
            param: {
                name: PLUGIN_ID + '_menu_focus_font_weight',
                type: 'select',
                values: {
                    'default': 'Как у остальных',
                    '400': 'Обычный',
                    '500': 'Средний',
                    '600': 'Полужирный',
                    '700': 'Жирный'
                },
                default: 'default'
            },
            field: { name: 'Толщина шрифта выделенного пункта', description: 'Тёмный текст на белом фоне кажется тоньше — его можно сделать толще остальных' },
            onChange: applyStyles
        });

        param(PAGE_MENU, 'menu_compact', 'trigger', false, 'Компактное меню', 'Меньше отступы между пунктами — меню чаще помещается на экран целиком');
    }

    function addFullPage() {
        title(PAGE_FULL, 'full_title_buttons', 'Кнопки');

        Lampa.SettingsApi.addParam({
            component: PAGE_FULL,
            param: { name: PLUGIN_ID + '_full_edit', type: 'button' },
            field: { name: 'Редактировать кнопки', description: 'Порядок, скрытие и перенос в меню «⋯». Кнопки плагинов появятся после открытия любой карточки' },
            onChange: openFullEditor
        });

        param(PAGE_FULL, 'full_split', 'trigger', true, 'Источники отдельными кнопками',
            'Сразу «Смотреть» (онлайн) и «Торренты» вместо меню выбора. У сериалов — «Продолжить» с последней серии');

        title(PAGE_FULL, 'full_title_continue', 'Продолжить');

        param(PAGE_FULL, 'full_continue_track', 'trigger', true, 'Запоминать последнюю включённую серию',
            '«Продолжить» ведёт на серию, которую включали последней, в том числе «Далее» в плеере и возврат к старой серии. ' +
            'Синхронизируется через аккаунт CUB. Если выключить — серия по записи Lampac и прогрессу просмотра');
        param(PAGE_FULL, 'full_continue_next_season', 'trigger', true, 'Переходить на следующий сезон',
            'Когда сезон досмотрен, «Продолжить» ведёт на первую серию следующего. Если выключить — кнопка пропадает');

        title(PAGE_FULL, 'full_title_view', 'Вид');

        Lampa.SettingsApi.addParam({
            component: PAGE_FULL,
            param: {
                name: PLUGIN_ID + '_full_reactions',
                type: 'select',
                values: {
                    show: 'Показывать',
                    top: 'Скрыть, выровнять по верху',
                    space: 'Скрыть, оставить отступ'
                },
                default: 'show'
            },
            field: { name: 'Реакции', description: 'Строка с эмодзи-реакциями (🔥 👍 💩 …). Без неё описание можно поднять к верху постера или оставить на месте' },
            onChange: applyStyles
        });

        param(PAGE_FULL, 'full_descr_full', 'trigger', true, 'Описание целиком',
            'В блоке «Подробно» показывать весь текст описания, а не обрезать его снизу');
    }

    function addOnlinePage() {
        title(PAGE_ONLINE, 'online_title_filter', 'Сезон и перевод');

        param(PAGE_ONLINE, 'online_filter_split', 'trigger', true, 'Отдельными кнопками',
            'В списке серий выбирать сезон и озвучку сразу, а не через «Фильтр». Применится при следующем открытии');
        param(PAGE_ONLINE, 'online_filter_focus', 'trigger', true, 'Фокус остаётся на кнопке',
            'После выбора сезона или озвучки не переходить к серии, а вернуться на кнопку');

        title(PAGE_ONLINE, 'online_title_play', 'Просмотр');

        param(PAGE_ONLINE, 'online_prev_button', 'trigger', true, 'Кнопка «Назад» в плеере',
            'Рядом с «Далее» на панели плеера: включает предыдущую серию');
        param(PAGE_ONLINE, 'online_next_season', 'trigger', true, '«Далее» и «Назад» между сезонами',
            'На последней серии сезона «Далее» включает первую серию следующего, на первой «Назад» — последнюю серию предыдущего');
        param(PAGE_ONLINE, 'online_auto_season', 'trigger', true, 'Следующий сезон автоматически',
            'После последней серии сезона сразу включать следующий. Работает, если в плеере включено автопереключение серий');
        param(PAGE_ONLINE, 'online_close_end', 'trigger', true, 'Закрывать плеер в конце сериала',
            'После последней серии последнего сезона вернуться к списку серий');
        param(PAGE_ONLINE, 'online_player_seasons', 'trigger', true, 'Выбор сезона в плеере',
            'Кнопка «Сезоны» на панели плеера: выбрать сезон, а затем серию. В списке отмечена серия, на которой остановились');
    }

    // Выбор для постеров: меняет и стили, и то, что дорисовано на уже показанных карточках
    function cardSelect(name, values, def, text, descr) {
        Lampa.SettingsApi.addParam({
            component: PAGE_CARDS,
            param: { name: PLUGIN_ID + '_' + name, type: 'select', values: values, default: def },
            field: { name: text, description: descr },
            onChange: function () {
                applyStyles();
                decorateCards();
            }
        });
    }

    function cardTrigger(name, text, descr) {
        var item = makeParam(PAGE_CARDS, name, 'trigger', false, text, descr);
        item.onChange = function () {
            applyStyles();
            decorateCards();
        };
        Lampa.SettingsApi.addParam(item);
    }

    function addCardsPage() {
        title(PAGE_CARDS, 'cards_title_common', 'Общее');

        cardSelect('card_vote_bg', {
            '0.3': 'Светлая',
            '0.5': 'Средняя',
            '0.7': 'Тёмная',
            '0.85': 'Очень тёмная',
            '1': 'Непрозрачная'
        }, '0.7', 'Подложка', 'Затемнение фона под рейтингом и отметками. У штатного вида рейтинга и у точки подложки нет');

        title(PAGE_CARDS, 'cards_title_vote', 'Рейтинг');

        cardSelect('card_vote_pos', {
            'default': 'Штатно, снизу справа',
            top: 'Сверху справа',
            bottom: 'Снизу справа, в углу',
            edge: 'За правым краем, напротив TS',
            title: 'Под названием',
            year: 'Справа от года',
            off: 'Скрыть'
        }, 'default', 'Положение', 'Где показывать оценку на постере');
        cardSelect('card_vote_look', {
            'default': 'Штатный',
            badge: 'Бейдж как TS',
            text: 'Текст со звёздочкой',
            ring: 'Кольцо',
            label: 'Ярлык с источником',
            ribbon: 'Лента сверху',
            scale: 'Мини-шкала',
            dot: 'Точка'
        }, 'default', 'Вид', 'Цвет задаётся настройкой «Цвет по оценке». Лента всегда свисает с верхнего края');
        cardSelect('card_vote_color', {
            none: 'Нет',
            bg: 'Фон',
            text: 'Цифра'
        }, 'none', 'Цвет по оценке', 'Зелёный от 7, жёлтый от 5, красный ниже');
        cardTrigger('card_vote_focus', 'Только при фокусе', 'Показывать рейтинг только на выбранной карточке');

        title(PAGE_CARDS, 'cards_title_badges', 'Качество и TV');

        cardSelect('card_quality_pos', {
            'default': 'Штатно, за левым краем',
            inside: 'Внутри, слева снизу',
            top: 'Внутри, слева сверху',
            off: 'Скрыть'
        }, 'default', 'Качество (TS, BD)', 'Бейдж качества у фильмов');
        cardSelect('card_type_pos', {
            'default': 'Штатно, за левым краем',
            inside: 'Внутри, слева сверху',
            off: 'Скрыть'
        }, 'default', 'TV', 'Бейдж сериала');

        title(PAGE_CARDS, 'cards_title_icons', 'Отметки');

        cardSelect('card_icons_pos', {
            'default': 'Штатно, сверху по центру',
            corner: 'Флажок в правом верхнем углу',
            edge: 'Бейдж за левым краем, как TV',
            off: 'Скрыть'
        }, 'default', 'Положение', 'Иконки истории, закладки, лайка и «смотреть позже»');

        title(PAGE_CARDS, 'cards_title_progress', 'Прогресс просмотра');

        cardSelect('card_progress', {
            'default': 'Штатная плашка при фокусе',
            bar: 'Полоска внизу, всегда',
            panel: 'Панель при фокусе',
            both: 'Полоска, в фокусе — панель',
            off: 'Скрыть'
        }, 'default', 'Вид', 'Штатная плашка появляется с задержкой. Панель — то же, но сразу и аккуратнее: градиент у низа постера');
        cardTrigger('card_progress_title', 'Время под названием', 'Рядом с годом: сколько осталось у фильма, сезон и серия у сериала');
    }

    function addSettingsPage() {
        title(PAGE_SETTINGS, 'settings_title_items', 'Разделы');

        Lampa.SettingsApi.addParam({
            component: PAGE_SETTINGS,
            param: { name: PLUGIN_ID + '_settings_edit', type: 'button' },
            field: { name: 'Редактировать разделы', description: 'Порядок, группы и скрытые разделы' },
            onChange: openSettingsEditor
        });

        Lampa.SettingsApi.addParam({
            component: PAGE_SETTINGS,
            param: { name: PLUGIN_ID + '_settings_group_edit', type: 'button' },
            field: { name: 'Порядок групп', description: 'В каком порядке идут группы разделов' },
            onChange: function () {
                openGroupsEditor(settingsGroups(), 'settings_group_order');
            }
        });

        title(PAGE_SETTINGS, 'settings_title_view', 'Вид');

        Lampa.SettingsApi.addParam({
            component: PAGE_SETTINGS,
            param: {
                name: PLUGIN_ID + '_settings_groups',
                type: 'select',
                values: {
                    off: 'Нет',
                    lines: 'Черта',
                    titles: 'Заголовок'
                },
                default: 'titles'
            },
            field: { name: 'Граница между группами', description: 'Как отделять группы друг от друга. Сами группы задаются в редакторе разделов' }
        });
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: PLUGIN_ID,
            name: 'Настройка интерфейса',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3zm0 6h12v2H3zm0 6h18v2H3zm15-7.5 3 2.5-3 2.5z"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: PLUGIN_ID + '_head_edit', type: 'button' },
            field: { name: 'Шапка', description: 'Какие кнопки, стрелку назад и часы показывать' },
            onChange: openHeadEditor
        });
        pageLink(1, PAGE_MENU, 'Меню', 'Порядок и группы пунктов, полоска, подсветка');
        pageLink(2, PAGE_FULL, 'Карточка', 'Кнопки, источники и реакции на странице фильма');
        pageLink(3, PAGE_ONLINE, 'Онлайн', 'Выбор сезона и озвучки, переход на следующий сезон');
        pageLink(4, PAGE_CARDS, 'Постеры', 'Рейтинг, качество и прогресс просмотра в списках');
        pageLink(5, PAGE_SETTINGS, 'Настройки', 'Порядок, группы и скрытие разделов');

        loadHeadButtons();
        addMenuPage();
        addFullPage();
        addOnlinePage();
        addCardsPage();
        addSettingsPage();
        discoverHeadButtons();
    }

    function start() {
        if (window.ui_tweaks_plugin_ready) return;
        window.ui_tweaks_plugin_ready = true;

        addSettings();
        applyStyles();
        trackMenu();
        trackMenuLayout();
        trackSettingsLayout();
        trackFullButtons();
        trackOnlineFilter();
        trackNextSeason();
        trackPlayerSeasons();
        trackContinue();
        trackCards();
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
