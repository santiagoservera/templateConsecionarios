require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DealerOS API corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
