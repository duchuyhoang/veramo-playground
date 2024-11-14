import express from 'express';
import bodyParser from 'body-parser';
import swagger from 'swagger-ui-express';
import path from 'path';
import swaggerDocument from './public/openapi.json';
import { errorHandler, notFoundHandler } from './response-handler';
import identifierRoutes from './routes/IdentifierRoutes';
import issuerRoutes from './routes/IssuerRoutes';
import holderRoutes from './routes/HolderRoutes';
import verifierRoutes from './routes/VerifierRoutes';

const PORT = 3000;
const DOC_PATH = 'docs';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// API Routes
app.use('/identifiers', identifierRoutes);
app.use('/issuers', issuerRoutes);
app.use('/holders', holderRoutes);
app.use('/verifiers', verifierRoutes);

// WWW Routes
app.use('/schemas', (req, res, next) => {
  const extname = path.extname(req.url);
  if (extname === '.json') {
    return express.static(path.join('src', 'public'))(req, res, next);
  }
  res.status(403).send('Forbidden: Only JSON files are allowed');
});
app.use('/docs', swagger.serveFiles(swaggerDocument), swagger.setup(swaggerDocument));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🏠 Running on http://localhost:${PORT}`);
  console.log(`📄 Document running on http://localhost:${PORT}/${DOC_PATH}`);
});
