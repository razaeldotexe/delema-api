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

const router = Router();

// 1. JSON Tools
router.post('/json', (req: Request, res: Response) => {
  const validation = JsonToolRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { action, input, input2 } = validation.data;
  try {
    let result;
    switch (action) {
      case 'prettify': result = JsonService.prettify(input); break;
      case 'minify': result = JsonService.minify(input); break;
      case 'validate': result = JsonService.validate(input); break;
      case 'diff': result = JsonService.diff(input, input2 || '{}'); break;
    }
    res.json({ success: true, result, error: null });
  } catch (error: any) {
    res.status(400).json({ success: false, result: null, error: error.message });
  }
});

// 2. Code Formatter
router.post('/format', async (req: Request, res: Response) => {
  const validation = CodeFormatRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { language, code } = validation.data;
  try {
    const result = await FormatService.format(code, language);
    res.json({ success: true, result, error: null });
  } catch (error: any) {
    res.status(400).json({ success: false, result: null, error: error.message });
  }
});

// 3. Hash & Encode
router.post('/crypto', (req: Request, res: Response) => {
  const validation = CryptoToolRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { action, type, input } = validation.data;
  try {
    let result;
    if (action === 'hash') {
      result = CryptoService.hash(input, type as 'md5' | 'sha256');
    } else if (action === 'encode') {
      result = CryptoService.encode(input, type as 'base64');
    } else {
      result = CryptoService.decode(input, type as 'base64');
    }
    res.json({ success: true, result, error: null });
  } catch (error: any) {
    res.status(400).json({ success: false, result: null, error: error.message });
  }
});

// 4. URL Parser
router.post('/url', (req: Request, res: Response) => {
  const validation = UrlToolRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { action, input } = validation.data;
  try {
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
  } catch (error: any) {
    res.status(400).json({ success: false, result: null, error: error.message });
  }
});

// 5. Timestamp Tools
router.post('/time', (req: Request, res: Response) => {
  const validation = TimeToolRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({ detail: validation.error.errors });
  }

  const { action, input } = validation.data;
  try {
    let result;
    if (action === 'now') {
      result = TimeService.now();
    } else {
      result = TimeService.convert(input || Date.now());
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, result: null, error: error.message });
  }
});

export default router;
