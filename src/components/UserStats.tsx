import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Trophy, TrendingUp, Award } from 'lucide-react';

interface UserStatsProps {
  userId: string;
}

interface Stats {
  current_streak: number;
  longest_streak: number;
  total_analyses: number;
}

interface BadgeType {
  type: string;
  earned_at: string;
}

const BADGE_INFO: Record<string, { label: string; icon: typeof Award; color: string }> = {
  first_analysis: { label: 'First Analysis', icon: Award, color: 'bg-blue-500' },
  analyst_10: { label: '10 Analyses', icon: Trophy, color: 'bg-green-500' },
  analyst_50: { label: '50 Analyses', icon: Trophy, color: 'bg-yellow-500' },
  analyst_100: { label: '100 Analyses', icon: Trophy, color: 'bg-purple-500' },
  streak_7: { label: '7 Day Streak', icon: Flame, color: 'bg-orange-500' },
  streak_30: { label: '30 Day Streak', icon: Flame, color: 'bg-red-500' },
};

export function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchBadges();
  }, [userId]);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setStats(data);
    } else {
      setStats({ current_streak: 0, longest_streak: 0, total_analyses: 0 });
    }
    setLoading(false);
  };

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (!error && data) {
      setBadges(data);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-4 bg-muted rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-16"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.longest_streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              personal best
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Total Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_analyses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              headlines analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges Earned
            </CardTitle>
            <CardDescription>
              Your achievements and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => {
                const badgeInfo = BADGE_INFO[badge.type];
                if (!badgeInfo) return null;

                const Icon = badgeInfo.icon;
                return (
                  <Badge
                    key={badge.type}
                    variant="secondary"
                    className="px-3 py-2 flex items-center gap-2"
                  >
                    <div className={`p-1 rounded ${badgeInfo.color}`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm">{badgeInfo.label}</span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
