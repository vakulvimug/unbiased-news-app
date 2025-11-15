import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Newspaper, TrendingUp, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-3xl">
        <div className="mb-8 flex justify-center">
          <Newspaper className="h-20 w-20 text-primary" />
        </div>
        <h1 className="mb-4 text-5xl font-bold text-foreground">News Bias Detector</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Understand the political bias in news articles with AI-powered analysis
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-lg bg-card border">
            <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Detect Bias</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes articles to identify political bias
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border">
            <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Related News</h3>
            <p className="text-sm text-muted-foreground">
              Find similar articles with comparable bias
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border">
            <Newspaper className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Multiple Sources</h3>
            <p className="text-sm text-muted-foreground">
              Compare coverage across different outlets
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
