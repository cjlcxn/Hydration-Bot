const secInterval = 1;
let timerMin = 30;
const currTime = (minCount, secCount) =>
  `${minCount.toString().padStart(2, "0")}:${secCount
    .toString()
    .padStart(2, "0")}`;
let timerCount;
let timer;
let statusBtn;

const timedown = function (isStart, min, secInterval) {
  let minCount = min;
  let secCount = 0;

  // if stop btn pressed
  if (!isStart) {
    clearInterval(timer);
    statusBtn = true;
    return;
  }
  // if start button pressed
  statusBtn = false;
  lastSavedTimer = "";
  timer = setInterval(() => {
    // logic on timers, 1) start with 02:00, 2) if xx:00, reduce xx by 1, and 00 to 59. 3)else just reduce seconds by 1
    if (secCount === 0) {
      minCount--;
      secCount = 60 - secInterval;
    } else {
      secCount -= secInterval;
    }

    // log the timer
    timerCount = currTime(minCount, secCount);
    console.log(currTime(minCount, secCount));

    if (minCount === 0 && secCount === 0) {
      chrome.notifications.create("", {
        type: "basic",
        title: "Water Time!",
        message: "Drink woter",
        iconUrl: "/images/128px.png",
        silent: true,
      });
      clearInterval(timer);
      timedown(true, min, secInterval);
    }
  }, secInterval * 1000);
};

// chrome.runtime.onInstalled.addListener(function() {
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("message received from popup");

  // if message received = start, start the countdown
  if (request.greeting === "start") {
    timedown(true, timerMin, secInterval);
    sendResponse({ farewell: "start" });
  }

  if (request.greeting === "end") {
    timedown(false, timerMin, secInterval);
    sendResponse({ farewell: "end" });
  }

  if (request.greeting === "reload") {
    console.log("extension!");
    sendResponse({
      farewell: timerCount,
      button: statusBtn,
      timerMin,
    });
  }

  if (request.greeting === "update") {
    console.log(request.min);
    timerMin = request.min;
    console.log(timerMin);
    sendResponse({ farewell: "updated" });
  }
});

// pasted code from stackoverflow - to continue loop
let lifeline;

keepAlive();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keepAlive") {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3); // 5 minutes minus 5 seconds
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: "*://*/*" })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: "keepAlive" }),
        // `function` will become `func` in Chrome 93+
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}
