'use server';

/**
 * @fileOverview Analyzes a video to generate a transcript and word frequencies.
 *
 * - analyzeVideo - A function that takes a video and returns its transcript and word frequency analysis.
 * - AnalyzeVideoInput - The input type for the analyzeVideo function.
 * - AnalyzeVideoOutput - The return type for the analyzeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WordFrequencySchema = z.object({
  word: z.string().describe('A word from the transcript.'),
  count: z.number().describe('The number of times the word appears in the transcript.'),
});

const TimedWordSchema = z.object({
    word: z.string().describe('The transcribed word.'),
    startTime: z.number().describe('The start time of the word in seconds.'),
    endTime: z.number().describe('The end time of the word in seconds.'),
});

const AnalyzeVideoInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type AnalyzeVideoInput = z.infer<typeof AnalyzeVideoInputSchema>;

const AnalyzeVideoOutputSchema = z.object({
  timedTranscript: z.array(TimedWordSchema).describe('The full transcript of the video with timestamps for each word.'),
  wordFrequencies: z.array(WordFrequencySchema).describe('An array of the 10 most frequent words and their counts.'),
});
export type AnalyzeVideoOutput = z.infer<typeof AnalyzeVideoOutputSchema>;
export type WordFrequency = z.infer<typeof WordFrequencySchema>;
export type TimedWord = z.infer<typeof TimedWordSchema>;

// Common English stop words.
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
  'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
  'should', 'now', 've', 'll', 'm', 're', 'y'
]);

const transcriptionPrompt = ai.definePrompt({
    name: 'transcriptionPrompt',
    input: { schema: AnalyzeVideoInputSchema },
    output: { schema: z.object({ timedTranscript: z.array(TimedWordSchema) }) },
    prompt: `Provide a detailed transcript for the following video. You must provide the start and end time in seconds for each word spoken.

Video: {{media url=videoDataUri}}`
});


const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async (input) => {
    const { output } = await transcriptionPrompt(input);

    if (!output || !output.timedTranscript) {
        throw new Error('Failed to generate transcript.');
    }
    
    const timedTranscript = output.timedTranscript;
    const frequencies = new Map<string, number>();

    for (const entry of timedTranscript) {
        const word = entry.word.toLowerCase().replace(/[^a-z]/g, '');
        if (word && !STOP_WORDS.has(word) && isNaN(parseInt(word))) {
            frequencies.set(word, (frequencies.get(word) || 0) + 1);
        }
    }

    const sortedFrequencies = Array.from(frequencies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const wordFrequencies = sortedFrequencies.map(([word, count]) => ({ word, count }));

    return {
      timedTranscript,
      wordFrequencies,
    };
  }
);


export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
    return analyzeVideoFlow(input);
}
