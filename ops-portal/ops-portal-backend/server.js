const express = require('express');
const cors = require('cors');
const workflowsRouter = require('./routes/workflows');
const caseTemplatesRouter = require('./routes/case-templates');
const communicationTemplatesRouter = require('./routes/communication-templates');
const casesRouter = require('./routes/cases');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/workflows', workflowsRouter);
app.use('/api/case-templates', caseTemplatesRouter);
app.use('/api/communication-templates', communicationTemplatesRouter);
app.use('/api/cases', casesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ops-portal-backend' });
});

app.listen(PORT, () => {
  console.log(`Ops Portal Backend running at http://localhost:${PORT}`);
});
