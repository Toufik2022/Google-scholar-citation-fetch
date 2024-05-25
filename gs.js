const express = require('express');
const app = express();
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const url = require('url');

const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Google Scholar Real-time Cited By Dashboard View</title>
      <link rel="icon" href="https://scholar.google.com/favicon.ico" type="image/x-icon">
      <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          background-image: url('https://wallpaperaccess.com/full/1567770.gif');
          background-repeat: no-repeat;
          background-size: cover;
          padding: 2rem;
          text-align: center;
        }
        .form-container {
          max-width: 500px;
          margin: auto;
          padding: 2rem;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          background-color: #ffa0a04f;
        }
        .table-container {
          max-width: 80%;
          margin: auto;
          margin-top: 2rem;
        }
        .center {
          margin-top: 2rem;
        }
      </style>
    </head>
    <body>
      <div class="container" style="margin-top: 20px; text-align: center;">
        <button style="background-color: #00000094; padding: -10px 20px; margin-right: 1px;">
          <a style="color: white; text-decoration: none; font-size: 18px; font-weight: bold;">Google Scholar Real-time Cited By Dashboard View</a>
        </button>
      </div>
      <br>
      <div class="container" style="margin-top: 20px; text-align: center;">
        <button style="background-color: #00000094; padding: -10px 20px; margin-right: 1px;">
          <a style="color: white; text-decoration: none; font-size: 18px; font-weight: bold;">© ® Developed By Toufik</a>
        </button>
      </div>
      <br>
      <p align="center">
        <img
          style="display: block;"
          src="https://readme-typing-svg.herokuapp.com?font=Montserrat&size=20&duration=5001&color=8B0000&vCenter=true&center=true&width=460&lines=WLC+TO+GOOGLE+SCHOLAR+;REAL-TIME+CITED+BY;DASHBOARD+VIEW">
      </p>
      <div class="form-container">
        <form action="/getCitedByData" method="post">
          <div class="form-group">
            <input type="text" id="googleScholarInput" name="googleScholarInput" class="form-control" placeholder="Enter Google Scholar Name or url or id" required>
          </div>
          <button type="submit" class="btn btn-primary">Cited By Data</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.post('/getCitedByData', async (req, res) => {
  const { googleScholarInput } = req.body;

  try {
    let googleScholarId = '';

    if (/^https:\/\/scholar\.google\.com\/citations\?hl=en&user=[a-zA-Z0-9_-]+$/.test(googleScholarInput)) {
      const parsedUrl = url.parse(googleScholarInput, true);
      googleScholarId = parsedUrl.query.user;
    } else if (/^[a-zA-Z0-9_-]+$/.test(googleScholarInput)) {
      googleScholarId = googleScholarInput;
    } else {

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(`https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=${encodeURIComponent(googleScholarInput)}`);

      const searchContent = await page.content();
      const $search = cheerio.load(searchContent);

      const profileLink = $search('.gsc_1usr a').attr('href');
      if (profileLink) {
        const parsedProfileUrl = url.parse(profileLink, true);
        googleScholarId = parsedProfileUrl.query.user;
      }

      await browser.close();
    }

    if (!googleScholarId) {
      throw new Error('Invalid Google Scholar input');
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://scholar.google.com/citations?hl=en&user=${googleScholarId}`);

    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);

    const citedByData = [];
    $('#gsc_rsb_cit tbody tr').each((index, element) => {
      const metric = $(element).find('.gsc_rsb_sc1 a').text().trim();
      const allCount = $(element).find('.gsc_rsb_std').eq(0).text().trim();
      const since2019Count = $(element).find('.gsc_rsb_std').eq(1).text().trim();

      citedByData.push({ metric, allCount, since2019Count });
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Scholar Cited By Dashboard</title>
        <link rel="icon" href="https://scholar.google.com/favicon.ico" type="image/x-icon">
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        <p align="center">
          <img
            style="display: block;"
            src="https://readme-typing-svg.herokuapp.com?font=Montserrat&size=20&duration=5001&color=8B0000&vCenter=true&center=true&width=460&lines=WLC+TO+GOOGLE+SCHOLAR+;REAL-TIME+CITED+BY;DASHBOARD+VIEW">
        </p>
        <br>
        <style>
          body {
            background-image: url('https://wallpaperaccess.com/full/1567770.gif');
            background-repeat: no-repeat;
            background-size: cover;
          }
          .table-container {
            max-width: 80%;
            margin: auto;
            margin-top: 2rem;
          }
          .center {
            margin-top: 2rem;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="table-container">
          <table class="table table-bordered table-striped">
            <thead class="thead-dark">
              <tr>
                <th>Metric</th>
                <th>All Count</th>
                <th>Since 2019 Count</th>
              </tr>
            </thead>
            <tbody>
              ${citedByData
                .map(
                  (dataPoint) => `
                <tr>
                  <td>${dataPoint.metric}</td>
                  <td>${dataPoint.allCount}</td>
                  <td>${dataPoint.since2019Count}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <div class="center">
          <form action="/" method="get">
            <button type="submit" class="btn btn-secondary">Search Again</button>
          </form>
        </div>
        <br><br>
        <div class="container" style="margin-top: 20px; text-align: center;">
          <button style="background-color: #00000094; padding: -10px 20px; margin-right: 1px;">
            <a style="color: white; text-decoration: none; font-size: 18px; font-weight: bold;">© ® Developed By Toufik</a>
          </button>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});