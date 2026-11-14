import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import Button from '../components/ui/button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Visual Icon / Badge */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border shadow-sm mb-6">
          <FileQuestion className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>

        {/* Status code */}
        <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-2">
          404 Error
        </span>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-3">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>

          <Button asChild className="w-full sm:w-auto">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

