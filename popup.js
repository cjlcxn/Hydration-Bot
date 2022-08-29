function options() {
  let timerMin = "30:00";
  let isEditVisible = false;
  const button1 = document.querySelector("#button1");
  const button2 = document.querySelector("#button2");
  const content = document.querySelector(".content");
  const editBtn = document.querySelector(".edit");
  const number = document.querySelector(".number");
  const confirmBtn = document.querySelector(".confirm");
  const form = document.querySelector(".form");
  const error = document.querySelector(".error");
  let timerApp;

  // function that returns array of element min and sec, in numbers (up to 99 mins ONLY)
  const retrieveTime = function (timeStr) {
    return [+timeStr.slice(0, 2), +timeStr.slice(3)];
  };

  const currTime = (min, sec = 0) =>
    `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  const timedown = function (min, sec = 0) {
    clearInterval(timerApp);
    timerApp = setInterval(() => {
      // logic on timers, 1) start with 02:00, 2) if xx:00, reduce xx by 1, and 00 to 59. 3)else just reduce seconds by 1
      if (sec === 0) {
        min--;
        sec = 60 - 1;
      } else {
        sec -= 1;
      }

      // manipulate the dom with the timer
      content.textContent = currTime(min, sec);

      if (min === 0 && sec === 0) {
        clearInterval(timerApp);
        timedown(retrieveTime(timerMin)[0]);
      }
    }, 1000);
  };

  // if start button pushed, message is sent to background, and it starts counting down
  button1.addEventListener("click", function () {
    // return early, if edit form visible
    if (isEditVisible) return;

    chrome.runtime.sendMessage({ greeting: "start" }, function (response) {
      console.log(response.farewell);
      if (response.farewell === "start") {
        // if green button pressed, make button display:none
        button1.style.display = "none";
        button2.style.display = "block";
        editBtn.style.display = "none";

        // coutdown also in the popout
        timedown(...retrieveTime(timerMin));
      }
    });
  });

  // if stop button pushed, message is sent to background and pause the timer
  button2.addEventListener("click", function () {
    chrome.runtime.sendMessage({ greeting: "end" }, function (response) {
      console.log(response.farewell);
      if (response.farewell === "end") {
        //swap button
        button1.style.display = "block";
        button2.style.display = "none";
        editBtn.style.display = "block";

        // coutdown stop also in the popout, reset to default
        clearInterval(timerApp);
        content.textContent = timerMin;
      }
    });
  });

  // eventListener for clicking on extension icon
  chrome.runtime.sendMessage({ greeting: "reload" }, function (response) {
    console.log(response.farewell);
    if (!response.farewell) {
      console.log("just started");
      content.textContent = timerMin;
    }
    if (response.farewell) {
      // display the time retrieved
      console.log(response.farewell);
      // set the default countdown, to the saved default in background, and change the default number.value displayed
      timerMin = currTime(response.timerMin);
      number.value = response.timerMin;

      // setting up the initial button to display
      console.log(response.button);
      // if show reset btn (i.e. if start btn clicked)
      if (!response.button) {
        button1.style.display = "none";
        button2.style.display = "block";
        editBtn.style.display = "none";
        content.textContent = response.farewell;

        // coutdown also in the popout
        timedown(...retrieveTime(response.farewell));
      }
      // if show start btn
      if (response.button) {
        button1.style.display = "block";
        button2.style.display = "none";

        // reset display to default
        content.textContent = timerMin;
      }
    }
  });

  // edit btn event listener
  editBtn.addEventListener("click", function () {
    // hide edit btn
    editBtn.style.display = "none";
    // show text form and confirm
    form.style.display = "block";
    // make start button unclick-able, and change status
    button1.style.backgroundColor = "grey";
    isEditVisible = true;
  });

  // confirm btn
  confirmBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // error catch
    if (
      Number.parseInt(number.value) > 99 ||
      Number.parseInt(number.value) < 1
    ) {
      error.style.display = "block";
      return;
    }

    // edit content to be the inputted number
    const minCount = Number.parseInt(number.value);
    timerMin = currTime(minCount);
    content.textContent = timerMin;

    // sends message to background, just to update the new timer
    chrome.runtime.sendMessage(
      { greeting: "update", min: minCount },
      function (response) {
        console.log(response.farewell);
      }
    );

    // hide edit btn
    editBtn.style.display = "block";
    // show text form and confirm
    form.style.display = "none";
    // hide err
    error.style.display = "none";
    // make start button clickable again
    button1.style.backgroundColor = "green";
    isEditVisible = false;
  });
}

document.addEventListener("DOMContentLoaded", options);
