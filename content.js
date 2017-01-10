var debugMode = 0;
var pfx = 'emjblt';
var storeLastEmojis = 'lastEmojis';
var emojiClass = '.' + pfx +  '-emoji';
var lastEmojiClass = `.${pfx}-last-emojies`;
var emojiCatClass = `.${pfx}-emoji-category`;
var inputsToBelt = 'input:not([type]), input[type="text"], input[type="search"], textarea, [contenteditable=true]';
var docEl = $(document);
var lastInputRect;
var lastInput;
var btnOffset = 15;
var beltBtnEl = $('<div class="'+pfx+'-btn"><div class="'+pfx+'-btn_image"></div></div>');
var beltPanelEl;
var lastEmojis = [];

/**
 * Debug, nothing more
 */
var debug = function () {
  if(debugMode)
    console.log.apply(this, arguments);
};


/**
 * Toggle emojis panel
 */
var toggleBeltPanel = function (e) {
  if (beltPanelEl.css('display') == 'block') {
    beltPanelEl.css('display', 'none');
  }else if(lastInput) {
    lastInput.focus();
    updateLastEmojis(lastEmojis);
    var rectEl = getOffsetRect(lastInput);
    beltPanelEl.css({
      display: 'block',
      top: (rectEl.top + rectEl.height) + 'px',
      left: (rectEl.left) + 'px',
    });
  }
}



/**
 * Update last emojis
 * @param {Array} lastEmojis
 */
var updateLastEmojis = function (lastEmojis) {
  var lastEmojisEl = beltPanelEl.find(lastEmojiClass);
  var lastEmojisStr = '';
  lastEmojis.forEach(function (emoji) {
    lastEmojisStr += `<span class="${pfx}-emoji">${emoji}</span>`;
  });
  lastEmojisEl.html(lastEmojisStr);
}



/**
 * Get offset rect
 * @param {HTMLElement} elem
 * @param {Array}
 */
function getOffsetRect(elem) {
    var box = elem.getBoundingClientRect()

    var body = document.body
    var docElem = document.documentElement

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

    var clientTop = docElem.clientTop || body.clientTop || 0
    var clientLeft = docElem.clientLeft || body.clientLeft || 0

    var top  = box.top +  scrollTop - clientTop
    var left = box.left + scrollLeft - clientLeft

    return {
      top: Math.round(top),
      left: Math.round(left),
      height: box.height,
      width: box.width,
    }
}



/**
 * Init all stuff
 */
var initEmojiBelt = function() {

  // Bind focus on inputs
  docEl.on('focusin', inputsToBelt, function(e) {
    var el = e.target;
    debug('Focused input: ', el);

    // Hide the panel only when the focus is changed
    if (!lastInput || lastInput != el) {
      beltPanelEl.css('display', 'none');
    }

    lastInput = el;
    var rectEl = getOffsetRect(el);
    lastInputRect = rectEl;

    beltBtnEl.css('display', 'none');
    beltBtnEl.css({
      display: 'block',
      top: (rectEl.top - btnOffset) + 'px',
      left: (rectEl.left - btnOffset) + 'px',
    });
    docEl.on('click', tryHideBelt);
  });

  // Bind some keys
  docEl.on('keydown', function(e) {
    // Alt + W
    if (e.altKey && e.which === 87) {
        e.preventDefault();
        if(lastInput) {
          beltBtnEl.trigger('click');
        }
    }
    // ESC
    if(e.which === 27 && beltBtnEl.css('display') == 'block') {
      beltPanelEl.css('display', 'none');
    }
  });

  // Prevent scroll bubbling
  var emojisCont = beltPanelEl.find('.' + pfx + '-emojies');
  emojisCont.on('mousewheel', function(e) {
    var delta = e.wheelDelta;
    if (delta < 0 && (this.scrollHeight - this.offsetHeight - this.scrollTop) <= 0) {
      this.scrollTop = this.scrollHeight;
      e.preventDefault();
    } else if (delta > 0 && delta > this.scrollTop) {
      this.scrollTop = 0;
      e.preventDefault();
    }
  });

  // Bind categories to scroll down
  beltPanelEl.find(emojiCatClass).each(function (el) {
    el.onclick = function () {
      var target = $(el.getAttribute('data-target'));
      if( target.length ){
          //emojisCont.animate({ scrollTop: (target.offset().top - 35 )}, 500);
          emojisCont.get(0).scrollTop = target.get(0).offsetTop- 35;
          return false;
      }
    };
  });

}



/**
 * Update last emoji array
 * @param {String} emoji
 * @return {Array}
 */
var addLastEmoji = function (emoji) {
  var index = lastEmojis.indexOf(emoji);
  if (index >= 0) {
    lastEmojis.splice(index, 1);
  }
  lastEmojis.unshift(emoji);
  lastEmojis = lastEmojis.slice(0, 10);
  var storeObj = {};
  storeObj[storeLastEmojis] = lastEmojis;
  chrome.storage.sync.set(storeObj);
  debug('Last emojis: ', lastEmojis);
  return lastEmojis;
}



/**
 * Check if need to hide all the stuff
 * @param  {Event} e
 */
var tryHideBelt = function (e) {
  var el = e.target;
  // Clicked on emoji
  if (el.matches(emojiClass) && lastInput) {
    debug('Clicked EMOJI: ', el.innerHTML);
    var startPos = lastInput.selectionStart;
    var endPos = lastInput.selectionEnd;
    var value = el.innerHTML.trim();
    addLastEmoji(value);
    debug('Last input text', lastInput, startPos, endPos);

    if (typeof lastInput.value === 'undefined') {
      insertTextAtCursor(value)
    } else {
      lastInput.value = lastInput.value.substring(0, startPos)
        + value
        + lastInput.value.substring(endPos, lastInput.value.length);
      lastInput.selectionStart = startPos + value.length;
      lastInput.selectionEnd = startPos + value.length;
      debug('Last input value after', lastInput.value);
    }
  }
  if (!el.matches(inputsToBelt + ', .' + pfx +'-btn_image') &&
      !el.closest('.' + pfx) &&
      el != beltBtnEl.get(0)) {
    beltBtnEl.css('display', 'none');
    beltPanelEl.css('display', 'none');
    docEl.off('click', tryHideBelt);
    lastInput = null;
  } else {
    if(lastInput){
      lastInput.focus();
    }
  }
};


/**
 * Insert for contenteditable elements
 * @param  {String} text
 */
function insertTextAtCursor(text) {
    var sel, range, html;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
            debug('Insert inside range', range);
        }else {
          debug('NO RANGE AT', sel, sel.getRangeAt, sel.rangeCount);
        }
    }
}



// Ask data to the bg.js script
chrome.runtime.sendMessage({action: 'getPanelTemplate'}, function(response) {
  debug('Bg response', response);
  beltPanelEl = $(response.data);
  beltBtnEl.css('display', 'none');
  beltPanelEl.css('top', '-1000px');
  beltBtnEl.on('click', toggleBeltPanel);

  chrome.storage.sync.get(storeLastEmojis, function(items){
    debug('Load last emojis', items);
    lastEmojis = items[storeLastEmojis] || [];
  });

  document.body.appendChild(beltBtnEl.get(0));
  document.body.appendChild(beltPanelEl.get(0));
  initEmojiBelt();
});
