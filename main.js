let runtime;
navigator.userAgent.match(/chrome|chromium|crios/i) ? (runtime = chrome.runtime) : (runtime = browser.runtime);
console.log(runtime);

// Scrap LinkedIn Feed and get data

const scrapper = (port) => {
  const data = {
    user: '',
    job: '',
    feed: [],
  };
  const feed_containers = document.getElementsByClassName('scaffold-layout__main')[0].lastElementChild.lastElementChild.children;
  data['user'] = document.querySelector('.feed-identity-module__actor-meta').innerText.split('\n\n')[0];
  data['job'] = document.querySelector('.feed-identity-module__actor-meta').innerText.split('\n\n')[1];
  Object.values(feed_containers).forEach((container, i) => {
    try {
      data['feed'].push({
        name: container.querySelector('.feed-shared-actor__name').innerText,
        isIn: container.querySelector('.feed-shared-actor__container-link').getAttribute('href').split('/')[3] === 'in',
        reactions_n: container.querySelector('.social-details-social-counts__social-proof-fallback-number').innerText ?? container.querySelector('.social-details-social-counts__reactions-count').innerText,
        subject: Object.values(container.querySelectorAll('.break-words')).filter((el) => el.nodeName === 'SPAN')[0].innerText ?? false,
      });
    } catch (err) {
      err;
    }
  });

  const linkdiniens = data['feed'].filter((c) => c.isIn);

  // Adding same person's reactions number
  const noMore = [];

  linkdiniens.map((l, i) => {
    let count = 0;

    if (!noMore.includes(l.name)) {
      linkdiniens.forEach((li, j) => {
        l.name === li.name ? (count += 1) : null;
        count > 1 && l.name === li.name ? (l.reactions_n = parseInt(l.reactions_n) + parseInt(li.reactions_n)) : null;
      });

      count > 1 ? noMore.push(l.name) : null;
    } else {
      linkdiniens.splice(i, 1);
    }
  });

  data['feed'] = linkdiniens;

  // Find the most influent
  const biggest = linkdiniens.reduce((prev, next) => {
    return prev >= parseInt(next.reactions_n) ? prev : parseInt(next.reactions_n);
  }, parseInt(linkdiniens[0].reactions_n));

  const theOne = linkdiniens.find((obj) => parseInt(obj.reactions_n) === biggest);

  // Send Data to API
  fetch('https://im-famous-on-linked-in.vercel.app/api/add', {
    method: 'post',
    body: JSON.stringify(data),
  })
    .then((d) => {
      port.postMessage({ theOne: [theOne.name, theOne.reactions_n] });
      console.log(d.ok)
    })
};

// Throw searching

const Fire = (port) => {
  const id = setInterval(() => {
    const scroll_el = document.getElementsByClassName('scaffold-layout__main')[0].lastChild;
    const a = document.getElementsByClassName('feed-shared-actor__container-link');
    const more_feed_btn = document.getElementsByTagName('button');
    const btns = Object.values(more_feed_btn);

    if (a.length <= 100) {
      const btn_displayed = btns.find((el) => el.innerText === 'Voir les nouveaux posts');
      const btn_more = btns.find((el) => el.innerText === 'Afficher plus de résultats');
      btn_displayed === undefined ? null : clearInterval(id);
      btn_more === undefined ? window.scrollBy(0, document.body.scrollHeight) : (btn_more.scrollIntoView(), btn_more.click());
      port.postMessage({ progress: a.length });
    } else {
      clearInterval(id);
      scrapper(port);
      port.postMessage({ progress: 100 });
    }
  }, 1500);
  port.onDisconnect.addListener(() => {
    clearInterval(id);
  });
};

// Make connexion between tabs and content-script and Listening for events

console.log("I'm famous on LinkedIn ✌️");

runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((data) => {
    if (data.msg === 'fire') {
      console.clear();
      Fire(port);
      port.postMessage({ run: true });
    }
  });
});
