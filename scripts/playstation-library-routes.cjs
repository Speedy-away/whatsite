'use strict';

const legacy = 'console/ps4/game-library/';
const directory = 'console/playstation-library/';
const index = directory + "index.html";
const download = directory + "download.html";
const redirects = new Map([[legacy + "index.html", index], [legacy + "download.html", download]]);

function moveTranslation(page) {
  const destination = redirects.get(page.page);
  if (!destination) return page;
  const canonical = new URL("/" + destination.replace(/index\.html$/, ""), page.canonical).href;
  return {...page, page: destination, canonical};
}

function redirectPage(destination, locale = "") {
  const target = "/" + (locale ? locale + "/" : "") + destination.replace(/index\.html$/, "");
  const canonical = "https://whatwhatboy.com" + target;
  return `<!doctype html>
<html lang="${locale || "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>PlayStation Game Library | WhatWhatBoy</title>
  <link rel="canonical" href="${canonical}">
  <script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
  <meta http-equiv="refresh" content="0; url=${target}">
</head>
<body><a href="${target}">Open the PlayStation Game Library</a></body>
</html>
`;
}

module.exports = {legacy, directory, index, download, redirects, moveTranslation, redirectPage};
