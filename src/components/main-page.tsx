"use client";

import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { analyzeVideo, type WordFrequency } from '@/ai/flows/analyze-video';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { LoaderCircle, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export function MainPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ transcript: string, wordFrequencies: WordFrequency[] } | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setVideoUrl(URL.createObjectURL(file));

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const videoDataUri = reader.result as string;
          try {
            const result = await analyzeVideo({ videoDataUri });
            setAnalysisResult(result);
          } catch (error) {
            console.error(error);
            toast({
              variant: 'destructive',
              title: 'Analysis Failed',
              description: 'Could not analyze the video. Please try again.',
            });
            setVideoUrl('');
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } finally {
            setIsAnalyzing(false);
          }
        };
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was an error reading the file.',
        });
        setIsAnalyzing(false);
      }
    }
  };


  if (!videoUrl && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#8d8d8d33_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Logo className="w-24 h-24 mx-auto text-primary" />
          <h1 className="mt-6 text-5xl font-bold font-headline tracking-tight text-foreground sm:text-7xl">
            Roast <span className="text-primary">Radar</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Upload a video, and our AI will find the most used words and cook up a custom roast for you. Ready to feel the burn?
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Input
              type="file"
              accept="video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
            <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-1">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Roast <span className="text-primary">Radar</span>
          </h1>
        </div>
         <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Video
          </Button>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <Card className="overflow-hidden shadow-2xl shadow-primary/10">
              <div className="aspect-video bg-black flex items-center justify-center">
                {isAnalyzing && !analysisResult ? (
                  <div className="text-center text-background">
                    <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-medium">Analyzing your video...</p>
                    <p className="text-muted-foreground">This may take a moment.</p>
                  </div>
                ) : (
                  <video src={videoUrl} controls className="w-full h-full" />
                )}
              </div>
            </Card>

            <AnimatePresence>
              {analysisResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Results</CardTitle>
                      <CardDescription>
                        Here are the most frequently used words in your video.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-4">Word Frequencies</h3>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                           <BarChart accessibilityLayer data={analysisResult.wordFrequencies}>
                              <CartesianGrid vertical={false} />
                              <XAxis
                                dataKey="word"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                              />
                              <YAxis
                                dataKey="count"
                                type="number"
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                               />
                               <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                              />
                              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
