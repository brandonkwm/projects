const express = require('express');
const router = express.Router();
const { getAll, getById, save, remove } = require('../store/communication-templates');

router.get('/', (req, res) => {
  try {
    const list = getAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const t = getById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Communication template not found' });
  res.json(t);
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
