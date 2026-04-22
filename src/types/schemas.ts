import { z } from 'zod';

// --- Recommendations ---

export const ScoreRequestSchema = z.object({
  items: z.array(z.record(z.any())),
  weights: z.record(z.number()),
});

export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;

// --- Rules Engine ---

export const RuleSchema = z.object({
  field: z.string(),
  operator: z.string(), // "=", "!=", ">", "<", ">=", "<=", "IN", "NOT IN"
  value: z.any(),
});

export type Rule = z.infer<typeof RuleSchema>;

export type RuleGroup = {
  condition: string; // "AND", "OR"
  rules: (Rule | RuleGroup)[];
};

export const RuleGroupSchema: z.ZodType<RuleGroup> = z.lazy(() =>
  z.object({
    condition: z.string(),
    rules: z.array(z.union([RuleSchema, RuleGroupSchema])),
  })
);

export const EvaluateRequestSchema = z.object({
  ruleset: RuleGroupSchema,
  facts: z.record(z.any()),
});

export type EvaluateRequest = z.infer<typeof EvaluateRequestSchema>;

export type DecisionTreeNode = {
  condition?: Rule | null;
  true_node?: DecisionTreeNode | any | null;
  false_node?: DecisionTreeNode | any | null;
  value?: any | null;
};

export const DecisionTreeNodeSchema: z.ZodType<DecisionTreeNode> = z.lazy(() =>
  z.object({
    condition: RuleSchema.optional().nullable(),
    true_node: z.union([DecisionTreeNodeSchema, z.any()]).optional().nullable(),
    false_node: z.union([DecisionTreeNodeSchema, z.any()]).optional().nullable(),
    value: z.any().optional().nullable(),
  })
);

export const DecisionTreeRequestSchema = z.object({
  tree: DecisionTreeNodeSchema,
  facts: z.record(z.any()),
});

export type DecisionTreeRequest = z.infer<typeof DecisionTreeRequestSchema>;

// --- Automated Routing ---

export const VariantSchema = z.object({
  name: z.string(),
  weight: z.number(),
  data: z.record(z.any()).optional().nullable(),
});

export type Variant = z.infer<typeof VariantSchema>;

export const ABTestRequestSchema = z.object({
  user_id: z.string(),
  variants: z.array(VariantSchema),
});

export type ABTestRequest = z.infer<typeof ABTestRequestSchema>;

// --- AI Search ---

export const ProductSearchRequestSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(5),
});

export type ProductSearchRequest = z.infer<typeof ProductSearchRequestSchema>;

export const ProductResultSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.string(),
  source_url: z.string().optional().nullable(),
  source_name: z.string().optional().default('AI Recommended'),
});

export type ProductResult = z.infer<typeof ProductResultSchema>;

// --- App Search ---

export const AppSearchRequestSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
});

export type AppSearchRequest = z.infer<typeof AppSearchRequestSchema>;

export const AppSearchResultSchema = z.object({
  name: z.string(),
  summary: z.string().optional().nullable(),
  icon_url: z.string().optional().nullable(),
  url: z.string(),
  source: z.string(),
});

export type AppSearchResult = z.infer<typeof AppSearchResultSchema>;

export const TrendingRequestSchema = z.object({
  source: z.string(),
  limit: z.number().optional().default(10),
});

export type TrendingRequest = z.infer<typeof TrendingRequestSchema>;

// --- FDA Search ---

export const FDACategoryEnum = z.enum(['drug', 'food', 'device']);

export const FDASearchRequestSchema = z.object({
  query: z.string(),
  category: FDACategoryEnum,
  limit: z.number().optional().default(5),
});

export type FDASearchRequest = z.infer<typeof FDASearchRequestSchema>;

// --- GitHub ---

export const GitHubScanRequestSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  token: z.string().optional().nullable(),
  path: z.string().optional().default(''),
});

export type GitHubScanRequest = z.infer<typeof GitHubScanRequestSchema>;

export const GitHubContentRequestSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  token: z.string().optional().nullable(),
  path: z.string(),
});

export type GitHubContentRequest = z.infer<typeof GitHubContentRequestSchema>;

export const FileInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  download_url: z.string().optional().nullable(),
});

export type FileInfo = z.infer<typeof FileInfoSchema>;

// --- Research ---

export const SearchRequestSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const ArxivPaperSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  summary: z.string(),
  published: z.string(),
  primary_category: z.string(),
  pdf_url: z.string(),
  entry_id: z.string(),
});

export type ArxivPaper = z.infer<typeof ArxivPaperSchema>;

export const WikipediaResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  fullurl: z.string(),
});

export type WikipediaResult = z.infer<typeof WikipediaResultSchema>;

export const NerdFontResultSchema = z.object({
  patchedName: z.string(),
  unpatchedName: z.string(),
  folderName: z.string(),
  downloadUrl: z.string(),
});

export type NerdFontResult = z.infer<typeof NerdFontResultSchema>;

// --- Weather ---

export const LocationInfoSchema = z.object({
  name: z.string(),
  country: z.string(),
  lat: z.number(),
  lon: z.number(),
  timezone: z.string(),
});

export type LocationInfo = z.infer<typeof LocationInfoSchema>;

export const CurrentWeatherSchema = z.object({
  time: z.string(),
  temperature: z.number(),
  wind_speed: z.number(),
  humidity: z.number(),
  condition: z.string(),
  weather_code: z.number(),
});

export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;

export const DailyItemSchema = z.object({
  date: z.string(),
  max_temp: z.number(),
  min_temp: z.number(),
  condition: z.string(),
  weather_code: z.number(),
});

export type DailyItem = z.infer<typeof DailyItemSchema>;

export const HourlyItemSchema = z.object({
  time: z.string(),
  temperature: z.number(),
  condition: z.string(),
  weather_code: z.number(),
});

export type HourlyItem = z.infer<typeof HourlyItemSchema>;

export const WeatherResponseSchema = z.object({
  location: LocationInfoSchema,
  current: CurrentWeatherSchema,
  daily: z.array(DailyItemSchema),
  hourly: z.array(HourlyItemSchema),
});

export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
