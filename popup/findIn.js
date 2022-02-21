let tabs;
navigator.userAgent.match(/chrome|chromium|crios/i) ? (tabs = chrome.tabs) : (tabs = browser.tabs);

document.querySelector('#fire').onclick = (e) => {
  e.target.disabled = true;
  tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (t) => {
      const port = tabs.connect(t[0].id, { name: 'theFireTab' });
      port.postMessage({ msg: 'fire' });
      port.onMessage.addListener((data) => {
        if (data.run) {
          document.querySelector('.loader-wrapper').style.display = 'flex';
          document.querySelector('.warning').style.display = 'flex';
        }
        if (data.progress) {
          document.querySelector('.front-loader').style.width = `${data.progress}%`;
          document.querySelector('.progress').innerText = `${data.progress}%`;
        }
        if (data.theOne) {
          document.querySelector('.result-wrapper').style.backgroundColor = 'green';
          document.querySelector('.winner').innerText = `🏆 ${data.theOne[0]} 🏆 \n\n avec ${data.theOne[1]} réactions`;
          setTimeout(() => (document.querySelector('.result-wrapper').style.backgroundColor = 'rgb(30, 30, 30)'), 800);
        }
      });
    }
  );
};
