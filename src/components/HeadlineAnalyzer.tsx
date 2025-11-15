import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BiasBadge } from '@/components/BiasBadge';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface HeadlineAnalyzerProps {
  onAnalysisComplete: (bias: string) => void;
}

export function HeadlineAnalyzer({ onAnalysisComplete }: HeadlineAnalyzerProps) {
  const [headline, setHeadline] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ bias: string; confidence: number } | null>(null);

  const analyzeBias = (text: string): { bias: string; confidence: number } => {
    const lowerText = text.toLowerCase();

    const leftKeywords = ['progressive', 'liberal', 'democrat', 'socialist', 'climate change', 'equality', 'reform'];
    const rightKeywords = ['conservative', 'republican', 'traditional', 'free market', 'freedom', 'patriot'];
    const centerKeywords = ['bipartisan', 'moderate', 'balanced', 'neutral', 'both sides'];

    let leftScore = 0;
    let rightScore = 0;
    let centerScore = 0;

    leftKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) leftScore++;
    });

    rightKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) rightScore++;
    });

    centerKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) centerScore++;
    });

    const total = leftScore + rightScore + centerScore;

    if (total === 0) {
      return { bias: 'Center', confidence: 50 };
    }

    if (leftScore > rightScore && leftScore > centerScore) {
      if (leftScore > rightScore * 2) {
        return { bias: 'Left', confidence: Math.min(90, 60 + leftScore * 5) };
      }
      return { bias: 'Left-Center', confidence: Math.min(85, 60 + leftScore * 4) };
    }

    if (rightScore > leftScore && rightScore > centerScore) {
      if (rightScore > leftScore * 2) {
        return { bias: 'Right', confidence: Math.min(90, 60 + rightScore * 5) };
      }
      return { bias: 'Right-Center', confidence: Math.min(85, 60 + rightScore * 4) };
    }

    return { bias: 'Center', confidence: Math.min(80, 60 + centerScore * 3) };
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headline.trim()) {
      toast({
        title: 'Please enter a headline',
        description: 'Enter a news headline to analyze its bias',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const analysisResult = analyzeBias(headline);
      setResult(analysisResult);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error: historyError } = await supabase
          .from('analysis_history')
          .insert({
            user_id: user.id,
            headline: headline,
            predicted_bias: analysisResult.bias,
          });

        if (historyError) {
          console.error('Error saving analysis:', historyError);
        }

        const { data: stats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const today = new Date().toISOString().split('T')[0];
        const lastDate = stats?.last_analysis_date;

        let newStreak = stats?.current_streak || 0;

        if (!lastDate || lastDate !== today) {
          if (lastDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDate === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }
        }

        const newTotal = (stats?.total_analyses || 0) + 1;
        const newLongest = Math.max(newStreak, stats?.longest_streak || 0);

        if (stats) {
          await supabase
            .from('user_stats')
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
              total_analyses: newTotal,
              last_analysis_date: today,
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_stats')
            .insert({
              user_id: user.id,
              current_streak: newStreak,
              longest_streak: newLongest,
              total_analyses: newTotal,
              last_analysis_date: today,
            });
        }

        await checkAndAwardBadges(user.id, newTotal, newLongest);
      }

      onAnalysisComplete(analysisResult.bias);

      toast({
        title: 'Analysis complete',
        description: `Bias detected: ${analysisResult.bias}`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const checkAndAwardBadges = async (userId: string, totalAnalyses: number, longestStreak: number) => {
    const badgesToCheck = [
      { type: 'first_analysis', threshold: 1, field: totalAnalyses },
      { type: 'analyst_10', threshold: 10, field: totalAnalyses },
      { type: 'analyst_50', threshold: 50, field: totalAnalyses },
      { type: 'analyst_100', threshold: 100, field: totalAnalyses },
      { type: 'streak_7', threshold: 7, field: longestStreak },
      { type: 'streak_30', threshold: 30, field: longestStreak },
    ];

    for (const badge of badgesToCheck) {
      if (badge.field >= badge.threshold) {
        const { data: existing } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .eq('badge_type', badge.type)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_type: badge.type,
            });
        }
      }
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Analyze News Headline</CardTitle>
        <CardDescription>
          Enter a news headline to detect its political bias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a news headline..."
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              disabled={analyzing}
              className="flex-1"
            />
            <Button type="submit" disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Detected Bias:</span>
                <BiasBadge bias={result.bias} />
              </div>
              <div className="text-sm text-muted-foreground">
                Confidence: {result.confidence}%
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
