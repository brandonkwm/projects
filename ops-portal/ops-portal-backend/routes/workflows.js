const express = require('express');
const router = express.Router();
const { getAll, getById, save, remove } = require('../store/workflows');

router.get('/', (req, res) => {
  try {
    const list = getAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const w = getById(req.params.id);
  if (!w) return res.status(404).json({ error: 'Workflow not found' });
  res.json(w);
});

router.post('/', (req, res) => {
  try {
    const saved = save(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const saved = save({ ...req.body, id: req.params.id });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  remove(req.params.id);
  res.status(204).send();
});

module.exports = router;
