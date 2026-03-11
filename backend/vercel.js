// Vercel serverless entry point
// Адаптировано для работы в serverless окружении Vercel

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Импортируем оригинальный app
const app = require('./index.js');

// Vercel ожидает обработчик в module.exports
module.exports = app;
