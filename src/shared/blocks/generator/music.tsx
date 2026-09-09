'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Loader2,
  Music,
  Pause,
  Play,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { AISong, AITaskStatus } from '@/extensions/ai/types';
import { LazyImage } from '@/shared/blocks/common/lazy-image';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Progress } from '@/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

interface SongData {
  id: string;
  audioUrl: string;
  sourceAudioUrl: string;
  streamAudioUrl: string;
  sourceStreamAudioUrl: string;
  imageUrl: string;
  sourceImageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: number;
  duration: number;
}

interface GeneratedSong {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  imageUrl?: string;
  artist: string;
  style: string;
  status: string;
  prompt?: string;
}

interface SongGeneratorProps {
  srOnlyTitle?: string;
  className?: string;
}

export function MusicGenerator({ className, srOnlyTitle }: SongGeneratorProps) {
  const t = useTranslations('ai.music');
  const { user, isCheckSign, setIsShowSignModal, fetchUserCredits } =
    useAppContext();

  // Form state
  const [provider, setProvider] = useState('kie');
  const [model, setModel] = useState('V5');
  const [customMode, setCustomMode] = useState(false);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [prompt, setPrompt] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generatedSongs, setGeneratedSongs] = useState<GeneratedSong[]>([]);
  const [currentPlayingSong, setCurrentPlayingSong] =
    useState<GeneratedSong | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // todo: get cost credits from settings
  const costCredits = 10;

  // Client-side mounting state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Task polling
  const pollTaskStatus = async (taskId: string) => {
    try {
      // Check timeout (3 minutes = 180000ms)
      if (generationStartTime) {
        const elapsedTime = Date.now() - generationStartTime;
        if (elapsedTime > 180000) {
          setProgress(0);
          setIsGenerating(false);
          setGenerationStartTime(null);
          toast.error('Generate music timed out. Please try again.');
          return true; // Stop polling
        }
      }

      // request api to query task
      const resp = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { status, taskInfo } = data;
      if (!status || !taskInfo) {
        throw new Error('Query task info failed');
      }

      const task = JSON.parse(taskInfo);
      const { errorCode, errorMessage, songs } = task;
      if (errorCode || errorMessage) {
        throw new Error(errorMessage);
      }

      // handle task status

      // task pending
      if (status === AITaskStatus.PENDING) {
        setProgress(10);
        return false;
      }

      // task processing
      if (status === AITaskStatus.PROCESSING) {
        setProgress(20);

        const isTextSuccess = songs.some((song: AISong) => song.imageUrl);
        const isFirstSuccess = songs.some((song: AISong) => song.audioUrl);

        // text success
        if (isTextSuccess) {
          setProgress(60);
          setGeneratedSongs(songs);
          return false;
        }

        // first success
        if (isFirstSuccess) {
          setProgress(85);
          setGeneratedSongs(songs);
          return false;
        }

        // final success
        return false;
      }

      // task failed, final status
      if (status === AITaskStatus.FAILED) {
        setProgress(0);
        setIsGenerating(false);
        setGenerationStartTime(null);
        toast.error('Generate music failed: ' + errorMessage);

        fetchUserCredits();

        return true;
      }

      // task success, final status
      if (status === AITaskStatus.SUCCESS) {
        setGeneratedSongs(songs);

        setProgress(100);
        setIsGenerating(false);
        setGenerationStartTime(null);
        return true;
      }

      // Still processing - update progress
      setProgress((prev) => Math.min(prev + 3, 80));
      return false;
    } catch (error: any) {
      console.error('Error polling task:', error);
      setIsGenerating(false);
      setProgress(0);
      setGenerationStartTime(null);
      toast.error('Create song failed: ' + error.message);

      fetchUserCredits();

      return true; // Stop polling on error
    }
  };

  // Start task polling
  useEffect(() => {
    if (taskId && isGenerating) {
      const interval = setInterval(async () => {
        const completed = await pollTaskStatus(taskId);
        if (completed) {
          clearInterval(interval);
        }
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [taskId, isGenerating, generationStartTime]);

  const handleGenerate = async () => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    if (!user.credits || user.credits.remainingCredits < costCredits) {
      toast.error('Insufficient credits');
      return;
    }

    if (!provider || !model) {
      toast.error('Invalid provider or model');
      return;
    }

    if (customMode) {
      if (!title || !style) {
        toast.error('Please enter title and style');
        return;
      }
      if (!instrumental && !lyrics) {
        toast.error('Please enter lyrics');
        return;
      }
    } else {
      if (!prompt) {
        toast.error('Please enter prompt');
        return;
      }
    }

    const params: any = {
      mediaType: 'music',
      provider: provider,
      model: model,
    };

    if (customMode) {
      params.options = {
        customMode: true,
        style,
        title,
        instrumental,
      };
      if (!instrumental) {
        params.options.lyrics = lyrics;
      }
    } else {
      params.prompt = prompt;
      params.options = {
        customMode: false,
        instrumental,
      };
    }

    setIsGenerating(true);
    setProgress(10);
    setGeneratedSongs([]);
    setCurrentPlayingSong(null);
    setGenerationStartTime(Date.now()); // Set generation start time

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: 'music',
          provider: provider,
          model: model,
          prompt: prompt,
          options: {
            style: style,
            title: title,
            lyrics: lyrics,
            customMode: customMode,
            instrumental: instrumental,
          },
        }),
      });

      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message || 'Failed to generate music');
      }

      const { id: taskId } = data;
      if (!taskId) {
        throw new Error('Failed to generate music');
      }

      // refresh user credits
      await fetchUserCredits();

      setTaskId(taskId);
      setProgress(20);
    } catch (err: any) {
      toast.error('Failed to generate music: ' + err.message);
      setIsGenerating(false);
      setProgress(0);
      setGenerationStartTime(null);
    }
  };

  const togglePlay = async (song: GeneratedSong) => {
    if (!song?.audioUrl) return;

    setIsLoadingAudio(true);

    try {
      // Stop current audio if playing
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }

      // If clicking on currently playing song, just pause
      if (currentPlayingSong?.id === song.id && isPlaying) {
        setIsPlaying(false);
        setCurrentPlayingSong(null);
        setIsLoadingAudio(false);
        return;
      }

      // Create new audio for the selected song
      audioRef.current = new Audio(song.audioUrl);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentPlayingSong(null);
      });
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsLoadingAudio(false);
        setIsPlaying(false);
        setCurrentPlayingSong(null);
      });

      // Play the selected song
      await audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingSong(song);
      setIsLoadingAudio(false);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
      setCurrentPlayingSong(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = async (song: GeneratedSong) => {
    if (!song?.audioUrl) return;

    try {
      toast.info(t('generator.downloading'));

      // Fetch the audio file via proxy
      const response = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(song.audioUrl)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }

      // Convert to blob
      const blob = await response.blob();

      // Create object URL
      const blobUrl = URL.createObjectURL(blob);

      // Create and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${song.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      toast.success(t('generator.download_success'));
    } catch (error) {
      console.error('Failed to download audio:', error);
      toast.error(t('generator.download_failed'));
    }
  };

  return (
    <section id="create" className={cn('py-16 md:py-24', className)}>
      {srOnlyTitle && <h2 className="sr-only">{srOnlyTitle}</h2>}
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left side - Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {t('generator.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={customMode}
                      onCheckedChange={setCustomMode}
                    />
                    <Label>{t('generator.form.custom_mode')}</Label>
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-4">
                    <Label>{t('generator.form.model')}</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V5">Suno V5</SelectItem>
                        <SelectItem value="V4_5PLUS">Suno V4.5+</SelectItem>
                        <SelectItem value="V4_5">Suno V4.5</SelectItem>
                        <SelectItem value="V4">Suno V4</SelectItem>
                        <SelectItem value="V3_5">Suno V3.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>

              <CardContent className="space-y-6">
                {customMode && (
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('generator.form.title')}</Label>
                    <Input
                      id="title"
                      placeholder={t('generator.form.title_placeholder')}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                )}

                {customMode && (
                  <div className="space-y-2">
                    <Label htmlFor="style">{t('generator.form.style')}</Label>
                    <Textarea
                      id="style"
                      placeholder={t('generator.form.style_placeholder')}
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="min-h-24"
                    />
                    <div className="text-muted-foreground text-right text-sm">
                      {style.length}/1000
                    </div>
                  </div>
                )}

                {!customMode && (
                  <div className="space-y-2">
                    <Label htmlFor="prompt">{t('generator.form.prompt')}</Label>
                    <Textarea
                      id="prompt"
                      placeholder={t('generator.form.prompt_placeholder')}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-32"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="instrumental"
                    checked={instrumental}
                    onCheckedChange={setInstrumental}
                  />
                  <Label htmlFor="instrumental">
                    {t('generator.form.instrumental')}
                  </Label>
                </div>

                {customMode && !instrumental && (
                  <div className="space-y-2">
                    <Label htmlFor="lyrics">{t('generator.form.lyrics')}</Label>
                    <Textarea
                      id="lyrics"
                      placeholder={t('generator.form.lyrics_placeholder')}
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                )}

                {!isMounted ? (
                  <Button className="w-full" size="lg" disabled>
                    <Music className="mr-2 h-4 w-4" />
                    {t('generator.generate')}
                  </Button>
                ) : isCheckSign ? (
                  <Button className="w-full" size="lg">
                    <Loader2 className="size-4 animate-spin" />{' '}
                    {t('generator.loading')}
                  </Button>
                ) : user ? (
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('generator.generating')}
                      </>
                    ) : (
                      <>
                        <Music className="mr-2 h-4 w-4" />
                        {t('generator.generate')}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsShowSignModal(true)}
                  >
                    <User className="mr-2 h-4 w-4" />{' '}
                    {t('generator.sign_in_to_generate')}
                  </Button>
                )}

                {!isMounted ? (
                  <div className="mb-6 flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('generator.credits_cost', { credits: costCredits })}
                    </span>
                    <span className="text-foreground font-medium">
                      {t('generator.credits_remaining', { credits: 0 })}
                    </span>
                  </div>
                ) : user &&
                  user.credits &&
                  user.credits.remainingCredits > 0 ? (
                  <div className="mb-6 flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('generator.credits_cost', { credits: costCredits })}
                    </span>
                    <span className="text-foreground font-medium">
                      {t('generator.credits_remaining', {
                        credits: user.credits.remainingCredits,
                      })}
                    </span>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('generator.credits_cost', { credits: costCredits })},{' '}
                      {t('generator.credits_remaining', {
                        credits: user?.credits?.remainingCredits || 0,
                      })}
                    </span>
                    <Link href="/pricing">
                      <Button className="w-full" size="lg" variant="outline">
                        <CreditCard className="size-4" />{' '}
                        {t('generator.buy_credits')}
                      </Button>
                    </Link>
                  </div>
                )}

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('generator.generation_progress')}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <p className="text-muted-foreground text-center text-sm">
                      {t('generator.time_cost')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right side - Generated Song Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  {t('generator.generated_song')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedSongs.length > 0 ? (
                  <div className="space-y-4">
                    {generatedSongs.map((song, index) => {
                      const isCurrentlyPlaying =
                        currentPlayingSong?.id === song.id && isPlaying;
                      const isCurrentlyLoading =
                        currentPlayingSong?.id === song.id && isLoadingAudio;

                      return (
                        <div key={song.id} className="space-y-4">
                          <div className="flex gap-4">
                            <div className="relative flex-shrink-0">
                              <div className="bg-muted relative h-20 w-20 overflow-hidden rounded-lg">
                                {song.imageUrl ? (
                                  <LazyImage
                                    src={song.imageUrl}
                                    alt={song.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="from-primary/20 to-accent/20 flex h-full w-full items-center justify-center bg-gradient-to-br">
                                    <Music className="text-muted-foreground h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              {song.audioUrl && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="absolute top-6 right-6 h-8 w-8 rounded-full p-0 shadow-lg"
                                  onClick={() => togglePlay(song)}
                                  disabled={isCurrentlyLoading}
                                >
                                  {isCurrentlyLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isCurrentlyPlaying ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-foreground mb-1 text-lg font-semibold">
                                {song.title}
                              </h3>
                              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                                <User className="h-4 w-4" />
                                <span>{song.artist}</span>
                                <Clock className="ml-2 h-4 w-4" />
                                <span>{formatDuration(song.duration)}</span>
                              </div>
                              <div className="mb-2 line-clamp-1 flex flex-wrap gap-1">
                                {song.style &&
                                  song.style
                                    .split(',')
                                    .slice(0, 2)
                                    .map((tag, tagIndex) => (
                                      <Badge
                                        key={tagIndex}
                                        variant="default"
                                        className="text-xs"
                                      >
                                        {tag.trim()}
                                      </Badge>
                                    ))}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {song.audioUrl ? (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>{t('generator.ready_to_play')}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-yellow-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>
                                      {t('generator.audio_generating')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {song.audioUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadAudio(song)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {index < generatedSongs.length - 1 && (
                            <div className="border-t" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Music className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {isGenerating
                        ? t('generator.generating_song')
                        : t('generator.no_song_generated')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
