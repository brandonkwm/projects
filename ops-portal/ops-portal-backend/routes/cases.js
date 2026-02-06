const express = require('express');
const router = express.Router();
const { getAll, getById, save, complete, create } = require('../store/cases');

router.get('/', (req, res) => {
  try {
    const status = req.query.status; // optional: open | completed
    const list = getAll();
    const filtered = status ? list.filter((c) => c.status === status) : list;
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const c = getById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json(c);
});

router.post('/', (req, res) => {
  try {
    const created = create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const updated = save({ ...getById(req.params.id), ...req.body });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/complete', (req, res) => {
  try {
    const completedCase = complete(req.params.id, req.body.fields || {});
    if (!completedCase) return res.status(404).json({ error: 'Case not found' });
    res.json(completedCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
