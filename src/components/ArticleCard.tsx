import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BiasBadge } from './BiasBadge';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    content: string;
    predicted_bias: string | null;
    true_bias: string | null;
    source?: {
      name: string;
      url: string | null;
      bias_label: string | null;
    };
  };
  onViewRelated?: (articleId: number) => void;
}

export function ArticleCard({ article, onViewRelated }: ArticleCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
          {article.predicted_bias && <BiasBadge bias={article.predicted_bias} />}
        </div>
        {article.source && (
          <CardDescription className="flex items-center gap-2">
            <span>{article.source.name}</span>
            {article.source.bias_label && (
              <BiasBadge bias={article.source.bias_label} className="text-xs" />
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {article.content}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onViewRelated && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewRelated(article.id)}
          >
            View Related
          </Button>
        )}
        {article.source?.url && (
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <a href={article.source.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Source
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
