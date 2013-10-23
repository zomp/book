jQuery(function ($) {
  var CONTENT_OFFSET = 1; //number of pages preceding content
  var MIN_CHARS_TO_SEARCH = 2; //chars needed to start searching (does not apply on numbers)
  var DIACRITICS = [[/a/gi,'[aáäą]'],[/ae/gi,'(?:ae|ä)'],[/c/gi,'[cčć]'],[/d/gi,'[dď]'],[/e/gi,'[eěéę]'],[/i/gi,'[ií]'],[/l/gi,'[lĺľł]'],[/n/gi,'[nňń]'],[/o/gi,'[oóôö]'],[/oe/gi,'(?:oe|ö)'],[/r/gi,'[rřŕ]'],[/s/gi,'[sšś]'],[/ss/gi,'(?:ss|ß)'],[/t/gi,'[tť]'],[/u/gi,'[uúůü]'],[/ue/gi,'(?:ue|ü)'],[/y/gi,'[yý]'],[/z/gi,'[zžźż]'],[/ /gi,'(?: |, | \\\()']]; //diactitics-less text to diactitics-enabled text conversion patterns (CZ, EN, SK, PL, DE)
  
  //settings
  if (window.localStorage) {
    if (window.localStorage.getItem('inverse') == 'true')
      $(document.body).addClass('inverse');
    
    if (window.localStorage.getItem('font-size') != null)
      $(document.body).css('font-size', window.localStorage.getItem('font-size'));
  }
  
  //hide menu above initial view
  var hideMenu = function () {
    $('html, body').scrollTop($('#container').position().top);
  };
  
  //inicialization
  var inner = $('#carousel .carousel-inner');
  var toc = $('.toc');
  for (var i = 0; i < content.length; i++) {
    toc.append('<a href="#carousel" data-slide-to="' + (i+CONTENT_OFFSET) + '" data-dismiss="modal" class="list-group-item"><span class="text-primary">' + content[i].number + '</span> ' + content[i].name + '</a>');
  }
  for (var i = 0; i < content.length; i++) {
    inner.append('<div id="' + encodeURIComponent(content[i].number) + '" class="item"><div class="container"><h2><span class="text-primary">' + content[i].number + '</span> ' + content[i].name + '</h2>' + content[i].content + '<p class="text-muted"><span class="glyphicon glyphicon-user"></span> ' + content[i].author + '</p></div></div>');
  }
  
  //invert colors
  $('.invertor').click(function (event) {
    $(document.body).toggleClass('inverse');
    window.localStorage.setItem('inverse', $(document.body).hasClass('inverse'));
    event.preventDefault();
  });
  
  //fullscreen
  $('.fullscreen').click(function (event) {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.oFullscreenElement && !document.msFullscreenElement) {
      if (document.documentElement.requestFullscreen)
        document.documentElement.requestFullscreen();
      else if (document.documentElement.mozRequestFullScreen)
        document.documentElement.mozRequestFullScreen();
      else if (document.documentElement.webkitRequestFullscreen)
        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      else if (document.documentElement.oRequestFullScreen)
        document.documentElement.oRequestFullScreen();
      else if (document.documentElement.msRequestFullScreen)
        document.documentElement.msRequestFullScreen();
    } else {
      if (document.cancelFullScreen)
        document.cancelFullScreen();
      else if (document.mozCancelFullScreen)
        document.mozCancelFullScreen();
      else if (document.webkitCancelFullScreen)
        document.webkitCancelFullScreen();
      else if (document.oCancelFullScreen)
        document.oCancelFullScreen();
      else if (document.msCancelFullScreen)
        document.msCancelFullScreen();
    }
    event.preventDefault();
  });
  
  //resize fonts
  $('.sizeReset').click(function (event) {
    $(document.body).css('font-size', '14px');
    window.localStorage.removeItem('font-size');
    event.preventDefault();
  });
  $('.sizeUp').click(function (event) {
    $(document.body).css('font-size', function (index, value) {
      value = parseInt(value);
      if (value >= 36)
        value = 36;
      else if (value < 14)
        value += 2;
      else if (value < 18)
        value += 4;
      else
        value += 6;
      return value + 'px';
    });
    window.localStorage.setItem('font-size', $(document.body).css('font-size'));
    event.preventDefault();
  });
  $('.sizeDown').click(function (event) {
    $(document.body).css('font-size', function (index, value) {
      value = parseInt(value);
      if (value <= 4)
        value = 4;
      else if (value <= 14)
        value -= 2;
      else if (value <= 18)
        value -= 4;
      else
        value -= 6;
      return value + 'px';
    });
    window.localStorage.setItem('font-size', $(document.body).css('font-size'));
    event.preventDefault();
  });
  
  //history
  $('#carousel').on('slid.bs.carousel', function () {
    history.pushState(null, null, '#' + ($('.item.active').attr('id') || ''));
  });
  var displaySong = function (hash) {
    for (var i = 0; i < content.length; i++)
      if (decodeURIComponent(hash) == content[i].number) 
        $('#carousel').carousel(i + CONTENT_OFFSET);
  };
  window.onpopstate = function () {
    displaySong(location.hash.slice(1));
  };
    displaySong(location.hash.slice(1));
  
  //search
  var prevQuery = ""; //previous query (to prevent repetitive search)
  var search = function (query) {
    var searchResults = $('.typeahead-search');
    var searchInput = $('.form-search');

    searchInput.parent().removeClass('has-error');
    
    //empty query help
    if (query.length == 0) {
      searchInput.removeClass('input-load');
      searchResults.parent().removeClass('open');
      return;
    }

    //repetitive identital search prevention (some browsers fire the search event repetitively)
    if (query == prevQuery) {
      searchInput.removeClass('input-load');
      searchResults.parent().addClass('open');
      return;
    }
    prevQuery = query;

    //search indicator
    searchInput.addClass('input-load');

    var foundNumbers = [];
    var foundNames = [];
    var foundContents = [];

    //number search (exact match)
    for (var i = 0; i < content.length; i++)
      if (content[i].number == query)
        foundNumbers.push(i);

    var regExp;
    //not well-formed regExp handling
    try {
      regExp = new RegExp(query, 'i');
    } catch (error) {
      searchInput.removeClass('input-load');
      searchInput.parent().addClass('has-error');
      searchResults.empty();
      searchResults.append('<li><a href="#help" data-toggle="modal">Chyba regulárního výrazu (<span class="glyphicon glyphicon-question-sign"></span> Nápověda)</a></li>');
      searchResults.parent().addClass('open');
      return;
    }

    //slow-down prevention
    if (query.length >= MIN_CHARS_TO_SEARCH) {
      //diactitics-less name search (substring)
      var diacriticsLessQuery = query;
      for (var i = 0; i < DIACRITICS.length; i++)
        diacriticsLessQuery = diacriticsLessQuery.replace(DIACRITICS[i][0], DIACRITICS[i][1]);
      var diacriticsLessRegExp = new RegExp(diacriticsLessQuery, 'i');
      for (var i = 0; i < content.length; i++)
        if (diacriticsLessRegExp.test(content[i].name))
          foundNames.push(i);

      //content search (substring)
      for (var i = 0; i < content.length; i++)
        if (regExp.test(content[i].content))
          foundContents.push(i);
    }
    
    searchInput.removeClass('input-load');

    //visualization
    searchResults.empty();
    var highlightRegExp = new RegExp('(' + diacriticsLessQuery + ')', 'i');
    /**
     * Visualize a group of results
     * @param results Array of content indices
     * @param header Header of the group
     * @param highlight Type of the group to highlight
     * @param divider Separation with previous group wanted
     */
    var visualizeResultsGroup = function (results, header, type, divider) {
      var highlightNumber = function (text) {
        if (type.number)
          text = '<strong>' + text + '</strong>';
        return text;
      };
      var highlightName = function (text) {
        if (type.name)
          text = text.replace(highlightRegExp, '<strong>$1</strong>');
        return text;
      };
      if (results.length) {
        if (divider)
          searchResults.append('<li class="divider"></li>');
        searchResults.append('<li role="presentation" class="dropdown-header">' + header + '</li>');
        for (var i = 0; i < results.length; i++)
          searchResults.append('<li><a href="#carousel" data-slide-to="' + (results[i]+CONTENT_OFFSET) + '"><span class="text-primary">' + highlightNumber(content[results[i]].number) + '</span> ' + highlightName(content[results[i]].name) + '</a></li>');
      }
    };
    visualizeResultsGroup(foundNumbers, 'Shoda čísla', {number: true});
    visualizeResultsGroup(foundNames, 'Shoda v názvu', {name: true}, foundNumbers.length);
    visualizeResultsGroup(foundContents, 'Shoda v obsahu', {}, foundNumbers.length || foundNames.length);
    if (foundNumbers.length == 0 && foundNames.length == 0 && foundContents.length == 0)
      searchResults.append('<li><a href="#help" data-toggle="modal">Nic nenalezeno' + (query.length < MIN_CHARS_TO_SEARCH ? ' – minimálně ' + MIN_CHARS_TO_SEARCH + ' znaky' : '') + ' (<span class="glyphicon glyphicon-question-sign"></span> Nápověda)</a></li>');
    searchResults.parent().addClass('open');
  }
  
  //search triggers
  $('.form-search').keyup(function (event) {
    if (event.which == 27)
      return;
    search($(this).val());
  });
  $('.btn-search').click(function (event) {
    $(this).parent().parent().addClass('open');
    search($('.form-search').val());
  });
  
  //arrow typeahead items looping and escape closing
  $('.form-search, .typeahead-search').keydown(function (event) {
    event.stopPropagation();
    if (!/(38|40|27)/.test(event.which))
      return;
    
    var parent = $(this).parent();
    var searchInput = $('.form-search', parent);
    
    event.preventDefault();
    
    if (event.which == 27) { //escape
      parent.removeClass('open');
      searchInput.focus();
      return;
    }
    
    var foundItems = $('li:not(.divider) a', parent);
    
    if (foundItems.length)
      parent.addClass('open');
    else
      return;
    
    var index = foundItems.index(foundItems.filter(':focus'));
    
    if (event.which == 38) //up
      index = (index + foundItems.length) % (foundItems.length + 1);
    else //down
      index++;
    
    if (index == foundItems.length)
      searchInput.focus();
    else
      foundItems.eq(index).focus();
  });
  
  //hide typeahead on item selection
  $('#carousel').on('slide.bs.carousel', function () {
    $('.form-search').parent().removeClass('open');
  });
  
  //prev/next on swipe/drag/keys
  $(document.body).hammer().on('swiperight', function () { //swiperight dragright
    $('#carousel').carousel('prev');
  });
  $(document.body).hammer().on('swipeleft', function () { //swipeleft dragleft
    $('#carousel').carousel('next');
  });
  $(document.body).keydown(function (event) {
    switch (event.which) {
      case 37: //left
        $('#carousel').carousel('prev');
        break;
      case 39: //right
        $('#carousel').carousel('next');
        break;
    }
  });
  $(document.body).keyup(function (event) {
    switch (event.which) {
      case 33: //pgUp
        $('#carousel').carousel('prev');
        break;
      case 34: //pgDn
        $('#carousel').carousel('next');
        break;
      case 17: //ctrl
        $('.form-search').focus();
        break;
    }
  });
  
  //scroll top link on page bottom
  $('.link-top').click(function (event) {
    event.preventDefault();
    event.stopPropagation();
    $('html, body').animate({ scrollTop: 0 }, 'fast');
  });
  
  //focus on search input
  $('.form-search').focus();
});
