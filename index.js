const express = require('express'); 
var cors = require('cors')
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyDWxWcWFFnOUJZ3uVVw2mwCZeZmC0A1PhU');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const app = express();
const port = 3000;
app.use(express.json({ limit: '100mb' }));
app.use(cors())
app.post('/upload', (req, res) => {
    const { uri } = req.body;
    console.log(uri)
    if (!uri) return res.status(400).send({ error: 'No URI provided' });
    require("fs").writeFile("out.png", uri.replace(/^data:image\/png;base64,/, ""), 'base64', async function(err) {    
        const result = await model.generateContent([
        "I want you to send back a JSON object only, not even formatting. It must have a \"recyclable\" key, the value of which is a boolean that says whether the object in focus is recyclable or not. There should also be a \"type\" key, the value of which is a string, saying the following: \"This is a or these are [type of object in focus], which is/are    \". Lastly, there should be an \"info\"    key, the value of which is a string. This value should have any additional information or facts about its eco friendliness",
        {
            inlineData: {
              data: uri.replace(/^data:image\/png;base64,/, ""),
              mimeType: "image/png",
            },
          } 
        ]);
        console.log(result.response.text())
        res.json(JSON.parse(result.response.text()));    
    });

});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
