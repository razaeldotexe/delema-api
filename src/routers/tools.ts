import { Router, Request, Response } from 'express';
import { 
  JsonToolRequestSchema, 
  CodeFormatRequestSchema, 
  CryptoToolRequestSchema, 
  UrlToolRequestSchema, 
  TimeToolRequestSchema 
} from '../types/schemas';
import { JsonService } from '../services/json.service';
import { FormatService } from '../services/format.service';
import { CryptoService } from '../services/crypto.service';
import { UrlService } from '../services/url.service';
import { TimeService } from '../services/time.service';
import { validateRequest } from '../middleware/validate';

const router = Router();

// 1. JSON Tools
router.post('/json', validateRequest(JsonToolRequestSchema), (req: Request, res: Response) => {
  const { action, input, input2 } = req.body;
  let result;
  switch (action) {
    case 'prettify': result = JsonService.prettify(input); break;
    case 'minify': result = JsonService.minify(input); break;
    case 'validate': result = JsonService.validate(input); break;
    case 'diff': result = JsonService.diff(input, input2 || '{}'); break;
  }
  res.json({ success: true, result, error: null });
});

// 2. Code Formatter
router.post('/format', validateRequest(CodeFormatRequestSchema), async (req: Request, res: Response) => {
  const { language, code } = req.body;
  const result = await FormatService.format(code, language);
  res.json({ success: true, result, error: null });
});

// 3. Hash & Encode
router.post('/crypto', validateRequest(CryptoToolRequestSchema), (req: Request, res: Response) => {
  const { action, type, input } = req.body;
  let result;
  if (action === 'hash') {
    result = CryptoService.hash(input, type as 'md5' | 'sha256');
  } else if (action === 'encode') {
    result = CryptoService.encode(input, type as 'base64');
  } else {
    result = CryptoService.decode(input, type as 'base64');
  }
  res.json({ success: true, result, error: null });
});

// 4. URL Parser
router.post('/url', validateRequest(UrlToolRequestSchema), (req: Request, res: Response) => {
  const { action, input } = req.body;
  if (action === 'parse') {
    const result = UrlService.parse(input);
    res.json(result);
  } else if (action === 'encode') {
    const result = UrlService.encode(input);
    res.json({ success: true, result, error: null });
  } else {
    const result = UrlService.decode(input);
    res.json({ success: true, result, error: null });
  }
});

// 5. Timestamp Tools
router.post('/time', validateRequest(TimeToolRequestSchema), (req: Request, res: Response) => {
  const { action, input } = req.body;
  let result;
  if (action === 'now') {
    result = TimeService.now();
  } else {
    result = TimeService.convert(input || Date.now());
  }
  res.json(result);
});

export default router;
