const express = require('express'); 
const cors = require('cors')
const erBase = require("eventregistry");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyDWxWcWFFnOUJZ3uVVw2mwCZeZmC0A1PhU');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const app = express();
const port = 3000;
const cache = {};           
app.use(express.text({ limit: '100mb', type:'text/plain' }));
app.use(cors())
app.get('/news', async (req, res) => {
  try {   
    const response = await fetch('https://eventregistry.org/api/v1/article/getArticlesForTopicPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uri: '240f6a12-b9d8-40a6-b1c6-a220e31d08de',
        infoArticleBodyLen: -1,
        resultType: 'articles',
        articlesSortBy: 'fq',
        apiKey: '1ffa7a20-c23f-434c-b785-12a05b4ebf06',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const articles = data.articles.results;

    res.json({ articles });       
  } catch (error) {
    console.error('Error fetching news articles:', error);
    res.status(500).send('Internal Server Error');
  }
}); 
app.post('/upload', (req, res) => {
    const uri = req.body;
    console.log(uri)
    if (!uri) return res.status(400).send({ error: 'No URI provided' });
    require("fs").writeFile("out.png", uri.replace(/^data:image\/png;base64,/, ""), 'base64', async function(err) {    
        const result = await model.generateContent([
        "I want you to send back a JSON object only, not even formatting. It must have a \"recyclable\" key, the value of which is a boolean that says whether the object in focus is recyclable or not. There should also be a \"type\" key, the value of which is a string, saying the following: \"This is a or these are [type of object in focus], which is/are\". Lastly, there should be an \"info\" key, the value of which is a string. This value should have any additional information or facts about its eco friendliness",
        {
            inlineData: {
              data: uri.replace(/^data:image\/png;base64,/, ""),
              mimeType: "image/png",
            },
          } 
        ]);
        console.log(result.response.text());
        res.send(result.response.text());    
    });

});
app.get('/article', async (req, res) => {
  const uri = req.query.uri;

  // Check if the article is in the cache
  if (cache[uri]) {
    return res.send(cache[uri]);
  }

  try {
    // Fetch article from the external API
    const response = await fetch('https://eventregistry.org/api/v1/article/getArticle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getArticle',
        articleUri: uri,
        infoArticleBodyLen: -1,
        resultType: 'info',
        apiKey: '3af292d9-b0b4-46a1-abb0-a00e01e517f5',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const articleData = data[uri].info;

    const newBody = await model.generateContent(
      `Format this using markdown, for the small sections you can add ## and ###\n${articleData.title}\n${articleData.date} by ${articleData.authors[0] ? articleData.authors[0].name : 'Anonymous'}\n ${articleData.body}`
    );

    // Cache the processed article content
    cache[uri] = newBody.response.candidates[0].content.parts[0].text;

    // Send the cached article content
    res.send(cache[uri]);

  } catch (error) {
    console.error('Error fetching news articles:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
