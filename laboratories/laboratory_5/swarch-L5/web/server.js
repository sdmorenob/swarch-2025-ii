const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Web App'));
app.listen(3000, () => console.log('Web on 3000'));