let isStartup = false;
const DEBUG = false;

/**
 * Do some debugging
 * @param {string} args
 * @returns {undefined}
 */
function debug(args) {
  if (DEBUG) {
    console.debug(args);
  }
}

// Fired when the browser starts
chrome.runtime.onStartup.addListener(() => {
  debug('startup');
  isStartup = true;
  setTimeout(() => isStartup = false, 5000);
});

// Extension install/update
chrome.runtime.onInstalled.addListener(() => {
  debug('installed');
  isStartup = true;
  setTimeout(() => isStartup = false, 5000);
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (isStartup) {
    return;
  }

  const tabId = tab.id;
  const groupId = tab.groupId;
  const windowId = tab.windowId;

  // Only care if Chrome placed it in a group
  if (tab.groupId === -1){
    return;
  }
  debug('new tab created, groupid=' + groupId + ' tabid=' + tabId);

  // Ungroup the tab
  await chrome.tabs.ungroup(tabId);
  tab = await chrome.tabs.get(tabId);
  debug('tab ungrouped new groupid=' + tab.groupId + ' new index=' + tab.index);

  // Get all tabs in this window
  let tabs = await chrome.tabs.query({windowId});
  for (const t of tabs) {
    debug('tab id=' + t.id + ' index=' + t.index + ' groupid=' + t.groupId + ' ' + t.title);
  }

  // Find the last tab index of that group
  const groupTabs = tabs.filter(t => t.groupId === groupId);
  const lastIndex = Math.max(...groupTabs.map(t => t.index));
  
  let moveTo;
  if (tab.index < lastIndex) {
    // we use lastIndex rather than lastIndex + 1 because the ungrouped tab, the one that we are moving
    // is at index 0, so when we remove it in the process of moving it, the index of the other
    // tabs decreases by one
    moveTo = lastIndex;
  } else {
    // the tab is after the last index in the group, so we need to add one
    moveTo = lastIndex + 1;
  }  
  debug('lastIndex=' + lastIndex + ' moveTo=' + moveTo);

  // Move it AFTER the group
  await chrome.tabs.move(tabId, {index: moveTo});
  debug('tab moved');
  
  if (DEBUG) {
    tabs = await chrome.tabs.query({windowId});
    for (const t of tabs) {
      debug('tab id=' + t.id + ' index=' + t.index + ' groupid=' + t.groupId + ' ' + t.title);
    }
  }
});
