var express = require('express')
  , app = express();

app.use(express.static('/var/www/html'));

app.listen(81, "0.0.0.0");