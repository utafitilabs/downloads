/*
   Renders each app's releases from GitHub's public releases API, in the
   reader's browser. One unauthenticated request serves the whole page; every
   app section filters the same list by its own tag prefix.

   The API is unauthenticated, so it can be unreachable or rate-limited. That
   case is not hidden: the section says what happened and links to the releases
   page, which always works.
*/
(function () {
  'use strict';

  var API = 'https://api.github.com/repos/utafitilabs/downloads/releases?per_page=100';
  var RELEASES_PAGE = 'https://github.com/utafitilabs/downloads/releases';

  var sections = document.querySelectorAll('.app[data-prefix]');
  if (!sections.length) { return; }

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (response) {
      if (!response.ok) { throw new Error('HTTP ' + response.status); }
      return response.json();
    })
    .then(function (releases) {
      if (!Array.isArray(releases)) { throw new Error('unexpected response'); }
      Array.prototype.forEach.call(sections, function (section) {
        render(section, forSection(releases, section.dataset.prefix));
      });
    })
    .catch(function () {
      Array.prototype.forEach.call(sections, fallback);
    });

  /* Published, non-draft releases for one app, newest first. */
  function forSection(releases, prefix) {
    return releases
      .filter(function (release) {
        return !release.draft &&
          typeof release.tag_name === 'string' &&
          release.tag_name.indexOf(prefix) === 0;
      })
      .sort(function (a, b) {
        return Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0);
      });
  }

  function render(section, releases) {
    var latestBox = section.querySelector('[data-latest]');

    if (!releases.length) {
      latestBox.textContent = '';
      latestBox.appendChild(
        line('No build has been published for this app yet.')
      );
      return;
    }

    latestBox.textContent = '';
    latestBox.appendChild(latestCard(releases[0]));

    var rest = releases.slice(1);
    if (!rest.length) { return; }

    var older = section.querySelector('[data-older]');
    var list = section.querySelector('[data-older-list]');
    rest.forEach(function (release) { list.appendChild(olderRow(release)); });
    older.hidden = false;
  }

  function latestCard(release) {
    var frag = document.createDocumentFragment();

    var version = document.createElement('p');
    version.className = 'version';
    version.textContent = release.name || release.tag_name;
    frag.appendChild(version);

    var meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = 'Latest · ' + release.tag_name +
      ' · published ' + when(release.published_at);
    frag.appendChild(meta);

    var asset = downloadable(release);
    if (asset) {
      var button = document.createElement('a');
      button.className = 'button';
      button.href = asset.browser_download_url;
      button.textContent = 'Download';
      frag.appendChild(button);

      var size = document.createElement('span');
      size.className = 'size';
      size.textContent = asset.name + ' · ' + megabytes(asset.size);
      frag.appendChild(size);
    } else {
      frag.appendChild(line('This release has no downloadable build attached.'));
    }

    var digest = sha256(release.body);
    if (digest) {
      var line256 = document.createElement('p');
      line256.className = 'digest';
      line256.appendChild(document.createTextNode('SHA-256 '));
      var code = document.createElement('code');
      code.textContent = digest;
      line256.appendChild(code);
      frag.appendChild(line256);
    }

    var notes = document.createElement('p');
    notes.className = 'digest';
    var link = document.createElement('a');
    link.href = release.html_url;
    link.textContent = 'Release notes';
    notes.appendChild(link);
    frag.appendChild(notes);

    return frag;
  }

  function olderRow(release) {
    var row = document.createElement('li');

    var asset = downloadable(release);
    var name = release.tag_name;

    if (asset) {
      var link = document.createElement('a');
      link.href = asset.browser_download_url;
      link.textContent = name;
      row.appendChild(link);
    } else {
      row.appendChild(document.createTextNode(name));
    }

    var when_ = document.createElement('span');
    when_.className = 'when';
    when_.textContent = when(release.published_at);
    row.appendChild(when_);

    var notes = document.createElement('a');
    notes.className = 'when';
    notes.href = release.html_url;
    notes.textContent = 'notes';
    row.appendChild(notes);

    return row;
  }

  /* The installable build: the first .apk, else the first asset at all. */
  function downloadable(release) {
    var assets = release.assets || [];
    for (var i = 0; i < assets.length; i++) {
      if (/\.apk$/i.test(assets[i].name)) { return assets[i]; }
    }
    return assets[0] || null;
  }

  /* The digest as the notes print it, if they print one. */
  function sha256(body) {
    if (typeof body !== 'string') { return null; }
    var match = body.match(/\b[a-f0-9]{64}\b/i);
    return match ? match[0].toLowerCase() : null;
  }

  function megabytes(bytes) {
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function when(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) { return 'an unknown date'; }
    return date.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function line(text) {
    var p = document.createElement('p');
    p.className = 'status';
    p.textContent = text;
    return p;
  }

  /* Say what went wrong, and point at the page that does not depend on the API. */
  function fallback(section) {
    var box = section.querySelector('[data-latest]');
    box.textContent = '';

    var p = document.createElement('p');
    p.className = 'status';
    p.appendChild(document.createTextNode(
      'The release list could not be loaded — GitHub’s API is ' +
      'unreachable or this browser has been rate-limited. Every build is ' +
      'still on the '
    ));
    var link = document.createElement('a');
    link.href = RELEASES_PAGE;
    link.textContent = 'releases page';
    p.appendChild(link);
    p.appendChild(document.createTextNode('.'));

    box.appendChild(p);
  }
})();
