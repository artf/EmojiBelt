
var pfx = 'emjblt';
var panelTemplate = '';

var getPanelTemplate = function () {
  if (!panelTemplate) {
    if (emojiDb) {
      var emjCatStr = '';
      var emjStr = '';
      var addClass = '';
      var category;
      emojiDb.forEach(function(emj) {
        if (category != emj.category && emj.category) {
          emjCatStr += `<span class="${pfx}-emoji-category" data-target="#${pfx}-${emj.emoji}">${emj.emoji}</span>`;
          addClass = !category ? pfx + '-divider-f' : '';
          emjStr += `<div class="${pfx}-divider ${addClass}" id="${pfx}-${emj.emoji}"></div>`;
          category = emj.category;
        }
        if(emj.emoji && emj.unicode_version &&
          emj.unicode_version != '9.0'){
          emjStr += `<span class="${pfx}-emoji" title="${emj.description}">${emj.emoji}</span>`;
        }
      });
      panelTemplate = `<div class="${pfx}-c">
                        <div class="${pfx}">
                          <div class="${pfx}-categories">${emjCatStr}</div>
                          <div class="${pfx}-emojies">
                            <div class="${pfx}-last-emojies"></div>
                            ${emjStr}
                          </div>
                        </div>
                      </div>`;
    }
  }

  return panelTemplate;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'getPanelTemplate'){
      var tmp = getPanelTemplate();
      sendResponse({data: tmp});
    }
    return true;
  }
);

/*
chrome.extension.onMessage.addListener(function(data) {
    chrome.tabs.query({
        title: "title pattern",
        url: "http://domain/*urlpattern*"
    }, function(result) {
        // result is an array of tab.Tabs
        if (result.length === 1) { // There's exactely one tab matching the query.
            var tab = result[0];
            // details.message holds the original message
            chrome.tabs.sendMessage(tab.id, details.message);
        }
    });
});
*/
