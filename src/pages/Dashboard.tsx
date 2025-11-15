import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArticleCard } from '@/components/ArticleCard';
import { HeadlineAnalyzer } from '@/components/HeadlineAnalyzer';
import { UserStats } from '@/components/UserStats';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Article {
  id: number;
  title: string;
  content: string;
  predicted_bias: string | null;
  true_bias: string | null;
  source_id: number | null;
}

interface Source {
  id: number;
  name: string;
  url: string | null;
  bias_label: string | null;
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [showRelated, setShowRelated] = useState(false);
  const [filterBias, setFilterBias] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [articlesRes, sourcesRes] = await Promise.all([
        supabase.from('articles').select('*').order('created_at', { ascending: false }),
        supabase.from('sources').select('*'),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (sourcesRes.error) throw sourcesRes.error;

      setArticles(articlesRes.data || []);
      setSources(sourcesRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleViewRelated = async (articleId: number) => {
    const article = articles.find((a) => a.id === articleId);
    if (!article || !article.predicted_bias) return;

    const related = articles.filter(
      (a) => a.id !== articleId && a.predicted_bias === article.predicted_bias
    );

    setRelatedArticles(related);
    setSelectedArticle(articleId);
    setShowRelated(true);
  };

  const getArticleWithSource = (article: Article) => ({
    ...article,
    source: sources.find((s) => s.id === article.source_id),
  });

  const handleAnalysisComplete = (bias: string) => {
    setFilterBias(bias);
  };

  const filteredArticles = filterBias
    ? articles.filter((a) => a.predicted_bias === filterBias)
    : articles;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">News Bias Detector</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user && <UserStats userId={user.id} />}

        <HeadlineAnalyzer onAnalysisComplete={handleAnalysisComplete} />

        {filterBias && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing articles with bias: <strong>{filterBias}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterBias(null)}
            >
              Clear Filter
            </Button>
          </div>
        )}

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {filterBias ? 'No articles found with this bias' : 'No articles found'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {filterBias
                ? 'Try analyzing another headline or clear the filter'
                : 'Articles will appear here once they are added to the database'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={getArticleWithSource(article)}
                onViewRelated={handleViewRelated}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={showRelated} onOpenChange={setShowRelated}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Related Articles with Similar Bias</DialogTitle>
            <DialogDescription>
              Articles with the same predicted bias as the selected article
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {relatedArticles.length === 0 ? (
              <p className="col-span-2 text-center text-muted-foreground py-8">
                No related articles found with similar bias
              </p>
            ) : (
              relatedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={getArticleWithSource(article)}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
