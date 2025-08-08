"use client";

import { useState, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { generateRoast } from '@/ai/flows/generate-roast';
import { analyzeVideo, type WordFrequency } from '@/ai/flows/analyze-video';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { Flame, Share2, Clipboard, LoaderCircle, Upload, ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';

export function MainPage() {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([]);
  const [transcript, setTranscript] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [roast, setRoast] = useState('');
  const [isRoasting, setIsRoasting] = useState(false);
  const [topWordIndex, setTopWordIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      setIsAnalyzed(false);
      setRoast('');
      setWordFrequencies([]);
      setTranscript('');
      setTopWordIndex(0);
      setVideoUrl(URL.createObjectURL(file));

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const videoDataUri = reader.result as string;
          try {
            const result = await analyzeVideo({ videoDataUri });
            if (result.wordFrequencies.length === 0) {
              toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not find any significant words to analyze. The video might be too short or have no speech.',
              });
              setVideoUrl('');
               if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            } else {
              setWordFrequencies(result.wordFrequencies);
              setTranscript(result.transcript);
              setIsAnalyzed(true);
            }
          } catch (error) {
            console.error(error);
            toast({
              variant: 'destructive',
              title: 'Analysis Failed',
              description: 'Could not analyze the video. Please try again with a different video.',
            });
            // Reset state if analysis fails
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

  const handleGenerateRoast = async () => {
    const mostFrequentWord = wordFrequencies[topWordIndex];
    if (!mostFrequentWord || !transcript) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot generate roast without a frequent word and transcript.",
      });
      return;
    }

    setIsRoasting(true);
    setRoast('');
    try {
      const result = await generateRoast({
        mostFrequentWord: mostFrequentWord.word,
        transcript: transcript,
      });
      setRoast(result.roast);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Roast Failed",
        description: "Could not generate a roast. Please try again.",
      });
    } finally {
      setIsRoasting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const currentWord = wordFrequencies[topWordIndex];
  const topFiveWords = wordFrequencies.slice(0, 5);

  const wordClips = useMemo(() => {
    if (!transcript || !currentWord) return [];
    
    const regex = new RegExp(`[^.!?]*\\b${currentWord.word}\\b[^.!?]*[.!?]`, 'gi');
    const matches = transcript.match(regex);
    
    return matches ? matches.map(s => s.trim()).slice(0, 3) : [];

  }, [transcript, currentWord]);

  const changeTopWord = (direction: 'next' | 'prev') => {
    setRoast('');
    if (direction === 'next') {
      setTopWordIndex((prev) => (prev + 1) % topFiveWords.length);
    } else {
      setTopWordIndex((prev) => (prev - 1 + topFiveWords.length) % topFiveWords.length);
    }
  }


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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-2xl shadow-primary/10">
              <div className="aspect-video bg-black flex items-center justify-center">
                {isAnalyzing ? (
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
              {isAnalyzed && (
                  <>
                  {isRoasting ? (
                    <motion.div key="roasting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Cooking up a roast...</CardTitle>
                            <CardDescription>Our AI is sharpening its wit. Get ready!</CardDescription>
                          </CardHeader>
                          <CardContent className="flex items-center gap-4">
                              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-muted-foreground">The roast is on its way...</p>
                          </CardContent>
                        </Card>
                    </motion.div>
                  ) : roast ? (
                    <motion.div key="roast" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{duration: 0.3}}>
                      <Card className="bg-gradient-to-br from-card to-card/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Flame className="text-primary" />
                            The Roast is Ready
                          </CardTitle>
                          <CardDescription>Warning: May cause singed egos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-medium tracking-tight font-headline text-foreground leading-relaxed">
                            &ldquo;{roast}&rdquo;
                          </p>
                        </CardContent>
                        <CardFooter className="gap-2">
                          <Button onClick={() => handleCopy(roast)}>
                            <Clipboard className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                          <Button variant="secondary" disabled>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ) : null}
                  
                  {wordClips.length > 0 && (
                    <motion.div key="clips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card>
                          <CardHeader>
                              <CardTitle className='flex items-center gap-2'>
                                <MessageSquareQuote className="text-primary" />
                                Word Clips
                              </CardTitle>
                              <CardDescription>
                                  Here&apos;s where &ldquo;{currentWord?.word}&rdquo; showed up in the transcript.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {wordClips.map((clip, index) => (
                              <div key={index} className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r-md">
                                <p className="italic text-muted-foreground">&ldquo;...{clip}...&rdquo;</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                    </motion.div>
                  )}
                  </>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>The most frequent words from your video.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isAnalyzing ? (
                       <div className="space-y-2">
                          <div className="h-24 w-full animate-pulse rounded-md bg-muted"/>
                          <div className="h-10 w-full animate-pulse rounded-md bg-muted"/>
                       </div>
                    ) : isAnalyzed && currentWord ? (
                       <div className="text-center flex flex-col items-center">
                          <Badge variant="secondary" className="mb-4">Rank #{topWordIndex + 1}</Badge>
                          <div className="flex items-center justify-center w-full gap-2">
                              <Button variant="ghost" size="icon" onClick={() => changeTopWord('prev')} disabled={topFiveWords.length <= 1}>
                                <ChevronLeft />
                              </Button>
                              <AnimatePresence mode="wait">
                                  <motion.div
                                      key={topWordIndex}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      transition={{ duration: 0.2 }}
                                      className="flex-1"
                                  >
                                      <h2 className="text-5xl font-bold font-headline capitalize text-primary break-words">{currentWord.word}</h2>
                                  </motion.div>
                              </AnimatePresence>
                              <Button variant="ghost" size="icon" onClick={() => changeTopWord('next')} disabled={topFiveWords.length <= 1}>
                                <ChevronRight />
                              </Button>
                          </div>

                          <p className="text-muted-foreground mt-2">
                              Mentioned <span className="font-bold text-foreground">{currentWord.count}</span> times
                          </p>
                          <Button className="w-full mt-6" size="lg" onClick={handleGenerateRoast} disabled={isRoasting || !!roast}>
                            {isRoasting ? (
                              <><LoaderCircle className="mr-2" />Roasting...</>
                            ) : roast ? (
                              "Roasted!"
                            ) : (
                              <><Flame className="mr-2" />Roast this word!</>
                            )}
                          </Button>
                       </div>
                    ) : (
                       <div className="text-center text-muted-foreground py-10">
                           <p>Upload a video to see the analysis.</p>
                       </div>
                    )}
                </CardContent>
            </Card>

            {isAnalyzed && wordFrequencies.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Word Leaderboard</CardTitle>
                        <CardDescription>The full ranking of frequent words.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-64">
                        <div className="space-y-0">
                          {wordFrequencies.map((item, index) => (
                            <div key={item.word} className={`p-4 flex items-center justify-between border-b ${index === topWordIndex ? 'bg-primary/10' : ''}`}>
                               <div className="flex items-center gap-4">
                                  <span className={`font-bold w-6 text-center ${index === topWordIndex ? 'text-primary' : 'text-muted-foreground'}`}>{index + 1}</span>
                                  <span className="text-lg font-medium capitalize">{item.word}</span>
                               </div>
                               <Badge variant={index === topWordIndex ? 'default' : 'secondary'}>{item.count} mentions</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                </Card>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
